process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const { cookieOptions, validateRuntimeConfig } = require('../src/config/runtime');
const { validateImageFile } = require('../src/services/fileSecurityService');

const restore = (name, value) => value === undefined ? delete process.env[name] : process.env[name] = value;

test('runtime validation rejects weak JWT secrets', () => {
  const previous = { uri: process.env.MONGODB_URI, secret: process.env.JWT_SECRET };
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/test';
  process.env.JWT_SECRET = 'weak';
  assert.throws(() => validateRuntimeConfig(), /JWT_SECRET/);
  restore('MONGODB_URI', previous.uri);
  restore('JWT_SECRET', previous.secret);
});

test('cross-site cookies must be secure', () => {
  const previous = { sameSite: process.env.COOKIE_SAME_SITE, secure: process.env.COOKIE_SECURE };
  process.env.COOKIE_SAME_SITE = 'none';
  process.env.COOKIE_SECURE = 'false';
  assert.throws(() => cookieOptions('/api/auth'), /COOKIE_SECURE/);
  restore('COOKIE_SAME_SITE', previous.sameSite);
  restore('COOKIE_SECURE', previous.secure);
});

test('image upload checks actual file signature', () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(validateImageFile({ mimetype: 'image/png', buffer: png }), true);
  assert.equal(validateImageFile({ mimetype: 'image/png', buffer: Buffer.from('not an image') }), false);
});
