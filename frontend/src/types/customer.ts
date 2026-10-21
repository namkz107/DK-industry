import type { Product } from "@/types"

export interface Address {
  _id: string
  label: string
  recipientName: string
  phone: string
  addressLine: string
  ward?: string
  district: string
  province: string
  formattedAddress?: string
  placeId?: string
  latitude?: number
  longitude?: number
  accuracyMeters?: number
  locationConfirmed?: boolean
  isDefault: boolean
}

export interface LocationDetails {
  placeId?: string; formattedAddress?: string; latitude: number; longitude: number
  addressLine?: string; ward?: string; district?: string; province?: string; accuracyMeters?: number
}
export interface PlaceSuggestion {
  placeId: string; text: string; mainText: string; secondaryText: string
  formattedAddress: string; latitude: number; longitude: number
  addressLine?: string; ward?: string; district?: string; province?: string
}

export interface CustomerProfile {
  name: string
  email: string
  phone: string
  company: string
  taxCode: string
  addresses: Address[]
}

export interface CartItem { product: Product; quantity: number; lineTotal: number }
export interface Cart { id?: string; items: CartItem[]; itemCount: number; subtotal: number }

export interface OrderItem { product: string; name: string; sku?: string; image?: string; unit?: string; price: number; quantity: number; lineTotal: number }
export interface TimelineItem { status: string; message?: string; at: string }
export type PaymentStatus = "unpaid" | "pending" | "paid" | "refund_pending" | "refunded"
export interface CustomerOrder {
  _id: string; code: string; items: OrderItem[]; subtotal: number; shippingFee: number; total: number
  paymentMethod: "cod" | "bank_transfer"; paymentStatus: PaymentStatus; status: string; customerNote?: string
  termsAcceptedAt: string; termsVersion: string
  shippingAddress: Omit<Address, "_id" | "label" | "isDefault">; timeline: TimelineItem[]; createdAt: string
  paymentTimeline?: Array<{ status: PaymentStatus; message?: string; at: string }>
  shippingProvider?: string; trackingCode?: string; estimatedDeliveryAt?: string; cancellationReason?: string
  deliveredAt?: string; customerConfirmedAt?: string; deliveryRecipientName?: string; deliveryConfirmationSource?: "staff" | "customer"
  afterSalesRequests?: Array<{ _id: string; type: "return" | "warranty" | "complaint"; reason: string; status: "submitted" | "reviewing" | "approved" | "rejected" | "received" | "resolved"; resolution?: string; submittedAt: string; resolvedAt?: string }>
}

export interface RequestAttachment { _id: string; originalName: string; mimeType?: string; size?: number }
export interface RequestMessage { _id: string; clientMessageId?: string; senderRole: "customer" | "staff" | "admin" | "system"; visibility: "customer"; content: string; attachments: RequestAttachment[]; readByCustomerAt?: string; readByStaffAt?: string; createdAt: string; deliveryStatus?: "sending" | "failed" }
export interface QuotationItem { _id: string; description: string; spec?: string; quantity: number; unit: string; unitPrice: number; lineTotal: number }
export interface Quotation {
  _id: string; code: string; version: number; items: QuotationItem[]; subtotal: number; taxRate: number; taxAmount: number; total: number
  currency: "VND"; workTitle?: string; leadTime?: string; paymentTerms?: string; incoterm?: string; notes?: string; validUntil: string
  status: "sent" | "accepted" | "rejected" | "superseded" | "expired"; sentAt?: string; respondedAt?: string; responseNote?: string
}
export interface QuotationResponse extends Quotation {
  nextAction: "track_project" | "wait_for_revised_quotation"
  workOrder?: Pick<WorkOrder, "_id" | "code" | "status"> | null
}
export interface WorkOrder {
  _id: string; code: string; status: "awaiting_contract" | "awaiting_deposit" | "scheduled" | "in_progress" | "quality_check" | "ready_for_delivery" | "completed" | "cancelled"
  agreedTotal: number; depositRequired: number; depositPaid: number; contractReference?: string; purchaseOrderReference?: string
  plannedStartAt?: string; plannedDeliveryAt?: string; customerConfirmedAt?: string; timeline: TimelineItem[]; createdAt: string
  repair?: { status?: "requested" | "accepted" | "rejected" | "requote"; reason?: string; resolution?: string; at?: string }
  request?: { _id: string; code: string; title: string; description?: string } | null
  quotation?: { _id: string; code: string; total: number; leadTime?: string; paymentTerms?: string; notes?: string } | null
}
export interface CustomerRequest {
  _id: string; code: string; requestType: "machining" | "product_quote" | "consulting"; title: string; description: string
  material?: string; quantity?: number; dimensions?: string; desiredDate?: string; budget?: string
  productSnapshot?: { name?: string; sku?: string; unit?: string }; attachments: RequestAttachment[]
  status: string; timeline: TimelineItem[]; createdAt: string; unreadCount?: number; latestQuotation?: Quotation | null
}
export interface MessagePage { hasMore: boolean; nextCursor: string | null }
export interface RequestDetail { request: CustomerRequest; messages: RequestMessage[]; messagePage?: MessagePage; quotations: Quotation[]; workOrder?: WorkOrder | null }

export interface CustomerSummary { orders: number; openOrders: number; requests: number; openRequests: number; activeProjects: number; completedProjects: number; cartItems: number }
export type PrivacyRequestStatus = "submitted" | "reviewing" | "approved" | "rejected" | "completed" | "cancelled"
export interface PrivacyRequest {
  _id: string; type: "deletion"; status: PrivacyRequestStatus; reason: string; resolution?: string
  handledAt?: string; completedAt?: string; cancelledAt?: string; createdAt: string; updatedAt: string
}
