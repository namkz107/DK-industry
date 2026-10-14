import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { SupportQuickActions } from "@/components/support-quick-actions"

describe("SupportQuickActions", () => {
  it("gửi nội dung tương ứng và thu gọn danh sách sau khi chọn", async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(<SupportQuickActions onSelect={onSelect}/>)

    await user.click(screen.getByRole("button", { name: /Tư vấn sản phẩm/i }))

    expect(onSelect).toHaveBeenCalledWith("Tôi cần tư vấn lựa chọn sản phẩm phù hợp.")
    expect(screen.queryByRole("button", { name: /Tư vấn sản phẩm/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Bạn cần hỗ trợ nội dung nào/i })).toHaveAttribute("aria-expanded", "false")
  })
})
