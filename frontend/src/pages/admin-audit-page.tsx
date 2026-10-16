import { useQuery } from "@tanstack/react-query"
import { ClipboardClock, Eye, RefreshCw, UserRound } from "lucide-react"
import { useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Pagination } from "@/components/pagination"
import { Select } from "@/components/ui/select"
import { WorkspaceModal } from "@/components/workspace-modal"
import { usePageMeta } from "@/hooks/use-page-meta"
import { adminClient } from "@/lib/admin-client"
import type { AuditLog } from "@/types/admin"

const entityNames: Record<string, string> = { user: "Tài khoản", product: "Sản phẩm", service: "Dịch vụ", project: "Dự án", site_setting: "Cấu hình website", lead: "Khách hàng tiềm năng", request: "Yêu cầu dịch vụ", quotation: "Báo giá", work_order: "Công việc", order: "Đơn hàng", payment: "Thanh toán", inventory: "Kho hàng", privacy_request: "Quyền riêng tư" }
const fieldNames: Record<string, string> = { status: "Trạng thái", paymentStatus: "Thanh toán", shippingFee: "Phí vận chuyển", total: "Tổng tiền", role: "Vai trò", depositRequired: "Tiền cọc yêu cầu", depositPaid: "Tiền cọc đã nhận", paymentMethod: "Phương thức thanh toán", reason: "Lý do", responseNote: "Phản hồi của khách", resolution: "Kết quả xử lý", type: "Loại yêu cầu" }
const valueNames: Record<string, Record<string, string>> = {
  status: { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", preparing: "Đã xác nhận", shipping: "Đang giao", delivered: "Hoàn tất", cancelled: "Đã hủy", active: "Hoạt động", blocked: "Đã khóa", submitted: "Đã tiếp nhận", reviewing: "Đang xem xét", approved: "Đã chấp thuận", rejected: "Từ chối", completed: "Đã hoàn tất", awaiting_contract: "Chờ hợp đồng / PO", awaiting_deposit: "Chờ đặt cọc", scheduled: "Đã lên lịch", in_progress: "Đang thực hiện", quality_check: "Kiểm tra chất lượng", ready_for_delivery: "Sẵn sàng bàn giao" },
  paymentStatus: { unpaid: "Chưa thanh toán", pending: "Chờ đối soát", paid: "Đã thanh toán", refund_pending: "Chờ hoàn tiền", refunded: "Đã hoàn tiền" },
  role: { customer: "Khách hàng", staff: "Nhân viên", admin: "Quản trị viên" },
  paymentMethod: { cod: "Thanh toán khi nhận hàng", bank_transfer: "Chuyển khoản" },
  type: { return: "Trả hàng", complaint: "Khiếu nại", warranty: "Bảo hành", deletion: "Xóa tài khoản" },
}
const moneyFields = new Set(["shippingFee", "total", "depositRequired", "depositPaid"])
const directMetadataFields = new Set(["status", "paymentStatus", "shippingFee", "total", "role", "depositRequired", "depositPaid", "paymentMethod", "reason", "responseNote", "resolution", "type"])

type Change = { label: string; before?: string; after: string }
const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
function displayValue(field: string, value: unknown) {
  if (value === undefined || value === null || value === "") return "Chưa có"
  const translated = valueNames[field]?.[String(value)]
  if (translated) return translated
  if (moneyFields.has(field) && typeof value === "number") return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value)
  if (typeof value === "boolean") return value ? "Có" : "Không"
  if (["string", "number"].includes(typeof value)) return String(value)
  return ""
}
function auditChanges(log: AuditLog): Change[] {
  const metadata = asRecord(log.metadata)
  const before = asRecord(metadata.before)
  const after = asRecord(metadata.after)
  const changes: Change[] = []
  for (const field of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (!fieldNames[field] || field.toLowerCase().includes("assigned")) continue
    if (JSON.stringify(before[field]) === JSON.stringify(after[field])) continue
    const previous = displayValue(field, before[field]); const next = displayValue(field, after[field])
    if (previous && next && previous !== next) changes.push({ label: fieldNames[field], before: previous, after: next })
  }
  for (const field of Object.keys(metadata)) {
    if (!directMetadataFields.has(field) || field in before || field in after) continue
    const value = displayValue(field, metadata[field])
    if (value) changes.push({ label: fieldNames[field], after: value })
  }
  return changes
}

