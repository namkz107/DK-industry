const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const RefreshSession = require('../models/RefreshSession');
const AccountToken = require('../models/AccountToken');
const { authenticate, requireRole } = require('../middleware/authenticate');
const { createAccessToken, createMfaChallenge, createSession, hashToken, newCsrfToken, newRefreshToken, refreshExpiry, publicUser, refreshCookieOptions, cookieBaseOptions, verifyMfaChallenge } = require('../services/authService');
const { decryptSecret, encryptSecret, generateRecoveryCodes, generateSecret, hashRecoveryCode, otpAuthUrl, recoveryCodeHash, verifyTotp } = require('../services/mfaService');
const { sendDirectEmail } = require('../services/notificationService');

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:\+84|0)[0-9]{9,10}$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/;
const normalizePhone = value => String(value || '').replace(/[\s.-]/g, '');
const businessName = () => String(process.env.COMPANY_NAME || 'Cơ khí Đăng Khoa').trim().slice(0, 180) || 'Cơ khí Đăng Khoa';

function validatePassword(password) {
  return passwordPattern.test(String(password || ''));
}

const sessionPayload = (user, tokens) => ({ user: publicUser(user), accessToken: tokens.accessToken, csrfToken: tokens.csrfToken });

async function issueAccountToken(user, type, ttlMinutes) {
  await AccountToken.deleteMany({ user: user._id, type, usedAt: null });
  const token = crypto.randomBytes(32).toString('base64url');
  await AccountToken.create({ user: user._id, type, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + ttlMinutes * 60 * 1000) });
  return token;
}

function clientUrl(path, token) {
  const base = (process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0].replace(/\/$/, '');
  return `${base}${path}?token=${encodeURIComponent(token)}`;
}

router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const phone = normalizePhone(req.body.phone);
    const password = String(req.body.password || '');
    if (name.length < 2 || name.length > 100) return res.status(400).json({ success: false, message: 'Họ tên phải có từ 2 đến 100 ký tự' });
    if (!emailPattern.test(email)) return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
    if (!phonePattern.test(phone)) return res.status(400).json({ success: false, message: 'Số điện thoại Việt Nam không hợp lệ' });
    if (!validatePassword(password)) return res.status(400).json({ success: false, message: 'Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số' });
    const exists = await User.exists({ $or: [{ email }, { phone }] });
    if (exists) return res.status(409).json({ success: false, message: 'Email hoặc số điện thoại đã được sử dụng' });

    const user = await User.create({ name, email, phone, passwordHash: await User.hashPassword(password), role: 'customer' });
    const verificationToken = await issueAccountToken(user, 'email_verification', 24 * 60);
    const tokens = await createSession(user, req);
    res.cookie('dk_refresh', tokens.refreshToken, refreshCookieOptions());
    res.status(201).json({ success: true, data: sessionPayload(user, tokens) });
    if (process.env.NODE_ENV !== 'test') setImmediate(() => sendDirectEmail({ to: user.email, subject: `Xác minh email ${businessName()}`, text: `Xin chào ${user.name},\n\nXác minh email của bạn tại: ${clientUrl('/xac-minh-email', verificationToken)}\n\nLiên kết có hiệu lực 24 giờ.` }).catch(error => console.error('Verification email failed:', error.message)));
  } catch (error) { next(error); }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    if (emailPattern.test(email)) {
      const user = await User.findOne({ email, status: 'active' });
      if (user) {
        const token = await issueAccountToken(user, 'password_reset', 30);
        if (process.env.NODE_ENV !== 'test') setImmediate(() => sendDirectEmail({ to: user.email, subject: `Đặt lại mật khẩu ${businessName()}`, text: `Chúng tôi nhận được yêu cầu đặt lại mật khẩu.\n\nTạo mật khẩu mới tại: ${clientUrl('/dat-lai-mat-khau', token)}\n\nLiên kết có hiệu lực 30 phút. Nếu bạn không yêu cầu, hãy bỏ qua email này.` }).catch(error => console.error('Password reset email failed:', error.message)));
      }
    }
    res.json({ success: true, message: 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi.' });
  } catch (error) { next(error); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const token = String(req.body.token || '');
    const password = String(req.body.password || '');
    if (!validatePassword(password)) return res.status(400).json({ success: false, message: 'Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số' });
    const accountToken = await AccountToken.findOne({ tokenHash: hashToken(token), type: 'password_reset', usedAt: null, expiresAt: { $gt: new Date() } });
    if (!accountToken) return res.status(400).json({ success: false, message: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' });
    const user = await User.findById(accountToken.user).select('+passwordHash +tokenVersion');
    if (!user || user.status !== 'active') return res.status(400).json({ success: false, message: 'Tài khoản không còn hoạt động' });
    user.passwordHash = await User.hashPassword(password);
    user.tokenVersion += 1;
    accountToken.usedAt = new Date();
    await Promise.all([user.save(), accountToken.save(), RefreshSession.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() })]);
    res.clearCookie('dk_refresh', cookieBaseOptions());
    res.json({ success: true, message: 'Đã đổi mật khẩu. Vui lòng đăng nhập lại.' });
  } catch (error) { next(error); }
});

