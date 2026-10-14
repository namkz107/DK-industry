import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

describe("ConfirmDialog", () => {
  it("xác nhận bằng modal tùy biến thay cho hộp thoại trình duyệt", () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog open title="Ẩn nội dung?" description="Nội dung sẽ không còn xuất hiện trên website." confirmLabel="Ẩn nội dung" destructive onConfirm={onConfirm} onOpenChange={() => undefined}/>)

    expect(screen.getByRole("dialog")).toHaveTextContent("Ẩn nội dung?")
    fireEvent.click(screen.getByRole("button", { name: "Ẩn nội dung" }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it("khóa thao tác đóng khi yêu cầu đang được xử lý", () => {
    render(<ConfirmDialog open busy title="Đang xử lý" description="Vui lòng chờ." onConfirm={() => undefined} onOpenChange={() => undefined}/>)
    expect(screen.getByRole("button", { name: "Đóng hộp thoại" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Đang xử lý..." })).toBeDisabled()
  })
})
