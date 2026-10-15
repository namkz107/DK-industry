import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { IntegerInput, MoneyInput } from "@/components/ui/numeric-input"
import { formatGroupedNumber, parseNumericInput } from "@/lib/numeric"

describe("numeric inputs", () => {
  it("định dạng tiền theo nhóm ba chữ số và đọc lại đúng giá trị", () => {
    expect(formatGroupedNumber("1000000")).toBe("1.000.000")
    expect(parseNumericInput("1.000.000")).toBe(1000000)
  })

  it("MoneyInput loại chữ và hiển thị dấu chấm khi nhập", () => {
    const onChange = vi.fn()
    render(<MoneyInput aria-label="Đơn giá" onChange={onChange}/>)
    const input = screen.getByRole("textbox", { name: "Đơn giá" })
    fireEvent.change(input, { target: { value: "abc100000" } })
    expect(input).toHaveValue("100.000")
    expect(onChange).toHaveBeenCalled()
  })

  it("IntegerInput chỉ giữ số nguyên và giới hạn giá trị tối đa", () => {
    render(<IntegerInput aria-label="Thuế" max={100}/>)
    const input = screen.getByRole("textbox", { name: "Thuế" })
    fireEvent.change(input, { target: { value: "12.5abc" } })
    expect(input).toHaveValue("100")
  })
})
