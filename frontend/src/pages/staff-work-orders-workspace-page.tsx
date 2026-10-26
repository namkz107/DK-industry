import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Eye, Factory, LoaderCircle, RefreshCw, RotateCcw, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Pagination } from "@/components/pagination"
import { StaffShell } from "@/components/staff/staff-shell"
import { Input } from "@/components/ui/input"
import { Select as UiSelect } from "@/components/ui/select"
import { WorkspaceModal } from "@/components/workspace-modal"
import { usePageMeta } from "@/hooks/use-page-meta"
import { staffClient } from "@/lib/staff-client"
import { cn } from "@/lib/utils"
import { WorkOrderDetail } from "@/pages/staff-work-orders-page"
import type { WorkOrderStatus } from "@/types/staff"

const labels: Record<WorkOrderStatus, string> = { awaiting_contract: "Chờ hợp đồng / PO", awaiting_deposit: "Chờ đặt cọc", scheduled: "Đã lên lịch", in_progress: "Đang thực hiện", quality_check: "Kiểm tra chất lượng", ready_for_delivery: "Sẵn sàng bàn giao", completed: "Đã hoàn thành", cancelled: "Đã hủy" }
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })

export function StaffWorkOrdersWorkspacePage() {
  usePageMeta("Công việc sau báo giá", "Danh sách gọn, hồ sơ và tiến độ được xử lý trong cửa sổ riêng.")
  const client = useQueryClient(); const [params] = useSearchParams()
  const [filters, setFilters] = useState({ q: params.get("q") || "", status: "", assigned: "" }); const [page, setPage] = useState(1); const [selected, setSelected] = useState(params.get("workOrderId") || "")
  const list = useQuery({ queryKey: ["staff", "work-orders", filters, page], queryFn: () => staffClient.workOrders({ ...filters, page }) })
  const detail = useQuery({ queryKey: ["staff", "work-order", selected], queryFn: () => staffClient.workOrder(selected), enabled: Boolean(selected) })
  useEffect(() => setPage(1), [filters])
  const refresh = () => { void client.invalidateQueries({ queryKey: ["staff", "work-orders"] }); void client.invalidateQueries({ queryKey: ["staff", "work-order", selected] }) }
  const update = useMutation({ mutationFn: (body: Parameters<typeof staffClient.updateWorkOrder>[1]) => staffClient.updateWorkOrder(selected, body), onSuccess: refresh })
  const items = list.data?.data.items || []; const item = detail.data?.data; const hasFilters = Boolean(filters.q || filters.status || filters.assigned)
  return <StaffShell title="Công việc sau báo giá" description="Theo dõi hợp đồng, đặt cọc và tiến độ mà không phải cuộn qua hồ sơ dài.">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-emerald-950 px-5 py-5 text-white sm:px-6"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-orange-300 ring-1 ring-white/15"><Factory className="size-5"/></span><div><h2 className="font-display text-xl font-bold">Danh sách công việc</h2><p className="mt-1 text-sm text-emerald-100/70">Chọn hồ sơ để cập nhật hợp đồng, đặt cọc và tiến độ.</p></div></div><div className="flex items-center gap-2"><span className="rounded-full bg-orange-400 px-3 py-1.5 text-xs font-black text-emerald-950">{list.data?.data.total || 0} công việc</span><button type="button" onClick={() => void list.refetch()} className="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 hover:bg-white/20" aria-label="Làm mới"><RefreshCw className={cn("size-4", list.isFetching && "animate-spin")}/></button></div></div>
      <div className="border-b p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><strong className="text-xs uppercase tracking-wider text-slate-500">Tìm kiếm và lọc</strong>{hasFilters && <button type="button" onClick={() => setFilters({ q: "", status: "", assigned: "" })} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-orange-700"><RotateCcw className="size-3.5"/>Xóa bộ lọc</button>}</div><div className="grid gap-3 md:grid-cols-[1fr_220px_180px]"><label className="relative"><Search className="absolute left-3 top-3.5 size-5 text-slate-400"/><Input className="pl-10" value={filters.q} onChange={event => setFilters({ ...filters, q: event.target.value })} placeholder="Mã công việc, hợp đồng, PO..."/></label><Filter value={filters.status} onChange={status => setFilters({ ...filters, status })} first="Mọi trạng thái" options={Object.entries(labels)}/><Filter value={filters.assigned} onChange={assigned => setFilters({ ...filters, assigned })} first="Tất cả phụ trách" options={[["mine", "Của tôi"], ["unassigned", "Chưa phân công"]]}/></div></div>
      <div className="hidden grid-cols-[1fr_1.2fr_180px_160px_52px] gap-4 border-b bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-500 lg:grid"><span>Mã công việc</span><span>Khách hàng</span><span>Trạng thái</span><span className="text-right">Giá trị</span><span/></div>
      <div className="max-h-[min(58vh,620px)] min-h-72 overflow-y-auto">{items.map(value => <button type="button" key={value._id} onClick={() => setSelected(value._id)} className={cn("group grid w-full grid-cols-[1fr_auto] items-center gap-3 border-b border-l-4 border-b-slate-100 border-l-orange-400 px-5 py-4 text-left transition last:border-b-0 hover:bg-orange-50/60 lg:grid-cols-[1fr_1.2fr_180px_160px_52px]", value.integrityIssues?.length && "border-l-red-500 bg-red-50/30")}><div><strong className="block text-emerald-950">{value.code}</strong><span className="mt-1 block text-xs text-slate-500">{new Date(value.createdAt).toLocaleDateString("vi-VN")}</span></div><span className={cn("truncate text-sm font-semibold", value.customer ? "text-slate-700" : "text-red-700")}>{value.customer?.name || "Khách hàng không còn tồn tại"}</span><span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">{labels[value.status]}</span><strong className="text-orange-700 lg:text-right">{money.format(value.agreedTotal)}</strong><span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white"><Eye className="size-4"/></span></button>)}{list.isLoading && <div className="grid min-h-72 place-items-center"><LoaderCircle className="size-8 animate-spin text-orange-600"/></div>}{list.error && <p role="alert" className="m-5 rounded-xl bg-red-50 p-4 text-red-700">{list.error.message}</p>}{!list.isLoading && !items.length && <p className="p-10 text-center text-slate-500">Chưa có công việc phù hợp.</p>}</div>
      <div className="border-t px-4 py-3"><Pagination page={list.data?.data.page || page} pages={list.data?.data.pages || 1} onChange={setPage}/></div>
    </section>
    <WorkspaceModal open={Boolean(selected)} onOpenChange={open => { if (!open && !update.isPending) setSelected("") }} busy={update.isPending} eyebrow={item?.code || "Hồ sơ công việc"} title={item?.request?.title || "Đang tải hồ sơ"} description="Thông tin hợp đồng, tiến độ và lịch sử được gom trong một cửa sổ.">{detail.isLoading ? <div className="grid min-h-72 place-items-center"><LoaderCircle className="size-8 animate-spin text-orange-600"/></div> : item ? <WorkOrderDetail item={item} busy={update.isPending} error={update.error as Error | null} onUpdate={body => update.mutate(body)}/> : <p className="p-10 text-center text-slate-500">Không thể tải hồ sơ.</p>}</WorkspaceModal>
  </StaffShell>
}

function Filter({ value, onChange, first, options }: { value: string; onChange: (value: string) => void; first: string; options: string[][] }) { return <UiSelect ariaLabel={first} value={value} onChange={onChange} options={[{ value: "", label: first }, ...options.map(([optionValue, label]) => ({ value: optionValue, label }))]}/> }
