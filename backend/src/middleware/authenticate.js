const User = require('../models/User');
const RefreshSession = require('../models/RefreshSession');
const { verifyAccessToken } = require('../services/authService');

async function authenticate(req, res, next) {
  try {
    const [scheme, token] = (req.get('authorization') || '').split(' ');
    if (scheme !== 'Bearer' || !token) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập' });
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select('+tokenVersion');
    if (!user || user.status !== 'active' || user.tokenVersion !== payload.tv) {
      return res.status(401).json({ success: false, message: 'Phiên đăng nhập không còn hiệu lực' });
    }
    if (process.env.NODE_ENV === 'production' || process.env.ENFORCE_SESSION_CHECK === 'true') {
      if (!payload.sid) return res.status(401).json({ success: false, message: 'Phiên đăng nhập không còn hiệu lực' });
      const activeSession = await RefreshSession.exists({ _id: payload.sid, user: user._id, revokedAt: null, expiresAt: { $gt: new Date() } });
      if (!activeSession) return res.status(401).json({ success: false, message: 'Phiên đăng nhập đã bị thu hồi' });
    }
    req.user = user;
    req.auth = payload;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, code: 'ACCESS_TOKEN_EXPIRED', message: 'Phiên đăng nhập đã hết hạn' });
    return res.status(401).json({ success: false, message: 'Thông tin xác thực không hợp lệ' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user?.role)
    ? next()
    : res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
}

async function requireAdminMfa(req, res, next) {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện thao tác này' });
    if (!req.user.mfaEnabledAt) {
      return res.status(403).json({ success: false, code: 'MFA_ENROLLMENT_REQUIRED', message: 'Quản trị viên phải thiết lập MFA trước khi sử dụng chức năng quản trị' });
    }
    if (!req.auth?.sid) {
      return res.status(403).json({ success: false, code: 'MFA_VERIFICATION_REQUIRED', message: 'Phiên quản trị chưa xác minh MFA' });
    }
    const verified = await RefreshSession.exists({
      _id: req.auth.sid,
      user: req.user._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
      mfaVerifiedAt: { $exists: true, $ne: null }
    });
    return verified
      ? next()
      : res.status(403).json({ success: false, code: 'MFA_VERIFICATION_REQUIRED', message: 'Phiên quản trị chưa xác minh MFA' });
  } catch (error) { next(error); }
}

function requireVerifiedEmail(req, res, next) {
  return req.user?.emailVerifiedAt
    ? next()
    : res.status(403).json({ success: false, code: 'EMAIL_VERIFICATION_REQUIRED', message: 'Vui lòng xác minh email trước khi thực hiện thao tác này' });
}

module.exports = { authenticate, requireAdminMfa, requireRole, requireVerifiedEmail };
