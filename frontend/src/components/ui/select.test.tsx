import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { Select } from "@/components/ui/select"

const options = [
  { value: "low", label: "Ưu tiên: Thấp" },
  { value: "normal", label: "Ưu tiên: Bình thường" },
  { value: "high", label: "Ưu tiên: Cao" },
]

describe("Select", () => {
  it("hiển thị dropdown tùy biến và trả về giá trị được chọn", () => {
    const onChange = vi.fn()
    render(<Select ariaLabel="Mức ưu tiên" value="normal" options={options} onChange={onChange}/>)

    fireEvent.click(screen.getByRole("button", { name: "Mức ưu tiên" }))
    expect(screen.getByRole("listbox", { name: "Mức ưu tiên" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Ưu tiên: Bình thường" })).toHaveAttribute("aria-selected", "true")
    fireEvent.click(screen.getByRole("option", { name: "Ưu tiên: Cao" }))
    expect(onChange).toHaveBeenCalledWith("high")
  })

  it("hỗ trợ mở và chọn bằng bàn phím", () => {
    const onChange = vi.fn()
    render(<Select ariaLabel="Mức ưu tiên" value="low" options={options} onChange={onChange}/>)
    const trigger = screen.getByRole("button", { name: "Mức ưu tiên" })

    fireEvent.keyDown(trigger, { key: "ArrowDown" })
    fireEvent.keyDown(trigger, { key: "ArrowDown" })
    fireEvent.keyDown(trigger, { key: "Enter" })
    expect(onChange).toHaveBeenCalledWith("normal")
  })
})
