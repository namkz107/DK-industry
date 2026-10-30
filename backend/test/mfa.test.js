const test = require('node:test');
const assert = require('node:assert/strict');

process.env.MFA_ENCRYPTION_KEY = 'unit_test_mfa_encryption_key_that_is_separate_and_long';

const { decryptSecret, encryptSecret, generateRecoveryCodes, hashRecoveryCode, recoveryCodeHash, totp, verifyTotp } = require('../src/services/mfaService');

test('TOTP tương thích vector chuẩn RFC 6238', () => {
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  assert.equal(totp(secret, 59_000), '287082');
});

test('MFA secret được mã hóa xác thực trước khi lưu', () => {
  const secret = 'JBSWY3DPEHPK3PXP';
  const encrypted = encryptSecret(secret);
  assert.notEqual(encrypted, secret);
  assert.equal(decryptSecret(encrypted), secret);
  const parts = encrypted.split('.');
  const ciphertext = Buffer.from(parts[2], 'base64url');
  ciphertext[0] ^= 0xff;
  const tampered = `${parts[0]}.${parts[1]}.${ciphertext.toString('base64url')}`;
  assert.throws(() => decryptSecret(tampered));
  const shortTag = Buffer.from(parts[1], 'base64url').subarray(0, 12).toString('base64url');
  assert.throws(() => decryptSecret(`${parts[0]}.${shortTag}.${parts[2]}`), /MFA secret is invalid/);
});

test('mã khôi phục chỉ lưu hash', () => {
  const codes = generateRecoveryCodes();
  const hashes = codes.map(hashRecoveryCode);
  assert.equal(codes.length, 10);
  assert.ok(recoveryCodeHash(codes[0].toLowerCase(), hashes));
  assert.equal(recoveryCodeHash('SAI-MA', hashes), undefined);
  assert.equal(hashes.some(hash => hash.includes(codes[0])), false);
});

test('TOTP từ chối mã sai', () => {
  assert.equal(verifyTotp('JBSWY3DPEHPK3PXP', 'not-a-code'), false);
});
