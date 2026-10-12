import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ShieldCheck } from "lucide-react"
import { useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { usePageMeta } from "@/hooks/use-page-meta"
import { adminClient } from "@/lib/admin-client"
import type { AdminPrivacyRequest } from "@/types/admin"

const statusNames: Record<string, string> = { submitted: "Đã tiếp nhận", reviewing: "Đang xem xét", approved: "Đã chấp thuận", rejected: "Từ chối", completed: "Đã hoàn tất", cancelled: "Khách đã hủy" }

function RequestCard({ item }: { item: AdminPrivacyRequest }) {
  const queryClient = useQueryClient(); const [status, setStatus] = useState(item.status); const [resolution, setResolution] = useState(item.resolution || ""); const [error, setError] = useState("")
  const update = useMutation({ mutationFn: () => adminClient.updatePrivacyRequest(item._id, { status, resolution }), onSuccess: () => { setError(""); void queryClient.invalidateQueries({ queryKey: ["admin", "privacy"] }) }, onError: err => setError(err.message) })
  const closed = ["cancelled", "completed"].includes(item.status)
  return <article className="rounded-3xl border bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-3 md:flex-row"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold text-emerald-950">{item.customer?.name || "Tài khoản không còn tồn tại"}</h2><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">{statusNames[item.status]}</span></div><p className="mt-1 text-sm text-slate-500">{item.customer?.email} · {item.customer?.phone || "Chưa có SĐT"} · {new Date(item.createdAt).toLocaleString("vi-VN")}</p></div></div><div className="mt-5 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Lý do của khách hàng</p><p className="mt-2 whitespace-pre-wrap text-slate-700">{item.reason}</p></div><div className="mt-5 grid gap-4 md:grid-cols-[220px_1fr]"><label className="text-sm font-bold text-slate-700">Trạng thái<select className="field-select mt-2" disabled={closed} value={status} onChange={event => setStatus(event.target.value as AdminPrivacyRequest["status"])}><option value="submitted">Đã tiếp nhận</option><option value="reviewing">Đang xem xét</option><option value="approved">Đã chấp thuận</option><option value="rejected">Từ chối</option><option value="completed">Đã hoàn tất</option></select></label><label className="text-sm font-bold text-slate-700">Kết quả/Ghi chú xử lý<Textarea className="mt-2" disabled={closed} maxLength={3000} value={resolution} onChange={event => setResolution(event.target.value)} placeholder="Nêu dữ liệu đã xóa, dữ liệu phải giữ lại và căn cứ..."/></label></div>{!closed && <Button className="mt-4" disabled={update.isPending || (["rejected", "completed"].includes(status) && resolution.trim().length < 10)} onClick={() => update.mutate()}>{update.isPending ? "Đang lưu..." : "Lưu kết quả xử lý"}</Button>}{error && <p role="alert" className="mt-3 text-sm font-semibold text-red-700">{error}</p>}</article>
}

export function AdminPrivacyPage() {
  usePageMeta("Yêu cầu quyền riêng tư", "Tiếp nhận và xử lý yêu cầu dữ liệu cá nhân của khách hàng.")
  const [status, setStatus] = useState(""); const [page, setPage] = useState(1)
  const requests = useQuery({ queryKey: ["admin", "privacy", status, page], queryFn: () => adminClient.privacyRequests(status, page) })
  return <AdminShell title="Quyền riêng tư" description="Theo dõi yêu cầu xóa tài khoản. Không xóa chứng từ giao dịch trước khi xác định thời hạn lưu trữ bắt buộc."><div className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center"><p className="flex items-center gap-2 font-bold text-emerald-950"><ShieldCheck className="size-5 text-orange-600"/>{requests.data?.data.total || 0} yêu cầu</p><select className="field-select sm:w-52" value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option value="">Tất cả trạng thái</option>{Object.entries(statusNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><div className="space-y-5">{requests.data?.data.items.map(item => <RequestCard key={item._id} item={item}/>)}</div>{requests.isLoading && <p className="rounded-2xl bg-white p-10 text-center">Đang tải...</p>}{requests.error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{requests.error.message}</p>}{!requests.isLoading && !requests.data?.data.items.length && <p className="rounded-2xl bg-white p-10 text-center text-slate-500">Chưa có yêu cầu phù hợp.</p>}<Pagination page={requests.data?.data.page || page} pages={requests.data?.data.pages || 1} onChange={setPage}/></AdminShell>
}
