import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ToastProvider, useToast } from "@/components/ui/toast"

function Trigger() {
  const toast = useToast()
  return <>
    <button onClick={() => toast.success("Đã cập nhật địa chỉ")}>Thành công</button>
    <button onClick={() => toast.error("Không thể lưu địa chỉ")}>Thất bại</button>
    <button onClick={() => toast.success("Đã thêm vào giỏ", { action: { label: "Xem giỏ hàng", onClick: () => undefined } })}>Snackbar</button>
  </>
}

describe("ToastProvider", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("hiển thị thông báo và cho phép đóng thủ công", () => {
    render(<ToastProvider><Trigger/></ToastProvider>)
    fireEvent.click(screen.getByRole("button", { name: "Thành công" }))

    expect(screen.getByRole("status")).toHaveTextContent("Đã cập nhật địa chỉ")
    fireEvent.click(screen.getByRole("button", { name: "Đóng thông báo" }))
    expect(screen.queryByText("Đã cập nhật địa chỉ")).not.toBeInTheDocument()
  })

  it("tự đóng thông báo thành công và giữ lỗi lâu hơn", () => {
    render(<ToastProvider><Trigger/></ToastProvider>)
    fireEvent.click(screen.getByRole("button", { name: "Thành công" }))
    fireEvent.click(screen.getByRole("button", { name: "Thất bại" }))

    act(() => vi.advanceTimersByTime(5000))
    expect(screen.queryByText("Đã cập nhật địa chỉ")).not.toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("Không thể lưu địa chỉ")

    act(() => vi.advanceTimersByTime(2000))
    expect(screen.queryByText("Không thể lưu địa chỉ")).not.toBeInTheDocument()
  })

  it("hỗ trợ hành động nhanh theo dạng snackbar", () => {
    render(<ToastProvider><Trigger/></ToastProvider>)
    fireEvent.click(screen.getByRole("button", { name: "Snackbar" }))
    fireEvent.click(screen.getByRole("button", { name: "Xem giỏ hàng" }))
    expect(screen.queryByText("Đã thêm vào giỏ")).not.toBeInTheDocument()
  })
})
