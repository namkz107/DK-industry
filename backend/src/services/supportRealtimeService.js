let namespace;
const SupportConversation = require('../models/SupportConversation');
const { isSocketSessionActive } = require('./socketSessionService');

const conversationRoom = id => `support:${id}`;

function setSupportNamespace(value) { namespace = value; }

async function authorizedSockets(conversationId, conversation) {
  const room = conversationRoom(conversationId);
  const sockets = await namespace.in(room).fetchSockets();
  const allowed = [];
  for (const socket of sockets) {
    const user = socket.data.user;
    let authorized = socket.data.guestConversationId === String(conversationId);
    if (user?.role === 'customer') authorized = String(conversation.customer) === String(user._id);
    if (user?.role === 'staff') authorized = !conversation.assignedTo || String(conversation.assignedTo) === String(user._id);
    if (user) authorized = authorized && await isSocketSessionActive(socket);
    if (authorized) allowed.push(socket);
    else await socket.leave(room);
  }
  return allowed;
}

async function emitSupportEvent(conversationId, event, payload) {
  if (!namespace) return;
  const conversation = await SupportConversation.findById(conversationId).select('_id customer assignedTo').lean();
  if (!conversation) return;
  const sockets = await authorizedSockets(conversationId, conversation);
  for (const socket of sockets) socket.emit(event, payload);
}

async function emitSupportMessage(conversationId, message) {
  if (!namespace) return;
  const payload = { conversationId: String(conversationId), message: typeof message.toObject === 'function' ? message.toObject() : message };
  await emitSupportEvent(conversationId, 'support:message', payload);
  namespace.to('support:staff').emit('support:inbox', {});
}

async function emitSupportUpdated(conversationId) {
  if (!namespace) return;
  await emitSupportEvent(conversationId, 'support:updated', { conversationId: String(conversationId) });
  namespace.to('support:staff').emit('support:inbox', {});
}

async function emitSupportAiStatus(conversationId, status) {
  if (!namespace) return;
  await emitSupportEvent(conversationId, 'support:ai-status', { conversationId: String(conversationId), status });
}

module.exports = { conversationRoom, setSupportNamespace, emitSupportEvent, emitSupportMessage, emitSupportUpdated, emitSupportAiStatus };
