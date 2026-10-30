const test = require('node:test');
const assert = require('node:assert/strict');
const Notification = require('../src/models/Notification');
const User = require('../src/models/User');
const { buildMailOptions, createNotification, mailTransport, quoteAdminEmail, sendDirectEmail } = require('../src/services/notificationService');

const managedKeys = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_REQUIRE_TLS', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM', 'SMTP_FROM', 'COMPANY_EMAIL', 'QUOTE_ADMIN_EMAIL'];

function withEnv(values, work) {
  const previous = Object.fromEntries(managedKeys.map(key => [key, process.env[key]]));
  for (const key of managedKeys) {
    if (values[key] === undefined) delete process.env[key];
    else process.env[key] = values[key];
  }
  return Promise.resolve().then(work).finally(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test('transactional mail uses an aligned Message-ID and trace headers', () => withEnv({
  EMAIL_FROM: 'DK Industry <mail@dkindustry.vn>', COMPANY_EMAIL: 'contact@dkindustry.vn'
}, () => {
  const options = buildMailOptions({ to: 'customer@example.com', subject: 'Báo giá BG-001', text: 'Nội dung', html: '<p>Nội dung</p>', category: 'quotation.sent', referenceId: 'BG-001' });
  assert.match(options.messageId, /^<[0-9a-f-]+@dkindustry\.vn>$/);
  assert.equal(options.replyTo, 'contact@dkindustry.vn');
  assert.equal(options.headers['X-Transactional-Category'], 'quotation.sent');
  assert.equal(options.headers['X-Entity-Ref-ID'], 'BG-001');
  assert.ok(options.date instanceof Date);
}));

test('SMTP transport requires modern TLS on submission port', () => withEnv({
  SMTP_HOST: 'smtp.example.com', SMTP_PORT: '587', SMTP_SECURE: 'false', SMTP_REQUIRE_TLS: 'true', SMTP_USER: 'mail@example.com', SMTP_PASS: 'secret'
}, () => {
  let captured;
  mailTransport({ createTransport: options => { captured = options; return {}; } });
  assert.equal(captured.requireTLS, true);
  assert.equal(captured.tls.minVersion, 'TLSv1.2');
  assert.equal(captured.tls.servername, 'smtp.example.com');
}));

test('extra quote mailbox has no personal hard-coded fallback', () => withEnv({}, () => {
  assert.equal(quoteAdminEmail(), '');
}));

test('direct email fails explicitly when SMTP is unavailable', () => withEnv({}, async () => {
  await assert.rejects(sendDirectEmail({ to: 'customer@example.com', subject: 'Test', text: 'Test' }), /SMTP is not configured/);
}));

test('notification remains pending during an SMTP outage instead of being skipped', () => withEnv({}, async () => {
  const originalFindById = User.findById;
  const originalCreate = Notification.create;
  User.findById = () => ({ select: () => ({ lean: () => Promise.resolve({ email: 'staff@example.com' }) }) });
  Notification.create = async documents => documents.map(document => ({ ...document, _id: 'notification-1' }));
  try {
    const notification = await createNotification({ recipient: '507f1f77bcf86cd799439011', type: 'request.created', title: 'Yêu cầu mới', message: 'Kiểm tra' });
    assert.equal(notification.email.address, 'staff@example.com');
    assert.equal(notification.email.status, 'pending');
  } finally {
    User.findById = originalFindById;
    Notification.create = originalCreate;
  }
}));