router.post('/verify-email', async (req, res, next) => {
  try {
    const accountToken = await AccountToken.findOne({ tokenHash: hashToken(String(req.body.token || '')), type: 'email_verification', usedAt: null, expiresAt: { $gt: new Date() } });
    if (!accountToken) return res.status(400).json({ success: false, message: 'Liên kết xác minh không hợp lệ hoặc đã hết hạn' });
    const user = await User.findById(accountToken.user);
    if (!user) return res.status(400).json({ success: false, message: 'Tài khoản không tồn tại' });
    user.emailVerifiedAt = user.emailVerifiedAt || new Date();
    accountToken.usedAt = new Date();
    await Promise.all([user.save(), accountToken.save()]);
    res.json({ success: true, message: 'Email đã được xác minh thành công.' });
  } catch (error) { next(error); }
});

router.post('/resend-verification', authenticate, async (req, res, next) => {
  try {
    if (req.user.emailVerifiedAt) return res.json({ success: true, message: 'Email đã được xác minh.' });
    const token = await issueAccountToken(req.user, 'email_verification', 24 * 60);
    if (process.env.NODE_ENV !== 'test') await sendDirectEmail({ to: req.user.email, subject: `Xác minh email ${businessName()}`, text: `Xin chào ${req.user.name},\n\nXác minh email của bạn tại: ${clientUrl('/xac-minh-email', token)}\n\nLiên kết có hiệu lực 24 giờ.` });
    res.json({ success: true, message: 'Đã gửi lại email xác minh.' });
  } catch (error) { next(error); }
});

router.post('/mfa/setup', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+passwordHash +mfaPendingSecretEncrypted +mfaPendingExpiresAt');
    if (!user || !(await user.verifyPassword(String(req.body.password || '')))) {
      return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }
    if (user.mfaEnabledAt) return res.status(409).json({ success: false, message: 'MFA đã được bật cho tài khoản này' });
    const secret = generateSecret();
    user.mfaPendingSecretEncrypted = encryptSecret(secret);
    user.mfaPendingExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    res.json({ success: true, data: { manualKey: secret, otpAuthUrl: otpAuthUrl({ secret, email: user.email }), expiresAt: user.mfaPendingExpiresAt } });
  } catch (error) { next(error); }
});

router.post('/mfa/confirm', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+mfaPendingSecretEncrypted +mfaPendingExpiresAt +mfaSecretEncrypted +mfaRecoveryCodeHashes');
    if (!user?.mfaPendingSecretEncrypted || !user.mfaPendingExpiresAt || user.mfaPendingExpiresAt <= new Date()) {
      return res.status(400).json({ success: false, message: 'Thiết lập MFA đã hết hạn. Vui lòng bắt đầu lại.' });
    }
    const secret = decryptSecret(user.mfaPendingSecretEncrypted);
    if (!verifyTotp(secret, req.body.code)) return res.status(400).json({ success: false, message: 'Mã xác thực không đúng hoặc đã hết hạn' });
    const recoveryCodes = generateRecoveryCodes();
    user.mfaSecretEncrypted = user.mfaPendingSecretEncrypted;
    user.mfaEnabledAt = new Date();
    user.mfaRecoveryCodeHashes = recoveryCodes.map(hashRecoveryCode);
    user.mfaPendingSecretEncrypted = undefined;
    user.mfaPendingExpiresAt = undefined;
    await Promise.all([
      user.save(),
      RefreshSession.updateMany({ user: user._id, _id: { $ne: req.auth.sid }, revokedAt: null }, { revokedAt: new Date() })
    ]);
    res.json({ success: true, message: 'Đã bật MFA. Các phiên khác đã bị thu hồi.', data: { recoveryCodes } });
  } catch (error) { next(error); }
});

