function notFound(req, res) {
  res.status(404).json({ success: false, message: `Không tìm thấy ${req.path}`, requestId: req.id });
}

function duplicateMessage(error) {
  const fields = Object.keys(error.keyPattern || {});
  if (fields.includes('email')) return 'Email này đã được dùng cho một tài khoản khác.';
  if (fields.includes('phone')) return 'Số điện thoại này đã được dùng cho một tài khoản khác.';
  if (fields.includes('request') && fields.includes('version')) return 'Hồ sơ này đã có báo giá cùng phiên bản.';
  if (fields.includes('code')) return 'Mã vừa tạo bị trùng với bản ghi đã có. Hãy thử lại.';
  if (fields.includes('slug')) return 'Đường dẫn này đã được dùng cho nội dung khác.';
  if (fields.includes('sku')) return 'Mã SKU này đã được dùng cho sản phẩm khác.';
  if (fields.includes('customer') && fields.includes('idempotencyKey')) return 'Đơn hàng này vừa được tạo, không cần gửi lại.';
  if (fields.length) return `Không lưu được vì dữ liệu bị trùng ở trường ${fields.join(', ')}.`;
  return 'Không lưu được vì dữ liệu bị trùng với bản ghi đã có.';
}

function errorHandler(error, req, res, next) {
  if (error.name === 'MulterError') {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? (error.field === 'image' ? 'Ảnh tối đa 5MB' : 'Mỗi tệp tối đa 10MB')
      : error.code === 'LIMIT_FILE_COUNT' ? 'Tối đa 5 tệp cho mỗi yêu cầu' : 'Tệp tải lên không hợp lệ';
    return res.status(400).json({ success: false, message });
  }
  if (error.code === 11000) {
    console.error(JSON.stringify({ level: 'warn', event: 'duplicate_key', requestId: req.id, method: req.method, path: req.path, keyPattern: error.keyPattern || null }));
    return res.status(409).json({ success: false, message: duplicateMessage(error), requestId: req.id });
  }
  const status = error.name === 'ValidationError' ? 400 : (error.status || 500);
  if (status >= 500) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'request_error',
      requestId: req.id,
      method: req.method,
      path: req.path,
      status,
      error: { name: error.name, code: error.code, message: error.message, stack: error.stack }
    }));
  }
  res.status(status).json({ success: false, message: status === 500 ? 'Lỗi máy chủ, vui lòng thử lại sau' : error.message, requestId: req.id });
}

module.exports = { notFound, errorHandler, duplicateMessage };
