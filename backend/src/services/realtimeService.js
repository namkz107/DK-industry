let chatNamespace;
const ServiceRequest = require('../models/ServiceRequest');
const { publicMessage } = require('./chatMessageService');
const { isSocketSessionActive } = require('./socketSessionService');

const customerRoom = requestId => `request:${requestId}:customer`;
const staffRoom = requestId => `request:${requestId}:staff`;

function setChatNamespace(namespace) {
  chatNamespace = namespace;
}

async function authorizedSockets(room, request, role) {
  const sockets = await chatNamespace.in(room).fetchSockets();
  const allowed = [];
  for (const socket of sockets) {
    const user = socket.data.user;
    const ownsResource = role === 'customer'
      ? user?.role === 'customer' && String(request.customer) === String(user._id)
      : user?.role === 'staff' && (!request.assignedTo || String(request.assignedTo) === String(user._id));
    const activeSession = ownsResource && await isSocketSessionActive(socket);
    if (activeSession) allowed.push(socket);
    else await socket.leave(room);
  }
  return allowed;
}

async function emitRequestEvent(requestId, event, payload, { visibility = 'customer' } = {}) {
  if (!chatNamespace) return;
  const id = String(requestId);
  const request = await ServiceRequest.findById(id).select('_id customer assignedTo').lean();
  if (!request) return;
  const staffSockets = await authorizedSockets(staffRoom(id), request, 'staff');
  for (const socket of staffSockets) socket.emit(event, payload);
  if (visibility === 'customer') {
    const customerSockets = await authorizedSockets(customerRoom(id), request, 'customer');
    for (const socket of customerSockets) socket.emit(event, payload);
  }
}

async function emitMessage(message) {
  const value = publicMessage(message);
  await emitRequestEvent(value.request, 'message:new', { requestId: String(value.request), message: value }, { visibility: value.visibility });
}

async function emitRequestUpdated(requestId, reason = 'updated', { visibility = 'customer' } = {}) {
  await emitRequestEvent(requestId, 'request:updated', { requestId: String(requestId), reason }, { visibility });
  // Staff in the shared operations room only receive a generic invalidation.
  // Resource identifiers and details are delivered through authorized request rooms.
  if (chatNamespace) chatNamespace.to('operations').emit('inbox:updated', {});
}

async function emitTyping(requestId, event, payload, sourceSocketId) {
  if (!chatNamespace) return;
  const id = String(requestId);
  const request = await ServiceRequest.findById(id).select('_id customer assignedTo').lean();
  if (!request) return;
  const targetRole = payload.role === 'customer' ? 'staff' : 'customer';
  const room = targetRole === 'staff' ? staffRoom(id) : customerRoom(id);
  const sockets = await authorizedSockets(room, request, targetRole);
  for (const socket of sockets) if (socket.id !== sourceSocketId) socket.emit(event, payload);
}

module.exports = {
  customerRoom,
  staffRoom,
  setChatNamespace,
  emitRequestEvent,
  emitMessage,
  emitRequestUpdated,
  emitTyping
};