router.post('/mfa/disable', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+passwordHash +mfaSecretEncrypted +mfaRecoveryCodeHashes');
    if (!user?.mfaEnabledAt || !user.mfaSecretEncrypted) return res.status(409).json({ success: false, message: 'MFA chưa được bật' });
    if (!(await user.verifyPassword(String(req.body.password || '')))) return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    const secret = decryptSecret(user.mfaSecretEncrypted);
    const recoveryHash = recoveryCodeHash(req.body.code, user.mfaRecoveryCodeHashes || []);
    if (!verifyTotp(secret, req.body.code) && !recoveryHash) return res.status(400).json({ success: false, message: 'Mã xác thực không đúng' });
    user.mfaEnabledAt = undefined;
    user.mfaSecretEncrypted = undefined;
    user.mfaRecoveryCodeHashes = undefined;
    await Promise.all([
      user.save(),
      RefreshSession.updateMany({ user: user._id, _id: { $ne: req.auth.sid }, revokedAt: null }, { revokedAt: new Date() })
    ]);
    res.json({ success: true, message: 'Đã tắt MFA. Các phiên khác đã bị thu hồi.' });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const identifier = String(req.body.identifier || '').trim();
    const password = String(req.body.password || '');
    const query = identifier.includes('@') ? { email: identifier.toLowerCase() } : { phone: normalizePhone(identifier) };
    const user = await User.findOne(query).select('+passwordHash +tokenVersion');
    if (!user || !(await user.verifyPassword(password))) return res.status(401).json({ success: false, message: 'Email, số điện thoại hoặc mật khẩu không đúng' });
    if (user.status !== 'active') return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.' });

    if (user.role === 'admin' && user.mfaEnabledAt) {
      return res.status(202).json({ success: true, data: { mfaRequired: true, challengeToken: createMfaChallenge(user) } });
    }

    user.lastLoginAt = new Date();
    await user.save();
    const tokens = await createSession(user, req);
    res.cookie('dk_refresh', tokens.refreshToken, refreshCookieOptions());
    res.json({ success: true, data: sessionPayload(user, tokens) });
  } catch (error) { next(error); }
});

router.post('/mfa/complete', async (req, res, next) => {
  try {
    let challenge;
    try { challenge = verifyMfaChallenge(String(req.body.challengeToken || '')); }
    catch { return res.status(401).json({ success: false, message: 'Phiên xác thực MFA không hợp lệ hoặc đã hết hạn' }); }
    const user = await User.findById(challenge.sub).select('+tokenVersion +mfaSecretEncrypted +mfaRecoveryCodeHashes');
    if (!user || user.status !== 'active' || user.role !== 'admin' || !user.mfaEnabledAt || user.tokenVersion !== challenge.tv) {
      return res.status(401).json({ success: false, message: 'Phiên xác thực MFA không còn hiệu lực' });
    }
    const code = String(req.body.code || '');
    const secret = decryptSecret(user.mfaSecretEncrypted);
    const recoveryHash = recoveryCodeHash(code, user.mfaRecoveryCodeHashes || []);
    if (!verifyTotp(secret, code) && !recoveryHash) return res.status(401).json({ success: false, message: 'Mã xác thực không đúng hoặc đã hết hạn' });
    if (recoveryHash) {
      user.mfaRecoveryCodeHashes = user.mfaRecoveryCodeHashes.filter(hash => hash !== recoveryHash);
    }
    user.lastLoginAt = new Date();
    await user.save();
    const tokens = await createSession(user, req);
    res.cookie('dk_refresh', tokens.refreshToken, refreshCookieOptions());
    res.json({ success: true, data: { ...sessionPayload(user, tokens), recoveryCodesRemaining: user.mfaRecoveryCodeHashes?.length ?? 0 } });
  } catch (error) { next(error); }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const currentToken = req.cookies.dk_refresh;
    if (!currentToken) return res.status(401).json({ success: false, message: 'Không tìm thấy phiên đăng nhập' });
    const csrfToken = String(req.get('x-csrf-token') || '');
    if (!csrfToken) return res.status(403).json({ success: false, message: 'Thiếu mã bảo vệ phiên' });
    const session = await RefreshSession.findOne({
      tokenHash: hashToken(currentToken), csrfTokenHash: hashToken(csrfToken), revokedAt: null, expiresAt: { $gt: new Date() }
    });
    if (!session) return res.status(403).json({ success: false, message: 'Mã bảo vệ phiên không hợp lệ' });
    const user = await User.findById(session.user).select('+tokenVersion');
    if (!user || user.status !== 'active') { session.revokedAt = new Date(); await session.save(); res.clearCookie('dk_refresh', cookieBaseOptions()); return res.status(401).json({ success: false, message: 'Tài khoản không còn hoạt động' }); }

    const refreshToken = newRefreshToken();
    const nextCsrfToken = newCsrfToken();
    session.tokenHash = hashToken(refreshToken);
    session.csrfTokenHash = hashToken(nextCsrfToken);
    session.expiresAt = refreshExpiry();
    session.lastUsedAt = new Date();
    await session.save();
    res.cookie('dk_refresh', refreshToken, refreshCookieOptions());
    res.json({ success: true, data: { user: publicUser(user), accessToken: createAccessToken(user, session._id), csrfToken: nextCsrfToken } });
  } catch (error) { next(error); }
});

