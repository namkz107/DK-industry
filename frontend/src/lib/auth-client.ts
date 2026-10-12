import type { AuthPayload, AuthSession, AuthUser } from "@/types/auth"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
let accessToken = ""
let refreshRequest: Promise<AuthUser> | null = null
const RUNTIME_SESSION_KEY = "dk_auth_runtime"
const RUNTIME_CSRF_KEY = "dk_auth_csrf"
let csrfToken = ""

function hasRuntimeSession() {
  try { return sessionStorage.getItem(RUNTIME_SESSION_KEY) === "active" } catch { return false }
}

function markRuntimeSession(active: boolean) {
  try {
    if (active) sessionStorage.setItem(RUNTIME_SESSION_KEY, "active")
    else { sessionStorage.removeItem(RUNTIME_SESSION_KEY); sessionStorage.removeItem(RUNTIME_CSRF_KEY) }
  } catch { /* Storage may be unavailable. */ }
}

function storeCsrfToken(value: string) {
  csrfToken = value
  try { sessionStorage.setItem(RUNTIME_CSRF_KEY, value) } catch { /* Storage may be unavailable. */ }
}

function restoreCsrfToken() {
  try { csrfToken = sessionStorage.getItem(RUNTIME_CSRF_KEY) || "" } catch { csrfToken = "" }
}

function acceptSession(payload: AuthPayload) {
  accessToken = payload.accessToken
  storeCsrfToken(payload.csrfToken)
  markRuntimeSession(true)
  return payload.user
}

function expireLocalSession() {
  accessToken = ""
  markRuntimeSession(false)
  window.dispatchEvent(new Event("dk:auth-expired"))
}

type ApiResponse<T> = { success: boolean; data: T; message?: string }

export class MfaRequiredError extends Error {
  challengeToken: string
  constructor(challengeToken: string) {
    super("Cần nhập mã xác thực hai bước")
    this.name = "MfaRequiredError"
    this.challengeToken = challengeToken
  }
}

async function parse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || "Không thể kết nối hệ thống")
  return body
}

async function publicPost<T>(path: string, payload?: unknown, headers: HeadersInit = {}) {
  const response = await fetch(`${API_URL}${path}`, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", ...headers }, body: payload ? JSON.stringify(payload) : undefined })
  return parse<T>(response)
}

async function authenticatedFetch(path: string, options: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  headers.set("Authorization", `Bearer ${accessToken}`)
  const response = await fetch(`${API_URL}${path}`, { ...options, credentials: "include", headers })
  if (response.status === 401 && retry) {
    try { await refreshSession(); return authenticatedFetch(path, options, false) } catch { expireLocalSession() }
  }
  return response
}

function refreshSession() {
  if (!refreshRequest) {
    restoreCsrfToken()
    refreshRequest = publicPost<ApiResponse<AuthPayload>>("/auth/refresh", undefined, csrfToken ? { "X-CSRF-Token": csrfToken } : {})
      .then(result => acceptSession(result.data))
      .finally(() => { refreshRequest = null })
  }
  return refreshRequest
}

export const authClient = {
  accessToken: () => accessToken,
  async register(payload: { name: string; email: string; phone: string; password: string }) {
    const result = await publicPost<ApiResponse<AuthPayload>>("/auth/register", payload)
    return acceptSession(result.data)
  },
  async login(payload: { identifier: string; password: string }) {
    const result = await publicPost<ApiResponse<AuthPayload | { mfaRequired: true; challengeToken: string }>>("/auth/login", payload)
    if ("mfaRequired" in result.data) throw new MfaRequiredError(result.data.challengeToken)
    return acceptSession(result.data)
  },
  async completeMfa(challengeToken: string, code: string) {
    const result = await publicPost<ApiResponse<AuthPayload & { recoveryCodesRemaining?: number }>>("/auth/mfa/complete", { challengeToken, code })
    return acceptSession(result.data)
  },
  async refresh() {
    return refreshSession()
  },
  async restore() {
    if (!hasRuntimeSession()) {
      accessToken = ""
      csrfToken = ""
      return null
    }
    try { return await refreshSession() } catch { expireLocalSession(); return null }
  },
  async logout() {
    try { restoreCsrfToken(); await publicPost("/auth/logout", undefined, csrfToken ? { "X-CSRF-Token": csrfToken } : {}) } finally { accessToken = ""; csrfToken = ""; markRuntimeSession(false) }
  },
  async authenticated<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
    const response = await authenticatedFetch(path, options, retry)
    return parse<T>(response)
  },
  async download(path: string) {
    const response = await authenticatedFetch(path)
    if (!response.ok) await parse(response)
    return response.blob()
  },
  me() { return this.authenticated<ApiResponse<{ user: AuthUser }>>("/auth/me") },
  changePassword(payload: { currentPassword: string; newPassword: string }) {
    return this.authenticated<{ success: boolean; message: string }>("/auth/change-password", { method: "POST", body: JSON.stringify(payload) })
  },
  forgotPassword(email: string) { return publicPost<{ success: boolean; message: string }>("/auth/forgot-password", { email }) },
  resetPassword(token: string, password: string) { return publicPost<{ success: boolean; message: string }>("/auth/reset-password", { token, password }) },
  verifyEmail(token: string) { return publicPost<{ success: boolean; message: string }>("/auth/verify-email", { token }) },
  resendVerification() { return this.authenticated<{ success: boolean; message: string }>("/auth/resend-verification", { method: "POST" }) },
  sessions() { return this.authenticated<ApiResponse<AuthSession[]>>("/auth/sessions") },
  async revokeSession(sessionId: string) {
    const result = await this.authenticated<{ success: boolean; message: string; data: { current: boolean } }>(`/auth/sessions/${sessionId}`, { method: "DELETE" })
    if (result.data.current) expireLocalSession()
    return result
  },
  async logoutAll() {
    try { return await this.authenticated<{ success: boolean; message: string }>("/auth/logout-all", { method: "POST" }) }
    finally { expireLocalSession() }
  },
  setupMfa(password: string) { return this.authenticated<ApiResponse<{ manualKey: string; otpAuthUrl: string; expiresAt: string }>>("/auth/mfa/setup", { method: "POST", body: JSON.stringify({ password }) }) },
  confirmMfa(code: string) { return this.authenticated<ApiResponse<{ recoveryCodes: string[] }>>("/auth/mfa/confirm", { method: "POST", body: JSON.stringify({ code }) }) },
  disableMfa(password: string, code: string) { return this.authenticated<{ success: boolean; message: string }>("/auth/mfa/disable", { method: "POST", body: JSON.stringify({ password, code }) }) },
}
