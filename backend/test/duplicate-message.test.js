const test = require('node:test');
const assert = require('node:assert/strict');
const { duplicateMessage } = require('../src/middleware/errorHandler');

test('lỗi trùng khóa nói rõ trường bị trùng', () => {
  assert.equal(duplicateMessage({ keyPattern: { email: 1 } }), 'Email này đã được dùng cho một tài khoản khác.');
  assert.equal(duplicateMessage({ keyPattern: { phone: 1 } }), 'Số điện thoại này đã được dùng cho một tài khoản khác.');
  assert.equal(duplicateMessage({ keyPattern: { request: 1, version: 1 } }), 'Hồ sơ này đã có báo giá cùng phiên bản.');
  assert.equal(duplicateMessage({ keyPattern: { sourceLead: 1 } }), 'Không lưu được vì dữ liệu bị trùng ở trường sourceLead.');
});
