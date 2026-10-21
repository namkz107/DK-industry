import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { QuoteDialog } from "@/components/quote-dialog"
import { ToastProvider } from "@/components/ui/toast"
import { api } from "@/lib/api"

vi.mock("@/lib/api", () => ({ api: { createLead: vi.fn() } }))

function renderQuote(product?: string) {
  const onOpenChange = vi.fn()
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <QuoteDialog open onOpenChange={onOpenChange} product={product} />
      </ToastProvider>
    </QueryClientProvider>,
  )
  return { onOpenChange }
}

async function fillValidQuote(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("Nguyễn Văn A"), "Nguyen Van A")
  await user.type(screen.getByPlaceholderText("0912 345 678"), "0912345678")
  await user.type(screen.getByPlaceholderText("email@congty.vn"), "a@congty.vn")
  await user.click(screen.getByRole("button", { name: "Dịch vụ cần hỗ trợ" }))
  await user.click(screen.getByRole("option", { name: "Gia công cơ khí" }))
  await user.click(screen.getByRole("checkbox", { name: /Tôi đồng ý/ }))
}

describe("QuoteDialog", () => {
  beforeEach(() => {
    vi.mocked(api.createLead).mockReset()
  })

  it("chặn gửi khi thiếu trường bắt buộc và nêu rõ lỗi", async () => {
    const user = userEvent.setup()
    renderQuote()

    await user.click(screen.getByRole("button", { name: "Gửi yêu cầu" }))

    expect(screen.getByText("Vui lòng nhập họ và tên")).toBeInTheDocument()
    expect(screen.getByText("Số điện thoại chưa đúng")).toBeInTheDocument()
    expect(screen.getByText("Vui lòng nhập email nhận phản hồi")).toBeInTheDocument()
    expect(screen.getByText("Vui lòng chọn nhu cầu")).toBeInTheDocument()
    expect(screen.getByText("Vui lòng đồng ý để chúng tôi liên hệ")).toBeInTheDocument()
    expect(api.createLead).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Gửi yêu cầu" })).toBeEnabled()
  })

  it("báo email, số điện thoại và nội dung không hợp lệ", async () => {
    const user = userEvent.setup()
    renderQuote()
    await user.type(screen.getByPlaceholderText("Nguyễn Văn A"), "An")
    await user.type(screen.getByPlaceholderText("0912 345 678"), "123")
    await user.type(screen.getByPlaceholderText("email@congty.vn"), "khong-dung")
    fireEvent.change(screen.getByPlaceholderText(/Loại công trình/), { target: { value: "a".repeat(2001) } })
    await user.click(screen.getByRole("button", { name: "Gửi yêu cầu" }))

    expect(screen.getByText("Số điện thoại chưa đúng")).toBeInTheDocument()
    expect(screen.getByText("Email chưa đúng")).toBeInTheDocument()
    expect(screen.getByText("Nội dung tối đa 2.000 ký tự")).toBeInTheDocument()
    expect(api.createLead).not.toHaveBeenCalled()
  })

  it("khóa nút khi đang gửi, rồi báo thành công và đóng hộp thoại", async () => {
    const user = userEvent.setup()
    let resolveLead: (value: Awaited<ReturnType<typeof api.createLead>>) => void = () => undefined
    vi.mocked(api.createLead).mockImplementation(() => new Promise(resolve => { resolveLead = resolve }))
    const { onOpenChange } = renderQuote()
    await fillValidQuote(user)

    fireEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu" }))
    expect(await screen.findByRole("button", { name: "Đang gửi..." })).toBeDisabled()
    expect(api.createLead).toHaveBeenCalledOnce()

    resolveLead({ success: true, message: "Yêu cầu đã được tiếp nhận", data: { id: "lead-1", code: "BG-TEST", status: "new", duplicate: false } })
    expect(await screen.findByRole("status")).toHaveTextContent("Mã tiếp nhận: BG-TEST")
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("giữ form và báo lỗi khi máy chủ từ chối", async () => {
    const user = userEvent.setup()
    vi.mocked(api.createLead).mockImplementation(async () => { throw new Error("Không thể kết nối máy chủ") })
    const { onOpenChange } = renderQuote()
    await fillValidQuote(user)

    fireEvent.click(screen.getByRole("button", { name: "Gửi yêu cầu" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Không thể kết nối máy chủ")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Gửi yêu cầu" })).toBeEnabled()
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
