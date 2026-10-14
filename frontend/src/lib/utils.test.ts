import { afterEach, describe, expect, it, vi } from "vitest"
import { cn, formatPrice, scrollToPageTop } from "@/lib/utils"

afterEach(() => vi.restoreAllMocks())

describe("frontend utilities", () => {
  it("formats Vietnamese prices and keeps quote-only products explicit", () => {
    expect(formatPrice(1250000)).toBe("1.250.000đ")
    expect(formatPrice(0)).toBe("Liên hệ báo giá")
    expect(formatPrice()).toBe("Liên hệ báo giá")
  })

  it("merges Tailwind classes without retaining conflicting values", () => {
    expect(cn("px-2 text-sm", null, "px-4")).toBe("text-sm px-4")
  })

  it("scrolls smoothly to the beginning of the page", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined)
    scrollToPageTop()
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "smooth" })
  })
})
