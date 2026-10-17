import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value?: number | null) {
  return value ? `${new Intl.NumberFormat("vi-VN").format(value)}đ` : "Liên hệ báo giá"
}

export function formatAddressParts(parts: Array<string | null | undefined>) {
  const seen = new Set<string>()
  return parts
    .map(part => part?.trim())
    .filter((part): part is string => {
      if (!part) return false
      const normalized = part.toLocaleLowerCase("vi").replace(/\s+/g, " ")
      if (seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })
    .join(", ")
}

export function scrollToPageTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
}
