import { describe, expect, it } from "vitest"
import { publicAssetUrl } from "@/lib/assets"

describe("publicAssetUrl", () => {
  it("keeps bundled and remote images unchanged", () => {
    expect(publicAssetUrl("/images/equipment/machine.jpg")).toBe("/images/equipment/machine.jpg")
    expect(publicAssetUrl("https://res.cloudinary.com/demo/machine.jpg")).toBe("https://res.cloudinary.com/demo/machine.jpg")
  })

  it("serves uploaded images from the configured API origin", () => {
    expect(publicAssetUrl("/uploads/content/machine.jpg")).toMatch(/\/uploads\/content\/machine\.jpg$/)
  })
})
