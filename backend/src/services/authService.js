const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshSession = require('../models/RefreshSession');
const { cookieOptions } = require('../config/runtime');

const REFRESH_DAYS = 7;

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw Object.assign(new Error('JWT_SECRET chưa được cấu hình'), { status: 503 });
  if (process.env.NODE_ENV === 'production' && secret.startsWith('replace_with_')) {
    throw Object.assign(new Error('JWT_SECRET production không hợp lệ'), { status: 503 });
  }
  return secret;
}

function createAccessToken(user, sessionId) {
  return jwt.sign(
    { role: user.role, sid: String(sessionId), tv: user.tokenVersion || 0 },
    jwtSecret(),
    { subject: String(user._id), expiresIn: '15m', issuer: 'dk-industry-api', audience: 'dk-industry-web' }
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, jwtSecret(), { issuer: 'dk-industry-api', audience: 'dk-industry-web' });
}

function createMfaChallenge(user) {
  return jwt.sign(
    { purpose: 'mfa_login', tv: user.tokenVersion || 0 },
    jwtSecret(),
    { subject: String(user._id), expiresIn: '5m', issuer: 'dk-industry-api', audience: 'dk-industry-mfa' }
  );
}

function verifyMfaChallenge(token) {
  const payload = jwt.verify(token, jwtSecret(), { issuer: 'dk-industry-api', audience: 'dk-industry-mfa' });
  if (payload.purpose !== 'mfa_login') throw new Error('MFA challenge is invalid');
  return payload;
}

function createSupportSocketToken(conversationId) {
  return jwt.sign({ purpose: 'support_guest', conversationId: String(conversationId) }, jwtSecret(), { expiresIn: '15m', issuer: 'dk-industry-api', audience: 'dk-industry-support' });
}

function verifySupportSocketToken(token) {
  const payload = jwt.verify(token, jwtSecret(), { issuer: 'dk-industry-api', audience: 'dk-industry-support' });
  if (payload.purpose !== 'support_guest' || !payload.conversationId) throw new Error('Phiên hỗ trợ không hợp lệ');
  return payload;
}

function newRefreshToken() {
  return crypto.randomBytes(64).toString('base64url');
}

function newCsrfToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function refreshExpiry() {
  return new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
}

async function createSession(user, req) {
  const refreshToken = newRefreshToken();
  const csrfToken = newCsrfToken();
  const session = await RefreshSession.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    csrfTokenHash: hashToken(csrfToken),
    expiresAt: refreshExpiry(),
    userAgent: req.get('user-agent') || '',
    ip: req.ip
  });
  return { accessToken: createAccessToken(user, session._id), refreshToken, csrfToken, session };
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    company: user.company || '',
    status: user.status,
    emailVerified: Boolean(user.emailVerifiedAt),
    mfaEnabled: Boolean(user.mfaEnabledAt)
  };
}

const refreshCookieOptions = () => cookieOptions('/api/auth');
const cookieBaseOptions = () => cookieOptions('/api/auth');

module.exports = { createAccessToken, verifyAccessToken, createMfaChallenge, verifyMfaChallenge, createSupportSocketToken, verifySupportSocketToken, createSession, hashToken, newCsrfToken, newRefreshToken, refreshExpiry, publicUser, refreshCookieOptions, cookieBaseOptions };
