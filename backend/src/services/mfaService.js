const crypto = require('crypto');

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function encryptionKey() {
  const source = process.env.MFA_ENCRYPTION_KEY;
  if (!source) throw Object.assign(new Error('MFA encryption key is not configured'), { status: 503 });
  return crypto.createHash('sha256').update(source).digest();
}

function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let output = '';
  for (let index = 0; index < bits.length; index += 5) output += alphabet[Number.parseInt(bits.slice(index, index + 5).padEnd(5, '0'), 2)];
  return output;
}

function base32Decode(value) {
  const clean = String(value || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const character of clean) {
    const index = alphabet.indexOf(character);
    if (index < 0) throw new Error('MFA secret is invalid');
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
  return Buffer.from(bytes);
}

function generateSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function encryptSecret(secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(value => value.toString('base64url')).join('.');
}

function decryptSecret(value) {
  const [ivValue, tagValue, ciphertextValue] = String(value || '').split('.');
  if (!ivValue || !tagValue || !ciphertextValue) throw new Error('MFA secret is invalid');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, 'base64url')), decipher.final()]).toString('utf8');
}

function totp(secret, timestamp = Date.now()) {
  const counter = BigInt(Math.floor(timestamp / 30_000));
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(counter);
  const digest = crypto.createHmac('sha1', base32Decode(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const number = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return String(number).padStart(6, '0');
}

function verifyTotp(secret, code, window = 1) {
  const clean = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  for (let offset = -window; offset <= window; offset += 1) {
    const expected = totp(secret, Date.now() + offset * 30_000);
    if (crypto.timingSafeEqual(Buffer.from(clean), Buffer.from(expected))) return true;
  }
  return false;
}

function normalizeRecoveryCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function hashRecoveryCode(code) {
  return crypto.createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex');
}

function generateRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => {
    const value = crypto.randomBytes(8).toString('hex').toUpperCase();
    return `${value.slice(0, 8)}-${value.slice(8)}`;
  });
}

function recoveryCodeHash(code, hashes = []) {
  const candidate = hashRecoveryCode(code);
  return hashes.find(hash => hash.length === candidate.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(candidate)));
}

function otpAuthUrl({ secret, email }) {
  const issuer = 'DK Industry';
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

module.exports = { decryptSecret, encryptSecret, generateRecoveryCodes, generateSecret, hashRecoveryCode, otpAuthUrl, recoveryCodeHash, totp, verifyTotp };
