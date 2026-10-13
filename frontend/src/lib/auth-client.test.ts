import { beforeEach, describe, expect, it, vi } from "vitest"

const user = { id: "u1", name: "Khách hàng", email: "customer@example.com", phone: "0900000000", role: "customer" as const, company: "", status: "active" as const }
const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

describe("authClient", () => {
  beforeEach(() => {
    vi.resetModules()
    sessionStorage.clear()
  })

  it("keeps access credentials in memory and CSRF state in session storage", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { user, accessToken: "access-1", csrfToken: "csrf-1" } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { user } }))
    const { authClient } = await import("@/lib/auth-client")

    await authClient.login({ identifier: user.email, password: "Password1" })
    await authClient.me()

    expect(authClient.accessToken()).toBe("access-1")
    expect(sessionStorage.getItem("dk_auth_runtime")).toBe("active")
    expect(sessionStorage.getItem("dk_auth_csrf")).toBe("csrf-1")
    const authenticatedOptions = fetchMock.mock.calls[1][1] as RequestInit
    expect(new Headers(authenticatedOptions.headers).get("Authorization")).toBe("Bearer access-1")
  })

  it("refreshes once after a 401 and retries with the rotated access token", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { user, accessToken: "access-old", csrfToken: "csrf-old" } }))
      .mockResolvedValueOnce(jsonResponse({ message: "expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { user, accessToken: "access-new", csrfToken: "csrf-new" } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, data: { user } }))
    const { authClient } = await import("@/lib/auth-client")

    await authClient.login({ identifier: user.email, password: "Password1" })
    const result = await authClient.me()

    expect(result.data.user.id).toBe("u1")
    expect(authClient.accessToken()).toBe("access-new")
    expect(fetchMock.mock.calls[2][0]).toContain("/auth/refresh")
    expect(new Headers((fetchMock.mock.calls[2][1] as RequestInit).headers).get("X-CSRF-Token")).toBe("csrf-old")
    expect(new Headers((fetchMock.mock.calls[3][1] as RequestInit).headers).get("Authorization")).toBe("Bearer access-new")
  })

  it("surfaces MFA challenges without accepting a partial session", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(jsonResponse({ success: true, data: { mfaRequired: true, challengeToken: "challenge" } }))
    const { authClient, MfaRequiredError } = await import("@/lib/auth-client")

    await expect(authClient.login({ identifier: "admin@example.com", password: "Password1" })).rejects.toBeInstanceOf(MfaRequiredError)
    expect(authClient.accessToken()).toBe("")
    expect(sessionStorage.getItem("dk_auth_runtime")).toBeNull()
  })
})
