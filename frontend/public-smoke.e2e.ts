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
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /đường ống.*hook-up cơ điện/i)
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

test("Vietnamese typography stays readable across public routes and viewports", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("desktop"), "Viewport matrix only needs one Chromium project")
  test.setTimeout(120_000)

  const representativeRoutes = ["/", "/gioi-thieu", "/dich-vu", "/du-an", "/san-pham", "/lien-he"]
  const widths = [320, 375, 390, 768, 1024, 1280, 1440]

  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
    for (const route of representativeRoutes) {
      await page.goto(route)
      await page.locator("h1").first().waitFor({ state: "visible" })
      await page.evaluate(() => document.fonts.ready)
      const typography = await page.evaluate(() => ({
        fontFamily: getComputedStyle(document.body).fontFamily,
        fontLoaded: document.fonts.check('16px "Be Vietnam Pro"'),
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        headingTransform: getComputedStyle(document.querySelector("h1") as HTMLElement).textTransform,
      }))
      expect(typography.fontFamily).toContain("Be Vietnam Pro")
      expect(typography.fontLoaded).toBe(true)
      expect(typography.hasHorizontalOverflow, `${route} overflows horizontally at ${width}px`).toBe(false)
      expect(typography.headingTransform, `${route} H1 is not uppercase`).toBe("uppercase")
    }

    if ([320, 390, 1280, 1440].includes(width)) {
      const route = width === 390 || width === 1280 ? "/lien-he" : "/"
      await page.goto(route)
      await page.locator("h1").first().waitFor({ state: "visible" })
      await page.screenshot({ path: testInfo.outputPath(`typography-${width}.png`), fullPage: true })
    }
  }

  const supportingRoutes = [
    "/chinh-sach/bao-mat",
    "/dang-nhap",
    "/dang-ky",
    "/quen-mat-khau",
    "/dat-lai-mat-khau",
    "/xac-minh-email",
    "/san-pham/khong-ton-tai",
    "/route-khong-ton-tai",
  ]
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
    for (const route of supportingRoutes) {
      await page.goto(route)
      await page.locator("h1").first().waitFor({ state: "visible" })
      const state = await page.evaluate(() => ({
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        headingTransform: getComputedStyle(document.querySelector("h1") as HTMLElement).textTransform,
      }))
      expect(state.hasHorizontalOverflow, `${route} overflows horizontally at ${width}px`).toBe(false)
      expect(state.headingTransform, `${route} H1 is not uppercase`).toBe("uppercase")
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/lien-he")
  await page.evaluate(() => { document.documentElement.style.zoom = "2" })
  const overflowAtTwoHundredPercent = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  expect(overflowAtTwoHundredPercent, "Contact page overflows horizontally at simulated 200% zoom").toBe(false)
})
