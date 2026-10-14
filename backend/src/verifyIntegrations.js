require('dotenv').config();
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { mailTransport, smtpConfigured } = require('./services/notificationService');
const { placeDetails, searchLocations } = require('./services/googleMapsService');

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

async function verifyGoogleMaps() {
  const sessionToken = crypto.randomUUID();
  const results = await searchLocations('Hà Nội, Việt Nam', sessionToken);
  if (!results.length) throw new Error('Google Places không trả về gợi ý địa chỉ.');
  const location = await placeDetails(results[0].placeId, sessionToken);
  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) throw new Error('Google Place Details không trả về tọa độ hợp lệ.');
  console.log('Google Maps: OK; Places Autocomplete và Place Details trả về dữ liệu hợp lệ');
}

Promise.allSettled([verifySmtp(), verifyGoogleMaps()]).then(results => {
  for (const result of results) if (result.status === 'rejected') console.error(`FAILED: ${result.reason.message}`);
  if (results.some(result => result.status === 'rejected')) process.exitCode = 1;
});
