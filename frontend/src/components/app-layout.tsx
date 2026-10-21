import { lazy, Suspense, useState } from "react"
import { LoaderCircle } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Outlet, ScrollRestoration, useLocation, useNavigate } from "react-router-dom"
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
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [quoteProduct, setQuoteProduct] = useState<string>()
  const canRequestQuote = ready && (!user || user.role === "customer")
  const openQuote = (value?: string) => {
    if (user?.role === "customer") {
      navigate(`/tai-khoan/yeu-cau${value ? `?product=${encodeURIComponent(value)}` : ""}`)
      return
    }
    if (user) return
    setQuoteProduct(value)
    setQuoteOpen(true)
  }
  return <><GlobalLoading /><a href="#main" className="skip-link">Chuyển đến nội dung chính</a><SiteHeader onQuote={() => openQuote()} /><main id="main"><AnimatePresence mode="wait" initial={false}><motion.div key={location.pathname} initial={reduceMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }} transition={{ duration: reduceMotion ? 0 : .32, ease: [.2,.75,.2,1] }}><Suspense fallback={<div className="grid min-h-[45vh] place-items-center" role="status" aria-label="Đang tải trang"><div className="flex items-center gap-3 font-semibold text-emerald-900"><LoaderCircle className="size-6 animate-spin"/>Đang tải trang...</div></div>}><Outlet context={{ openQuote, canRequestQuote } satisfies LayoutContext} /></Suspense></motion.div></AnimatePresence></main><SiteFooter /><Suspense fallback={null}><SupportChatWidget/></Suspense><QuoteDialog open={quoteOpen} product={quoteProduct} onOpenChange={setQuoteOpen} /><ScrollRestoration /></>
}
