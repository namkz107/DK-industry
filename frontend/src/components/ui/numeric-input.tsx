import * as React from "react"
import { Input } from "@/components/ui/input"
import { digitsOnly, formatGroupedNumber } from "@/lib/numeric"

type NumericInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "inputMode">

function normalizedInteger(value: string, max?: string | number) {
  const digits = digitsOnly(value).replace(/^0+(?=\d)/, "")
  const maxValue = Number(max)
  if (digits && Number.isFinite(maxValue) && Number(digits) > maxValue) return String(maxValue)
  return digits
}

export const IntegerInput = React.forwardRef<HTMLInputElement, NumericInputProps>(({ value, defaultValue, onChange, max, ...props }, ref) => (
  <Input
    {...props}
    ref={ref}
    type="text"
    inputMode="numeric"
    pattern="[0-9]*"
    max={max}
    value={value === undefined ? undefined : normalizedInteger(String(value), max)}
    defaultValue={defaultValue === undefined ? undefined : normalizedInteger(String(defaultValue), max)}
    onChange={event => {
      event.currentTarget.value = normalizedInteger(event.currentTarget.value, max)
      onChange?.(event)
    }}
  />
))
IntegerInput.displayName = "IntegerInput"

export const MoneyInput = React.forwardRef<HTMLInputElement, NumericInputProps>(({ value, defaultValue, onChange, ...props }, ref) => (
  <Input
    {...props}
    ref={ref}
    type="text"
    inputMode="numeric"
    pattern="[0-9.]*"
    value={value === undefined ? undefined : formatGroupedNumber(value)}
    defaultValue={defaultValue === undefined ? undefined : formatGroupedNumber(defaultValue)}
    onChange={event => {
      event.currentTarget.value = formatGroupedNumber(event.currentTarget.value)
      onChange?.(event)
    }}
  />
))
MoneyInput.displayName = "MoneyInput"
