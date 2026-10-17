import type { Paged } from "@/types/staff"

export type AdminEntity = "user" | "product" | "service" | "project" | "site_setting" | "lead" | "request" | "quotation" | "work_order" | "order" | "payment" | "inventory" | "privacy_request"
export interface AboutSiteSetting { leaderImage: string | null }
export interface AdminUser { _id: string; name: string; email: string; phone: string; role: "customer" | "staff" | "admin"; status: "active" | "blocked"; emailVerified: boolean; mfaEnabled: boolean; lastLoginAt?: string; createdAt: string }
export interface AuditLog { _id: string; action: string; entity: AdminEntity; entityId: string; summary: string; metadata?: Record<string, unknown>; actor?: { _id: string; name: string; email: string }; createdAt: string }
export interface AdminOrderSummary { _id: string; code: string; total: number; status: string; paymentStatus: string; customer?: { name: string }; createdAt: string }
export interface AdminAnalytics {
  revenueTrend: Array<{ key: string; label: string; revenue: number; orders: number }>
  orderStatuses: Array<{ status: string; count: number }>
  conversion: { opportunities: number; quotations: number; wins: number }
  topProducts: Array<{ productId?: string; name: string; quantity: number; revenue: number }>
}
export type AdminWorkOrderStatus = "awaiting_contract" | "awaiting_deposit" | "scheduled" | "in_progress" | "quality_check" | "ready_for_delivery" | "completed" | "cancelled"
export interface AdminWorkOrder {
  _id: string; code: string; status: AdminWorkOrderStatus; agreedTotal: number; depositRequired: number; depositPaid: number
  contractReference?: string; purchaseOrderReference?: string; plannedStartAt?: string; plannedDeliveryAt?: string; createdAt: string; updatedAt: string
  customer: { _id: string; name: string; email: string; phone?: string; company?: string } | null
  assignedTo?: { _id: string; name: string; email: string } | null
  request: { _id: string; code: string; title: string; description: string; requestType: string; material?: string; quantity?: number; dimensions?: string; desiredDate?: string; budget?: string } | null
  quotation: { _id: string; code: string; version: number; status: string; subtotal: number; taxRate: number; taxAmount: number; total: number; validUntil: string; leadTime?: string; paymentTerms?: string; notes?: string; createdAt: string; items: Array<{ _id: string; description: string; quantity: number; unit: string; unitPrice: number; lineTotal: number }> } | null
  milestones: Array<{ _id: string; name: string; dueAt?: string; completedAt?: string; note?: string }>
  timeline: Array<{ _id: string; status: string; message?: string; at: string }>
}
export interface AdminDashboard { customers: number; staff: number; blockedUsers: number; products: number; lowStock: number; services: number; projects: number; activeProjects: number; openRequests: number; openOrders: number; pendingOrders: number; revenue: number; monthlyRevenue: number; deliveredRevenue: number; monthlyDeliveredRevenue: number; deliveredOrders: number; recentOrders: AdminOrderSummary[]; recentActivity: AuditLog[]; analytics: AdminAnalytics }
export interface AdminProduct { _id: string; name: string; slug: string; sku?: string; category: string; description?: string; specifications?: Record<string, string>; price: number | null; unit: string; stock: number; priceOnRequest: boolean; image?: string; images?: string[]; featured: boolean; active: boolean; deletedAt?: string | null; updatedAt: string }
export interface AdminService { _id: string; name: string; slug: string; summary: string; description?: string; capabilities: string[]; materials: string[]; applications: string[]; image?: string; order: number; featured: boolean; published: boolean; deletedAt?: string | null; updatedAt: string }
export interface ProjectStage { phase: "before" | "during" | "after"; title: string; description?: string; images: Array<{ url: string; caption?: string }> }
export interface AdminProject { _id: string; title: string; slug: string; category: string; client?: string; location?: string; year?: string; description?: string; objective?: string; projectScale?: string; durationDays?: number | null; teamSize?: number | null; scope?: string[]; requirements?: string[]; workItems?: string[]; technicalHighlights?: string[]; challenge?: string; solution?: string; results?: string; customerFeedback?: string; stages?: ProjectStage[]; image?: string; gallery?: string[]; featured: boolean; published: boolean; deletedAt?: string | null; updatedAt: string }
export interface AdminPrivacyRequest {
  _id: string; type: "deletion"; status: "submitted" | "reviewing" | "approved" | "rejected" | "completed" | "cancelled"
  reason: string; resolution?: string; customer?: { _id: string; name: string; email: string; phone?: string; status?: string }
  handledBy?: { _id: string; name: string; email: string }; handledAt?: string; createdAt: string; updatedAt: string
}
export type AdminPaged<T> = Paged<T> & { counts?: { published: number; hidden: number; deleted: number } }
