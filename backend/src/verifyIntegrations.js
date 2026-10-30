require('dotenv').config();
const dns = require('dns').promises;
const nodemailer = require('nodemailer');
const { mailTransport, sendDirectEmail, smtpConfigured } = require('./services/notificationService');
const { renderBrandedEmail } = require('./services/emailTemplateService');
const { searchLocations } = require('./services/locationService');

const senderAddress = () => String(process.env.SMTP_FROM || process.env.EMAIL_FROM || '').match(/<([^>]+)>/)?.[1]?.trim() || String(process.env.SMTP_FROM || process.env.EMAIL_FROM || '').trim();

async function txtRecords(name) {
  return (await dns.resolveTxt(name)).map(parts => parts.join(''));
}

async function verifyEmailDns() {
  const address = senderAddress();
  const domain = address.toLowerCase().split('@').pop();
  if (!domain || domain === address.toLowerCase()) throw new Error('EMAIL_FROM không chứa tên miền hợp lệ');
  const [rootRecords, dmarcRecords] = await Promise.all([txtRecords(domain), txtRecords(`_dmarc.${domain}`)]);
  if (!rootRecords.some(value => /^v=spf1\b/i.test(value))) throw new Error(`Không tìm thấy SPF tại ${domain}`);
  if (!dmarcRecords.some(value => /^v=dmarc1\b/i.test(value))) throw new Error(`Không tìm thấy DMARC tại _dmarc.${domain}`);
  const selector = String(process.env.EMAIL_DKIM_SELECTOR || '').trim();
  if (selector) {
    const dkimName = `${selector}._domainkey.${domain}`;
    const dkimRecords = await txtRecords(dkimName);
    if (!dkimRecords.some(value => /(?:^|;)\s*p\s*=/i.test(value))) throw new Error(`Không tìm thấy DKIM public key tại ${dkimName}`);
    console.log(`Email DNS: OK; SPF, DKIM (${selector}) và DMARC tồn tại cho ${domain}`);
    return;
  }
  console.log(`Email DNS: SPF và DMARC tồn tại cho ${domain}; chưa đặt EMAIL_DKIM_SELECTOR nên chưa kiểm tra được DKIM selector`);
}

async function verifySmtp() {
  if (!smtpConfigured()) throw new Error('SMTP chưa đủ cấu hình. Cần SMTP_HOST, SMTP_USER, SMTP_PASS và EMAIL_FROM/SMTP_FROM.');
  const transporter = mailTransport(nodemailer);
  await transporter.verify();
  const recipient = process.env.SMTP_TEST_TO || process.env.SMTP_USER;
  const website = (process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0].replace(/\/$/, '');
  const content = renderBrandedEmail({
    preheader: 'Bản xem trước email thương hiệu Cơ khí Đăng Khoa.',
    eyebrow: 'BẢN XEM TRƯỚC EMAIL THƯƠNG HIỆU',
    title: 'Hệ thống email đã sẵn sàng',
    greeting: 'Xin chào đội ngũ Cơ khí Đăng Khoa,',
    paragraphs: ['Đây là email kiểm tra giao diện mới. Các email tài khoản, đơn hàng, báo giá, yêu cầu và thông báo hệ thống sẽ sử dụng cùng nhận diện xanh emerald – cam này.'],
    details: [
      { label: 'Trạng thái SMTP', value: 'Hoạt động bình thường', highlight: true },
      { label: 'Thời điểm kiểm tra', value: new Date().toLocaleString('vi-VN') }
    ],
    cta: { label: 'Mở website', url: website },
    notice: 'Đây là email kiểm tra tự động, không phải giao dịch của khách hàng.'
  });
  const info = await sendDirectEmail({
    to: recipient,
    subject: `Bản xem trước email thương hiệu - ${new Date().toLocaleTimeString('vi-VN')}`,
    text: content.text,
    html: content.html,
    category: 'integration.test',
    referenceId: `smtp-test-${Date.now()}`
  });
  console.log(`SMTP: OK; đã gửi email kiểm tra tới ${recipient}; messageId=${info.messageId}; accepted=${(info.accepted || []).join(',') || 'unknown'}`);
}

async function verifyLocations() {
  const results = await searchLocations('Hà Nội, Việt Nam');
  if (!results.length || !Number.isFinite(results[0].latitude) || !Number.isFinite(results[0].longitude)) throw new Error('Nominatim không trả về địa chỉ và tọa độ hợp lệ.');
  console.log('Địa chỉ: OK; Nominatim trả về dữ liệu hợp lệ, liên kết hiển thị dùng Google Maps');
}

Promise.allSettled([verifySmtp(), verifyEmailDns(), verifyLocations()]).then(results => {
  for (const result of results) if (result.status === 'rejected') console.error(`FAILED: ${result.reason.message}`);
  if (results.some(result => result.status === 'rejected')) process.exitCode = 1;
});
