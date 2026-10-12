const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const runIntegration = process.env.RUN_CLOUDINARY_INTEGRATION === '1';

test('Cloudinary stores private customer files and serves a short-lived signed download', { skip: !runIntegration }, async () => {
  const previousDriver = process.env.FILE_STORAGE_DRIVER;
  process.env.FILE_STORAGE_DRIVER = 'cloudinary';
  const { decodeDescriptor, removeStoredFiles, sendStoredFile, storeCustomerFiles } = require('../src/services/fileStorageService');
  const source = Buffer.from('%PDF-1.4\n%%EOF');
  let stored = [];
  try {
    stored = await storeCustomerFiles([{ originalname: 'cloudinary-check.pdf', mimetype: 'application/pdf', size: source.length, buffer: source }]);
    const descriptor = decodeDescriptor(stored[0].storedName);
    assert.ok(descriptor.publicId);
    assert.equal(descriptor.format, 'pdf');
    let downloadUrl;
    sendStoredFile({ redirect: (_status, url) => { downloadUrl = url; } }, stored[0]);
    assert.match(downloadUrl, /^https:\/\/api\.cloudinary\.com\//);
    const response = await fetch(downloadUrl);
    assert.equal(response.ok, true);
    assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 5).toString('ascii'), '%PDF-');
  } finally {
    await removeStoredFiles(stored);
    if (previousDriver === undefined) delete process.env.FILE_STORAGE_DRIVER;
    else process.env.FILE_STORAGE_DRIVER = previousDriver;
  }
});
