const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function parseEnv(text) {
  const values = {};
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return { values: {}, missing: true };
  return { values: parseEnv(fs.readFileSync(file, 'utf8')), missing: false };
}

function isPlaceholder(value) {
  return !value || /replace_with|your_|example\.(?:com|invalid)|localhost|127\.0\.0\.1|gsk_key_cua_ban|\.\.\./i.test(value) || /(^|[=:/])<[^>]+>/.test(value);
}

function isHttpsOrigin(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.pathname === '/' && !parsed.search && !parsed.hash;
  } catch { return false; }
}

function validateProduction(backend, frontend) {
  const errors = [];
  const warnings = [];
  const requireValue = (scope, env, key) => {
    const value = String(env[key] || '').trim();
    if (isPlaceholder(value)) errors.push(`${scope}.${key} chưa có giá trị production`);
    return value;
  };

  if (backend.NODE_ENV !== 'production') errors.push('backend.NODE_ENV phải là production');
  if (!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(String(backend.APP_VERSION || ''))) errors.push('backend.APP_VERSION phải là phiên bản semver, ví dụ 1.0.0');
  if (!/^[a-f0-9]{7,64}$/i.test(String(backend.RELEASE_SHA || ''))) errors.push('backend.RELEASE_SHA phải là Git commit SHA của bản deploy');
  const mongo = requireValue('backend', backend, 'MONGODB_URI');
  if (/(?:^|[_-])test(?:\?|$)/i.test(mongo)) errors.push('backend.MONGODB_URI không được trỏ tới database test');
  const origins = String(backend.CLIENT_URL || '').split(',').map(item => item.trim()).filter(Boolean);
  if (!origins.length || origins.some(origin => !isHttpsOrigin(origin))) errors.push('backend.CLIENT_URL phải gồm các HTTPS origin hợp lệ');
  const jwt = requireValue('backend', backend, 'JWT_SECRET');
  const mfa = requireValue('backend', backend, 'MFA_ENCRYPTION_KEY');
  if (jwt.length < 48) errors.push('backend.JWT_SECRET phải dài ít nhất 48 ký tự');
  if (mfa.length < 32) errors.push('backend.MFA_ENCRYPTION_KEY phải dài ít nhất 32 ký tự');
  if (jwt && jwt === mfa) errors.push('JWT_SECRET và MFA_ENCRYPTION_KEY phải khác nhau');
  if (backend.COOKIE_SECURE !== 'true') errors.push('backend.COOKIE_SECURE phải là true');
  if (!['lax', 'strict', 'none'].includes(String(backend.COOKIE_SAME_SITE || '').toLowerCase())) errors.push('backend.COOKIE_SAME_SITE phải là lax, strict hoặc none');
  if (!String(backend.TRUST_PROXY || '').trim()) errors.push('backend.TRUST_PROXY phải được đặt theo reverse proxy thực tế');
  if (backend.ENFORCE_SESSION_CHECK !== 'true') errors.push('backend.ENFORCE_SESSION_CHECK phải là true');
  if (backend.ALLOW_NON_TRANSACTIONAL_WRITES === 'true') warnings.push('Đang cho phép ghi không transaction; không khuyến nghị cho production');

  if (backend.FILE_STORAGE_DRIVER !== 'cloudinary') errors.push('backend.FILE_STORAGE_DRIVER phải là cloudinary');
  const cloudinaryUrl = String(backend.CLOUDINARY_URL || '').trim();
  if (isPlaceholder(cloudinaryUrl)) {
    for (const key of ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']) requireValue('backend', backend, key);
  }
  for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM', 'COMPANY_NAME', 'COMPANY_PHONE', 'COMPANY_EMAIL', 'COMPANY_ADDRESS']) requireValue('backend', backend, key);
  if (backend.SUPPORT_AI_ENABLED === 'true' && isPlaceholder(String(backend.GROQ_API_KEY || ''))) errors.push('backend.GROQ_API_KEY bắt buộc khi bật AI');
  if (String(backend.ADMIN_SEED_PASSWORD || '').trim() && !isPlaceholder(backend.ADMIN_SEED_PASSWORD)) warnings.push('Nên xóa ADMIN_SEED_PASSWORD khỏi production sau khi bootstrap Admin');

  const siteUrl = requireValue('frontend', frontend, 'VITE_SITE_URL').replace(/\/$/, '');
  if (!isHttpsOrigin(`${siteUrl}/`)) errors.push('frontend.VITE_SITE_URL phải là HTTPS origin hợp lệ');
  const apiUrl = requireValue('frontend', frontend, 'VITE_API_URL');
  if (!(apiUrl === '/api' || /^https:\/\/.+\/api\/?$/i.test(apiUrl))) errors.push('frontend.VITE_API_URL phải là /api hoặc URL HTTPS kết thúc bằng /api');
  const socketUrl = String(frontend.VITE_SOCKET_URL || '').trim();
  if (socketUrl && !isHttpsOrigin(socketUrl)) errors.push('frontend.VITE_SOCKET_URL phải để trống (same-origin) hoặc là HTTPS origin');
  for (const key of ['VITE_CLOUDINARY_LOGO_URL', 'VITE_CLOUDINARY_CEO_IMAGE_URL', 'VITE_COMPANY_NAME', 'VITE_COMPANY_PHONE', 'VITE_COMPANY_PHONE_LABEL', 'VITE_COMPANY_EMAIL', 'VITE_COMPANY_ADDRESS', 'VITE_COMPANY_MAP_DESTINATION', 'VITE_COMPANY_TAX_CODE', 'VITE_COMPANY_REGISTRATION_NUMBER', 'VITE_COMPANY_LEGAL_REPRESENTATIVE']) requireValue('frontend', frontend, key);
  if (frontend.VITE_POLICY_VERSION !== backend.TERMS_VERSION) errors.push('VITE_POLICY_VERSION phải trùng TERMS_VERSION');
  if (siteUrl && origins.length && !origins.includes(siteUrl)) errors.push('VITE_SITE_URL phải có trong backend.CLIENT_URL');

  return { ok: errors.length === 0, errors, warnings };
}

function argument(name, fallback) {
  const prefix = `--${name}=`;
  const item = process.argv.slice(2).find(value => value.startsWith(prefix));
  return item ? item.slice(prefix.length) : fallback;
}

function main() {
  const backendPath = path.resolve(root, argument('backend-env', 'backend/.env.production'));
  const frontendPath = path.resolve(root, argument('frontend-env', 'frontend/.env.production'));
  const backendFile = loadEnvFile(backendPath);
  const frontendFile = loadEnvFile(frontendPath);
  const errors = [];
  if (backendFile.missing) errors.push(`Không tìm thấy ${path.relative(root, backendPath)}`);
  if (frontendFile.missing) errors.push(`Không tìm thấy ${path.relative(root, frontendPath)}`);
  const result = validateProduction({ ...backendFile.values, ...process.env }, { ...frontendFile.values, ...process.env });
  result.errors.unshift(...errors);
  result.ok = result.errors.length === 0;
  const output = { ok: result.ok, checked: { backend: path.relative(root, backendPath), frontend: path.relative(root, frontendPath) }, errors: result.errors, warnings: result.warnings };
  console.log(JSON.stringify(output, null, 2));
  if (!output.ok) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { isPlaceholder, parseEnv, validateProduction };
