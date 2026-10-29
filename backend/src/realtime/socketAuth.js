const RefreshSession = require('../models/RefreshSession');
const User = require('../models/User');
const { verifyAccessToken } = require('../services/authService');

async function authenticatedUser(token) {
  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user || user.status !== 'active' || user.tokenVersion !== payload.tv) throw new Error('Phiên đăng nhập không còn hiệu lực');
  if (process.env.NODE_ENV === 'production' || process.env.ENFORCE_SESSION_CHECK === 'true') {
    if (!payload.sid) throw new Error('Phiên đăng nhập không còn hiệu lực');
    const active = await RefreshSession.exists({ _id: payload.sid, user: user._id, revokedAt: null, expiresAt: { $gt: new Date() } });
    if (!active) throw new Error('Phiên đăng nhập đã bị thu hồi');
  }
  return { user, expiresAt: payload.exp * 1000, sessionId: payload.sid };
}

module.exports = { authenticatedUser };
