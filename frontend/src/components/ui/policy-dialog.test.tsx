import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { PolicyDialog } from "@/components/ui/policy-dialog"

const policy = {
  title: "Chính sách thanh toán",
  intro: "Thông tin thanh toán cho đơn hàng.",
  sections: [{ title: "Chuyển khoản", paragraphs: ["Chỉ chuyển tiền theo thông tin chính thức."] }],
}

describe("PolicyDialog", () => {
  it("hiển thị nội dung chính sách và gửi yêu cầu đóng", async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    render(<PolicyDialog open policy={policy} onOpenChange={onOpenChange}/>)

    expect(screen.getByRole("dialog", { name: policy.title })).toBeInTheDocument()
    expect(screen.getByText("Chỉ chuyển tiền theo thông tin chính thức.")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Đã hiểu" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
