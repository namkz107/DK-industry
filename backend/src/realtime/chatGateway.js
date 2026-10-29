const { Server } = require('socket.io');
const RequestMessage = require('../models/RequestMessage');
const ServiceRequest = require('../models/ServiceRequest');
const { customerRoom, staffRoom, setChatNamespace, emitRequestEvent, emitTyping } = require('../services/realtimeService');
const { isSocketSessionActive, registerSocketSession } = require('../services/socketSessionService');
const { initializeSupportGateway } = require('./supportGateway');
const { authenticatedUser } = require('./socketAuth');
const { clientOrigins } = require('../config/runtime');

const validRequestId = value => /^[a-f\d]{24}$/i.test(String(value || ''));

async function authorizedRequest(requestId, user) {
  if (!validRequestId(requestId)) return null;
  if (!['customer', 'staff'].includes(user.role)) return null;
  const filter = user.role === 'customer'
    ? { _id: requestId, customer: user._id }
    : { _id: requestId, assignedTo: { $in: [user._id, null] } };
  return ServiceRequest.findOne(filter).select('_id customer assignedTo').lean();
}

function initializeChatGateway(httpServer) {
  const allowedOrigins = clientOrigins();
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
    connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000, skipMiddlewares: false }
  });
  const chat = io.of('/chat');
  setChatNamespace(chat);
  initializeSupportGateway(io);

  chat.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Vui lòng đăng nhập'));
      const authenticated = await authenticatedUser(token);
      socket.data.user = authenticated.user;
      socket.data.expiresAt = authenticated.expiresAt;
      socket.data.sessionId = authenticated.sessionId;
      next();
    } catch (error) {
      next(new Error(error.name === 'TokenExpiredError' ? 'Phiên đăng nhập đã hết hạn' : error.message || 'Không thể xác thực'));
    }
  });

  chat.on('connection', socket => {
    registerSocketSession(socket, { sessionId: socket.data.sessionId, userId: socket.data.user._id });
    const expiryTimer = setTimeout(() => {
      socket.emit('auth:expired');
      socket.disconnect(true);
    }, Math.max(0, socket.data.expiresAt - Date.now()));
    expiryTimer.unref?.();
    socket.on('disconnect', () => clearTimeout(expiryTimer));
    if (socket.data.user.role === 'staff') socket.join('operations');

    socket.on('request:join', async (requestId, acknowledge = () => {}) => {
      try {
        if (!await isSocketSessionActive(socket)) {
          socket.disconnect(true);
          return acknowledge({ ok: false, message: 'Phiên đăng nhập không còn hiệu lực' });
        }
        const request = await authorizedRequest(requestId, socket.data.user);
        if (!request) return acknowledge({ ok: false, message: 'Bạn không có quyền truy cập hội thoại này' });
        const room = socket.data.user.role === 'customer' ? customerRoom(requestId) : staffRoom(requestId);
        await socket.join(room);
        if (!await authorizedRequest(requestId, socket.data.user)) {
          await socket.leave(room);
          return acknowledge({ ok: false, message: 'Bạn không có quyền truy cập hội thoại này' });
        }
        acknowledge({ ok: true });
      } catch {
        acknowledge({ ok: false, message: 'Không thể mở hội thoại' });
      }
    });

    socket.on('request:leave', requestId => {
      if (!validRequestId(requestId)) return;
      socket.leave(customerRoom(requestId));
      socket.leave(staffRoom(requestId));
    });

    socket.on('message:read', async (requestId, acknowledge = () => {}) => {
      try {
        const user = socket.data.user;
        if (!await isSocketSessionActive(socket)) {
          socket.disconnect(true);
          return acknowledge({ ok: false });
        }
        const request = await authorizedRequest(requestId, user);
        if (!request) {
          socket.leave(customerRoom(requestId));
          socket.leave(staffRoom(requestId));
          return acknowledge({ ok: false });
        }
        const now = new Date();
        const isCustomer = user.role === 'customer';
        const filter = isCustomer
          ? { request: requestId, visibility: 'customer', senderRole: { $in: ['staff', 'admin', 'system'] }, readByCustomerAt: null }
          : { request: requestId, senderRole: 'customer', readByStaffAt: null };
        const update = isCustomer ? { readByCustomerAt: now } : { readByStaffAt: now };
        const result = await RequestMessage.updateMany(filter, update);
        if (result.modifiedCount) {
          await emitRequestEvent(requestId, 'message:read', { requestId: String(requestId), readerRole: isCustomer ? 'customer' : 'staff', readAt: now.toISOString() });
        }
        acknowledge({ ok: true, readAt: now.toISOString() });
      } catch {
        acknowledge({ ok: false });
      }
    });

    for (const event of ['typing:start', 'typing:stop']) {
      socket.on(event, async requestId => {
        if (!validRequestId(requestId)) return;
        try {
          if (!await isSocketSessionActive(socket)) return socket.disconnect(true);
          const user = socket.data.user;
          const ownRoom = user.role === 'customer' ? customerRoom(requestId) : staffRoom(requestId);
          if (!socket.rooms.has(ownRoom) || !await authorizedRequest(requestId, user)) {
            await socket.leave(ownRoom);
            return;
          }
          await emitTyping(requestId, event, { requestId: String(requestId), role: user.role, name: user.name }, socket.id);
        } catch {
          // Typing indicators are best effort and fail closed.
        }
      });
    }
  });

  return io;
}

module.exports = { initializeChatGateway, authenticatedUser };
