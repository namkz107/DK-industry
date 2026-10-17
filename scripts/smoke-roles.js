const path = require('path');

let chromium;
try {
  ({ chromium } = require(path.resolve(__dirname, '../frontend/node_modules/playwright')));
} catch {
  console.error('Không tìm thấy Playwright. Hãy chạy npm install --prefix frontend trước.');
  process.exit(2);
}

const args = process.argv.slice(2);
const allowHttp = args.includes('--allow-http');
const headed = args.includes('--headed');
const baseArg = args.find(value => !value.startsWith('--')) || process.env.ROLE_SMOKE_BASE_URL;
if (!baseArg) {
  console.error('Usage: npm run smoke:roles -- https://staging.example.vn');
  process.exit(2);
}

const baseUrl = baseArg.replace(/\/$/, '');
if (!allowHttp && !baseUrl.startsWith('https://')) {
  console.error('Role smoke test yêu cầu HTTPS. Chỉ dùng --allow-http với môi trường local.');
  process.exit(2);
}

const roles = [
  {
    name: 'Customer', prefix: 'UAT_CUSTOMER', home: '/tai-khoan', denied: [['/staff', '/tai-khoan'], ['/admin', '/tai-khoan']],
    routes: [
      ['/tai-khoan/ho-so', 'Hồ sơ & địa chỉ'],
      ['/tai-khoan/yeu-cau', 'Yêu cầu gia công & báo giá'],
      ['/tai-khoan/du-an', 'Dự án của tôi'],
      ['/tai-khoan/don-hang', 'Đơn sản phẩm'],
    ],
  },
  {
    name: 'Staff', prefix: 'UAT_STAFF', home: '/staff', denied: [['/admin', '/staff'], ['/tai-khoan/ho-so', '/tai-khoan']],
    routes: [
      ['/staff', 'Tổng quan công việc'],
      ['/staff/requests', 'Yêu cầu gia công'],
      ['/staff/work-orders', 'Dự án'],
      ['/staff/orders', 'Đơn sản phẩm'],
      ['/staff/support', 'Hỗ trợ khách hàng'],
    ],
  },
  {
    name: 'Admin', prefix: 'UAT_ADMIN', home: '/admin', denied: [['/staff', '/admin'], ['/tai-khoan/ho-so', '/tai-khoan']],
    routes: [
      ['/admin', 'Tổng quan quản trị'],
      ['/admin/nhan-su', 'Quản lý tài khoản'],
      ['/admin/noi-dung', 'Sản phẩm và nội dung'],
      ['/admin/gioi-thieu', 'Ảnh phần Giới thiệu'],
      ['/admin/nhat-ky', 'Nhật ký quản trị'],
      ['/admin/quyen-rieng-tu', 'Quyền riêng tư'],
    ],
  },
];

const missing = roles.flatMap(role => ['EMAIL', 'PASSWORD'].filter(key => !process.env[`${role.prefix}_${key}`]).map(key => `${role.prefix}_${key}`));
if (missing.length) {
  console.error(`Thiếu biến môi trường: ${missing.join(', ')}`);
  process.exit(2);
}

function absolute(route) { return `${baseUrl}${route}`; }

async function expectPath(page, expected, label) {
  await page.waitForURL(url => url.pathname === expected, { timeout: 15_000 });
  if (new URL(page.url()).pathname !== expected) throw new Error(`${label}: sai route ${new URL(page.url()).pathname}`);
}

async function assertHealthyPage(page, route, heading) {
  const response = await page.goto(absolute(route), { waitUntil: 'domcontentloaded' });
  if (!response || response.status() >= 400) throw new Error(`${route}: HTTP ${response?.status() || 'unknown'}`);
  await expectPath(page, route, route);
  await page.getByRole('heading', { level: 1, name: heading, exact: true }).waitFor({ state: 'visible' });
  await page.waitForTimeout(400);
  const alert = page.locator('[role="alert"]:visible').first();
  if (await alert.count()) throw new Error(`${route}: ${await alert.innerText()}`);
  console.log(`PASS ${route} — ${heading}`);
}

async function login(page, role) {
  await page.goto(absolute('/dang-nhap'), { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email hoặc số điện thoại', { exact: true }).fill(process.env[`${role.prefix}_EMAIL`]);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(process.env[`${role.prefix}_PASSWORD`]);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();

  const mfa = page.getByLabel('Mã xác thực', { exact: true });
  if (await mfa.isVisible({ timeout: 2_000 }).catch(() => false)) {
    const code = process.env[`${role.prefix}_MFA_CODE`];
    if (!code) throw new Error(`${role.name}: cần ${role.prefix}_MFA_CODE đang còn hiệu lực`);
    await mfa.fill(code);
    await page.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  }

  await expectPath(page, role.home, `${role.name} login`);
  console.log(`PASS ${role.name} login`);
}

async function testRole(browser, role) {
  const context = await browser.newContext({ locale: 'vi-VN' });
  const page = await context.newPage();
  try {
    await login(page, role);
    for (const [route, heading] of role.routes) await assertHealthyPage(page, route, heading);
    if (role.name === 'Admin') await page.getByRole('navigation', { name: 'Khu vực quản trị' }).getByRole('link', { name: 'Quyền riêng tư' }).waitFor();
    for (const [route, expected] of role.denied) {
      await page.goto(absolute(route), { waitUntil: 'domcontentloaded' });
      await expectPath(page, expected, `${role.name} RBAC ${route}`);
      console.log(`PASS ${role.name} RBAC ${route} -> ${expected}`);
    }
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch({ headless: !headed });
  try {
    for (const role of roles) await testRole(browser, role);
  } finally {
    await browser.close();
  }
  console.log(`Role smoke test hoàn tất: ${baseUrl}`);
}

main().catch(error => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
