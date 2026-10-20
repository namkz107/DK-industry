const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { v2: cloudinary } = require('cloudinary');
const { storageDriver } = require('../config/runtime');
const { canonicalCustomerMimeType } = require('./fileSecurityService');

const descriptorPrefix = 'cloudinary:';
const quarantinePrefix = 'quarantine:';
const storageRoot = () => path.resolve(process.env.FILE_STORAGE_ROOT || path.join(__dirname, '..', '..', 'storage'));
const customerDirectory = () => path.join(storageRoot(), 'customer-requests');
const quarantineDirectory = () => path.join(storageRoot(), 'customer-quarantine');
const contentDirectory = () => path.join(storageRoot(), 'content-images');
const contentStorageDirectory = () => contentDirectory();

function configureCloudinary() {
  if (process.env.CLOUDINARY_URL) return;
  cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
}

function encodeDescriptor(value) {
  return descriptorPrefix + Buffer.from(JSON.stringify(value)).toString('base64url');
}

function decodeDescriptor(value) {
  if (!String(value || '').startsWith(descriptorPrefix)) return null;
  try { return JSON.parse(Buffer.from(value.slice(descriptorPrefix.length), 'base64url').toString('utf8')); }
  catch { return null; }
}

function uploadBuffer(buffer, options) {
  configureCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => error ? reject(error) : resolve(result));
    stream.end(buffer);
  });
}

async function storeCustomerFile(file, { quarantine = false } = {}) {
  const extension = path.extname(file.originalname).toLowerCase();
  const mimeType = canonicalCustomerMimeType(file.originalname);
  if (storageDriver() === 'cloudinary') {
    const folder = quarantine ? 'quarantine' : 'customer-requests';
    const result = await uploadBuffer(file.buffer, { public_id: `dk-industry/${folder}/${crypto.randomUUID()}${extension}`, resource_type: 'raw', type: 'authenticated', overwrite: false });
    return { originalName: file.originalname, storedName: encodeDescriptor({ publicId: result.public_id, format: result.format || extension.slice(1) || 'bin' }), mimeType, size: file.size };
  }
  const directory = quarantine ? quarantineDirectory() : customerDirectory();
  await fs.promises.mkdir(directory, { recursive: true });
  const storedName = `${crypto.randomUUID()}${extension}`;
  await fs.promises.writeFile(path.join(directory, storedName), file.buffer, { flag: 'wx' });
  return { originalName: file.originalname, storedName: quarantine ? `${quarantinePrefix}${storedName}` : storedName, mimeType, size: file.size };
}

async function storeCustomerFiles(files = []) {
  const stored = [];
  try {
    for (const file of files) stored.push(await storeCustomerFile(file));
    return stored;
  } catch (error) {
    await removeStoredFiles(stored);
    throw error;
  }
}

async function removeStoredFiles(files = []) {
  await Promise.all(files.map(async file => {
    const descriptor = decodeDescriptor(file.storedName);
    if (descriptor) {
      configureCloudinary();
      await cloudinary.uploader.destroy(descriptor.publicId, { resource_type: 'raw', type: 'authenticated', invalidate: true }).catch(() => {});
      return;
    }
    const value = String(file.storedName || '');
    const quarantined = value.startsWith(quarantinePrefix);
    const rawName = quarantined ? value.slice(quarantinePrefix.length) : value;
    const safeName = path.basename(rawName);
    if (safeName && safeName === rawName) await fs.promises.unlink(path.join(quarantined ? quarantineDirectory() : customerDirectory(), safeName)).catch(() => {});
  }));
}

function downloadFilename(value) {
  const filename = path.basename(String(value || 'download'))
    .replace(/[\r\n"]/g, '_')
    .trim();
  return filename || 'download';
}

async function sendStoredFile(res, attachment) {
  if (attachment.scanStatus !== 'clean') {
    throw Object.assign(new Error('Tệp chưa vượt qua kiểm tra an toàn và không thể tải xuống'), { status: 423 });
  }
  const descriptor = decodeDescriptor(attachment.storedName);
  if (descriptor) {
    configureCloudinary();
    const url = cloudinary.utils.private_download_url(descriptor.publicId, descriptor.format, { resource_type: 'raw', type: 'authenticated', expires_at: Math.floor(Date.now() / 1000) + 60, attachment: true });
    // Do not redirect the browser to Cloudinary: the frontend downloads through
    // fetch(), whose CORS policy blocks that authenticated cross-origin redirect.
    // The application has already authorized this route, so proxy the short-lived
    // signed URL server-side and keep the file private from unauthenticated users.
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      throw Object.assign(new Error('Không thể tải tệp từ kho lưu trữ'), { status: 502 });
    }
    const filename = downloadFilename(attachment.originalName);
    const asciiFilename = filename.replace(/[^\x20-\x7E]/g, '_');
    res.setHeader('Content-Type', response.headers.get('content-type') || attachment.mimeType || 'application/octet-stream');
    const contentLength = response.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Content-Disposition', `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    await new Promise((resolve, reject) => {
      const stream = Readable.fromWeb(response.body);
      stream.on('error', reject);
      res.on('error', reject);
      res.on('finish', resolve);
      stream.pipe(res);
    });
    return;
  }
  const safeName = path.basename(String(attachment.storedName || ''));
  if (!safeName || safeName !== attachment.storedName || safeName.startsWith(quarantinePrefix)) throw Object.assign(new Error('Tệp đính kèm không hợp lệ'), { status: 404 });
  return res.download(path.join(customerDirectory(), safeName), attachment.originalName);
}

async function storeContentImage(file, baseUrl) {
  const extension = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[file.mimetype];
  if (storageDriver() === 'cloudinary') {
    const result = await uploadBuffer(file.buffer, { public_id: `dk-industry/content/${crypto.randomUUID()}`, resource_type: 'image', type: 'upload', overwrite: false });
    return { url: result.secure_url, filename: result.public_id };
  }
  await fs.promises.mkdir(contentDirectory(), { recursive: true });
  const filename = `${crypto.randomUUID()}${extension}`;
  await fs.promises.writeFile(path.join(contentDirectory(), filename), file.buffer, { flag: 'wx' });
  return { url: `${baseUrl}/uploads/content/${filename}`, filename };
}

async function removeContentImage(filename) {
  const value = String(filename || '');
  if (storageDriver() === 'cloudinary') {
    // Content images are public, but only generated IDs inside this namespace
    // may be deleted by this service.
    if (!/^dk-industry\/content\/[A-Za-z0-9_-]+$/.test(value)) return;
    configureCloudinary();
    await cloudinary.uploader.destroy(value, { resource_type: 'image', invalidate: true }).catch(() => {});
    return;
  }
  const safeName = path.basename(value);
  if (safeName && safeName === value) await fs.promises.unlink(path.join(contentDirectory(), safeName)).catch(() => {});
}

module.exports = { contentStorageDirectory, decodeDescriptor, removeContentImage, removeStoredFiles, sendStoredFile, storeContentImage, storeCustomerFile, storeCustomerFiles };
