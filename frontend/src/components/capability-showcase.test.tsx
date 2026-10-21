import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { CapabilityShowcase } from "@/components/capability-showcase"

class FakeIntersectionObserver {
  private callback: IntersectionObserverCallback
  constructor(callback: IntersectionObserverCallback) { this.callback = callback }
  observe() { this.callback([{ isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry], this as unknown as IntersectionObserver) }
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}
vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver)

let reduceMotion = false

vi.mock("motion/react", async () => {
  const actual = await vi.importActual<typeof import("motion/react")>("motion/react")
  return { ...actual, useReducedMotion: () => reduceMotion, useInView: () => true }
})

function renderShowcase() {
  return render(<MemoryRouter><CapabilityShowcase /></MemoryRouter>)
}

describe("CapabilityShowcase", () => {
  beforeEach(() => { reduceMotion = false })

  it("đổi nội dung, ảnh và tab khi chọn giai đoạn", async () => {
    reduceMotion = true
    const user = userEvent.setup()
    renderShowcase()

    expect(screen.getByRole("tab", { name: "Tư vấn" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("heading", { name: "Khảo sát kỹ. Đề xuất đúng." })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Kỹ sư Đăng Khoa khảo sát và tư vấn kỹ thuật" })).toHaveAttribute("src", "/images/heroes/about-hero.jpg")

    await user.click(screen.getByRole("tab", { name: "Bảo trì" }))

    expect(screen.getByRole("tab", { name: "Bảo trì" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tab", { name: "Tư vấn" })).toHaveAttribute("tabindex", "-1")
    expect(screen.getByRole("heading", { name: "Phản hồi nhanh. Vận hành bền vững." })).toBeInTheDocument()
    expect(screen.getByText("Lịch bảo trì chủ động")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Kỹ thuật viên Đăng Khoa bảo trì hệ thống" })).toHaveAttribute("src", "/images/heroes/contact-hero.jpg")
    expect(screen.getByRole("button", { name: "Chọn giai đoạn Bảo trì" })).toHaveAttribute("aria-pressed", "true")
  })

  it("chuyển tab bằng phím mũi tên", async () => {
    reduceMotion = true
    const user = userEvent.setup()
    renderShowcase()
    screen.getByRole("tab", { name: "Tư vấn" }).focus()

    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Chế tạo" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("heading", { name: "Gia công chính xác. Kiểm soát từng bước." })).toBeInTheDocument()

    await user.keyboard("{End}")
    expect(screen.getByRole("tab", { name: "Bảo trì" })).toHaveAttribute("aria-selected", "true")
    await user.keyboard("{Home}")
    expect(screen.getByRole("tab", { name: "Tư vấn" })).toHaveAttribute("aria-selected", "true")
  })

  it("không chạy vòng quay khi người dùng giảm chuyển động", () => {
    reduceMotion = true
    const { container } = renderShowcase()
    expect(container.querySelector(".capability-carousel--running")).toBeNull()
  })

  it("chạy vòng quay khi đang trong vùng nhìn và dừng khi rê chuột", async () => {
    const user = userEvent.setup()
    const { container } = renderShowcase()
    const carousel = container.querySelector(".capability-carousel")
    expect(carousel).toHaveClass("capability-carousel--running")

    await user.hover(carousel!)
    expect(carousel).not.toHaveClass("capability-carousel--running")
  })
})
