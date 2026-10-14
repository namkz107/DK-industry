import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(value?: number | null) {
  return value ? `${new Intl.NumberFormat("vi-VN").format(value)}đ` : "Liên hệ báo giá"
}

export function scrollToPageTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
}
