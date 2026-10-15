export function digitsOnly(value: unknown) {
  return String(value ?? "").replace(/\D/g, "")
}

export function parseNumericInput(value: unknown) {
  const digits = digitsOnly(value)
  return digits ? Number(digits) : 0
}

export function formatGroupedNumber(value: unknown) {
  const digits = digitsOnly(value).replace(/^0+(?=\d)/, "")
  return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""
}
