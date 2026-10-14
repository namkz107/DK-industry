require('dotenv').config();
const nodemailer = require('nodemailer');
const { mailTransport, smtpConfigured } = require('./services/notificationService');
const { renderBrandedEmail } = require('./services/emailTemplateService');
const { searchLocations } = require('./services/locationService');

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
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM,
    to: recipient,
    subject: `Bản xem trước email thương hiệu - ${new Date().toLocaleTimeString('vi-VN')}`,
    text: content.text,
    html: content.html
  });
  console.log(`SMTP: OK; đã gửi email kiểm tra tới ${recipient}`);
}

async function verifyLocations() {
  const results = await searchLocations('Hà Nội, Việt Nam');
  if (!results.length || !Number.isFinite(results[0].latitude) || !Number.isFinite(results[0].longitude)) throw new Error('Nominatim không trả về địa chỉ và tọa độ hợp lệ.');
  console.log('Địa chỉ: OK; Nominatim trả về dữ liệu hợp lệ, liên kết hiển thị dùng Google Maps');
}

Promise.allSettled([verifySmtp(), verifyLocations()]).then(results => {
  for (const result of results) if (result.status === 'rejected') console.error(`FAILED: ${result.reason.message}`);
  if (results.some(result => result.status === 'rejected')) process.exitCode = 1;
});
