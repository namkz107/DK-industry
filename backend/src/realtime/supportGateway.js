const mongoose = require('mongoose');
const SupportConversation = require('../models/SupportConversation');
const SupportMessage = require('../models/SupportMessage');
const { verifySupportSocketToken } = require('../services/authService');
const { conversationRoom, emitSupportEvent, setSupportNamespace } = require('../services/supportRealtimeService');
const { isSocketSessionActive, registerSocketSession } = require('../services/socketSessionService');
const { authenticatedUser } = require('./socketAuth');

async function authorizedConversation(conversationId, socket) {
  if (!conversationId || !mongoose.isValidObjectId(conversationId)) return false;
  if (socket.data.guestConversationId) return socket.data.guestConversationId === String(conversationId);
  if (!await isSocketSessionActive(socket)) return false;
  if (socket.data.user?.role === 'customer') return Boolean(await SupportConversation.exists({ _id: conversationId, customer: socket.data.user._id }));
  if (socket.data.user?.role === 'staff') {
    return Boolean(await SupportConversation.exists({ _id: conversationId, assignedTo: { $in: [socket.data.user._id, null] } }));
  }
  return false;
}

function initializeSupportGateway(io) {
  const support = io.of('/support');
  setSupportNamespace(support);

  support.use(async (socket, next) => {
    try {
      const { token, supportToken } = socket.handshake.auth || {};
      if (token) {
        const authenticated = await authenticatedUser(token);
        socket.data.user = authenticated.user;
        socket.data.expiresAt = authenticated.expiresAt;
        socket.data.sessionId = authenticated.sessionId;
      } else if (supportToken) {
        const payload = verifySupportSocketToken(supportToken);
        socket.data.guestConversationId = payload.conversationId;
        socket.data.expiresAt = payload.exp * 1000;
      } else throw new Error('Không tìm thấy phiên hỗ trợ');
      next();
    } catch (error) { next(new Error(error.message || 'Phiên hỗ trợ không hợp lệ')); }
  });

  support.on('connection', socket => {
    if (socket.data.user) registerSocketSession(socket, { sessionId: socket.data.sessionId, userId: socket.data.user._id });
    const timer = setTimeout(() => { socket.emit('auth:expired'); socket.disconnect(true); }, Math.max(0, socket.data.expiresAt - Date.now()));
    timer.unref?.();
    socket.on('disconnect', () => clearTimeout(timer));
    if (socket.data.user?.role === 'staff') socket.join('support:staff');

    socket.on('support:join', async (conversationId, acknowledge = () => {}) => {
      try {
        if (!await authorizedConversation(conversationId, socket)) return acknowledge({ ok: false });
        await socket.join(conversationRoom(conversationId));
        if (!await authorizedConversation(conversationId, socket)) {
          await socket.leave(conversationRoom(conversationId));
          return acknowledge({ ok: false });
        }
        acknowledge({ ok: true });
      } catch { acknowledge({ ok: false }); }
    });

    socket.on('support:read', async conversationId => {
      try {
        if (!conversationId || !mongoose.isValidObjectId(conversationId)) return;
        const user = socket.data.user;
        if (user && !await isSocketSessionActive(socket)) return socket.disconnect(true);
        const isStaff = user?.role === 'staff';
        const allowed = isStaff
          ? Boolean(await SupportConversation.exists({ _id: conversationId, assignedTo: { $in: [user._id, null] } }))
          : socket.data.guestConversationId === String(conversationId)
            || (user?.role === 'customer' && await SupportConversation.exists({ _id: conversationId, customer: user._id }));
        if (!allowed) return;
        const roles = isStaff ? ['guest', 'customer'] : ['staff', 'admin', 'system'];
        const now = new Date();
        await Promise.all([
          SupportMessage.updateMany({ conversation: conversationId, senderRole: { $in: roles }, readAt: null }, { readAt: now }),
          SupportConversation.updateOne({ _id: conversationId }, isStaff ? { unreadByStaff: 0 } : { unreadByCustomer: 0 })
        ]);
        await emitSupportEvent(conversationId, 'support:read', { conversationId: String(conversationId), reader: isStaff ? 'staff' : 'customer', readAt: now.toISOString() });
        if (isStaff) support.to('support:staff').emit('support:inbox', {});
      } catch {
        // A read receipt is best effort and must never terminate the socket process.
      }
    });
  });
}

module.exports = { initializeSupportGateway };
