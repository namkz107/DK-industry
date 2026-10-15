const test = require('node:test');
const assert = require('node:assert/strict');
const { transitionLead, transitionOrder, transitionPayment, transitionServiceRequest } = require('../src/services/workflowService');

test('Lead chỉ đi theo các bước nghiệp vụ hợp lệ', () => {
  const lead = { status: 'new', timeline: [] };
  transitionLead(lead, 'qualified', { message: 'Đủ thông tin sơ bộ' });
  transitionLead(lead, 'qualified');
  assert.equal(lead.timeline.length, 1);
  transitionLead(lead, 'needs_analysis');
  transitionLead(lead, 'quoted');
  transitionLead(lead, 'won');
  assert.equal(lead.status, 'won');
  assert.throws(() => transitionLead(lead, 'new'), error => error.code === 'INVALID_STATUS_TRANSITION');
});

test('Lead có thể ghi nhận kết quả trực tiếp mà không ép qua trạng thái nội bộ', () => {
  const lead = { status: 'new', timeline: [] };
  transitionLead(lead, 'won', { message: 'Đã tạo hồ sơ tư vấn.' });
  assert.equal(lead.status, 'won');
  assert.equal(lead.timeline.length, 1);
});

test('Service Request không thể bỏ qua bước phân tích để chấp thuận', () => {
  const request = { status: 'submitted', timeline: [] };
  assert.throws(() => transitionServiceRequest(request, 'accepted'), error => error.code === 'INVALID_STATUS_TRANSITION');
  transitionServiceRequest(request, 'reviewing');
  transitionServiceRequest(request, 'reviewing');
  assert.equal(request.timeline.length, 1);
  transitionServiceRequest(request, 'quoted');
  transitionServiceRequest(request, 'accepted');
  assert.equal(request.status, 'accepted');
  assert.ok(request.closedAt instanceof Date);
});

test('Service Request tự đi thẳng đến báo giá nhưng vẫn không thể tự chấp thuận', () => {
  const request = { status: 'submitted', timeline: [] };
  transitionServiceRequest(request, 'quoted', { message: 'Đã gửi báo giá.' });
  assert.equal(request.status, 'quoted');
  assert.throws(() => transitionServiceRequest({ status: 'submitted', timeline: [] }, 'accepted'), error => error.code === 'INVALID_STATUS_TRANSITION');
});

test('Order phải xác nhận trước khi chuẩn bị và giao hàng', () => {
  const order = { status: 'pending', paymentStatus: 'unpaid', timeline: [], paymentTimeline: [] };
  assert.throws(() => transitionOrder(order, 'shipping'), /Không thể chuyển Order/);
  transitionOrder(order, 'confirmed');
  transitionOrder(order, 'confirmed');
  assert.equal(order.timeline.length, 1);
  transitionOrder(order, 'preparing');
  transitionOrder(order, 'shipping');
  transitionOrder(order, 'delivered');
  transitionPayment(order, 'paid', { message: 'Đã thu tiền COD.' });
  transitionPayment(order, 'paid');
  assert.equal(order.paymentTimeline.length, 1);
  assert.equal(order.status, 'delivered');
  assert.equal(order.paymentStatus, 'paid');
  assert.ok(order.deliveredAt instanceof Date);
  assert.throws(() => transitionPayment(order, 'unpaid'), error => error.code === 'INVALID_STATUS_TRANSITION');
});

test('Order không bỏ qua bước chuẩn bị hàng trước khi xuất giao', () => {
  const order = { status: 'confirmed', timeline: [] };
  assert.throws(() => transitionOrder(order, 'shipping'), error => error.code === 'INVALID_STATUS_TRANSITION');
  transitionOrder(order, 'preparing', { message: 'Đang chuẩn bị hàng.' });
  transitionOrder(order, 'shipping', { message: 'Đã bàn giao vận chuyển.' });
  assert.equal(order.timeline.length, 2);
});
