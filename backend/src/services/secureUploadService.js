const path = require('path');
const QuarantinedUpload = require('../models/QuarantinedUpload');
const { writeAudit } = require('./auditService');
const { removeStoredFiles, storeCustomerFile, storeCustomerFiles } = require('./fileStorageService');
const { MalwareScanError, scanBuffer } = require('./malwareScanService');

let scanner = scanBuffer;

function quarantineRetentionDate() {
  const configured = Number(process.env.QUARANTINE_RETENTION_DAYS || 30);
  const days = Number.isInteger(configured) ? Math.min(90, Math.max(1, configured)) : 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function quarantineRejectedFile(file, error, { actor, source }) {
  const stored = await storeCustomerFile(file, { quarantine: true });
  let item;
  try {
    item = await QuarantinedUpload.create({
      owner: actor,
      source,
      originalName: path.basename(String(file.originalname || 'upload')),
      storedName: stored.storedName,
      mimeType: stored.mimeType,
      size: stored.size,
      scanStatus: error.scanStatus === 'infected' ? 'infected' : 'error',
      failureCode: String(error.code || 'SCANNER_ERROR').slice(0, 100),
      attempts: error.attempts || 1,
      purgeAfter: quarantineRetentionDate()
    });
    await writeAudit({
      actor,
      action: 'upload.quarantined',
      entity: 'quarantined_file',
      entityId: item._id,
      summary: error.scanStatus === 'infected' ? 'Tệp tải lên bị cách ly do phát hiện nội dung không an toàn' : 'Tệp tải lên bị cách ly do không thể xác minh an toàn',
      metadata: { source, scanStatus: item.scanStatus, failureCode: item.failureCode }
    });
  } catch (storageError) {
    await removeStoredFiles([stored]);
    if (item) await QuarantinedUpload.deleteOne({ _id: item._id });
    throw storageError;
  }
}

async function scanAndStoreCustomerFiles(files = [], context) {
  for (const file of files) {
    try {
      const result = await scanner(file.buffer);
      if (result?.status === 'infected') {
        throw new MalwareScanError('Tệp bị từ chối vì không vượt qua kiểm tra an toàn', 'MALWARE_DETECTED', { status: 422, scanStatus: 'infected' });
      }
      if (result?.status !== 'clean') throw new MalwareScanError('Kết quả quét tệp không hợp lệ', 'SCANNER_INVALID_RESPONSE');
    } catch (error) {
      await quarantineRejectedFile(file, error, context);
      throw error;
    }
  }
  const stored = await storeCustomerFiles(files);
  return stored.map(file => ({ ...file, scanStatus: 'clean', scannedAt: new Date() }));
}

function setMalwareScannerForTests(value) {
  if (process.env.NODE_ENV !== 'test') throw new Error('Scanner override is available only in tests');
  scanner = value || scanBuffer;
}

module.exports = { scanAndStoreCustomerFiles, setMalwareScannerForTests };
