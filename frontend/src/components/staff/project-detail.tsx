import { CalendarClock, Check, CircleDollarSign, ClipboardCheck, FileCheck2, FolderKanban, Timer } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { staffClient } from "@/lib/staff-client"
import { cn } from "@/lib/utils"
import type { StaffWorkOrder, WorkOrderStatus } from "@/types/staff"

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
const stages = ["Chuẩn bị", "Đang thực hiện", "Chờ bàn giao", "Hoàn thành"]
const stageByStatus: Record<WorkOrderStatus, number> = {
  awaiting_contract: 0, awaiting_deposit: 0, scheduled: 0,
  in_progress: 1, quality_check: 1, ready_for_delivery: 2,
  completed: 3, cancelled: -1,
}
const statusLabel = (status: WorkOrderStatus) => status === "cancelled" ? "Đã hủy" : stages[stageByStatus[status]] || status
const nextStatus = (status: WorkOrderStatus): WorkOrderStatus | "" => {
  const stage = stageByStatus[status]
  if (stage === 0) return "in_progress"
  if (stage === 1) return "ready_for_delivery"
  if (stage === 2) return "completed"
  return ""
}
const actionLabel = (status: WorkOrderStatus) => stageByStatus[status] === 0 ? "Bắt đầu thực hiện" : stageByStatus[status] === 1 ? "Chuyển sang chờ bàn giao" : stageByStatus[status] === 2 ? "Hoàn thành dự án" : ""

export function ProjectDetail({ item, busy, error, onUpdate }: { item: StaffWorkOrder; busy: boolean; error: Error | null; onUpdate: (body: Parameters<typeof staffClient.updateWorkOrder>[1]) => void }) {
  const incomplete = Boolean(item.integrityIssues?.length || !item.customer || !item.request || !item.quotation)
  const [message, setMessage] = useState("")
  useEffect(() => { setMessage("") }, [item._id, item.status])
  const next = nextStatus(item.status)
  const currentStage = stageByStatus[item.status]

  return <article className="space-y-6">
    {incomplete && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><strong className="block">Hồ sơ dự án không đầy đủ</strong><p className="mt-1">Khách hàng, yêu cầu hoặc báo giá liên kết không còn tồn tại. Dự án chỉ có thể xem và không thể cập nhật.</p></div>}
    <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-wider text-orange-700">{item.code}</p><h2 className="mt-2 font-display text-3xl font-bold text-emerald-950">{item.request?.title || "Yêu cầu không còn tồn tại"}</h2><p className="mt-2 text-slate-600">{item.customer?.name || "Khách hàng không còn tồn tại"} · Báo giá {item.quotation?.code || "không còn tồn tại"}</p></div><div className="text-right"><span className={cn("inline-block rounded-full px-4 py-2 text-sm font-black", item.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800")}>{statusLabel(item.status)}</span><p className="mt-2 text-sm font-semibold text-slate-500">{item.assignedTo ? `Phụ trách: ${item.assignedTo.name}` : "Chưa có người phụ trách"}</p></div></div>
      {item.status !== "cancelled" && <ol className="mt-8 grid grid-cols-4" aria-label="Tiến độ dự án">{stages.map((label, index) => {
        const completed = index < currentStage || item.status === "completed"
        const current = index === currentStage && item.status !== "completed"
        return <li key={label} className="relative flex min-w-0 flex-col items-center text-center"><span className={cn("absolute left-0 right-1/2 top-4 h-0.5", index === 0 && "hidden", index <= currentStage ? "bg-emerald-600" : "bg-slate-200")}/><span className={cn("absolute left-1/2 right-0 top-4 h-0.5", index === stages.length - 1 && "hidden", index < currentStage || item.status === "completed" ? "bg-emerald-600" : "bg-slate-200")}/><span className={cn("relative z-10 grid size-8 place-items-center rounded-full border-2 bg-white", completed ? "border-emerald-600 bg-emerald-600 text-white" : current ? "border-orange-500 text-orange-600" : "border-slate-300 text-slate-300")}>{completed ? <Check className="size-4"/> : <span className="size-2 rounded-full bg-current"/>}</span><span className={cn("mt-2 text-[11px] font-bold sm:text-sm", index <= currentStage ? "text-emerald-950" : "text-slate-400")}>{label}</span></li>
      })}</ol>}
      <div className="mt-8 grid gap-4 rounded-2xl bg-emerald-50 p-5 sm:grid-cols-3"><p><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><CircleDollarSign className="size-4 text-orange-600"/>Giá trị thống nhất</span><strong className="mt-1 block text-emerald-950">{money.format(item.agreedTotal)}</strong></p><p><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><FileCheck2 className="size-4 text-orange-600"/>Báo giá đã duyệt</span><strong className="mt-1 block text-emerald-950">{item.quotation?.code || "Không còn tồn tại"}</strong></p><p><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><Timer className="size-4 text-orange-600"/>Thời gian thực hiện</span><strong className="mt-1 block text-emerald-950">{item.quotation?.leadTime || "Theo báo giá đã thống nhất"}</strong></p></div>
    </section>

    {!incomplete && next && <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6 sm:p-8"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-orange-600 text-white"><ClipboardCheck className="size-5"/></span><div><h3 className="font-display text-xl font-bold text-orange-950">Bước tiếp theo: {actionLabel(item.status)}</h3><p className="mt-1 text-sm leading-6 text-orange-900">Nội dung cập nhật sẽ được lưu vào lịch sử và thông báo cho khách hàng.</p></div></div><form className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={event => { event.preventDefault(); onUpdate({ status: next, message }) }}><Textarea className="min-h-24 bg-white" value={message} onChange={event => setMessage(event.target.value)} placeholder="Mô tả ngắn tiến độ, kết quả hoặc thông tin bàn giao..."/><Button size="lg" disabled={busy}>{busy ? "Đang cập nhật..." : actionLabel(item.status)}</Button></form></section>}

    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 font-semibold text-red-700">{error.message}</p>}
    <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"><h3 className="flex items-center gap-2 font-display text-xl font-bold text-emerald-950"><FolderKanban className="size-5 text-orange-600"/>Lịch sử dự án</h3><ol className="mt-4 space-y-4">{[...(item.timeline || [])].reverse().map((entry, index) => <li className="flex gap-3 text-sm" key={`${entry.at}-${index}`}><span className="mt-1.5 size-2 shrink-0 rounded-full bg-orange-500"/><div><strong>{statusLabel(entry.status as WorkOrderStatus)}</strong>{entry.message && <p className="mt-1 leading-6 text-slate-500">{entry.message}</p>}<time className="mt-1 flex items-center gap-1 text-xs text-slate-400"><CalendarClock className="size-3"/>{new Date(entry.at).toLocaleString("vi-VN")}</time></div></li>)}</ol></section>
  </article>
}
