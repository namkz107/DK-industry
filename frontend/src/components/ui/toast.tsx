import { CircleAlert, CircleCheck, Info, X } from "lucide-react"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

type ToastVariant = "success" | "error" | "info"

type ToastOptions = {
  duration?: number
  title?: string
  action?: { label: string; onClick: () => void }
}

type ToastItem = ToastOptions & {
  id: number
  message: string
  variant: ToastVariant
}

type ToastApi = {
  success: (message: string, options?: ToastOptions) => number
  error: (message: string, options?: ToastOptions) => number
  info: (message: string, options?: ToastOptions) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastApi | null>(null)
let nextToastId = 0

const styles: Record<ToastVariant, { icon: typeof CircleCheck; iconClass: string; borderClass: string; title: string }> = {
  success: { icon: CircleCheck, iconClass: "bg-emerald-100 text-emerald-700", borderClass: "border-emerald-200", title: "Thành công" },
  error: { icon: CircleAlert, iconClass: "bg-red-100 text-red-700", borderClass: "border-red-200", title: "Có lỗi xảy ra" },
  info: { icon: Info, iconClass: "bg-blue-100 text-blue-700", borderClass: "border-blue-200", title: "Thông báo" },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<number, number>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) window.clearTimeout(timer)
    timers.current.delete(id)
    setToasts(current => current.filter(item => item.id !== id))
  }, [])

  const show = useCallback((variant: ToastVariant, message: string, options: ToastOptions = {}) => {
    const id = ++nextToastId
    const duration = options.duration ?? (variant === "error" ? 7000 : 5000)
    setToasts(current => [...current.slice(-3), { id, message, variant, ...options }])
    if (duration > 0) timers.current.set(id, window.setTimeout(() => dismiss(id), duration))
    return id
  }, [dismiss])

  useEffect(() => () => {
    timers.current.forEach(timer => window.clearTimeout(timer))
    timers.current.clear()
  }, [])

  const api = useMemo<ToastApi>(() => ({
    success: (message, options) => show("success", message, options),
    error: (message, options) => show("error", message, options),
    info: (message, options) => show("info", message, options),
    dismiss,
  }), [dismiss, show])

  return <ToastContext.Provider value={api}>
    {children}
    <ol aria-label="Thông báo hệ thống" aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-5 sm:top-24 sm:w-[min(420px,calc(100vw-40px))]">
      {toasts.map(item => <Toast key={item.id} item={item} onDismiss={dismiss}/>) }
    </ol>
  </ToastContext.Provider>
}

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const style = styles[item.variant]
  const Icon = style.icon
  const headline = item.title || (item.variant === "error" ? item.message : style.title)
  const detail = item.variant === "error" ? (item.title ? item.message : "") : item.message
  return <li role={item.variant === "error" ? "alert" : "status"} className={`toast-enter pointer-events-auto flex w-full items-start gap-3 rounded-card border bg-white p-4 shadow-float ${style.borderClass}`}>
    <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${style.iconClass}`}><Icon className="size-5" aria-hidden="true"/></span>
    <div className="min-w-0 flex-1 pt-0.5"><strong className="block break-words text-sm text-emerald-950">{headline}</strong>{detail && <p className="mt-1 break-words text-sm leading-5 text-slate-600">{detail}</p>}{item.action && <button type="button" className="mt-2 text-sm font-bold text-orange-700 underline underline-offset-4 hover:text-orange-800" onClick={() => { item.action?.onClick(); onDismiss(item.id) }}>{item.action.label}</button>}</div>
    <button type="button" onClick={() => onDismiss(item.id)} className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng thông báo"><X className="size-4" aria-hidden="true"/></button>
  </li>
}

// Provider và hook được đặt cùng nhau để API toast luôn dùng đúng context.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast phải được sử dụng bên trong ToastProvider")
  return context
}
