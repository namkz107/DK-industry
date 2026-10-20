const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { Writable } = require('node:stream');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const runIntegration = process.env.RUN_CLOUDINARY_INTEGRATION === '1';

test('Cloudinary stores private customer files and proxies an authorized download', { skip: !runIntegration }, async () => {
  const previousDriver = process.env.FILE_STORAGE_DRIVER;
  process.env.FILE_STORAGE_DRIVER = 'cloudinary';
  const { decodeDescriptor, removeStoredFiles, sendStoredFile, storeCustomerFiles } = require('../src/services/fileStorageService');
  const source = Buffer.from('%PDF-1.4\n%%EOF');
  let stored = [];
  try {
    stored = await storeCustomerFiles([{ originalname: 'cloudinary-check.pdf', mimetype: 'application/pdf', size: source.length, buffer: source }]);
    stored = stored.map(file => ({ ...file, scanStatus: 'clean', scannedAt: new Date() }));
    const descriptor = decodeDescriptor(stored[0].storedName);
    assert.ok(descriptor.publicId);
    assert.equal(descriptor.format, 'pdf');
    const chunks = [];
    const response = new Writable({ write(chunk, _encoding, callback) { chunks.push(Buffer.from(chunk)); callback(); } });
    response.headers = {};
    response.setHeader = (name, value) => { response.headers[String(name).toLowerCase()] = value; };
    await sendStoredFile(response, stored[0]);
    assert.match(response.headers['content-disposition'], /attachment/);
    assert.match(response.headers['content-disposition'], /cloudinary-check\.pdf/);
    assert.equal(Buffer.concat(chunks).subarray(0, 5).toString('ascii'), '%PDF-');
  } finally {
    await removeStoredFiles(stored);
    if (previousDriver === undefined) delete process.env.FILE_STORAGE_DRIVER;
    else process.env.FILE_STORAGE_DRIVER = previousDriver;
  }
});
