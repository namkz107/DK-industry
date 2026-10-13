import { describe, expect, it } from "vitest"
import { cn, formatPrice } from "@/lib/utils"

describe("frontend utilities", () => {
  it("formats Vietnamese prices and keeps quote-only products explicit", () => {
    expect(formatPrice(1250000)).toBe("1.250.000đ")
    expect(formatPrice(0)).toBe("Liên hệ báo giá")
    expect(formatPrice()).toBe("Liên hệ báo giá")
  })

  it("merges Tailwind classes without retaining conflicting values", () => {
    expect(cn("px-2 text-sm", null, "px-4")).toBe("text-sm px-4")
  })
})
