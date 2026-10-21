const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('pdfkit');

const regularFont = path.join(__dirname, '..', 'assets', 'fonts', 'NotoSans-Regular.ttf');
const boldFont = path.join(__dirname, '..', 'assets', 'fonts', 'NotoSans-Bold.ttf');
const logoPath = path.join(__dirname, '..', 'assets', 'brand', 'dk-logo.png');
const stampPath = path.join(__dirname, '..', 'assets', 'brand', 'dk-stamp.jpg');

const letterhead = {
  englishName: process.env.COMPANY_ENGLISH_NAME || 'DANG KHOA CIC AND T.,JSC',
  legalName: process.env.COMPANY_LEGAL_NAME || 'CÔNG TY CỔ PHẦN TƯ VẤN ĐẦU TƯ XÂY DỰNG VÀ THƯƠNG MẠI ĐĂNG KHOA.',
  address: process.env.COMPANY_QUOTE_ADDRESS || 'CỤM 3 - DUYEN TRUONG - DUYEN THAI - THUONG TIN - HA NOI',
  phones: process.env.COMPANY_QUOTE_PHONES || '098 3688 326     097 7361 298',
  taxCode: process.env.COMPANY_TAX_CODE || '0106426038',
  email: process.env.COMPANY_QUOTE_EMAIL || process.env.COMPANY_EMAIL || 'ctydangkhoa8386@gmail.com'
};

const amount = value => Number(value || 0).toLocaleString('en-US');
const pad = value => String(value).padStart(2, '0');
const date = value => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return `${pad(parsed.getDate())}/${pad(parsed.getMonth() + 1)}/${parsed.getFullYear()}`;
};

function validityText(quotation) {
  if (quotation.validityLabel) return quotation.validityLabel;
  if (Number.isInteger(quotation.validityDays) && quotation.validityDays > 0) return `${quotation.validityDays} ngày`;
  const start = new Date(quotation.sentAt || quotation.createdAt || Date.now());
  const end = new Date(quotation.validUntil);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (days > 0 && days <= 365) return `${days} ngày`;
  return date(quotation.validUntil);
}

