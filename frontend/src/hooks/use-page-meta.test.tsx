import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { usePageMeta } from "@/hooks/use-page-meta"

describe("usePageMeta", () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="description" content="old"><link rel="canonical" href="https://old.example/">'
    vi.stubEnv("VITE_SITE_URL", "https://dk-industry.example/")
    window.history.replaceState({}, "", "/dich-vu?ignored=true")
  })

  it("sets title, description, Open Graph and a query-free canonical URL", () => {
    const { unmount } = renderHook(() => usePageMeta("Dịch vụ", "Gia công cơ khí chính xác"))

    expect(document.title).toBe("Dịch vụ | Cơ khí Đăng Khoa")
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute("content", "Gia công cơ khí chính xác")
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute("content", "Dịch vụ | Cơ khí Đăng Khoa")
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute("href", "https://dk-industry.example/dich-vu")

    unmount()
    expect(document.title).toBe("Cơ khí Đăng Khoa | Giải pháp cơ khí toàn diện")
  })
})
