const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const path = require('node:path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { io: createClient } = require('socket.io-client');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('../test-utils/integrationDatabase');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= crypto.randomBytes(48).toString('base64url');

const app = require('../src/app');
const Notification = require('../src/models/Notification');
const RefreshSession = require('../src/models/RefreshSession');
const RequestMessage = require('../src/models/RequestMessage');
const ServiceRequest = require('../src/models/ServiceRequest');
const User = require('../src/models/User');
const { initializeChatGateway } = require('../src/realtime/chatGateway');
const { createAccessToken } = require('../src/services/authService');
const { uniqueToken, uniqueVietnamesePhone } = require('../test-utils/uniqueTestData');

const runIntegration = process.env.RUN_CHAT_INTEGRATION === '1';
const waitFor = (socket, event, timeout = 8000) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeout);
  socket.once(event, value => { clearTimeout(timer); resolve(value); });
});
const join = (socket, requestId) => new Promise(resolve => socket.emit('request:join', String(requestId), resolve));

test('Socket chat xác thực room, realtime, idempotency và bảo vệ ghi chú nội bộ', { skip: !runIntegration }, async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const server = http.createServer(app);
  const io = initializeChatGateway(server);
  server.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const suffix = uniqueToken('chat');
  const passwordHash = await User.hashPassword('StrongPass123');
  const users = await User.create([
    { name: 'Khách Chat Test', email: `${suffix}-customer@example.com`, phone: uniqueVietnamesePhone('096'), passwordHash, role: 'customer' },
    { name: 'Khách Khác Chat Test', email: `${suffix}-other@example.com`, phone: uniqueVietnamesePhone('095'), passwordHash, role: 'customer' },
    { name: 'Nhân viên Chat Test', email: `${suffix}-staff@example.com`, phone: uniqueVietnamesePhone('094'), passwordHash, role: 'staff' },
    { name: 'Nhân viên Chat Khác', email: `${suffix}-other-staff@example.com`, phone: uniqueVietnamesePhone('093'), passwordHash, role: 'staff' }
  ]);
  const [customer, other, staff, otherStaff] = users;
  const request = await ServiceRequest.create({ code: `YC-${suffix}`, customer: customer._id, requestType: 'machining', title: 'Kiểm thử chat realtime', description: 'Nội dung kiểm thử chat realtime và phân quyền.', contact: { name: customer.name, email: customer.email }, timeline: [{ status: 'submitted', actorType: 'customer', actor: customer._id }] });
  const token = user => createAccessToken(user, new mongoose.Types.ObjectId());
  const customerSocket = createClient(`${origin}/chat`, { transports: ['websocket'], auth: { token: token(customer) } });
  const otherSocket = createClient(`${origin}/chat`, { transports: ['websocket'], auth: { token: token(other) } });
  const staffSocket = createClient(`${origin}/chat`, { transports: ['websocket'], auth: { token: token(staff) } });
  const otherStaffSocket = createClient(`${origin}/chat`, { transports: ['websocket'], auth: { token: token(otherStaff) } });
  const otherStaffSecondTab = createClient(`${origin}/chat`, { transports: ['websocket'], auth: { token: token(otherStaff) } });

  try {
    await Promise.all([waitFor(customerSocket, 'connect'), waitFor(otherSocket, 'connect'), waitFor(staffSocket, 'connect'), waitFor(otherStaffSocket, 'connect'), waitFor(otherStaffSecondTab, 'connect')]);
    assert.deepEqual(await join(customerSocket, request._id), { ok: true });
    assert.equal((await join(otherSocket, request._id)).ok, false);
    assert.deepEqual(await join(staffSocket, request._id), { ok: true });
    assert.deepEqual(await join(otherStaffSocket, request._id), { ok: true });
    assert.deepEqual(await join(otherStaffSecondTab, request._id), { ok: true });

    const clientMessageId = `message_${suffix}`;
    const realtimeMessage = waitFor(staffSocket, 'message:new');
    const send = await fetch(`${origin}/api/customer/requests/${request._id}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${token(customer)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Tin nhắn realtime kiểm thử.', clientMessageId })
    });
    assert.equal(send.status, 201);
    const firstBody = await send.json();
    assert.equal((await realtimeMessage).message.clientMessageId, clientMessageId);

    const duplicate = await fetch(`${origin}/api/customer/requests/${request._id}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${token(customer)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Tin nhắn realtime kiểm thử.', clientMessageId })
    });
    assert.equal(duplicate.status, 200);
    assert.equal((await duplicate.json()).data._id, firstBody.data._id);
    assert.equal(await RequestMessage.countDocuments({ request: request._id, clientMessageId }), 1);

    const claim = await fetch(`${origin}/api/staff/requests/${request._id}/claim`, {
      method: 'POST', headers: { Authorization: `Bearer ${token(staff)}`, 'Content-Type': 'application/json' }, body: '{}'
    });
    assert.equal(claim.status, 200);
    assert.equal((await join(otherStaffSocket, request._id)).ok, false);

    let customerLeaked = false;
    let staleStaffLeaked = false;
    let staleSecondTabLeaked = false;
    customerSocket.once('message:new', () => { customerLeaked = true; });
    otherStaffSocket.once('message:new', () => { staleStaffLeaked = true; });
    otherStaffSecondTab.once('message:new', () => { staleSecondTabLeaked = true; });
    const assignedStaffMessage = waitFor(staffSocket, 'message:new');
    const internal = await fetch(`${origin}/api/staff/requests/${request._id}/messages`, {
      method: 'POST', headers: { Authorization: `Bearer ${token(staff)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Ghi chú chỉ dành cho nội bộ.', visibility: 'internal', clientMessageId: `internal_${suffix}` })
    });
    assert.equal(internal.status, 201);
    await assignedStaffMessage;
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.equal(customerLeaked, false);
    assert.equal(staleStaffLeaked, false);
    assert.equal(staleSecondTabLeaked, false);
  } finally {
    customerSocket.disconnect(); otherSocket.disconnect(); staffSocket.disconnect(); otherStaffSocket.disconnect(); otherStaffSecondTab.disconnect();
    await Promise.all([
      Notification.deleteMany({ recipient: { $in: users.map(user => user._id) } }),
      RequestMessage.deleteMany({ request: request._id }),
      ServiceRequest.deleteOne({ _id: request._id }),
      User.deleteMany({ _id: { $in: users.map(user => user._id) } })
    ]);
    await new Promise(resolve => io.close(resolve));
    await mongoose.disconnect();
  }
});

test('Socket bị ngắt trên mọi tab khi refresh session bị thu hồi và không thể reconnect', { skip: !runIntegration }, async () => {
  const previousSessionCheck = process.env.ENFORCE_SESSION_CHECK;
  process.env.ENFORCE_SESSION_CHECK = 'true';
  await mongoose.connect(process.env.MONGODB_URI);
  const server = http.createServer(app);
  const io = initializeChatGateway(server);
  server.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const suffix = uniqueToken('socket-session');
  const password = 'StrongPass123';
  const user = await User.create({
    name: 'Nhân viên Socket Session',
    email: `${suffix}@example.com`,
    phone: uniqueVietnamesePhone('092'),
    passwordHash: await User.hashPassword(password),
    role: 'staff'
  });
  const request = await ServiceRequest.create({
    code: `YC-${suffix}`,
    customer: new mongoose.Types.ObjectId(),
    requestType: 'machining',
    title: 'Kiểm thử thu hồi socket',
    description: 'Dữ liệu kiểm thử session socket.',
    contact: { name: 'Khách kiểm thử' },
    timeline: [{ status: 'submitted', actorType: 'customer' }]
  });
  const sockets = [];

  const login = async () => {
    const response = await fetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: user.email, password })
    });
    assert.equal(response.status, 200);
    return { body: await response.json(), cookie: response.headers.get('set-cookie').split(';')[0] };
  };

  try {
    const first = await login();
    const second = await login();
    const sessionsResponse = await fetch(`${origin}/api/auth/sessions`, {
      headers: { Authorization: `Bearer ${first.body.data.accessToken}` }
    });
    const sessions = (await sessionsResponse.json()).data;
    const secondSession = sessions.find(session => !session.current);
    assert.ok(secondSession);

    const secondTabA = createClient(`${origin}/chat`, { transports: ['websocket'], auth: { token: second.body.data.accessToken } });
    const secondTabB = createClient(`${origin}/chat`, { transports: ['websocket'], auth: { token: second.body.data.accessToken } });
    sockets.push(secondTabA, secondTabB);
    await Promise.all([waitFor(secondTabA, 'connect'), waitFor(secondTabB, 'connect')]);
    assert.equal((await join(secondTabA, request._id)).ok, true);
    assert.equal((await join(secondTabB, request._id)).ok, true);
    const disconnectedA = waitFor(secondTabA, 'disconnect');
    const disconnectedB = waitFor(secondTabB, 'disconnect');
    const revoke = await fetch(`${origin}/api/auth/sessions/${secondSession.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${first.body.data.accessToken}` }
    });
    assert.equal(revoke.status, 200);
    await Promise.all([disconnectedA, disconnectedB]);

    const revokedReconnect = createClient(`${origin}/chat`, {
      transports: ['websocket'],
      reconnection: false,
      auth: { token: second.body.data.accessToken }
    });
    sockets.push(revokedReconnect);
    await waitFor(revokedReconnect, 'connect_error');

    const firstSocket = createClient(`${origin}/chat`, { transports: ['websocket'], auth: { token: first.body.data.accessToken } });
    sockets.push(firstSocket);
    await waitFor(firstSocket, 'connect');
    const firstDisconnected = waitFor(firstSocket, 'disconnect');
    const logout = await fetch(`${origin}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: first.cookie, 'X-CSRF-Token': first.body.data.csrfToken }
    });
    assert.equal(logout.status, 200);
    await firstDisconnected;

    const expiringSession = await RefreshSession.create({
      user: user._id,
      tokenHash: `expiry-token-${suffix}`,
      csrfTokenHash: `expiry-csrf-${suffix}`,
      expiresAt: new Date(Date.now() + 10_000)
    });
    const expiringToken = jwt.sign(
      { role: user.role, sid: String(expiringSession._id), tv: user.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { subject: String(user._id), expiresIn: '2s', issuer: 'dk-industry-api', audience: 'dk-industry-web' }
    );
    const expiringSocket = createClient(`${origin}/chat`, { transports: ['websocket'], auth: { token: expiringToken } });
    sockets.push(expiringSocket);
    await waitFor(expiringSocket, 'connect');
    const expiryDisconnect = waitFor(expiringSocket, 'disconnect', 4000);
    await waitFor(expiringSocket, 'auth:expired', 4000);
    await expiryDisconnect;
    assert.equal(expiringSocket.connected, false);
  } finally {
    for (const socket of sockets) socket.disconnect();
    await Promise.all([
      RefreshSession.deleteMany({ user: user._id }),
      ServiceRequest.deleteOne({ _id: request._id }),
      User.deleteOne({ _id: user._id })
    ]);
    await new Promise(resolve => io.close(resolve));
    await mongoose.disconnect();
    if (previousSessionCheck === undefined) delete process.env.ENFORCE_SESSION_CHECK;
    else process.env.ENFORCE_SESSION_CHECK = previousSessionCheck;
  }
});
