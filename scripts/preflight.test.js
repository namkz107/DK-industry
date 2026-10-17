const test = require('node:test');
const assert = require('node:assert/strict');
const { isPlaceholder, parseEnv, validateProduction } = require('./preflight');

const backend = {
  NODE_ENV: 'production', APP_VERSION: '1.0.0', RELEASE_SHA: '529bb92', MONGODB_URI: 'mongodb+srv://user:secret@cluster.mongodb.net/dk_industry',
  CLIENT_URL: 'https://dk.example', JWT_SECRET: 'j'.repeat(64), MFA_ENCRYPTION_KEY: 'm'.repeat(64),
  COOKIE_SECURE: 'true', COOKIE_SAME_SITE: 'lax', TRUST_PROXY: '1', ENFORCE_SESSION_CHECK: 'true',
  FILE_STORAGE_DRIVER: 'cloudinary', CLOUDINARY_URL: 'cloudinary://key:secret@cloud',
  SMTP_HOST: 'smtp.example.vn', SMTP_PORT: '587', SMTP_SECURE: 'false', SMTP_USER: 'mail@example.vn', SMTP_PASS: 'secret-app-password', EMAIL_FROM: 'DK <mail@example.vn>',
  COMPANY_NAME: 'DK Industry', COMPANY_PHONE: '0900000000', COMPANY_EMAIL: 'hello@example.vn', COMPANY_ADDRESS: 'Ha Noi',
  SUPPORT_AI_ENABLED: 'false', TERMS_VERSION: '2026-10-14'
};
const frontend = {
  VITE_SITE_URL: 'https://dk.example', VITE_API_URL: '/api', VITE_SOCKET_URL: '',
  VITE_CLOUDINARY_LOGO_URL: 'https://res.cloudinary.com/cloud/image/upload/logo', VITE_CLOUDINARY_CEO_IMAGE_URL: 'https://res.cloudinary.com/cloud/image/upload/ceo',
  VITE_COMPANY_NAME: 'DK Industry', VITE_COMPANY_PHONE: '0900000000', VITE_COMPANY_PHONE_LABEL: '0900 000 000', VITE_COMPANY_EMAIL: 'hello@example.vn', VITE_COMPANY_ADDRESS: 'Ha Noi',
  VITE_COMPANY_MAP_DESTINATION: '20.8,105.8', VITE_COMPANY_TAX_CODE: '0123456789', VITE_COMPANY_REGISTRATION_NUMBER: 'DK-123', VITE_COMPANY_LEGAL_REPRESENTATIVE: 'Nguyen Van A',
  VITE_POLICY_VERSION: '2026-10-14'
};

test('dotenv parser handles comments, export and quoted values', () => {
  assert.deepEqual(parseEnv('# comment\nA=one\nexport B="two words"\nC=\'three\'\n'), { A: 'one', B: 'two words', C: 'three' });
});

test('placeholder detection catches local and sample values', () => {
  assert.equal(isPlaceholder('http://localhost:5000'), true);
  assert.equal(isPlaceholder('replace_with_secret'), true);
  assert.equal(isPlaceholder('https://dk.example.vn'), false);
});

test('complete same-origin production configuration passes', () => {
  assert.deepEqual(validateProduction(backend, frontend), { ok: true, errors: [], warnings: [] });
});

test('unsafe deployment values are rejected with actionable errors', () => {
  const result = validateProduction({ ...backend, CLIENT_URL: 'http://localhost:3000', JWT_SECRET: 'short' }, { ...frontend, VITE_SITE_URL: 'https://other.example', VITE_COMPANY_TAX_CODE: '' });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(value => value.includes('CLIENT_URL')));
  assert.ok(result.errors.some(value => value.includes('JWT_SECRET')));
  assert.ok(result.errors.some(value => value.includes('VITE_COMPANY_TAX_CODE')));
  assert.ok(result.errors.some(value => value.includes('VITE_SITE_URL phải có')));
});

test('rejects malformed email, SMTP, storage and map configuration', () => {
  const result = validateProduction(
    { ...backend, SMTP_PORT: '99999', SMTP_SECURE: 'sometimes', COMPANY_EMAIL: 'not-an-email', CLOUDINARY_URL: 'https://cloudinary.example/key' },
    { ...frontend, VITE_COMPANY_EMAIL: 'not-an-email', VITE_CLOUDINARY_LOGO_URL: 'http://example.com/logo.png', VITE_COMPANY_MAP_DESTINATION: '91,181' },
  );
  assert.equal(result.ok, false);
  for (const key of ['SMTP_PORT', 'SMTP_SECURE', 'COMPANY_EMAIL', 'CLOUDINARY_URL', 'VITE_CLOUDINARY_LOGO_URL', 'VITE_COMPANY_MAP_DESTINATION']) {
    assert.ok(result.errors.some(value => value.includes(key)), `missing validation error for ${key}`);
  }
});
