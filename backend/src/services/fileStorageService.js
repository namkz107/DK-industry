const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const { storageDriver } = require('../config/runtime');

const descriptorPrefix = 'cloudinary:';
const storageRoot = () => path.resolve(process.env.FILE_STORAGE_ROOT || path.join(__dirname, '..', '..', 'storage'));
const customerDirectory = () => path.join(storageRoot(), 'customer-requests');
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

async function storeCustomerFile(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  if (storageDriver() === 'cloudinary') {
    const result = await uploadBuffer(file.buffer, { public_id: `dk-industry/customer-requests/${crypto.randomUUID()}${extension}`, resource_type: 'raw', type: 'authenticated', overwrite: false });
    return { originalName: file.originalname, storedName: encodeDescriptor({ publicId: result.public_id, format: result.format || extension.slice(1) || 'bin' }), mimeType: file.mimetype, size: file.size };
  }
  await fs.promises.mkdir(customerDirectory(), { recursive: true });
  const storedName = `${crypto.randomUUID()}${extension}`;
  await fs.promises.writeFile(path.join(customerDirectory(), storedName), file.buffer, { flag: 'wx' });
  return { originalName: file.originalname, storedName, mimeType: file.mimetype, size: file.size };
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
    const safeName = path.basename(String(file.storedName || ''));
    if (safeName && safeName === file.storedName) await fs.promises.unlink(path.join(customerDirectory(), safeName)).catch(() => {});
  }));
}

function sendStoredFile(res, attachment) {
  const descriptor = decodeDescriptor(attachment.storedName);
  if (descriptor) {
    configureCloudinary();
    const url = cloudinary.utils.private_download_url(descriptor.publicId, descriptor.format, { resource_type: 'raw', type: 'authenticated', expires_at: Math.floor(Date.now() / 1000) + 60, attachment: true });
    return res.redirect(302, url);
  }
  const safeName = path.basename(String(attachment.storedName || ''));
  if (!safeName || safeName !== attachment.storedName) throw Object.assign(new Error('Tệp đính kèm không hợp lệ'), { status: 404 });
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

module.exports = { contentStorageDirectory, decodeDescriptor, removeStoredFiles, sendStoredFile, storeContentImage, storeCustomerFiles };
