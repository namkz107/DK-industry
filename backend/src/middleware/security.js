const { rateLimit } = require('express-rate-limit');

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' } });
const leadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng gọi hotline để được hỗ trợ.' } });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, skipSuccessfulRequests: true, message: { success: false, message: 'Quá nhiều lần thử đăng nhập. Vui lòng chờ 15 phút.' } });
const emailActionLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Bạn đã yêu cầu gửi email quá nhiều lần. Vui lòng thử lại sau.' } });
const registrationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Đã tạo quá nhiều tài khoản từ kết nối này. Vui lòng thử lại sau.' } });
const customerRequestLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false, skip: req => req.method === 'GET' || req.path.endsWith('/messages'), message: { success: false, message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.' } });
const chatMessageLimiter = rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng thử lại sau.' } });
const supportMessageLimiter = rateLimit({ windowMs: 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Bạn đang gửi yêu cầu hỗ trợ quá nhanh. Vui lòng chờ một chút.' } });

const locationLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Bạn đã tìm vị trí quá nhiều lần. Vui lòng thử lại sau.' } });
const privacyRequestLimiter = rateLimit({ windowMs: 24 * 60 * 60 * 1000, limit: 3, standardHeaders: 'draft-8', legacyHeaders: false, skip: req => req.method === 'GET', message: { success: false, message: 'Bạn đã gửi quá nhiều yêu cầu quyền riêng tư. Vui lòng liên hệ bộ phận hỗ trợ.' } });

function rejectUnsafeKeys(req, res, next) {
  const unsafe = value => value && typeof value === 'object' && Object.entries(value).some(([key, child]) => key.startsWith('$') || key.includes('.') || unsafe(child));
  if (unsafe(req.body) || unsafe(req.query) || unsafe(req.params)) return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ' });
  next();
}

module.exports = { apiLimiter, leadLimiter, authLimiter, emailActionLimiter, registrationLimiter, customerRequestLimiter, chatMessageLimiter, locationLimiter, privacyRequestLimiter, supportMessageLimiter, rejectUnsafeKeys };
