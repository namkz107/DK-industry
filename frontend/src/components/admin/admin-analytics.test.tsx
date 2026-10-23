import { render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it } from "vitest"
import { AdminAnalyticsPanel } from "@/components/admin/admin-analytics"

beforeAll(() => {
  class Observer { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }
  viStub(Observer)
})

function viStub(Observer: new () => { observe: () => void }) {
  Object.defineProperty(globalThis, "IntersectionObserver", { writable: true, value: Observer })
  Object.defineProperty(globalThis, "ResizeObserver", { writable: true, value: Observer })
}

describe("AdminAnalyticsPanel", () => {
  it("hiện doanh thu, trạng thái đơn và sản phẩm nổi bật", () => {
    render(<AdminAnalyticsPanel
      sales={{ revenue: 12000000, monthlyRevenue: 3000000, deliveredRevenue: 8000000, monthlyDeliveredRevenue: 2000000, deliveredOrders: 4 }}
      analytics={{
        revenueTrend: [{ key: "2026-10", label: "T10/26", revenue: 3000000, orders: 2, projectRevenue: 7000000, projects: 1 }],
        orderStatuses: [{ status: "delivered", count: 4 }, { status: "pending", count: 1 }],
        conversion: { opportunities: 10, quotations: 6, wins: 4 },
        topProducts: [{ name: "Van công nghiệp", quantity: 3, revenue: 5000000 }],
      }}
      recentOrders={[{ _id: "1", code: "DH-001", total: 1500000, status: "delivered", paymentStatus: "paid", customer: { name: "Khách A" }, createdAt: "2026-10-01T00:00:00.000Z" }]}
    />)

    expect(screen.getByRole("heading", { name: "Doanh thu và xu hướng" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Doanh thu theo tháng" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Trạng thái đơn hàng" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Sản phẩm nổi bật" })).toBeInTheDocument()
    expect(screen.getByText("DH-001")).toBeInTheDocument()
    expect(screen.getAllByText("40%").length).toBeGreaterThan(0)
  })
})
