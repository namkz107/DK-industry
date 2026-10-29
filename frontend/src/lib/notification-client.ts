import { authClient } from "@/lib/auth-client"

export interface NotificationItem {
  _id: string
  type: string
  title: string
  message: string
  link?: string
  readAt?: string
  createdAt: string
}

type Result<T> = { success: boolean; data: T; message?: string }

export interface NotificationListResult {
  items: NotificationItem[]
  unread: number
  total: number
  allTotal: number
  page: number
  pages: number
}

export const notificationClient = {
  list: ({ page, limit, unread }: { page?: number; limit?: number; unread?: boolean } = {}) => {
    const params = new URLSearchParams()
    if (page) params.set("page", String(page))
    if (limit) params.set("limit", String(limit))
    if (unread) params.set("unread", "true")
    const query = params.toString()
    return authClient.authenticated<Result<NotificationListResult>>(`/notifications${query ? `?${query}` : ""}`)
  },
  read: (id: string) => authClient.authenticated<Result<NotificationItem>>(`/notifications/${id}/read`, { method: "PATCH" }),
  readAll: () => authClient.authenticated<{ success: boolean; message: string }>("/notifications/read-all", { method: "PATCH" }),
}