function generateQuotationPdf({ quotation, request, customer }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 32, bufferPages: true, info: { Title: `Báo giá ${quotation.code}`, Author: letterhead.legalName } });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.registerFont('Regular', regularFont);
    doc.registerFont('Bold', boldFont);

    const left = 32;
    const width = doc.page.width - 64;
    const bottom = doc.page.height - 36;
    const ink = '#111111';
    let y = 24;

    const text = (value, x, top, options = {}) => {
      doc.font(options.bold ? 'Bold' : 'Regular').fontSize(options.size || 9).fillColor(options.color || ink);
      doc.text(String(value ?? ''), x, top, { width: options.width, height: options.height, align: options.align || 'left', lineGap: 1, ellipsis: Boolean(options.ellipsis) });
      doc.x = left;
      doc.y = y;
    };
    const ensure = height => {
      if (y + height <= bottom) return;
      doc.addPage();
      y = 32;
    };
    const withColon = label => `${String(label).replace(/:\s*$/, '')}: `;
    const measureLine = (label, value, maxWidth, options = {}) => {
      const caption = withColon(label);
      doc.font('Bold').fontSize(9);
      const captionWidth = Math.min(doc.widthOfString(caption), Math.max(40, maxWidth - 48));
      const valueWidth = Math.max(36, maxWidth - captionWidth);
      doc.font(options.bold ? 'Bold' : 'Regular').fontSize(9);
      const valueHeight = doc.heightOfString(String(value || ''), { width: valueWidth });
      return { caption, captionWidth, valueWidth, height: Math.max(12, valueHeight) };
    };
    const fullRow = (label, value, options = {}) => {
      const measured = measureLine(label, value, width, options);
      ensure(measured.height + 4);
      text(measured.caption, left, y, { width: measured.captionWidth + 2, height: measured.height + 2, bold: true, size: 9 });
      text(value || '', left + measured.captionWidth, y, { width: measured.valueWidth, height: measured.height + 2, bold: options.bold, size: 9 });
      y += measured.height + 3;
    };
    const pairRow = (leftLabel, leftValue, rightLabel, rightValue) => {
      const gap = 18;
      const half = (width - gap) / 2;
      const leftMeasured = measureLine(leftLabel, leftValue, half);
      const rightMeasured = measureLine(rightLabel, rightValue, half);
      const height = Math.max(leftMeasured.height, rightMeasured.height);
      ensure(height + 4);
      text(leftMeasured.caption, left, y, { width: leftMeasured.captionWidth + 2, height: height + 2, bold: true, size: 9 });
      text(leftValue || '', left + leftMeasured.captionWidth, y, { width: leftMeasured.valueWidth, height: height + 2, size: 9 });
      const rightX = left + half + gap;
      text(rightMeasured.caption, rightX, y, { width: rightMeasured.captionWidth + 2, height: height + 2, bold: true, size: 9 });
      text(rightValue || '', rightX + rightMeasured.captionWidth, y, { width: rightMeasured.valueWidth, height: height + 2, size: 9 });
      y += height + 3;
    };

    if (fs.existsSync(logoPath)) doc.image(logoPath, left, y, { fit: [78, 62] });
    text(letterhead.englishName, left + 86, y + 2, { width: width - 86, align: 'center', bold: true, size: 13 });
    text(`ADD: ${letterhead.address}`, left + 86, y + 20, { width: width - 86, align: 'center', size: 9 });
    text(`TEL: ${letterhead.phones}`, left + 86, y + 34, { width: width - 86, align: 'center', size: 9 });
    text(`MST: ${letterhead.taxCode}      Email: ${letterhead.email}`, left + 86, y + 48, { width: width - 86, align: 'center', size: 9 });
    y += 74;

    const senderName = quotation.senderName || quotation.createdBy?.name || '';
    const senderPhone = quotation.senderPhone || '';
    const recipientCompany = quotation.recipientCompany || customer?.company || customer?.name || '';
    const recipientName = quotation.recipientName || customer?.name || '';
    const recipientPhone = quotation.recipientPhone || customer?.phone || '';
    const workTitle = quotation.workTitle || request?.title || '';

    fullRow('Supplier/ Công ty gửi báo giá:', letterhead.legalName);
    pairRow('PIC/ Người gửi báo giá', senderName, 'Hand phone/ Số điện thoại:', senderPhone);
    pairRow('Quotation No/ Số báo giá', quotation.code || '', 'Fax No/ Số Fax:', quotation.senderFax || '');
    fullRow('Quotation Date/ Ngày báo giá', date(quotation.sentAt || quotation.createdAt || new Date()));
    fullRow("Quotation's Validity/ Hiệu lực báo giá", validityText(quotation));
    y += 6;
    fullRow('To', recipientCompany, { bold: true });
    pairRow('PIC/ Người nhận báo giá', recipientName, 'Hand phone/ Số điện thoại', recipientPhone);
    fullRow('Fax No/ Số Fax', quotation.recipientFax || '');
    y += 4;
    ensure(28);
    text('Please check quotation\'s detail as following/ Công ty chúng tôi xin gửi tới Quý công ty báo giá cụ thể như sau', left, y, { width, size: 9 });
    y += 28;
    fullRow('+ Working Title/ Tên công việc:', workTitle);
    fullRow('+ Payment Term/ Điều kiện thanh toán:', quotation.paymentTerms || '');
    fullRow('+ Incoterm/ Điều kiện giao hàng:', quotation.incoterm || '');
    fullRow('+ Leadtime/ Thời gian giao hàng:', quotation.leadTime || '');
    fullRow('+ TOTAL AMOUNT/ TỔNG GIÁ TRỊ ĐƠN HÀNG:', amount(quotation.total), { bold: true });
    y += 4;
    ensure(36);
    text('1. Material Expense/ Chi phí vật tư:', left, y, { width, bold: true, size: 10 });
    y += 16;
    text('1.1. Main Material/ Vật tư chính:', left, y, { width, size: 10 });
    y += 18;

    const widths = [28, 188, 72, 48, 52, 66, width - 454];
    const headers = ['STT', 'Material\n(Tên Vật Tư)', 'Spec\n(Model, Maker,…)', 'Unit\n(Đơn Vị)', 'Quantity\n(Khối Lượng)', 'Unit Price\n(Đơn giá)', 'Amount\n(Số Tiền)'];
    const drawCells = (values, rowHeight, options = {}) => {
      const header = options === true || options.header;
      const emphasize = options === true || options.emphasize;
      ensure(rowHeight + 4);
      let x = left;
      values.forEach((value, index) => {
        doc.rect(x, y, widths[index], rowHeight).lineWidth(0.6).strokeColor('#222222').stroke();
        text(value, x + 3, y + 5, {
          width: widths[index] - 6,
          height: rowHeight - 8,
          align: header || index === 0 || index === 3 || index === 4 ? 'center' : index >= 5 ? 'right' : 'left',
          bold: header || emphasize,
          size: header ? 7.5 : 8.5
        });
        x += widths[index];
      });
      y += rowHeight;
    };
    const drawHeader = () => drawCells(headers, 54, { header: true });
    drawHeader();
    (quotation.items || []).forEach((item, index) => {
      const values = [
        String(index + 1),
        item.description || '',
        item.spec || '',
        item.unit || '',
        Number(item.quantity || 0).toLocaleString('en-US'),
        amount(item.unitPrice),
        amount(item.lineTotal)
      ];
      const heights = values.map((value, cell) => doc.font('Regular').fontSize(8.5).heightOfString(String(value), { width: widths[cell] - 6 }));
      const rowHeight = Math.max(28, Math.max(...heights) + 12);
      if (y + rowHeight > bottom) {
        doc.addPage();
        y = 32;
        drawHeader();
      }
      drawCells(values, rowHeight);
    });
    if (Number(quotation.taxAmount) > 0) {
      drawCells(['', `VAT (${quotation.taxRate || 0}%)`, '', '', '', '', amount(quotation.taxAmount)], 24, { emphasize: true });
    }
    drawCells(['', 'Tổng giá trị đơn hàng.', '', '', '', '', amount(quotation.total)], 26, { emphasize: true });

    if (quotation.notes) {
      y += 10;
      ensure(24);
      text(`Ghi chú: ${quotation.notes}`, left, y, { width, size: 9 });
      y += doc.heightOfString(`Ghi chú: ${quotation.notes}`, { width }) + 8;
    }

    y += 12;
    if (fs.existsSync(stampPath)) {
      const stampWidth = 210;
      if (y + 120 > bottom) {
        doc.addPage();
        y = 32;
      }
      doc.image(stampPath, left + width - stampWidth, y, { fit: [stampWidth, 120] });
    }
    doc.end();
  });
}

module.exports = { generateQuotationPdf, letterhead };
