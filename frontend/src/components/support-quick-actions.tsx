import { ChevronDown, ClipboardList, PackageSearch, ShoppingBag, Wrench } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const supportQuickActions = [
  { label: "Dịch vụ gia công", message: "Tôi muốn tìm hiểu các dịch vụ gia công hiện có.", icon: Wrench },
  { label: "Tư vấn sản phẩm", message: "Tôi cần tư vấn lựa chọn sản phẩm phù hợp.", icon: PackageSearch },
  { label: "Đặt hàng", message: "Tôi muốn đặt hàng sản phẩm. Hãy hướng dẫn tôi các bước.", icon: ShoppingBag },
  { label: "Tra cứu đơn hàng", message: "Tôi muốn tra cứu tình trạng đơn hàng. Tôi cần cung cấp thông tin gì?", icon: ClipboardList },
] as const

type SupportQuickActionsProps = {
  disabled?: boolean
  onSelect: (message: string) => void
}

export function SupportQuickActions({ disabled = false, onSelect }: SupportQuickActionsProps) {
  const [expanded, setExpanded] = useState(true)

  return <section className="border-b border-emerald-100 bg-gradient-to-br from-orange-50 via-white to-emerald-50 px-3 py-3" aria-label="Hỗ trợ nhanh">
    <button type="button" className="flex w-full items-center justify-between gap-3 rounded-lg px-1 text-left" aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>
      <span><strong className="block text-sm text-emerald-950">Bạn cần hỗ trợ nội dung nào?</strong><span className="text-[11px] text-slate-500">Chọn nhanh hoặc nhập câu hỏi bên dưới</span></span>
      <ChevronDown className={cn("size-4 shrink-0 text-orange-600 transition-transform", expanded && "rotate-180")} aria-hidden="true"/>
    </button>
    {expanded && <div className="mt-3 grid grid-cols-2 gap-2">{supportQuickActions.map(({ label, message, icon: Icon }) => <button
      key={label}
      type="button"
      disabled={disabled}
      className="flex min-h-11 items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 text-left text-xs font-bold text-emerald-950 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-800 disabled:pointer-events-none disabled:opacity-50"
      onClick={() => { onSelect(message); setExpanded(false) }}
    ><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-800"><Icon className="size-4" aria-hidden="true"/></span>{label}</button>)}</div>}
  </section>
}
