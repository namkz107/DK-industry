export type UserRole = "customer" | "staff" | "admin"

export interface AuthUser {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  company: string
  status: "active" | "blocked"
  emailVerified?: boolean
  mfaEnabled?: boolean
}

export interface AuthPayload {
  user: AuthUser
  accessToken: string
  csrfToken: string
}

export interface AuthSession {
  id: string
  userAgent: string
  ip: string
  createdAt: string
  lastUsedAt: string
  expiresAt: string
  current: boolean
}
