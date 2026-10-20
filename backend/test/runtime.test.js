process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const { cookieOptions, validateRuntimeConfig } = require('../src/config/runtime');
const { canonicalCustomerMimeType, isAllowedCustomerFileMetadata, validateImageFile } = require('../src/services/fileSecurityService');

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

test('customer upload requires an allowed extension and matching MIME type', () => {
  assert.equal(isAllowedCustomerFileMetadata({ originalname: 'drawing.pdf', mimetype: 'application/pdf' }), true);
  assert.equal(isAllowedCustomerFileMetadata({ originalname: 'drawing.pdf', mimetype: 'image/png' }), false);
  assert.equal(isAllowedCustomerFileMetadata({ originalname: '../drawing.exe', mimetype: 'application/octet-stream' }), false);
  assert.equal(canonicalCustomerMimeType('drawing.jpeg'), 'image/jpeg');
});

test('production requires a separate MFA encryption key', () => {
  const previous = { nodeEnv: process.env.NODE_ENV, uri: process.env.MONGODB_URI, secret: process.env.JWT_SECRET, client: process.env.CLIENT_URL, mfa: process.env.MFA_ENCRYPTION_KEY, storage: process.env.FILE_STORAGE_DRIVER, cloudinary: process.env.CLOUDINARY_URL, clamav: process.env.CLAMAV_HOST };
  process.env.NODE_ENV = 'production';
  process.env.MONGODB_URI = 'mongodb+srv://example.mongodb.net/test';
  process.env.JWT_SECRET = 'production_jwt_secret_that_is_random_and_longer_than_48_characters';
  process.env.CLIENT_URL = 'https://example.com';
  process.env.FILE_STORAGE_DRIVER = 'cloudinary';
  process.env.CLOUDINARY_URL = 'cloudinary://key:secret@cloud';
  process.env.CLAMAV_HOST = 'clamav';
  delete process.env.MFA_ENCRYPTION_KEY;
  assert.throws(() => validateRuntimeConfig(), /MFA_ENCRYPTION_KEY/);
  restore('NODE_ENV', previous.nodeEnv); restore('MONGODB_URI', previous.uri); restore('JWT_SECRET', previous.secret); restore('CLIENT_URL', previous.client); restore('MFA_ENCRYPTION_KEY', previous.mfa); restore('FILE_STORAGE_DRIVER', previous.storage); restore('CLOUDINARY_URL', previous.cloudinary); restore('CLAMAV_HOST', previous.clamav);
});

test('production does not require a paid Google Maps key', () => {
  const previous = {
    nodeEnv: process.env.NODE_ENV, uri: process.env.MONGODB_URI, secret: process.env.JWT_SECRET,
    client: process.env.CLIENT_URL, mfa: process.env.MFA_ENCRYPTION_KEY, storage: process.env.FILE_STORAGE_DRIVER,
    cloudinary: process.env.CLOUDINARY_URL, clamav: process.env.CLAMAV_HOST
  };
  process.env.NODE_ENV = 'production';
  process.env.MONGODB_URI = 'mongodb+srv://example.mongodb.net/test';
  process.env.JWT_SECRET = 'production_jwt_secret_that_is_random_and_longer_than_48_characters';
  process.env.CLIENT_URL = 'https://example.com';
  process.env.MFA_ENCRYPTION_KEY = 'production_mfa_encryption_secret_longer_than_32_characters';
  process.env.FILE_STORAGE_DRIVER = 'cloudinary';
  process.env.CLOUDINARY_URL = 'cloudinary://key:secret@cloud';
  process.env.CLAMAV_HOST = 'clamav';
  assert.doesNotThrow(() => validateRuntimeConfig());
  restore('NODE_ENV', previous.nodeEnv); restore('MONGODB_URI', previous.uri); restore('JWT_SECRET', previous.secret); restore('CLIENT_URL', previous.client); restore('MFA_ENCRYPTION_KEY', previous.mfa); restore('FILE_STORAGE_DRIVER', previous.storage); restore('CLOUDINARY_URL', previous.cloudinary); restore('CLAMAV_HOST', previous.clamav);
});

test('production refuses to start without a malware scanner host', () => {
  const previous = {
    nodeEnv: process.env.NODE_ENV, uri: process.env.MONGODB_URI, secret: process.env.JWT_SECRET,
    client: process.env.CLIENT_URL, mfa: process.env.MFA_ENCRYPTION_KEY, storage: process.env.FILE_STORAGE_DRIVER,
    cloudinary: process.env.CLOUDINARY_URL, clamav: process.env.CLAMAV_HOST
  };
  process.env.NODE_ENV = 'production';
  process.env.MONGODB_URI = 'mongodb+srv://example.mongodb.net/test';
  process.env.JWT_SECRET = 'production_jwt_secret_that_is_random_and_longer_than_48_characters';
  process.env.CLIENT_URL = 'https://example.com';
  process.env.MFA_ENCRYPTION_KEY = 'production_mfa_encryption_secret_longer_than_32_characters';
  process.env.FILE_STORAGE_DRIVER = 'cloudinary';
  process.env.CLOUDINARY_URL = 'cloudinary://key:secret@cloud';
  delete process.env.CLAMAV_HOST;
  assert.throws(() => validateRuntimeConfig(), /CLAMAV_HOST/);
  restore('NODE_ENV', previous.nodeEnv); restore('MONGODB_URI', previous.uri); restore('JWT_SECRET', previous.secret); restore('CLIENT_URL', previous.client); restore('MFA_ENCRYPTION_KEY', previous.mfa); restore('FILE_STORAGE_DRIVER', previous.storage); restore('CLOUDINARY_URL', previous.cloudinary); restore('CLAMAV_HOST', previous.clamav);
});