router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies.dk_refresh;
    if (token) {
      const csrfToken = String(req.get('x-csrf-token') || '');
      if (!csrfToken) return res.status(403).json({ success: false, message: 'Thiếu mã bảo vệ phiên' });
      await RefreshSession.updateOne({ tokenHash: hashToken(token), csrfTokenHash: hashToken(csrfToken), revokedAt: null }, { revokedAt: new Date() });
    }
    res.clearCookie('dk_refresh', cookieBaseOptions());
    res.json({ success: true, message: 'Đã đăng xuất' });
  } catch (error) { next(error); }
});

router.get('/sessions', authenticate, async (req, res, next) => {
  try {
    const sessions = await RefreshSession.find({ user: req.user._id, revokedAt: null, expiresAt: { $gt: new Date() } })
      .select('_id userAgent ip createdAt lastUsedAt expiresAt')
      .sort({ lastUsedAt: -1, createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, data: sessions.map(session => ({
      id: session._id,
      userAgent: session.userAgent || 'Thiết bị không xác định',
      ip: session.ip || '',
      createdAt: session.createdAt,
      lastUsedAt: session.lastUsedAt || session.createdAt,
      expiresAt: session.expiresAt,
      current: String(session._id) === String(req.auth.sid)
    })) });
  } catch (error) { next(error); }
});

router.delete('/sessions/:sessionId', authenticate, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.sessionId)) return res.status(404).json({ success: false, message: 'Không tìm thấy phiên đăng nhập' });
    const session = await RefreshSession.findOneAndUpdate(
      { _id: req.params.sessionId, user: req.user._id, revokedAt: null },
      { revokedAt: new Date() },
      { new: true }
    );
    if (!session) return res.status(404).json({ success: false, message: 'Không tìm thấy phiên đăng nhập' });
    const current = String(session._id) === String(req.auth.sid);
    if (current) res.clearCookie('dk_refresh', cookieBaseOptions());
    res.json({ success: true, message: current ? 'Đã đăng xuất phiên hiện tại' : 'Đã thu hồi phiên đăng nhập', data: { current } });
  } catch (error) { next(error); }
});

router.post('/logout-all', authenticate, async (req, res, next) => {
  try {
    const now = new Date();
    req.user.tokenVersion = (req.user.tokenVersion || 0) + 1;
    await Promise.all([
      req.user.save(),
      RefreshSession.updateMany({ user: req.user._id, revokedAt: null }, { revokedAt: now })
    ]);
    res.clearCookie('dk_refresh', cookieBaseOptions());
    res.json({ success: true, message: 'Đã đăng xuất khỏi tất cả thiết bị' });
  } catch (error) { next(error); }
});

router.get('/me', authenticate, (req, res) => res.json({ success: true, data: { user: publicUser(req.user) } }));

router.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    if (!validatePassword(newPassword)) return res.status(400).json({ success: false, message: 'Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số' });
    const user = await User.findById(req.user._id).select('+passwordHash +tokenVersion');
    if (!(await user.verifyPassword(currentPassword))) return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    if (await user.verifyPassword(newPassword)) return res.status(400).json({ success: false, message: 'Mật khẩu mới phải khác mật khẩu hiện tại' });
    user.passwordHash = await User.hashPassword(newPassword);
    user.tokenVersion += 1;
    await user.save();
    await RefreshSession.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
    res.clearCookie('dk_refresh', cookieBaseOptions());
    res.json({ success: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
  } catch (error) { next(error); }
});

module.exports = router;
