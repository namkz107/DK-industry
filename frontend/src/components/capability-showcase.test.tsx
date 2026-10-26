import { act, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CapabilityShowcase } from "@/components/capability-showcase"

function renderShowcase() {
  return render(<MemoryRouter><CapabilityShowcase /></MemoryRouter>)
}

describe("CapabilityShowcase", () => {
  afterEach(() => { vi.useRealTimers() })

  it("tự đưa ảnh lướt từ phải sang trái và đổi nội dung theo", () => {
    vi.useFakeTimers()
    const { container } = renderShowcase()

    expect(screen.getByRole("tab", { name: "01 Tư vấn" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("heading", { name: "Khảo sát kỹ. Đề xuất đúng." })).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Kỹ sư cầm mũ bảo hộ và xem bản vẽ" })).toHaveAttribute("src", "/images/stages/tu-van-xem-ban-ve.png")
    expect(container.querySelectorAll(".capability-reel__track img")).toHaveLength(5)

    act(() => { vi.advanceTimersByTime(4200) })

    expect(screen.getByRole("heading", { name: "Gia công chính xác. Kiểm soát từng bước." })).toBeInTheDocument()
    expect(container.querySelector(".capability-reel__track")).toHaveStyle({ transform: "translateX(-100%)" })
    expect(screen.getByText("Giai đoạn 02 · Chế tạo")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("tab", { name: "04 Bảo trì" }))

    expect(screen.getByRole("tab", { name: "04 Bảo trì" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("heading", { name: "Phản hồi nhanh. Vận hành bền vững." })).toBeInTheDocument()
    expect(screen.getByText("Lịch bảo trì chủ động")).toBeInTheDocument()
    expect(container.querySelector(".capability-reel__track")).toHaveStyle({ transform: "translateX(-300%)" })
  })
})
