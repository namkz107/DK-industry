const Notification = require('../models/Notification');
const User = require('../models/User');
const { smtpConfigured } = require('../config/runtime');

const emailMaxAttempts = () => Math.max(1, Math.min(10, Number(process.env.EMAIL_MAX_ATTEMPTS) || 5));
const retryDelayMs = attempt => Math.min(60 * 60 * 1000, 60 * 1000 * (2 ** Math.max(0, attempt - 1)));

function mailTransport(nodemailer) {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    disableFileAccess: true,
    disableUrlAccess: true
  });
}

async function sendDirectEmail({ to, subject, text }) {
  if (!smtpConfigured()) return false;
  try {
    const nodemailer = require('nodemailer');
    await mailTransport(nodemailer).sendMail({ from: process.env.SMTP_FROM || process.env.EMAIL_FROM, to, subject, text });
    return true;
  } catch (error) {
    console.error('Direct email failed:', error.message);
    return false;
  }
}

async function createNotification({ recipient, type, title, message, link = '', metadata = {}, email = '', session = null }) {
  try {
    const document = {
      recipient, type, title, message, link, metadata,
      email: email && smtpConfigured()
        ? { address: email, status: 'pending' }
        : { address: email || '', status: 'not_requested' }
    };
    const created = await Notification.create([document], session ? { session } : undefined);
    return created[0];
  } catch (error) {
    if (session) throw error;
    console.error('Cannot create notification:', error.message);
    return null;
  }
}

async function notifyOperations(payload, session = null) {
  try {
    const query = User.find({ role: { $in: ['staff', 'admin'] }, status: 'active' }).select('_id email').lean();
    if (session) query.session(session);
    const recipients = await query;
    return Promise.all(recipients.map(user => createNotification({ ...payload, recipient: user._id, email: user.email, session })));
  } catch (error) {
    if (session) throw error;
    console.error('Cannot notify operations:', error.message);
    return [];
  }
}

async function dispatchPendingEmails(limit = 25) {
  if (!smtpConfigured()) return { sent: 0, failed: 0 };
  let nodemailer;
  try { nodemailer = require('nodemailer'); } catch { return { sent: 0, failed: 0 }; }
  const transporter = mailTransport(nodemailer);
  let sent = 0;
  let failed = 0;
  const now = new Date();
  const staleBefore = new Date(now.getTime() - 15 * 60 * 1000);
  // A process may stop between reserving and sending. Return that work to the
  // queue after a bounded lease instead of losing the notification forever.
  await Notification.updateMany(
    { 'email.status': 'sending', 'email.sendingAt': { $lt: staleBefore } },
    { $set: { 'email.status': 'pending', 'email.nextAttemptAt': now }, $unset: { 'email.sendingAt': 1 } }
  );
  for (let index = 0; index < limit; index += 1) {
    const notification = await Notification.findOneAndUpdate(
      {
        'email.status': 'pending',
        'email.address': { $ne: '' },
        'email.attempts': { $lt: emailMaxAttempts() },
        $or: [{ 'email.nextAttemptAt': { $exists: false } }, { 'email.nextAttemptAt': null }, { 'email.nextAttemptAt': { $lte: new Date() } }]
      },
      { $set: { 'email.status': 'sending', 'email.sendingAt': new Date() }, $inc: { 'email.attempts': 1 } },
      { new: true, sort: { createdAt: 1 } }
    );
    if (!notification) break;
    try {
      const baseUrl = (process.env.CLIENT_URL || '').split(',')[0];
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM,
        to: notification.email.address,
        subject: notification.title,
        text: `${notification.message}${notification.link ? `\n\n${baseUrl}${notification.link}` : ''}`
      });
      notification.email.status = 'sent';
      notification.email.sentAt = new Date();
      notification.email.error = undefined;
      notification.email.nextAttemptAt = undefined;
      notification.email.sendingAt = undefined;
      sent += 1;
    } catch (error) {
      const finalAttempt = notification.email.attempts >= emailMaxAttempts();
      notification.email.status = finalAttempt ? 'failed' : 'pending';
      notification.email.error = String(error.message || error).slice(0, 500);
      notification.email.sendingAt = undefined;
      notification.email.nextAttemptAt = finalAttempt ? undefined : new Date(Date.now() + retryDelayMs(notification.email.attempts));
      failed += 1;
    }
    await notification.save();
  }
  return { sent, failed };
}

function dispatchSoon() {
  if (process.env.NODE_ENV === 'test') return;
  setImmediate(() => dispatchPendingEmails().catch(error => console.error('Notification email dispatch failed:', error.message)));
}

module.exports = { createNotification, notifyOperations, dispatchPendingEmails, dispatchSoon, mailTransport, smtpConfigured, sendDirectEmail };
