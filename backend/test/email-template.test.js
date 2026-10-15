const test = require('node:test');
const assert = require('node:assert/strict');
const { notificationEmail, passwordResetEmail, quotationEmail, verificationEmail } = require('../src/services/emailTemplateService');

test('verification email renders branded HTML and a plain-text fallback', () => {
  const email = verificationEmail({ name: 'Nguyễn Văn A', actionUrl: 'https://example.com/xac-minh?token=abc' });
  assert.match(email.html, /Cơ khí Đăng Khoa/);
  assert.match(email.html, /Xác minh email/);
  assert.match(email.html, /https:\/\/example\.com\/xac-minh\?token=abc/);
  assert.match(email.text, /Nguyễn Văn A/);
  assert.match(email.text, /Hiệu lực liên kết: 24 giờ/);
});

test('password email escapes customer-controlled content', () => {
  const email = passwordResetEmail({ name: '<script>alert(1)</script>', actionUrl: 'https://example.com/reset' });
  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.html, /&lt;script&gt;/);
});

test('notification email includes category, reference and CTA', () => {
  const email = notificationEmail({
    notification: { type: 'order.updated', title: 'Đơn hàng DH-261014-ABC đã được cập nhật', message: 'Đơn hàng đang được giao.' },
    recipientName: 'Minh', actionUrl: 'https://example.com/tai-khoan/don-hang'
  });
  assert.match(email.html, /CẬP NHẬT ĐƠN HÀNG/);
  assert.match(email.html, /DH-261014-ABC/);
  assert.match(email.text, /Xem chi tiết: https:\/\/example\.com\/tai-khoan\/don-hang/);
});

test('quotation email includes every item, totals, terms and PDF notice', () => {
  const email = quotationEmail({
    quotation: {
      code: 'BG-261015-ABC123',
      items: [
        { description: 'Gia công chi tiết CNC', quantity: 2, unit: 'cái', unitPrice: 500000, lineTotal: 1000000 },
        { description: 'Xử lý bề mặt', quantity: 1, unit: 'lô', unitPrice: 200000, lineTotal: 200000 }
      ],
      subtotal: 1200000, taxRate: 10, taxAmount: 120000, total: 1320000,
      validUntil: new Date('2026-10-31T00:00:00.000Z'), leadTime: '10 ngày làm việc', paymentTerms: 'Đặt cọc 50%', notes: 'Giao hàng tại xưởng.'
    },
    request: { code: 'YC-261015-TEST', title: 'Cung ứng thiết bị' },
    customer: { name: 'Nam' },
    actionUrl: 'https://example.com/tai-khoan/yeu-cau'
  });
  assert.match(email.html, /Gia công chi tiết CNC/);
  assert.match(email.html, /Xử lý bề mặt/);
  assert.match(email.html, /1\.320\.000/);
  assert.match(email.text, /File báo giá BG-261015-ABC123\.pdf/);
  assert.match(email.text, /Đặt cọc 50%/);
});
