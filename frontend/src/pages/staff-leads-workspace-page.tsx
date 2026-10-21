import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Eye, LoaderCircle, RefreshCw, RotateCcw, Search, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Pagination } from "@/components/pagination"
import { StaffShell } from "@/components/staff/staff-shell"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useToast } from "@/components/ui/toast"
import { WorkspaceModal } from "@/components/workspace-modal"
import { usePageMeta } from "@/hooks/use-page-meta"
import { leadStageLabel, stageFilters } from "@/lib/simple-status"
import { staffClient } from "@/lib/staff-client"
import { cn } from "@/lib/utils"
import { LeadDetail } from "@/pages/staff-leads-page"
import type { Priority } from "@/types/staff"

const priorityNames: Record<Priority, string> = { low: "Thấp", normal: "Bình thường", high: "Cao", urgent: "Khẩn" }

export function StaffLeadsWorkspacePage() {
  usePageMeta("Quản lý Lead", "Danh sách gọn, xử lý khách hàng tiềm năng trong cửa sổ riêng.")
  const [params] = useSearchParams(); const client = useQueryClient(); const navigate = useNavigate(); const toast = useToast()
  const [filters, setFilters] = useState({ q: "", stage: "", priority: params.get("priority") || "", assigned: params.get("assigned") || "" })
  const [page, setPage] = useState(1); const [selected, setSelected] = useState(params.get("leadId") || "")
  const list = useQuery({ queryKey: ["staff", "leads", filters, page], queryFn: () => staffClient.leads({ ...filters, page }) })
  const detail = useQuery({ queryKey: ["staff", "lead", selected], queryFn: () => staffClient.lead(selected), enabled: Boolean(selected) })
  useEffect(() => setPage(1), [filters])
  const refresh = () => { void client.invalidateQueries({ queryKey: ["staff", "leads"] }); void client.invalidateQueries({ queryKey: ["staff", "lead", selected] }); void client.invalidateQueries({ queryKey: ["staff", "dashboard"] }) }
  const update = useMutation({ mutationFn: (body: Parameters<typeof staffClient.updateLead>[1]) => staffClient.updateLead(selected, body), onSuccess: refresh })
  const note = useMutation({ mutationFn: (content: string) => staffClient.addLeadNote(selected, content), onSuccess: refresh })
  const convert = useMutation({ mutationFn: () => staffClient.convertLead(selected), onSuccess: result => { refresh(); toast.success(result.message || `Đã tạo yêu cầu ${result.data.requestCode}`); navigate(`/staff/requests?requestId=${result.data.requestId}&q=${encodeURIComponent(result.data.requestCode)}`) }, onError: error => toast.error(error.message) })
  const items = list.data?.data.items || []; const lead = detail.data?.data; const hasFilters = Boolean(filters.q || filters.stage || filters.priority || filters.assigned)

  return <StaffShell title="Khách hàng tiềm năng" description="Tìm nhanh trong danh sách và mở hồ sơ xử lý mà không làm trang kéo dài.">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 px-5 py-5 text-white sm:px-6"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-orange-300 ring-1 ring-white/15"><Sparkles className="size-5"/></span><div><h2 className="font-display text-xl font-bold">Danh sách khách tiềm năng</h2><p className="mt-1 text-sm text-emerald-100/70">Chọn một khách để liên hệ, ghi chú hoặc chuyển sang báo giá.</p></div></div><div className="flex items-center gap-2"><span className="rounded-full bg-orange-400 px-3 py-1.5 text-xs font-black text-emerald-950">{list.data?.data.total || 0} lead</span><button type="button" onClick={() => void list.refetch()} className="grid size-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 hover:bg-white/20" aria-label="Làm mới"><RefreshCw className={cn("size-4", list.isFetching && "animate-spin")}/></button></div></div>
      <div className="border-b p-4 sm:p-5"><div className="mb-3 flex items-center justify-between"><strong className="text-xs uppercase tracking-wider text-slate-500">Tìm kiếm và lọc</strong>{hasFilters && <button type="button" onClick={() => setFilters({ q: "", stage: "", priority: "", assigned: "" })} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-orange-700"><RotateCcw className="size-3.5"/>Xóa bộ lọc</button>}</div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_190px_170px_170px]"><label className="relative"><Search className="absolute left-3 top-3.5 size-5 text-slate-400"/><Input className="pl-10" value={filters.q} onChange={event => setFilters({ ...filters, q: event.target.value })} placeholder="Mã, tên, điện thoại..."/></label><Filter value={filters.stage} onChange={stage => setFilters({ ...filters, stage })} first="Mọi trạng thái" options={stageFilters}/><Filter value={filters.priority} onChange={priority => setFilters({ ...filters, priority })} first="Mọi ưu tiên" options={Object.entries(priorityNames)}/><Filter value={filters.assigned} onChange={assigned => setFilters({ ...filters, assigned })} first="Tất cả phụ trách" options={[["mine", "Của tôi"], ["unassigned", "Chưa phân công"]]}/></div></div>
      <div className="hidden grid-cols-[1.1fr_1fr_150px_140px_52px] gap-4 border-b bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-wider text-slate-500 lg:grid"><span>Khách hàng</span><span>Dịch vụ</span><span>Trạng thái</span><span>Ưu tiên</span><span/></div>
      <div className="max-h-[min(58vh,620px)] min-h-72 overflow-y-auto">{items.map(item => <button type="button" key={item._id} onClick={() => setSelected(item._id)} className="group grid w-full grid-cols-[1fr_auto] items-center gap-3 border-b border-l-4 border-b-slate-100 border-l-orange-400 px-5 py-4 text-left transition last:border-b-0 hover:bg-orange-50/60 lg:grid-cols-[1.1fr_1fr_150px_140px_52px]"><div className="min-w-0"><strong className="block truncate text-emerald-950">{item.name}</strong><span className="mt-1 block text-xs font-bold text-slate-500">{item.code}</span></div><span className="truncate text-sm text-slate-600">{item.serviceType || "Chưa chọn dịch vụ"}</span><span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">{leadStageLabel(item.status)}</span><span className="text-sm font-bold text-orange-700">{priorityNames[item.priority]}</span><span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white"><Eye className="size-4"/></span></button>)}{list.isLoading && <div className="grid min-h-72 place-items-center"><LoaderCircle className="size-8 animate-spin text-orange-600"/></div>}{list.error && <p role="alert" className="m-5 rounded-xl bg-red-50 p-4 text-red-700">{list.error.message}</p>}{!list.isLoading && !items.length && <p className="p-10 text-center text-slate-500">Không có khách tiềm năng phù hợp.</p>}</div>
      <div className="border-t px-4 py-3"><Pagination page={list.data?.data.page || page} pages={list.data?.data.pages || 1} onChange={setPage}/></div>
    </section>
    <WorkspaceModal open={Boolean(selected)} onOpenChange={open => { if (!open && !update.isPending && !note.isPending && !convert.isPending) setSelected("") }} busy={update.isPending || note.isPending || convert.isPending} eyebrow={lead?.code || "Hồ sơ lead"} title={lead?.name || "Đang tải hồ sơ"} description="Liên hệ, cập nhật và ghi chú trong cùng một cửa sổ.">{detail.isLoading ? <div className="grid min-h-72 place-items-center"><LoaderCircle className="size-8 animate-spin text-orange-600"/></div> : lead ? <LeadDetail lead={lead} busy={update.isPending || note.isPending || convert.isPending} error={(update.error || note.error || convert.error) as Error | null} onUpdate={body => update.mutate(body)} onNote={content => note.mutate(content)} onConvert={() => convert.mutate()}/> : <p className="p-10 text-center text-slate-500">Không thể tải hồ sơ.</p>}</WorkspaceModal>
  </StaffShell>
}

function Filter({ value, onChange, first, options }: { value: string; onChange: (value: string) => void; first: string; options: string[][] }) { return <Select ariaLabel={first} value={value} onChange={onChange} options={[{ value: "", label: first }, ...options.map(([optionValue, label]) => ({ value: optionValue, label }))]}/> }
