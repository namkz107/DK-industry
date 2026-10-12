const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'unit_test_secret_that_is_longer_than_32_characters';

const User = require('../src/models/User');
const { createAccessToken, verifyAccessToken, newCsrfToken, newRefreshToken, hashToken, refreshCookieOptions } = require('../src/services/authService');
const { requireVerifiedEmail } = require('../src/middleware/authenticate');

test('access token giữ đúng danh tính và vai trò trong 15 phút', () => {
  const user = {
    _id: '507f1f77bcf86cd799439011',
    role: 'staff',
    tokenVersion: 2
  };
  const sessionId = '507f1f77bcf86cd799439012';
  const payload = verifyAccessToken(createAccessToken(user, sessionId));

  assert.equal(payload.sub, user._id);
  assert.equal(payload.sid, sessionId);
  assert.equal(payload.role, 'staff');
  assert.equal(payload.tv, 2);
  assert.ok(payload.exp - payload.iat <= 15 * 60);
});

test('refresh token đủ ngẫu nhiên và chỉ lưu dạng hash', () => {
  const first = newRefreshToken();
  const second = newRefreshToken();

  assert.notEqual(first, second);
  assert.ok(first.length >= 80);
  assert.match(hashToken(first), /^[a-f0-9]{64}$/);
  assert.notEqual(hashToken(first), first);
});

test('CSRF token của refresh session đủ ngẫu nhiên và chỉ lưu dạng hash', () => {
  const first = newCsrfToken();
  const second = newCsrfToken();

  assert.notEqual(first, second);
  assert.ok(first.length >= 40);
  assert.match(hashToken(first), /^[a-f0-9]{64}$/);
});

test('refresh token chỉ dùng session cookie, không lưu dài hạn', () => {
  const sessionCookie = refreshCookieOptions();

  assert.equal(sessionCookie.httpOnly, true);
  assert.equal(sessionCookie.sameSite, 'lax');
  assert.equal(sessionCookie.maxAge, undefined);
});

test('mật khẩu được bcrypt hash và có thể xác thực', async () => {
  const hash = await User.hashPassword('StrongPass123');
  const user = new User({ passwordHash: hash });

  assert.notEqual(hash, 'StrongPass123');
  assert.equal(await user.verifyPassword('StrongPass123'), true);
  assert.equal(await user.verifyPassword('WrongPass123'), false);
});

test('thao tác thương mại nhạy cảm yêu cầu email đã xác minh', () => {
  let nextCalled = false;
  const next = () => { nextCalled = true; };
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };

  requireVerifiedEmail({ user: { emailVerifiedAt: null } }, response, next);
  assert.equal(nextCalled, false);
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.code, 'EMAIL_VERIFICATION_REQUIRED');

  requireVerifiedEmail({ user: { emailVerifiedAt: new Date() } }, response, next);
  assert.equal(nextCalled, true);
});
