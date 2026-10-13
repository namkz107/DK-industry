import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, count: 0, data: null }),
  }))
})

test("public navigation and metadata work", async ({ page }, testInfo) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/Trang chủ \| Cơ khí Đăng Khoa/)
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Giải.*pháp.*cơ.*khí/)

  if (testInfo.project.name.includes("mobile")) {
    await page.getByRole("button", { name: "Mở menu" }).click()
    await page.getByRole("navigation", { name: "Điều hướng di động" }).getByRole("link", { name: "Dịch vụ" }).click()
  } else {
    await page.getByRole("navigation", { name: "Điều hướng chính" }).getByRole("link", { name: "Dịch vụ" }).click()
  }

  await expect(page).toHaveURL(/\/dich-vu$/)
  await expect(page).toHaveTitle(/Dịch vụ/)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Cắt laser.*CNC/i)
})

test("protected customer route redirects anonymous visitors to login", async ({ page }) => {
  await page.goto("/tai-khoan/ho-so")
  await expect(page).toHaveURL(/\/dang-nhap$/)
  await expect(page.getByRole("heading", { level: 1, name: "Chào mừng bạn trở lại" })).toBeVisible()
})

test("policy and not-found routes render safely", async ({ page }) => {
  await page.goto("/chinh-sach/bao-mat")
  await expect(page.getByRole("heading", { name: "Chính sách bảo mật và dữ liệu cá nhân" })).toBeVisible()
  await page.goto("/route-khong-ton-tai")
  await expect(page.getByRole("heading", { name: /không tìm thấy/i })).toBeVisible()
})