export function AdminAuditPage() {
  usePageMeta("Nhật ký quản trị", "Theo dõi các thay đổi nhạy cảm trong hệ thống.")
  const [entity, setEntity] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AuditLog | null>(null)
  const logs = useQuery({ queryKey: ["admin", "audit", entity, page], queryFn: () => adminClient.auditLogs(entity, page) })
  return <AdminShell title="Nhật ký quản trị" description="Lưu dấu ai đã thay đổi tài khoản hoặc nội dung nào và vào thời điểm nào.">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 px-5 py-5 text-white sm:px-6"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-orange-300 ring-1 ring-white/15"><ClipboardClock className="size-5"/></span><div><h2 className="font-display text-xl font-bold">Dòng thời gian hoạt động</h2><p className="mt-1 text-sm text-emerald-100/70">Theo dõi và mở chi tiết từng thay đổi trong hệ thống.</p></div></div><div className="flex items-center gap-2"><span className="rounded-full bg-orange-400 px-3 py-1.5 text-xs font-black text-emerald-950">{logs.data?.data.total || 0} hoạt động</span><button type="button" onClick={() => void logs.refetch()} className="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 hover:bg-white/20" aria-label="Làm mới"><RefreshCw className={`size-4 ${logs.isFetching ? "animate-spin" : ""}`}/></button></div></div>
      <div className="flex flex-col justify-between gap-3 border-b p-4 sm:flex-row sm:items-center sm:px-5"><p className="text-sm font-semibold text-slate-500">Nhật ký chỉ đọc, được sắp xếp từ mới đến cũ.</p><Select className="sm:w-56" ariaLabel="Lọc theo đối tượng" value={entity} onChange={value => { setEntity(value); setPage(1) }} options={[{ value: "", label: "Tất cả đối tượng" }, ...Object.entries(entityNames).map(([value, label]) => ({ value, label }))]}/></div>
      <div className="hidden grid-cols-[1.4fr_1fr_180px_52px] gap-4 border-b bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-500 md:grid"><span>Hoạt động</span><span>Người thực hiện</span><span>Thời gian</span><span/></div>
      <div className="max-h-[min(62vh,680px)] min-h-72 overflow-y-auto">{logs.data?.data.items.map(item => { const hasDetails = auditChanges(item).length > 0; return <button type="button" disabled={!hasDetails} onClick={() => setSelected(item)} className={`group grid w-full grid-cols-[1fr_auto] items-center gap-3 border-b border-l-4 border-b-slate-100 px-5 py-4 text-left transition last:border-b-0 md:grid-cols-[1.4fr_1fr_180px_52px] ${hasDetails ? "border-l-orange-400 hover:bg-orange-50/60" : "cursor-default border-l-slate-200"}`} key={item._id}><div className="min-w-0"><strong className="block truncate text-emerald-950">{item.summary}</strong><span className="mt-1 block text-xs font-bold text-slate-500">{entityNames[item.entity] || "Hoạt động hệ thống"}</span></div><span className="flex items-center gap-2 text-sm text-slate-600"><UserRound className="size-4 text-emerald-700"/>{item.actor?.name || "Tài khoản hệ thống"}</span><time className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString("vi-VN")}</time>{hasDetails ? <span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white" title="Xem nội dung thay đổi"><Eye className="size-4"/></span> : <span className="size-9"/>}</button> })}{logs.isLoading && <p className="p-10 text-center">Đang tải nhật ký...</p>}{logs.error && <p role="alert" className="m-4 rounded-xl bg-red-50 p-4 text-red-700">{logs.error.message}</p>}{!logs.isLoading && !logs.data?.data.items.length && <p className="p-12 text-center text-slate-500">Chưa có hoạt động quản trị phù hợp.</p>}</div>
      <div className="border-t px-4 py-3"><Pagination page={logs.data?.data.page || page} pages={logs.data?.data.pages || 1} onChange={setPage}/></div>
    </section>
    <WorkspaceModal open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null) }} width="medium" eyebrow={selected ? entityNames[selected.entity] || "Nhật ký" : "Nhật ký"} title={selected?.summary || "Chi tiết hoạt động"} description={selected ? new Date(selected.createdAt).toLocaleString("vi-VN") : undefined}>{selected && <AuditDetail log={selected}/>}</WorkspaceModal>
  </AdminShell>
}

function AuditDetail({ log }: { log: AuditLog }) {
  const changes = auditChanges(log)
  return <div className="space-y-5 rounded-3xl border bg-white p-6 shadow-sm"><div className="grid gap-4 sm:grid-cols-2"><Detail label="Người thực hiện" value={log.actor?.name || "Tài khoản hệ thống"}/><Detail label="Thời điểm" value={new Date(log.createdAt).toLocaleString("vi-VN")}/></div>{changes.length > 0 ? <section><h3 className="font-display text-lg font-bold text-emerald-950">Nội dung thay đổi</h3><div className="mt-3 divide-y overflow-hidden rounded-2xl border border-slate-200">{changes.map((change, index) => <div className="grid gap-2 p-4 sm:grid-cols-[170px_1fr]" key={`${change.label}-${index}`}><strong className="text-sm text-slate-600">{change.label}</strong><div className="text-sm">{change.before ? <span className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">{change.before}</span><span className="text-slate-400">→</span><span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-bold text-emerald-800">{change.after}</span></span> : <span className="font-bold text-emerald-800">{change.after}</span>}</div></div>)}</div></section> : <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">Hoạt động này đã được ghi nhận đầy đủ trong phần mô tả và không có thông tin bổ sung cần hiển thị.</p>}</div>
}

function Detail({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 p-4"><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span><strong className="mt-1 block break-words text-sm text-emerald-950">{value}</strong></div> }
