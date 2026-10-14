require('dotenv').config();
const nodemailer = require('nodemailer');
const { mailTransport, smtpConfigured } = require('./services/notificationService');
const { searchLocations } = require('./services/locationService');

async function verifySmtp() {
  if (!smtpConfigured()) throw new Error('SMTP chưa đủ cấu hình. Cần SMTP_HOST, SMTP_USER, SMTP_PASS và EMAIL_FROM/SMTP_FROM.');
  const transporter = mailTransport(nodemailer);
  await transporter.verify();
  const recipient = process.env.SMTP_TEST_TO || process.env.SMTP_USER;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.EMAIL_FROM,
    to: recipient,
    subject: 'DK Industry - kiểm tra SMTP thành công',
    text: `SMTP của DK Industry hoạt động bình thường lúc ${new Date().toISOString()}.`
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
