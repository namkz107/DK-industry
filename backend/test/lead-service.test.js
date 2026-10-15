const test = require('node:test');
const assert = require('node:assert/strict');
const { createPublicLead } = require('../src/services/leadService');

const validPayload = {
  name: 'Khách hàng kiểm thử',
  phone: '0912345678',
  email: 'khach@example.com',
  serviceType: 'Tư vấn kỹ thuật',
  consent: true
};

test('form báo giá công khai bắt buộc email nhận phản hồi', async () => {
  await assert.rejects(
    createPublicLead({ ...validPayload, email: '' }),
    error => error.status === 400 && /email/i.test(error.message)
  );
});

test('form báo giá công khai từ chối email không hợp lệ', async () => {
  await assert.rejects(
    createPublicLead({ ...validPayload, email: 'khong-hop-le' }),
    error => error.status === 400 && /email/i.test(error.message)
  );
});
