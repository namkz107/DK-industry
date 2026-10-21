import { CalendarClock, CircleDollarSign, FileCheck2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { staffClient } from "@/lib/staff-client"
import { cn } from "@/lib/utils"
import type { StaffWorkOrder, WorkOrderStatus } from "@/types/staff"

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
const statusLabel = (status: WorkOrderStatus) => status === "completed" ? "Hoàn thành" : status === "cancelled" ? "Đã hủy" : "Đang làm"
const dateValue = (value?: string) => value ? value.slice(0, 10) : ""

export function ProjectDetail({ item, busy, error, onUpdate, onRepair }: { item: StaffWorkOrder; busy: boolean; error: Error | null; onUpdate: (body: Parameters<typeof staffClient.updateWorkOrder>[1]) => void; onRepair: (body: { decision: "accept" | "reject"; resolution: string; plannedDeliveryAt?: string }) => void }) {
  const incomplete = Boolean(item.integrityIssues?.length || !item.customer || !item.request || !item.quotation)
  const [delivery, setDelivery] = useState(dateValue(item.plannedDeliveryAt))
  const [resolution, setResolution] = useState("")
  const [repairDate, setRepairDate] = useState(dateValue(item.plannedDeliveryAt))
  useEffect(() => { setDelivery(dateValue(item.plannedDeliveryAt)); setResolution(""); setRepairDate(dateValue(item.plannedDeliveryAt)) }, [item._id, item.status, item.plannedDeliveryAt, item.repair?.status])
  const waitingRepair = item.repair?.status === "requested" || item.repair?.status === "requote"

  return <article className="space-y-6">
    {incomplete && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"><strong className="block">Hồ sơ dự án không đầy đủ</strong><p className="mt-1">Khách hàng, yêu cầu hoặc báo giá liên kết không còn tồn tại.</p></div>}
    <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-black uppercase tracking-wider text-orange-700">{item.code}</p><h2 className="mt-2 font-display text-3xl font-bold text-emerald-950">{item.request?.title || "Yêu cầu không còn tồn tại"}</h2><p className="mt-2 text-slate-600">{item.customer?.name || "Khách hàng không còn tồn tại"} · Báo giá {item.quotation?.code || "không còn tồn tại"}</p></div><span className={cn("inline-block rounded-full px-4 py-2 text-sm font-black", item.status === "cancelled" ? "bg-red-50 text-red-700" : item.status === "completed" ? "bg-emerald-50 text-emerald-800" : "bg-orange-50 text-orange-800")}>{statusLabel(item.status)}</span></div>
      <div className="mt-8 grid gap-4 rounded-2xl bg-emerald-50 p-5 sm:grid-cols-3"><p><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><CircleDollarSign className="size-4 text-orange-600"/>Giá trị đã chốt</span><strong className="mt-1 block text-emerald-950">{money.format(item.agreedTotal)}</strong></p><p><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><FileCheck2 className="size-4 text-orange-600"/>Báo giá</span><strong className="mt-1 block text-emerald-950">{item.quotation?.code || "Không còn tồn tại"}</strong></p><p><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><CalendarClock className="size-4 text-orange-600"/>Ngày giao</span><strong className="mt-1 block text-emerald-950">{item.plannedDeliveryAt ? new Date(item.plannedDeliveryAt).toLocaleDateString("vi-VN") : "Chưa hẹn"}</strong></p></div>
      {!incomplete && item.status !== "completed" && item.status !== "cancelled" && <form className="mt-5 flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); onUpdate({ plannedDeliveryAt: delivery, message: `Hẹn giao ngày ${delivery}.` }) }}><label className="text-sm font-bold text-slate-700">Đổi ngày giao<Input className="mt-2" type="date" value={delivery} onChange={event => setDelivery(event.target.value)} required/></label><Button disabled={busy || !delivery}>Lưu ngày giao</Button></form>}
    </section>
    {waitingRepair && <section className="rounded-3xl border border-orange-200 bg-orange-50 p-6 sm:p-8">
      <h3 className="font-display text-xl font-bold text-orange-950">{item.repair?.status === "requote" ? "Khách muốn sửa tính phí" : "Khách yêu cầu sửa"}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-orange-900">{item.repair?.reason || "Khách chưa ghi rõ lỗi."}</p>
      <form className="mt-5 space-y-3" onSubmit={event => { event.preventDefault(); const decision = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "reject" ? "reject" : "accept"; onRepair({ decision, resolution: resolution.trim(), plannedDeliveryAt: decision === "accept" ? repairDate : undefined }) }}>
        <Textarea className="bg-white" rows={3} value={resolution} onChange={event => setResolution(event.target.value)} placeholder="Lý do nhận sửa hoặc từ chối, gửi cho khách"/>
        <label className="block text-sm font-bold text-slate-700">Ngày giao lại nếu nhận sửa<Input className="mt-2 max-w-xs bg-white" type="date" value={repairDate} onChange={event => setRepairDate(event.target.value)}/></label>
        <div className="flex flex-wrap gap-2"><Button value="accept" disabled={busy || resolution.trim().length < 3}>Nhận sửa</Button><Button value="reject" variant="outline" disabled={busy || resolution.trim().length < 3}>Từ chối sửa</Button></div>
      </form>
    </section>}
    {item.repair?.status === "rejected" && <p className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">Đã từ chối sửa: {item.repair.resolution}</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 font-semibold text-red-700">{error.message}</p>}
    <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8"><h3 className="font-display text-xl font-bold text-emerald-950">Nhật ký</h3><ol className="mt-4 space-y-4">{[...(item.timeline || [])].reverse().map((entry, index) => <li className="flex gap-3 text-sm" key={`${entry.at}-${index}`}><span className="mt-1.5 size-2 shrink-0 rounded-full bg-orange-500"/><div><strong>{statusLabel(entry.status as WorkOrderStatus)}</strong>{entry.message && <p className="mt-1 leading-6 text-slate-500">{entry.message}</p>}<time className="mt-1 block text-xs text-slate-400">{new Date(entry.at).toLocaleString("vi-VN")}</time></div></li>)}</ol></section>
  </article>
}
