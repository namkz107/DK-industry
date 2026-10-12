const { URL } = require('url');

const allowedSameSite = new Set(['lax', 'strict', 'none']);

function booleanValue(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`${name} must be either true or false`);
}

function clientOrigins() {
  return (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map(value => value.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function validateOrigins(origins) {
  for (const origin of origins) {
    const parsed = new URL(origin);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      throw new Error(`CLIENT_URL contains an invalid origin: ${origin}`);
    }
  }
}

function cookieOptions(path) {
  const sameSite = String(process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
  if (!allowedSameSite.has(sameSite)) throw new Error('COOKIE_SAME_SITE must be lax, strict, or none');
  const secure = booleanValue('COOKIE_SECURE', process.env.NODE_ENV === 'production');
  if (sameSite === 'none' && !secure) throw new Error('COOKIE_SECURE must be true when COOKIE_SAME_SITE=none');
  return { httpOnly: true, secure, sameSite, path };
}

function cloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_URL || (
    process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET
  ));
}

function storageDriver() {
  const value = String(process.env.FILE_STORAGE_DRIVER || 'local').toLowerCase();
  if (!['local', 'cloudinary'].includes(value)) throw new Error('FILE_STORAGE_DRIVER must be local or cloudinary');
  return value;
}

function integrationStatus() {
  return {
    database: Boolean(process.env.MONGODB_URI),
    email: Boolean(process.env.SMTP_HOST && (process.env.SMTP_FROM || process.env.EMAIL_FROM)),
    maps: Boolean(process.env.GOOGLE_MAPS_SERVER_API_KEY),
    aiSupport: process.env.SUPPORT_AI_ENABLED === 'true' && Boolean(process.env.GROQ_API_KEY),
    fileStorage: storageDriver(),
    cloudinary: cloudinaryConfigured()
  };
}

function validateRuntimeConfig() {
  const errors = [];
  const warnings = [];
  const production = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET || '';
  const origins = clientOrigins();

  if (!process.env.MONGODB_URI) errors.push('MONGODB_URI is required');
  if (jwtSecret.length < 48 || /replace_with_|your_/i.test(jwtSecret)) errors.push('JWT_SECRET must be a random value of at least 48 characters');
  try { validateOrigins(origins); } catch (error) { errors.push(error.message); }
  try { cookieOptions('/api/auth'); } catch (error) { errors.push(error.message); }

  let driver;
  try { driver = storageDriver(); } catch (error) { errors.push(error.message); }
  if (driver === 'cloudinary' && !cloudinaryConfigured()) errors.push('Cloudinary credentials are required when FILE_STORAGE_DRIVER=cloudinary');
  if (production && driver === 'local' && !booleanValue('ALLOW_LOCAL_FILE_STORAGE', false)) {
    errors.push('Production requires durable file storage; set FILE_STORAGE_DRIVER=cloudinary or explicitly ALLOW_LOCAL_FILE_STORAGE=true');
  }
  if (production && origins.some(origin => !origin.startsWith('https://'))) errors.push('Production CLIENT_URL origins must use HTTPS');
  if (!process.env.SMTP_HOST) warnings.push('SMTP is not configured; verification and recovery emails will not be delivered');
  if (!process.env.GOOGLE_MAPS_SERVER_API_KEY) warnings.push('Google Maps server API is not configured; address search will be unavailable');

  if (errors.length) throw new Error(`Invalid runtime configuration:\n- ${errors.join('\n- ')}`);
  return { warnings, origins, integrations: integrationStatus() };
}

module.exports = {
  booleanValue,
  clientOrigins,
  cloudinaryConfigured,
  cookieOptions,
  integrationStatus,
  storageDriver,
  validateRuntimeConfig
};
