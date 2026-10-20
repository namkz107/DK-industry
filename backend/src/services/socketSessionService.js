const RefreshSession = require('../models/RefreshSession');

const socketsBySession = new Map();
const socketsByUser = new Map();

const add = (registry, key, socket) => {
  if (!key) return;
  const value = String(key);
  const sockets = registry.get(value) || new Set();
  sockets.add(socket);
  registry.set(value, sockets);
};

const remove = (registry, key, socket) => {
  if (!key) return;
  const value = String(key);
  const sockets = registry.get(value);
  if (!sockets) return;
  sockets.delete(socket);
  if (!sockets.size) registry.delete(value);
};

function registerSocketSession(socket, { sessionId, userId } = {}) {
  if (!sessionId || !userId) return;
  socket.data.sessionId = String(sessionId);
  socket.data.userId = String(userId);
  add(socketsBySession, sessionId, socket);
  add(socketsByUser, userId, socket);
  socket.once('disconnect', () => {
    remove(socketsBySession, sessionId, socket);
    remove(socketsByUser, userId, socket);
  });
}

function disconnectSockets(sockets, reason = 'session_revoked') {
  for (const socket of [...(sockets || [])]) {
    socket.emit('auth:revoked', { reason });
    socket.disconnect(true);
  }
}

function disconnectSessionSockets(sessionId, reason) {
  disconnectSockets(socketsBySession.get(String(sessionId || '')), reason);
}

function disconnectUserSockets(userId, { exceptSessionId, reason } = {}) {
  const sockets = socketsByUser.get(String(userId || '')) || [];
  const filtered = [...sockets].filter(socket => !exceptSessionId || socket.data.sessionId !== String(exceptSessionId));
  disconnectSockets(filtered, reason);
}

async function isSocketSessionActive(socket) {
  if (!(process.env.NODE_ENV === 'production' || process.env.ENFORCE_SESSION_CHECK === 'true')) return true;
  const sessionId = socket.data.sessionId;
  const userId = socket.data.userId || socket.data.user?._id;
  if (!sessionId || !userId) return false;
  return Boolean(await RefreshSession.exists({
    _id: sessionId,
    user: userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  }));
}

module.exports = {
  disconnectSessionSockets,
  disconnectUserSockets,
  isSocketSessionActive,
  registerSocketSession
};
