import { lazy, Suspense, useState } from "react"
import { LoaderCircle } from "lucide-react"
import { Outlet, ScrollRestoration, useNavigate } from "react-router-dom"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { QuoteDialog } from "@/components/quote-dialog"
import { GlobalLoading } from "@/components/global-loading"
import { useAuth } from "@/contexts/auth-context"

export interface LayoutContext { openQuote: (product?: string) => void; canRequestQuote: boolean }

const SupportChatWidget = lazy(() => import("@/components/support-chat-widget").then(module => ({ default: module.SupportChatWidget })))

export function AppLayout() {
  const { user, ready } = useAuth()
  const navigate = useNavigate()
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [quoteProduct, setQuoteProduct] = useState<string>()
  const [quoteTrigger, setQuoteTrigger] = useState<HTMLElement | null>(null)
  const canRequestQuote = ready && (!user || user.role === "customer")
  const openQuote = (value?: string) => {
    if (user?.role === "customer") {
      navigate(`/tai-khoan/yeu-cau${value ? `?product=${encodeURIComponent(value)}` : ""}`)
      return
    }
    if (user) return
    setQuoteTrigger(document.activeElement instanceof HTMLElement ? document.activeElement : null)
    setQuoteProduct(value)
    setQuoteOpen(true)
  }
  return <><GlobalLoading /><a href="#main" className="skip-link">Chuyển đến nội dung chính</a><SiteHeader onQuote={() => openQuote()} /><main id="main"><Suspense fallback={<div className="grid min-h-[45vh] place-items-center" role="status" aria-label="Đang tải trang"><div className="flex items-center gap-3 font-semibold text-emerald-900"><LoaderCircle className="size-6 animate-spin"/>Đang tải trang...</div></div>}><Outlet context={{ openQuote, canRequestQuote } satisfies LayoutContext} /></Suspense></main><SiteFooter /><Suspense fallback={null}><SupportChatWidget/></Suspense><QuoteDialog open={quoteOpen} product={quoteProduct} onOpenChange={setQuoteOpen} returnFocusTo={quoteTrigger} /><ScrollRestoration /></>
}
