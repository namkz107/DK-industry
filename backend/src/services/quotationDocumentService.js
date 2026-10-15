const PDFDocument = require('pdfkit');
const path = require('node:path');

const regularFont = path.join(__dirname, '..', 'assets', 'fonts', 'NotoSans-Regular.ttf');
const boldFont = path.join(__dirname, '..', 'assets', 'fonts', 'NotoSans-Bold.ttf');

const money = value => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
const date = value => new Date(value).toLocaleDateString('vi-VN');

function generateQuotationPdf({ quotation, request, customer }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true, info: { Title: `Báo giá ${quotation.code}`, Author: process.env.COMPANY_NAME || 'Cơ khí Đăng Khoa' } });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.registerFont('Regular', regularFont);
    doc.registerFont('Bold', boldFont);

    const companyName = process.env.COMPANY_NAME || 'CÔNG TY CỔ PHẦN TƯ VẤN ĐẦU TƯ XÂY DỰNG THƯƠNG MẠI ĐĂNG KHOA';
    const brandName = process.env.EMAIL_BRAND_NAME || 'Cơ khí Đăng Khoa';
    const orange = '#ea580c';
    const green = '#022c22';
    const muted = '#64748b';
    const pageWidth = doc.page.width - 84;

    const text = (value, options = {}) => {
      const { x, y, bold, size, color, ...textOptions } = options;
      doc.font(bold ? 'Bold' : 'Regular').fontSize(size || 10).fillColor(color || green);
      if (Number.isFinite(x) && Number.isFinite(y)) return doc.text(String(value || ''), x, y, textOptions);
      return doc.text(String(value || ''), textOptions);
    };
    const ensureSpace = height => { if (doc.y + height > doc.page.height - 64) doc.addPage(); };

    doc.rect(0, 0, doc.page.width, 116).fill(green);
    text(brandName, { x: 42, y: 34, width: 330, bold: true, size: 20, color: '#ffffff' });
    text(companyName, { x: 42, y: 66, width: 390, size: 8.5, color: '#d1fae5' });
    text('BÁO GIÁ', { x: 430, y: 36, width: 123, align: 'right', bold: true, size: 21, color: '#ffffff' });
    text(quotation.code, { x: 430, y: 69, width: 123, align: 'right', bold: true, size: 10, color: '#fdba74' });
    doc.x = 42;
    doc.y = 142;

    text(`Kính gửi: ${customer?.name || 'Quý khách hàng'}`, { bold: true, size: 12 });
    text(customer?.company ? `Công ty: ${customer.company}` : `Email: ${customer?.email || ''}`, { color: muted, size: 9.5 });
    if (customer?.company && customer?.email) text(`Email: ${customer.email}`, { color: muted, size: 9.5 });
    doc.moveDown(0.5);
    text(`Yêu cầu: ${request?.code || ''} - ${request?.title || ''}`, { bold: true, size: 10.5 });
    text(`Ngày lập: ${date(quotation.sentAt || quotation.createdAt || new Date())}    |    Hiệu lực đến: ${date(quotation.validUntil)}`, { color: muted, size: 9.5 });
    doc.moveDown(1.2);

    const widths = [30, 218, 58, 55, 86, 86];
    const headers = ['STT', 'Hạng mục', 'SL', 'Đơn vị', 'Đơn giá', 'Thành tiền'];
    const drawRow = (values, height, header = false) => {
      ensureSpace(height + 6);
      const y = doc.y;
      let x = 42;
      values.forEach((value, index) => {
        doc.rect(x, y, widths[index], height).fillAndStroke(header ? green : index === 0 ? '#f8fafc' : '#ffffff', '#cbd5e1');
        text(value, { x: x + 5, y: y + 7, width: widths[index] - 10, height: height - 10, bold: header, size: header ? 8.5 : 8.3, color: header ? '#ffffff' : green, align: index >= 4 ? 'right' : index === 0 || index === 2 ? 'center' : 'left' });
        x += widths[index];
      });
      doc.y = y + height;
    };
    drawRow(headers, 30, true);
    quotation.items.forEach((item, index) => {
      const descriptionHeight = doc.font('Regular').fontSize(8.3).heightOfString(item.description, { width: widths[1] - 10 });
      const height = Math.max(32, descriptionHeight + 14);
      drawRow([index + 1, item.description, item.quantity.toLocaleString('vi-VN'), item.unit, money(item.unitPrice), money(item.lineTotal)], height);
    });

    doc.moveDown(1);
    const totalsX = 335;
    const totalRow = (label, value, emphasized = false) => {
      ensureSpace(25);
      const y = doc.y;
      text(label, { x: totalsX, y: y + 4, width: 100, bold: emphasized, size: emphasized ? 11 : 9.5, color: emphasized ? green : muted });
      text(value, { x: 435, y: y + 4, width: 118, align: 'right', bold: true, size: emphasized ? 12 : 9.5, color: emphasized ? orange : green });
      doc.y = y + (emphasized ? 29 : 23);
    };
    totalRow('Tạm tính', money(quotation.subtotal));
    totalRow(`VAT (${quotation.taxRate || 0}%)`, money(quotation.taxAmount));
    doc.moveTo(totalsX, doc.y).lineTo(553, doc.y).strokeColor('#cbd5e1').stroke();
    totalRow('TỔNG CỘNG', money(quotation.total), true);
    doc.x = 42;

    const conditions = [
      quotation.leadTime && ['Thời gian thực hiện', quotation.leadTime],
      quotation.paymentTerms && ['Điều khoản thanh toán', quotation.paymentTerms],
      quotation.notes && ['Ghi chú', quotation.notes]
    ].filter(Boolean);
    if (conditions.length) {
      ensureSpace(80);
      doc.moveDown(0.6);
      text('ĐIỀU KIỆN VÀ GHI CHÚ', { bold: true, size: 11, color: orange });
      doc.moveDown(0.45);
      conditions.forEach(([label, value]) => {
        text(`${label}:`, { bold: true, size: 9.5 });
        text(value, { size: 9.5, color: muted, indent: 12 });
        doc.moveDown(0.35);
      });
    }

    const range = doc.bufferedPageRange();
    for (let page = range.start; page < range.start + range.count; page += 1) {
      doc.switchToPage(page);
      const footerY = doc.page.height - 54;
      doc.moveTo(42, footerY - 10).lineTo(doc.page.width - 42, footerY - 10).strokeColor('#e2e8f0').stroke();
      text(`${brandName}  |  ${process.env.COMPANY_PHONE_LABEL || process.env.COMPANY_PHONE || '096 5243 386'}  |  ${process.env.COMPANY_EMAIL || ''}`, { x: 42, y: footerY, width: pageWidth - 60, size: 7.5, color: muted });
      text(`${page - range.start + 1}/${range.count}`, { x: doc.page.width - 90, y: footerY, width: 48, align: 'right', size: 7.5, color: muted });
    }
    doc.end();
  });
}

module.exports = { generateQuotationPdf };
