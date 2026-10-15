const Notification = require('../models/Notification');
const Quotation = require('../models/Quotation');
const ServiceRequest = require('../models/ServiceRequest');
const User = require('../models/User');
const { smtpConfigured } = require('../config/runtime');
const { notificationEmail, quotationEmail } = require('./emailTemplateService');
const { generateQuotationPdf } = require('./quotationDocumentService');

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

async function sendDirectEmail({ to, subject, text, html }) {
  if (!smtpConfigured()) return false;
  try {
    const nodemailer = require('nodemailer');
    await mailTransport(nodemailer).sendMail({ from: process.env.SMTP_FROM || process.env.EMAIL_FROM, replyTo: process.env.COMPANY_EMAIL || undefined, to, subject, text, html });
    return true;
  } catch (error) {
    console.error('Direct email failed:', error.message);
    return false;
  }
}

async function createNotification({ recipient, type, title, message, link = '', metadata = {}, email, session = null }) {
  try {
    let emailAddress = email;
    if (emailAddress === undefined && smtpConfigured()) {
      const query = User.findById(recipient).select('email').lean();
      if (session) query.session(session);
      emailAddress = (await query)?.email || '';
    }
    const document = {
      recipient, type, title, message, link, metadata,
      email: emailAddress && smtpConfigured()
        ? { address: emailAddress, status: 'pending' }
        : { address: emailAddress || '', status: 'not_requested' }
    };
    const created = await Notification.create([document], session ? { session } : undefined);
    return created[0];
  } catch (error) {
    if (session) throw error;
    console.error('Cannot create notification:', error.message);
    return null;
  }
}

async function notifyRole(role, payload, session = null) {
  try {
    const query = User.find({ role, status: 'active' }).select('_id email').lean();
    if (session) query.session(session);
    const recipients = await query;
    return Promise.all(recipients.map(user => createNotification({ ...payload, recipient: user._id, email: user.email, session })));
  } catch (error) {
    if (session) throw error;
    console.error('Cannot notify operations:', error.message);
    return [];
  }
}

const notifyOperations = (payload, session = null) => notifyRole('staff', payload, session);
const notifyAdmins = (payload, session = null) => notifyRole('admin', payload, session);

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
      await notification.populate('recipient', 'name email company phone');
      const actionUrl = notification.link ? `${baseUrl.replace(/\/$/, '')}${notification.link.startsWith('/') ? notification.link : `/${notification.link}`}` : '';
      let emailContent;
      let attachments;
      if (notification.type === 'quotation.sent' && notification.metadata?.quotationId) {
        const [quotation, request] = await Promise.all([
          Quotation.findById(notification.metadata.quotationId).lean(),
          ServiceRequest.findById(notification.metadata.requestId).select('code title').lean()
        ]);
        if (!quotation || !request) throw new Error('Không tìm thấy dữ liệu để tạo email báo giá');
        emailContent = quotationEmail({ quotation, request, customer: notification.recipient, actionUrl });
        attachments = [{ filename: `Bao-gia-${quotation.code}.pdf`, content: await generateQuotationPdf({ quotation, request, customer: notification.recipient }), contentType: 'application/pdf' }];
      } else {
        emailContent = notificationEmail({ notification, recipientName: notification.recipient?.name, actionUrl });
      }
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM,
        replyTo: process.env.COMPANY_EMAIL || undefined,
        to: notification.email.address,
        subject: notification.title,
        text: emailContent.text,
        html: emailContent.html,
        attachments
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

module.exports = { createNotification, notifyOperations, notifyAdmins, dispatchPendingEmails, dispatchSoon, mailTransport, smtpConfigured, sendDirectEmail };
