const DEFAULT_LOGO = 'https://res.cloudinary.com/dgbounqav/image/upload/f_auto,q_auto/logo_dk_uhmnyn';

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const cleanUrl = value => {
  try {
    const url = new URL(String(value || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch { return ''; }
};

function brand() {
  const website = cleanUrl((process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0]);
  return {
    name: String(process.env.COMPANY_NAME || 'CTY CPTV ĐẦU TƯ XD TM ĐĂNG KHOA').trim(),
    displayName: String(process.env.EMAIL_BRAND_NAME || 'Cơ khí Đăng Khoa').trim(),
    phone: String(process.env.COMPANY_PHONE_LABEL || process.env.COMPANY_PHONE || '096 5243 386').trim(),
    email: String(process.env.COMPANY_EMAIL || process.env.SMTP_USER || '').trim(),
    address: String(process.env.COMPANY_ADDRESS || '').trim(),
    website,
    logo: cleanUrl(process.env.COMPANY_LOGO_URL || DEFAULT_LOGO),
    zalo: cleanUrl(process.env.COMPANY_ZALO_URL || '')
  };
}

function plainText({ eyebrow, title, greeting, paragraphs = [], details = [], cta, notice }) {
  const company = brand();
  return [
    eyebrow,
    title,
    '',
    greeting,
    ...paragraphs.flatMap(paragraph => ['', paragraph]),
    details.length ? '' : null,
    ...details.map(item => `${item.label}: ${item.value}`),
    cta?.url ? `\n${cta.label}: ${cta.url}` : null,
    notice ? `\nLưu ý: ${notice}` : null,
    '',
    'Trân trọng,',
    `Đội ngũ ${company.displayName}`,
    '',
    [company.phone && `Hotline: ${company.phone}`, company.email && `Email: ${company.email}`, company.website && `Website: ${company.website}`].filter(Boolean).join(' · '),
    company.address
  ].filter(value => value !== null && value !== undefined).join('\n').trim();
}

function renderBrandedEmail({ preheader = '', eyebrow = 'THÔNG BÁO TỪ CÔNG TY', title, greeting = 'Kính gửi Quý khách hàng,', paragraphs = [], contentHtml = '', details = [], cta, notice = '' }) {
  const company = brand();
  const safeCtaUrl = cleanUrl(cta?.url);
  const detailRows = details.map((item, index) => `<tr>
    <td style="padding:${index ? '14px 0 0' : '0'};font-family:Arial,sans-serif;font-size:13px;line-height:20px;color:#64748b;">${escapeHtml(item.label)}</td>
    <td align="right" style="padding:${index ? '14px 0 0 16px' : '0 0 0 16px'};font-family:Arial,sans-serif;font-size:14px;line-height:20px;font-weight:700;color:${item.highlight ? '#047857' : '#022c22'};">${escapeHtml(item.value)}</td>
  </tr>`).join('');
  const socialLinks = [
    company.website && `<a href="${escapeHtml(company.website)}" style="color:#047857;text-decoration:underline;">Website</a>`,
    company.zalo && `<a href="${escapeHtml(company.zalo)}" style="color:#047857;text-decoration:underline;">Zalo</a>`
  ].filter(Boolean).join('&nbsp;&nbsp;·&nbsp;&nbsp;');

  const html = `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f5f5f4;color:#0f172a;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader || title)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f5f5f4;"><tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 12px 32px rgba(2,44,34,.10);">
      <tr><td align="center" style="padding:24px 28px 22px;background:#022c22;border-bottom:4px solid #ea580c;">
        ${company.logo ? `<img src="${escapeHtml(company.logo)}" width="112" alt="${escapeHtml(company.displayName)}" style="display:block;width:112px;max-width:112px;height:auto;margin:0 auto 12px;border:0;background:#ffffff;border-radius:12px;padding:6px;">` : ''}
        <div style="font-family:Arial,sans-serif;font-size:19px;line-height:26px;font-weight:700;color:#ffffff;">${escapeHtml(company.displayName)}</div>
        <div style="margin-top:4px;font-family:Arial,sans-serif;font-size:12px;line-height:18px;color:#a7f3d0;">Giải pháp cơ khí · Đồng hành cùng doanh nghiệp</div>
      </td></tr>
      <tr><td style="padding:32px 30px 12px;">
        <div style="font-family:Arial,sans-serif;font-size:11px;line-height:18px;font-weight:700;letter-spacing:1.2px;color:#c2410c;">${escapeHtml(eyebrow)}</div>
        <h1 style="margin:8px 0 0;font-family:Arial,sans-serif;font-size:26px;line-height:34px;color:#022c22;">${escapeHtml(title)}</h1>
        <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:15px;line-height:24px;color:#334155;">${escapeHtml(greeting)}</p>
        ${paragraphs.map(paragraph => `<p style="margin:12px 0 0;font-family:Arial,sans-serif;font-size:15px;line-height:24px;color:#475569;">${escapeHtml(paragraph)}</p>`).join('')}
        ${contentHtml}
      </td></tr>
      ${details.length ? `<tr><td style="padding:12px 30px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:14px;"><tr><td style="padding:18px 20px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${detailRows}</table></td></tr></table></td></tr>` : ''}
      ${safeCtaUrl ? `<tr><td align="center" style="padding:18px 30px 14px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#ea580c" style="border-radius:12px;"><a href="${escapeHtml(safeCtaUrl)}" style="display:inline-block;padding:14px 24px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px;">${escapeHtml(cta.label)} &rarr;</a></td></tr></table></td></tr>` : ''}
      ${notice ? `<tr><td style="padding:10px 30px 0;"><div style="padding:12px 14px;background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;font-family:Arial,sans-serif;font-size:13px;line-height:20px;color:#9a3412;"><strong>Lưu ý:</strong> ${escapeHtml(notice)}</div></td></tr>` : ''}
      <tr><td style="padding:24px 30px 30px;font-family:Arial,sans-serif;font-size:14px;line-height:23px;color:#475569;">Nếu cần hỗ trợ thêm, Quý khách vui lòng phản hồi email này hoặc liên hệ hotline của chúng tôi.<br><br>Trân trọng,<br><strong style="color:#022c22;">Đội ngũ ${escapeHtml(company.displayName)}</strong></td></tr>
      <tr><td align="center" style="padding:24px 24px 22px;background:#f8fafc;border-top:1px solid #e2e8f0;font-family:Arial,sans-serif;color:#64748b;">
        <div style="font-size:14px;line-height:22px;font-weight:700;color:#022c22;">${escapeHtml(company.name)}</div>
        <div style="margin-top:7px;font-size:12px;line-height:19px;">${[company.phone && `Hotline: ${escapeHtml(company.phone)}`, company.email && `Email: ${escapeHtml(company.email)}`].filter(Boolean).join(' &nbsp;·&nbsp; ')}</div>
        ${company.address ? `<div style="font-size:12px;line-height:19px;">${escapeHtml(company.address)}</div>` : ''}
        ${socialLinks ? `<div style="margin-top:9px;font-size:12px;line-height:19px;">${socialLinks}</div>` : ''}
        <div style="margin:18px auto 0;max-width:500px;border-top:1px solid #e2e8f0;padding-top:15px;font-size:10px;line-height:16px;color:#94a3b8;">&copy; ${new Date().getFullYear()} ${escapeHtml(company.displayName)}. Email này được gửi tự động từ hệ thống; vui lòng không chia sẻ liên kết bảo mật hoặc mã xác thực.</div>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  return { html, text: plainText({ eyebrow, title, greeting, paragraphs, details, cta: safeCtaUrl ? { ...cta, url: safeCtaUrl } : undefined, notice }) };
}

function leadAcknowledgementEmail(lead) {
  const company = brand();
  const content = renderBrandedEmail({
    preheader: `Mã tiếp nhận ${lead.code}. Chúng tôi sẽ phản hồi trong giờ làm việc.`,
    eyebrow: 'XÁC NHẬN YÊU CẦU',
    title: `Đã tiếp nhận yêu cầu ${lead.code}`,
    greeting: `Xin chào ${lead.name || 'Quý khách'},`,
    paragraphs: [
      'Cảm ơn bạn đã gửi yêu cầu tư vấn. Đội ngũ kỹ thuật đã nhận đủ thông tin và sẽ phản hồi qua email hoặc số điện thoại bạn cung cấp trong giờ làm việc.',
      lead.serviceType ? `Nhu cầu đã ghi nhận: ${lead.serviceType}.` : '',
      lead.message ? `Nội dung bạn đã gửi: ${lead.message}` : ''
    ].filter(Boolean),
    details: [
      { label: 'Mã tiếp nhận', value: lead.code, highlight: true },
      lead.phone && { label: 'Số điện thoại', value: lead.phone },
      lead.serviceType && { label: 'Nhu cầu', value: lead.serviceType },
      lead.budget && { label: 'Ngân sách', value: lead.budget }
    ].filter(Boolean),
    cta: { label: 'Xem thông tin liên hệ', url: `${company.website}/lien-he` },
    notice: 'Nếu bạn không gửi yêu cầu này, hãy bỏ qua email.'
  });
  return { subject: `Đã tiếp nhận yêu cầu ${lead.code} - ${company.displayName}`, ...content };
}

function leadOperationsEmail(lead) {
  const company = brand();
  const content = renderBrandedEmail({
    preheader: `${lead.name} vừa gửi yêu cầu ${lead.code}.`,
    eyebrow: 'YÊU CẦU TỪ WEBSITE',
    title: `Yêu cầu báo giá mới ${lead.code}`,
    greeting: 'Xin chào đội ngũ vận hành,',
    paragraphs: [
      `${lead.name} vừa gửi yêu cầu tư vấn khi chưa đăng nhập.`,
      lead.message || 'Khách chưa mô tả thêm nội dung.'
    ],
    details: [
      { label: 'Mã tiếp nhận', value: lead.code, highlight: true },
      { label: 'Họ tên', value: lead.name },
      { label: 'Số điện thoại', value: lead.phone },
      { label: 'Email', value: lead.email },
      { label: 'Nhu cầu', value: lead.serviceType || 'Chưa chọn' },
      { label: 'Ngân sách', value: lead.budget || 'Chưa xác định' }
    ],
    cta: { label: 'Mở hồ sơ yêu cầu', url: `${company.website}/staff/leads?leadId=${lead._id}` }
  });
  return { subject: `Yêu cầu báo giá mới ${lead.code} - ${lead.name}`, ...content };
}

function verificationEmail({ name, actionUrl }) {
  const title = 'Chào mừng bạn đến với Cơ khí Đăng Khoa';
  return {
    subject: `Xác minh email ${brand().displayName}`,
    ...renderBrandedEmail({
      preheader: 'Xác minh địa chỉ email để bảo vệ tài khoản của bạn.', eyebrow: 'CHÀO MỪNG KHÁCH HÀNG', title,
      greeting: `Xin chào ${name || 'Quý khách'},`,
      paragraphs: ['Cảm ơn bạn đã đăng ký tài khoản. Vui lòng xác minh địa chỉ email để sử dụng đầy đủ chức năng theo dõi đơn hàng, yêu cầu gia công và báo giá.'],
      details: [{ label: 'Hiệu lực liên kết', value: '24 giờ', highlight: true }],
      cta: { label: 'Xác minh email', url: actionUrl },
      notice: 'Nếu bạn không tạo tài khoản này, bạn có thể bỏ qua email.'
    })
  };
}

function passwordResetEmail({ name, actionUrl }) {
  return {
    subject: `Đặt lại mật khẩu ${brand().displayName}`,
    ...renderBrandedEmail({
      preheader: 'Yêu cầu tạo mật khẩu mới cho tài khoản của bạn.', eyebrow: 'BẢO MẬT TÀI KHOẢN', title: 'Đặt lại mật khẩu',
      greeting: `Xin chào ${name || 'Quý khách'},`,
      paragraphs: ['Chúng tôi nhận được yêu cầu tạo mật khẩu mới cho tài khoản của bạn. Nhấn nút bên dưới để tiếp tục.'],
      details: [{ label: 'Hiệu lực liên kết', value: '30 phút', highlight: true }],
      cta: { label: 'Tạo mật khẩu mới', url: actionUrl },
      notice: 'Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email và không chia sẻ liên kết với bất kỳ ai.'
    })
  };
}

function notificationCategory(type = '') {
  if (type.startsWith('order.')) return 'CẬP NHẬT ĐƠN HÀNG';
  if (type.startsWith('work_order.')) return 'CẬP NHẬT DỰ ÁN';
  if (type.startsWith('quotation.') || type.startsWith('request.')) return 'YÊU CẦU & BÁO GIÁ';
  if (type.startsWith('support.')) return 'CHĂM SÓC KHÁCH HÀNG';
  if (type.startsWith('privacy.')) return 'QUYỀN RIÊNG TƯ';
  if (type.startsWith('lead.')) return 'THÔNG BÁO KINH DOANH';
  return 'THÔNG BÁO HỆ THỐNG';
}

function notificationEmail({ notification, recipientName, actionUrl }) {
  const reference = String(notification.title || '').match(/(?:DH|YC|BG|CV|DA)-[A-Z0-9-]+/i)?.[0];
  return renderBrandedEmail({
    preheader: notification.message,
    eyebrow: notificationCategory(notification.type),
    title: notification.title,
    greeting: recipientName ? `Xin chào ${recipientName},` : 'Kính gửi Quý khách hàng,',
    paragraphs: [notification.message],
    details: reference ? [{ label: 'Mã tham chiếu', value: reference, highlight: true }] : [],
    cta: actionUrl ? { label: 'Xem chi tiết', url: actionUrl } : undefined
  });
}

const formatMoney = value => `${Number(value || 0).toLocaleString('vi-VN')} đ`;

function quotationEmail({ quotation, request, customer, actionUrl }) {
  const rows = quotation.items.map((item, index) => `<tr>
    <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#475569;">${index + 1}</td>
    <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;font-size:12px;color:#0f172a;">${escapeHtml(item.description)}</td>
    <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:center;font-family:Arial,sans-serif;font-size:12px;color:#475569;">${escapeHtml(item.quantity)}</td>
    <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-family:Arial,sans-serif;font-size:12px;color:#475569;">${escapeHtml(item.unit)}</td>
    <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:Arial,sans-serif;font-size:12px;color:#475569;white-space:nowrap;">${formatMoney(item.unitPrice)}</td>
    <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#022c22;white-space:nowrap;">${formatMoney(item.lineTotal)}</td>
  </tr>`).join('');
  const conditionRows = [
    quotation.leadTime && ['Thời gian thực hiện', quotation.leadTime],
    quotation.paymentTerms && ['Điều khoản thanh toán', quotation.paymentTerms],
    quotation.notes && ['Ghi chú', quotation.notes]
  ].filter(Boolean).map(([label, value]) => `<p style="margin:7px 0;font-family:Arial,sans-serif;font-size:13px;line-height:20px;color:#475569;"><strong style="color:#022c22;">${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join('');
  const contentHtml = `
    <div style="margin-top:20px;overflow:hidden;border:1px solid #cbd5e1;border-radius:12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
        <thead><tr style="background:#022c22;">
          <th style="padding:10px 6px;font-family:Arial,sans-serif;font-size:11px;color:#ffffff;">STT</th>
          <th align="left" style="padding:10px 8px;font-family:Arial,sans-serif;font-size:11px;color:#ffffff;">HẠNG MỤC</th>
          <th style="padding:10px 6px;font-family:Arial,sans-serif;font-size:11px;color:#ffffff;">SL</th>
          <th align="left" style="padding:10px 8px;font-family:Arial,sans-serif;font-size:11px;color:#ffffff;">ĐƠN VỊ</th>
          <th align="right" style="padding:10px 8px;font-family:Arial,sans-serif;font-size:11px;color:#ffffff;">ĐƠN GIÁ</th>
          <th align="right" style="padding:10px 8px;font-family:Arial,sans-serif;font-size:11px;color:#ffffff;">THÀNH TIỀN</th>
        </tr></thead><tbody>${rows}</tbody>
      </table>
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:14px;background:#f8fafc;border-radius:12px;"><tr><td style="padding:16px 18px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr><td style="font-family:Arial,sans-serif;font-size:13px;color:#64748b;">Tạm tính</td><td align="right" style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#022c22;">${formatMoney(quotation.subtotal)}</td></tr>
        <tr><td style="padding-top:8px;font-family:Arial,sans-serif;font-size:13px;color:#64748b;">VAT (${escapeHtml(quotation.taxRate || 0)}%)</td><td align="right" style="padding-top:8px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#022c22;">${formatMoney(quotation.taxAmount)}</td></tr>
        <tr><td style="padding-top:12px;border-top:1px solid #cbd5e1;font-family:Arial,sans-serif;font-size:16px;font-weight:700;color:#022c22;">Tổng cộng</td><td align="right" style="padding-top:12px;border-top:1px solid #cbd5e1;font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#ea580c;">${formatMoney(quotation.total)}</td></tr>
      </table>
    </td></tr></table>
    ${conditionRows ? `<div style="margin-top:16px;padding:14px 16px;background:#fff7ed;border-left:4px solid #f97316;border-radius:8px;">${conditionRows}</div>` : ''}`;
  const rendered = renderBrandedEmail({
    preheader: `Báo giá ${quotation.code} - ${formatMoney(quotation.total)}`,
    eyebrow: 'BÁO GIÁ CHI TIẾT',
    title: `Báo giá ${quotation.code}`,
    greeting: `Xin chào ${customer?.name || 'Quý khách'},`,
    paragraphs: [`Chúng tôi gửi bạn báo giá cho yêu cầu ${request?.code || ''} - ${request?.title || ''}. File PDF đầy đủ được đính kèm email này.`],
    contentHtml,
    details: [
      { label: 'Mã báo giá', value: quotation.code, highlight: true },
      { label: 'Hiệu lực đến', value: new Date(quotation.validUntil).toLocaleDateString('vi-VN') }
    ],
    cta: actionUrl ? { label: 'Xem và phản hồi báo giá', url: actionUrl } : undefined
  });
  const itemText = quotation.items.map((item, index) => `${index + 1}. ${item.description} - ${item.quantity} ${item.unit} x ${formatMoney(item.unitPrice)} = ${formatMoney(item.lineTotal)}`).join('\n');
  rendered.text = [
    `BÁO GIÁ ${quotation.code}`,
    `Kính gửi: ${customer?.name || 'Quý khách'}`,
    `Yêu cầu: ${request?.code || ''} - ${request?.title || ''}`,
    '', 'CÁC HẠNG MỤC', itemText, '',
    `Tạm tính: ${formatMoney(quotation.subtotal)}`,
    `VAT (${quotation.taxRate || 0}%): ${formatMoney(quotation.taxAmount)}`,
    `TỔNG CỘNG: ${formatMoney(quotation.total)}`,
    `Hiệu lực đến: ${new Date(quotation.validUntil).toLocaleDateString('vi-VN')}`,
    quotation.leadTime && `Thời gian thực hiện: ${quotation.leadTime}`,
    quotation.paymentTerms && `Điều khoản thanh toán: ${quotation.paymentTerms}`,
    quotation.notes && `Ghi chú: ${quotation.notes}`,
    actionUrl && `Xem và phản hồi: ${actionUrl}`,
    '', `File báo giá ${quotation.code}.pdf được đính kèm email này.`
  ].filter(Boolean).join('\n');
  return rendered;
}

module.exports = { escapeHtml, leadAcknowledgementEmail, leadOperationsEmail, notificationEmail, passwordResetEmail, quotationEmail, renderBrandedEmail, verificationEmail };
