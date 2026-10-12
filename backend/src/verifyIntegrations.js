require('dotenv').config();
const nodemailer = require('nodemailer');
const { mailTransport, smtpConfigured } = require('./services/notificationService');
const { searchLocations } = require('./services/openStreetMapService');

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

async function verifyOpenStreetMap() {
  const results = await searchLocations('Hà Nội, Việt Nam');
  if (!results.length) throw new Error('OpenStreetMap/Nominatim không trả về kết quả tìm kiếm.');
  console.log('OpenStreetMap/Nominatim: OK; tìm kiếm địa chỉ trả về kết quả hợp lệ');
}

Promise.allSettled([verifySmtp(), verifyOpenStreetMap()]).then(results => {
  for (const result of results) if (result.status === 'rejected') console.error(`FAILED: ${result.reason.message}`);
  if (results.some(result => result.status === 'rejected')) process.exitCode = 1;
});
