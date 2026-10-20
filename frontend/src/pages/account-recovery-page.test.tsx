import { afterEach, describe, expect, it } from "vitest"
import { clearActionTokenFromUrl, readActionToken } from "@/lib/account-action-token"

afterEach(() => window.history.replaceState({}, "", "/"))

describe("account action token URL handling", () => {
  it("reads a fragment token and removes it from browser history", () => {
    window.history.replaceState({}, "", "/dat-lai-mat-khau#token=fragment-secret")

    expect(readActionToken()).toBe("fragment-secret")
    expect(readActionToken()).toBe("fragment-secret")
    clearActionTokenFromUrl()
    expect(window.location.href).not.toContain("fragment-secret")
    expect(window.location.hash).toBe("")
  })

  it("rejects a legacy query token and removes it from browser history", () => {
    window.history.replaceState({}, "", "/xac-minh-email?token=legacy-secret")

    expect(readActionToken()).toBe("")
    clearActionTokenFromUrl()
    expect(window.location.href).not.toContain("legacy-secret")
    expect(window.location.search).toBe("")
  })

  it("returns an empty value when the link has no token", () => {
    window.history.replaceState({}, "", "/dat-lai-mat-khau")
    expect(readActionToken()).toBe("")
  })
})
