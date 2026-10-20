const fs = require('fs');
const path = require('path');

const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };

const customerFileTypes = {
  '.pdf': { mimeType: 'application/pdf', accepted: ['application/pdf', 'application/octet-stream'] },
  '.png': { mimeType: 'image/png', accepted: ['image/png'] },
  '.jpg': { mimeType: 'image/jpeg', accepted: ['image/jpeg'] },
  '.jpeg': { mimeType: 'image/jpeg', accepted: ['image/jpeg'] },
  '.zip': { mimeType: 'application/zip', accepted: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'] },
  '.dxf': { mimeType: 'application/dxf', accepted: ['application/dxf', 'image/vnd.dxf', 'text/plain', 'application/octet-stream'] },
  '.dwg': { mimeType: 'image/vnd.dwg', accepted: ['image/vnd.dwg', 'application/acad', 'application/x-acad', 'application/octet-stream'] },
  '.step': { mimeType: 'model/step', accepted: ['model/step', 'application/step', 'text/plain', 'application/octet-stream'] },
  '.stp': { mimeType: 'model/step', accepted: ['model/step', 'application/step', 'text/plain', 'application/octet-stream'] },
  '.iges': { mimeType: 'model/iges', accepted: ['model/iges', 'application/iges', 'text/plain', 'application/octet-stream'] },
  '.igs': { mimeType: 'model/iges', accepted: ['model/iges', 'application/iges', 'text/plain', 'application/octet-stream'] }
};

function customerFileType(filename) {
  return customerFileTypes[path.extname(String(filename || '')).toLowerCase()];
}

function isAllowedCustomerFileMetadata(file) {
  const type = customerFileType(file?.originalname);
  return Boolean(type && type.accepted.includes(String(file?.mimetype || '').toLowerCase()));
}

function canonicalCustomerMimeType(filename) {
  return customerFileType(filename)?.mimeType || 'application/octet-stream';
}

function matchesSignature(extension, buffer) {
  const ascii = buffer.toString('latin1');
  const upper = ascii.toUpperCase();
  if (extension === '.pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (extension === '.png') return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (['.jpg', '.jpeg'].includes(extension)) return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (extension === '.zip') return buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && [0x03, 0x05, 0x07].includes(buffer[2]) && [0x04, 0x06, 0x08].includes(buffer[3]);
  if (extension === '.dwg') return /^AC10\d{2}/.test(buffer.subarray(0, 6).toString('ascii'));
  if (['.step', '.stp'].includes(extension)) return upper.includes('ISO-10303-21');
  if (['.iges', '.igs'].includes(extension)) return upper.includes('IGES') || ascii.split(/\r?\n/).slice(0, 10).some(line => line.length >= 73 && line[72] === 'S');
  if (extension === '.dxf') return /(?:^|\r?\n)\s*0\s*\r?\n\s*SECTION/i.test(ascii) || upper.includes('AUTOCAD BINARY DXF');
  return false;
}

async function validateUploadedFiles(files = []) {
  for (const file of files) {
    if (file.buffer) {
      if (!matchesSignature(path.extname(file.originalname).toLowerCase(), file.buffer.subarray(0, 8192))) {
        fail(`Nội dung tệp “${path.basename(file.originalname)}” không đúng định dạng đã khai báo`);
      }
      continue;
    }
    const handle = await fs.promises.open(file.path, 'r');
    try {
      const buffer = Buffer.alloc(8192);
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
      if (!matchesSignature(path.extname(file.originalname).toLowerCase(), buffer.subarray(0, bytesRead))) {
        fail(`Nội dung tệp “${path.basename(file.originalname)}” không đúng định dạng đã khai báo`);
      }
    } finally {
      await handle.close();
    }
  }
}

function validateImageFile(file) {
  const buffer = file?.buffer;
  if (!buffer) return false;
  if (file.mimetype === 'image/jpeg') return matchesSignature('.jpg', buffer);
  if (file.mimetype === 'image/png') return matchesSignature('.png', buffer);
  if (file.mimetype === 'image/webp') return buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

module.exports = { canonicalCustomerMimeType, isAllowedCustomerFileMetadata, validateImageFile, validateUploadedFiles };
