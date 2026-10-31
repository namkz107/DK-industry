const test = require('node:test');
const assert = require('node:assert/strict');
const { documentPresentation, generateQuotationPdf } = require('../src/services/quotationDocumentService');

test('sent quotation belongs to the responsible staff member and has no director stamp', () => {
  assert.deepEqual(documentPresentation({ status: 'sent', senderName: 'Nguyễn Văn A' }), {
    confirmed: false,
    title: 'BÁO GIÁ',
    signerName: 'Nguyễn Văn A',
    signerRole: 'NGƯỜI PHỤ TRÁCH BÁO GIÁ'
  });
});

test('accepted quotation becomes a director-confirmed document', () => {
  const previous = process.env.COMPANY_LEGAL_REPRESENTATIVE;
  process.env.COMPANY_LEGAL_REPRESENTATIVE = 'Nguyễn Văn Giám Đốc';
  try {
    assert.deepEqual(documentPresentation({ status: 'accepted', senderName: 'Nguyễn Văn A' }), {
      confirmed: true,
      title: 'BÁO GIÁ ĐÃ XÁC NHẬN',
      signerName: 'Nguyễn Văn Giám Đốc',
      signerRole: 'GIÁM ĐỐC'
    });
  } finally {
    if (previous === undefined) delete process.env.COMPANY_LEGAL_REPRESENTATIVE;
    else process.env.COMPANY_LEGAL_REPRESENTATIVE = previous;
  }
});

test('quotation PDF is generated with a valid PDF header and meaningful content', async () => {
  const buffer = await generateQuotationPdf({
    quotation: {
      code: 'BG-261015-ABC123', version: 1,
      items: [
        { description: 'Gia công chi tiết CNC theo bản vẽ', quantity: 2, unit: 'cái', unitPrice: 500000, lineTotal: 1000000 },
        { description: 'Xử lý bề mặt', quantity: 1, unit: 'lô', unitPrice: 200000, lineTotal: 200000 }
      ],
      subtotal: 1200000, taxRate: 10, taxAmount: 120000, total: 1320000,
      validUntil: new Date('2026-10-31T00:00:00.000Z'), createdAt: new Date('2026-10-15T00:00:00.000Z'),
      leadTime: '10 ngày làm việc', paymentTerms: 'Đặt cọc 50%', notes: 'Giao hàng tại xưởng.'
    },
    request: { code: 'YC-261015-TEST', title: 'Cung ứng thiết bị' },
    customer: { name: 'Nguyễn Văn Nam', email: 'nam@example.com', company: 'Công ty Nam' }
  });
  assert.equal(buffer.subarray(0, 5).toString(), '%PDF-');
  assert.ok(buffer.length > 10000);
});

test('actual PDF embeds director JPEG only after customer acceptance', async () => {
  const quotation = {
    code: 'BG-TEST-STAMP', senderName: 'Nguyễn Văn A',
    items: [{ description: 'Gia công', quantity: 1, unit: 'cái', unitPrice: 100000, lineTotal: 100000 }],
    total: 100000, validUntil: new Date('2027-01-01'), sentAt: new Date('2026-10-31')
  };
  for (const status of ['draft', 'sent', 'rejected', 'superseded', 'expired', 'accepted']) {
    const pdf = await generateQuotationPdf({ quotation: { ...quotation, status }, request: {}, customer: {} });
    // The director seal is the only JPEG; the shared company logo is PNG.
    const jpegCount = (pdf.toString('latin1').match(/\/DCTDecode/g) || []).length;
    assert.equal(jpegCount, status === 'accepted' ? 1 : 0, `unexpected director stamp in ${status} PDF`);
  }
});
