const test = require('node:test');
const assert = require('node:assert/strict');
const { notificationEmail, passwordResetEmail, verificationEmail } = require('../src/services/emailTemplateService');

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
