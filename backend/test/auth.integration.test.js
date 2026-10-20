const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('../test-utils/integrationDatabase');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ||= 'local_integration_secret_longer_than_32_characters';
process.env.MFA_ENCRYPTION_KEY ||= 'local_integration_mfa_encryption_key_longer_than_32_characters';

const app = require('../src/app');
const User = require('../src/models/User');
const RefreshSession = require('../src/models/RefreshSession');
const { uniqueToken, uniqueVietnamesePhone } = require('../test-utils/uniqueTestData');
const { totp } = require('../src/services/mfaService');
const { issueAccountToken } = require('../src/services/accountTokenService');
const { hashToken } = require('../src/services/authService');

const runIntegration = process.env.RUN_AUTH_INTEGRATION === '1';

test('luồng register → me → refresh → RBAC → logout', { skip: !runIntegration }, async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}/api`;
  const email = `${uniqueToken('auth')}@example.com`;
  const phone = uniqueVietnamesePhone('097');
  let userId;

  try {
    const register = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Kiểm thử Authentication', email, phone, password: 'StrongPass123', role: 'admin' })
    });
    const registerBody = await register.json();
    assert.equal(register.status, 201);
    assert.equal(registerBody.data.user.role, 'customer');
    assert.ok(registerBody.data.accessToken);
    assert.ok(registerBody.data.csrfToken);
    userId = registerBody.data.user.id;
    let cookie = register.headers.get('set-cookie').split(';')[0];

    const me = await fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${registerBody.data.accessToken}` } });
    assert.equal(me.status, 200);
    assert.equal((await me.json()).data.user.email, email);

    const secondLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'DK-Industry-Second-Test-Device' },
      body: JSON.stringify({ identifier: email, password: 'StrongPass123' })
    });
    const secondLoginBody = await secondLogin.json();
    assert.equal(secondLogin.status, 200);
    const secondCookie = secondLogin.headers.get('set-cookie').split(';')[0];
    const sessionsResponse = await fetch(`${baseUrl}/auth/sessions`, { headers: { Authorization: `Bearer ${registerBody.data.accessToken}` } });
    const sessionsBody = await sessionsResponse.json();
    assert.equal(sessionsResponse.status, 200);
    assert.equal(sessionsBody.data.length, 2);
    assert.equal(sessionsBody.data.filter(item => item.current).length, 1);
    const secondSession = sessionsBody.data.find(item => item.userAgent.includes('Second-Test-Device'));
    assert.ok(secondSession);
    const revokeSecond = await fetch(`${baseUrl}/auth/sessions/${secondSession.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${registerBody.data.accessToken}` } });
    assert.equal(revokeSecond.status, 200);
    assert.equal((await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', headers: { Cookie: secondCookie, 'X-CSRF-Token': secondLoginBody.data.csrfToken } })).status, 403);
    assert.ok(secondLoginBody.data.accessToken);

    assert.equal((await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', headers: { Cookie: cookie } })).status, 403);
    const refresh = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': registerBody.data.csrfToken } });
    const refreshBody = await refresh.json();
    assert.equal(refresh.status, 200);
    assert.ok(refreshBody.data.accessToken);
    assert.ok(refreshBody.data.csrfToken);
    cookie = refresh.headers.get('set-cookie').split(';')[0];

    const customerForbidden = await fetch(`${baseUrl}/admin/dashboard`, { headers: { Authorization: `Bearer ${refreshBody.data.accessToken}` } });
    assert.equal(customerForbidden.status, 403);

    await User.updateOne({ _id: userId }, { role: 'staff' });
    const staffRefresh = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': refreshBody.data.csrfToken } });
    const staffBody = await staffRefresh.json();
    assert.equal(staffBody.data.user.role, 'staff');
    cookie = staffRefresh.headers.get('set-cookie').split(';')[0];

    const staffDashboard = await fetch(`${baseUrl}/admin/dashboard`, { headers: { Authorization: `Bearer ${staffBody.data.accessToken}` } });
    assert.equal(staffDashboard.status, 403);
    const staffCannotCreateContent = await fetch(`${baseUrl}/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffBody.data.accessToken}` },
      body: JSON.stringify({})
    });
    assert.equal(staffCannotCreateContent.status, 403);

    await User.updateOne({ _id: userId }, { role: 'admin' });
    const adminRefresh = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': staffBody.data.csrfToken } });
    const adminBody = await adminRefresh.json();
    assert.equal(adminBody.data.user.role, 'admin');
    cookie = adminRefresh.headers.get('set-cookie').split(';')[0];

    const blockedAdminDashboard = await fetch(`${baseUrl}/admin/dashboard`, { headers: { Authorization: `Bearer ${adminBody.data.accessToken}` } });
    assert.equal(blockedAdminDashboard.status, 403);
    assert.equal((await blockedAdminDashboard.json()).code, 'MFA_ENROLLMENT_REQUIRED');

    const setupMfa = await fetch(`${baseUrl}/auth/mfa/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminBody.data.accessToken}` },
      body: JSON.stringify({ password: 'StrongPass123' })
    });
    const setupMfaBody = await setupMfa.json();
    assert.equal(setupMfa.status, 200);
    const mfaSecret = setupMfaBody.data.manualKey;
    const badConfirm = await fetch(`${baseUrl}/auth/mfa/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminBody.data.accessToken}` },
      body: JSON.stringify({ code: '000000' })
    });
    assert.equal(badConfirm.status, 400);
    const confirmMfa = await fetch(`${baseUrl}/auth/mfa/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminBody.data.accessToken}` },
      body: JSON.stringify({ code: totp(mfaSecret) })
    });
    assert.equal(confirmMfa.status, 200);
    const adminDashboard = await fetch(`${baseUrl}/admin/dashboard`, { headers: { Authorization: `Bearer ${adminBody.data.accessToken}` } });
    assert.equal(adminDashboard.status, 200);

    const staleRefreshToken = `stale-refresh-${uniqueToken('mfa')}`;
    const staleCsrfToken = `stale-csrf-${uniqueToken('mfa')}`;
    await RefreshSession.create({
      user: userId,
      tokenHash: hashToken(staleRefreshToken),
      csrfTokenHash: hashToken(staleCsrfToken),
      expiresAt: new Date(Date.now() + 60_000)
    });
    const staleRefresh = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { Cookie: `dk_refresh=${staleRefreshToken}`, 'X-CSRF-Token': staleCsrfToken }
    });
    assert.equal(staleRefresh.status, 401);
    assert.equal((await staleRefresh.json()).code, 'MFA_LOGIN_REQUIRED');

    const mfaLogin = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: email, password: 'StrongPass123' }) });
    const mfaLoginBody = await mfaLogin.json();
    assert.equal(mfaLogin.status, 202);
    assert.equal(mfaLoginBody.data.mfaRequired, true);
    assert.ok(mfaLoginBody.data.challengeToken);
    const invalidMfaComplete = await fetch(`${baseUrl}/auth/mfa/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeToken: mfaLoginBody.data.challengeToken, code: '000000' }) });
    assert.equal(invalidMfaComplete.status, 401);
    const mfaComplete = await fetch(`${baseUrl}/auth/mfa/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeToken: mfaLoginBody.data.challengeToken, code: totp(mfaSecret) }) });
    const mfaCompleteBody = await mfaComplete.json();
    assert.equal(mfaComplete.status, 200);
    assert.equal(mfaCompleteBody.data.user.mfaEnabled, true);
    assert.ok(mfaComplete.headers.get('set-cookie'));
    assert.equal((await fetch(`${baseUrl}/admin/dashboard`, { headers: { Authorization: `Bearer ${mfaCompleteBody.data.accessToken}` } })).status, 200);

    const logout = await fetch(`${baseUrl}/auth/logout`, { method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': adminBody.data.csrfToken } });
    assert.equal(logout.status, 200);

    const afterLogout = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', headers: { Cookie: cookie, 'X-CSRF-Token': adminBody.data.csrfToken } });
    assert.equal(afterLogout.status, 403);

    const invalidReset = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid-token', password: 'ChangedPass123' })
    });
    assert.equal(invalidReset.status, 400);
    const account = await User.findById(userId);
    const expiredResetToken = await issueAccountToken(account, 'password_reset', -1);
    assert.equal((await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: expiredResetToken, password: 'ChangedPass123' })
    })).status, 400);
    const resetToken = await issueAccountToken(account, 'password_reset', 30);
    const resetRequest = () => fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: resetToken, password: 'ChangedPass123' })
    });
    const resetStatuses = (await Promise.all([resetRequest(), resetRequest()])).map(response => response.status).sort();
    assert.deepEqual(resetStatuses, [200, 400]);
    assert.equal((await resetRequest()).status, 400);

    const expiredVerificationToken = await issueAccountToken(account, 'email_verification', -1);
    assert.equal((await fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: expiredVerificationToken })
    })).status, 400);
    const verificationToken = await issueAccountToken(account, 'email_verification', 30);
    const verifyRequest = () => fetch(`${baseUrl}/auth/verify-email`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verificationToken })
    });
    const verifyStatuses = (await Promise.all([verifyRequest(), verifyRequest()])).map(response => response.status).sort();
    assert.deepEqual(verifyStatuses, [200, 400]);
    assert.equal((await verifyRequest()).status, 400);
  } finally {
    const user = userId ? await User.findById(userId) : await User.findOne({ email });
    if (user) {
      await RefreshSession.deleteMany({ user: user._id });
      await User.deleteOne({ _id: user._id });
    }
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await mongoose.disconnect();
  }
});
