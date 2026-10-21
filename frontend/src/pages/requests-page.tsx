import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ChevronDown, Download, Eye, FileCog, FileUp, LoaderCircle, Send, XCircle } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { useSearchParams } from "react-router-dom"
import { z } from "zod"
import { CustomerShell } from "@/components/customer/customer-shell"
import { RequestConversation } from "@/components/customer/request-conversation-realtime"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { IntegerInput } from "@/components/ui/numeric-input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { usePageMeta } from "@/hooks/use-page-meta"
import { customerClient } from "@/lib/customer-client"
import { scrollToPageTop } from "@/lib/utils"
import type { CustomerRequest, RequestAttachment } from "@/types/customer"

const schema = z.object({
  requestType: z.enum(["machining", "product_quote", "consulting"]), title: z.string().trim().min(5, "Tiêu đề cần ít nhất 5 ký tự").max(200),
  description: z.string().trim().min(10, "Mô tả cần ít nhất 10 ký tự").max(5000), material: z.string().trim().max(200),
  quantity: z.string().regex(/^(|[1-9][0-9]{0,6})$/, "Số lượng không hợp lệ"), dimensions: z.string().trim().max(300), desiredDate: z.string(), budget: z.string().trim().max(100)
})
type RequestData = z.infer<typeof schema>

const statuses: Record<string, { label: string; className: string }> = {
  submitted: { label: "Đã nhận", className: "bg-orange-50 text-orange-800" }, reviewing: { label: "Đang báo giá", className: "bg-blue-50 text-blue-800" },
  need_more_info: { label: "Đang báo giá", className: "bg-blue-50 text-blue-800" }, quoted: { label: "Chờ xác nhận", className: "bg-violet-50 text-violet-800" },
  accepted: { label: "Đã chốt", className: "bg-emerald-50 text-emerald-800" }, rejected: { label: "Không thực hiện", className: "bg-slate-100 text-slate-600" }, cancelled: { label: "Không thực hiện", className: "bg-slate-100 text-slate-600" }
}
const typeNames = { machining: "Gia công theo yêu cầu", product_quote: "Báo giá sản phẩm", consulting: "Tư vấn kỹ thuật" }

export function RequestsPage() {
  usePageMeta("Yêu cầu gia công", "Gửi bản vẽ và theo dõi yêu cầu kỹ thuật.")
  const [params] = useSearchParams()
  const queryClient = useQueryClient()
  const toast = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState("")
  const [cancellingRequest, setCancellingRequest] = useState<CustomerRequest | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<CustomerRequest | null>(null)
  const productId = params.get("productId") || ""
  const productName = params.get("product") || ""
  const form = useForm<RequestData>({ resolver: zodResolver(schema), defaultValues: { requestType: productName ? "product_quote" : "machining", title: productName ? `Báo giá ${productName}` : "", description: productName ? `Tôi cần tư vấn và báo giá sản phẩm ${productName}.` : "", material: "", quantity: "", dimensions: "", desiredDate: "", budget: "Chưa xác định" } })
  const requestType = form.watch("requestType")
  const requests = useQuery({ queryKey: ["customer", "requests"], queryFn: customerClient.requests })
  const activeRequest = selectedRequest ? requests.data?.data.find(item => item._id === selectedRequest._id) || selectedRequest : null
  useEffect(() => { const requestId = params.get("requestId"); const item = requests.data?.data.find(value => value._id === requestId); if (item) setSelectedRequest(item) }, [params, requests.data])
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: ["customer", "requests"] }); void queryClient.invalidateQueries({ queryKey: ["customer", "summary"] }) }
  const create = useMutation({ mutationFn: customerClient.createRequest, onSuccess: result => { toast.success(`Đã gửi yêu cầu ${result.data.code}. Kỹ thuật sẽ kiểm tra trong giờ làm việc.`, { title: "Gửi yêu cầu thành công" }); form.reset({ requestType: "machining", title: "", description: "", material: "", quantity: "", dimensions: "", desiredDate: "", budget: "Chưa xác định" }); setFiles([]); if (fileInput.current) fileInput.current.value = ""; scrollToPageTop(); refresh() }, onError: error => toast.error(error.message, { title: "Không thể gửi yêu cầu" }) })
  const cancel = useMutation({ mutationFn: customerClient.cancelRequest, onSuccess: result => { toast.success(result.message || "Đã hủy yêu cầu"); setCancellingRequest(null); setSelectedRequest(null); scrollToPageTop(); refresh() }, onError: error => toast.error(error.message) })

  const submit = form.handleSubmit(data => {
    setFileError("")
    if (files.length > 5 || files.some(file => file.size > 10 * 1024 * 1024)) { setFileError("Tối đa 5 tệp, mỗi tệp không quá 10MB"); return }
    const body = new FormData()
    const normalized = data.requestType === "machining" ? data : { ...data, material: "", quantity: "", dimensions: "", desiredDate: "" }
    Object.entries(normalized).forEach(([key, value]) => { if (value) body.append(key, value) })
    if (productId) body.append("productId", productId)
    files.forEach(file => body.append("attachments", file))
    create.mutate(body)
  })

  const download = async (request: CustomerRequest, attachment: RequestAttachment) => {
    try {
      const blob = await customerClient.downloadAttachment(request._id, attachment._id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = attachment.originalName; anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) { toast.error(error instanceof Error ? error.message : "Không thể tải tệp") }
  }

  if (requests.error) return <CustomerShell title="Yêu cầu gia công & báo giá" description="Không thể tải lịch sử yêu cầu."><p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{requests.error.message}</p></CustomerShell>

  return <CustomerShell title="Yêu cầu gia công & báo giá" description="Gửi thông số và bản vẽ một lần; mỗi yêu cầu có mã riêng để theo dõi xuyên suốt.">
    {activeRequest ? <div className="space-y-5"><Button variant="outline" onClick={() => setSelectedRequest(null)}><ArrowLeft className="size-4"/>Quay lại danh sách yêu cầu</Button><div><p className="text-sm font-black uppercase tracking-wider text-orange-700">{activeRequest.code}</p><h2 className="mt-2 font-display text-3xl font-bold text-emerald-950">{activeRequest.title}</h2><p className="mt-2 text-slate-500">{typeNames[activeRequest.requestType]} · {dateTime(activeRequest.createdAt)}</p></div><CustomerRequestDetail request={activeRequest} onDownload={attachment => void download(activeRequest, attachment)} onCancel={() => setCancellingRequest(activeRequest)}/></div> : <div className="space-y-6">
      <details open={Boolean(productName)} className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-gradient-to-r from-orange-50 to-white px-5 py-5 sm:px-7"><span className="flex items-center gap-3"><span className="grid size-12 place-items-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-200"><FileCog className="size-6"/></span><span><strong className="block font-display text-xl text-emerald-950">Tạo yêu cầu mới</strong><span className="mt-1 block text-sm text-slate-500">Chỉ mở biểu mẫu khi bạn cần gửi một yêu cầu mới.</span></span></span><ChevronDown className="size-5 shrink-0 text-slate-500 transition group-open:rotate-180"/></summary><form className="border-t border-slate-100 p-5 sm:p-7" onSubmit={submit}><div className="grid gap-x-5 lg:grid-cols-2"><Field label="Loại yêu cầu *" error={form.formState.errors.requestType?.message}><Select ariaLabel="Loại yêu cầu" value={requestType} onChange={value => form.setValue("requestType", value as RequestData["requestType"], { shouldDirty: true, shouldValidate: true })} options={[{ value: "machining", label: "Gia công theo yêu cầu" }, { value: "product_quote", label: "Báo giá sản phẩm" }, { value: "consulting", label: "Tư vấn kỹ thuật" }]}/></Field><Field label="Tiêu đề *" error={form.formState.errors.title?.message}><Input placeholder="Ví dụ: Gia công 200 chi tiết inox 304" {...form.register("title")}/></Field></div><Field label="Mô tả yêu cầu *" error={form.formState.errors.description?.message}><Textarea className="min-h-32" placeholder={requestType === "machining" ? "Công dụng, dung sai, bề mặt, tiến độ và yêu cầu nghiệm thu..." : "Mô tả ngắn nhu cầu để chúng tôi tư vấn chính xác..."} {...form.register("description")}/></Field>{requestType === "machining" && <div className="grid gap-x-5 sm:grid-cols-2"><Field label="Vật liệu"><Input placeholder="Inox 304, thép SS400..." {...form.register("material")}/></Field><Field label="Số lượng" error={form.formState.errors.quantity?.message}><IntegerInput min="1" placeholder="100" {...form.register("quantity")}/></Field><Field label="Kích thước / dung sai"><Input placeholder="200 × 100 × 3mm" {...form.register("dimensions")}/></Field><Field label="Ngày mong muốn"><Input type="date" {...form.register("desiredDate")}/></Field></div>}<Field label="Ngân sách dự kiến"><Select ariaLabel="Ngân sách dự kiến" value={form.watch("budget")} onChange={value => form.setValue("budget", value, { shouldDirty: true })} options={["Chưa xác định", "Dưới 10 triệu", "10 - 50 triệu", "50 - 200 triệu", "Trên 200 triệu"].map(value => ({ value, label: value }))}/></Field><label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-orange-400 hover:bg-orange-50/40"><FileUp className="mx-auto size-8 text-orange-600"/><span className="mt-2 block font-bold text-emerald-950">{requestType === "machining" ? "Đính kèm bản vẽ" : "Đính kèm tài liệu (nếu có)"}</span><span className="mt-1 block text-xs leading-5 text-slate-500">PDF, ảnh, DXF, DWG, STEP, IGES hoặc ZIP · tối đa 5 tệp × 10MB</span><input ref={fileInput} className="mx-auto mt-3 block max-w-md text-sm" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.dxf,.dwg,.step,.stp,.iges,.igs,.zip" onChange={event => setFiles(Array.from(event.target.files || []))}/></label>{files.length > 0 && <p className="mt-2 text-sm font-semibold text-slate-600">Đã chọn {files.length} tệp</p>}{fileError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{fileError}</p>}<div className="mt-5 flex justify-end"><Button size="lg" disabled={create.isPending}>{create.isPending ? <><LoaderCircle className="size-5 animate-spin"/>Đang gửi...</> : <><Send className="size-5"/>Gửi yêu cầu</>}</Button></div></form></details>
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_-32px_rgba(15,23,42,.35)]"><div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 px-5 py-6 text-white sm:px-7"><div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">Hồ sơ của bạn</p><h2 className="mt-1 font-display text-2xl font-bold">Danh sách yêu cầu</h2><p className="mt-1 text-sm text-emerald-100/75">Theo dõi yêu cầu, báo giá và phản hồi trong một nơi.</p></div><span className="rounded-full bg-orange-400 px-3.5 py-2 text-xs font-black text-emerald-950">{requests.data?.data.length || 0} yêu cầu</span></div>{requests.isLoading ? <Loading/> : !requests.data?.data.length ? <div className="grid min-h-72 place-items-center px-6 text-center"><div><FileCog className="mx-auto size-12 text-slate-300"/><p className="mt-4 font-bold text-slate-700">Bạn chưa có yêu cầu nào.</p><p className="mt-1 text-sm text-slate-400">Mở biểu mẫu phía trên để gửi yêu cầu đầu tiên.</p></div></div> : <><div className="hidden grid-cols-[minmax(0,1.35fr)_minmax(160px,.7fr)_140px_210px_90px] gap-5 border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-[11px] font-black uppercase tracking-[.12em] text-slate-500 lg:grid"><span>Yêu cầu</span><span>Loại</span><span>Ngày gửi</span><span>Trạng thái</span><span className="text-right">Thao tác</span></div><div>{requests.data.data.map(request => { const status = statuses[request.status] || { label: request.status, className: "bg-slate-100 text-slate-700" }; return <button type="button" key={request._id} onClick={() => setSelectedRequest(request)} className="group block w-full border-b border-slate-100 px-5 py-5 text-left transition last:border-b-0 hover:bg-orange-50/50 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(160px,.7fr)_140px_210px_90px] lg:items-center lg:gap-5 lg:px-6 lg:py-4"><div className="min-w-0"><span className="text-xs font-black uppercase tracking-wider text-orange-700">{request.code}</span><strong className="mt-1 block truncate text-base text-emerald-950">{request.title}</strong><div className="mt-3 flex flex-wrap items-center gap-2 lg:hidden"><span className="text-xs text-slate-500">{typeNames[request.requestType]}</span><span className="text-slate-300">•</span><span className="text-xs text-slate-500">{new Date(request.createdAt).toLocaleDateString("vi-VN")}</span><span className={`rounded-full px-2.5 py-1 text-xs font-black ${status.className}`}>{status.label}</span></div></div><span className="hidden truncate text-sm text-slate-600 lg:block">{typeNames[request.requestType]}</span><span className="hidden text-sm text-slate-500 lg:block">{new Date(request.createdAt).toLocaleDateString("vi-VN")}</span><div className="hidden flex-wrap items-center gap-2 lg:flex"><span className={`rounded-full px-3 py-1.5 text-xs font-black ${status.className}`}>{status.label}</span>{request.latestQuotation?.status === "sent" && <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-black text-orange-800">Báo giá mới</span>}{Boolean(request.unreadCount) && <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-black text-white">{request.unreadCount} mới</span>}</div><span className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-orange-50 px-3 text-sm font-bold text-orange-700 transition group-hover:bg-orange-600 group-hover:text-white lg:mt-0 lg:justify-self-end">Xem<Eye className="size-4"/></span></button>})}</div></>}</section>
    </div>}
    <ConfirmDialog open={Boolean(cancellingRequest)} title="Hủy yêu cầu này?" description={cancellingRequest ? `Yêu cầu ${cancellingRequest.code} sẽ được chuyển sang trạng thái đã hủy và không tiếp tục xử lý.` : ""} confirmLabel="Hủy yêu cầu" destructive busy={cancel.isPending} onOpenChange={open => { if (!open) setCancellingRequest(null) }} onConfirm={() => { if (cancellingRequest) cancel.mutate(cancellingRequest._id) }}/>
  </CustomerShell>
}

function CustomerRequestDetail({ request, onDownload, onCancel }: { request: CustomerRequest; onDownload: (attachment: RequestAttachment) => void; onCancel: () => void }) {
  const status = statuses[request.status] || { label: request.status, className: "bg-slate-100 text-slate-700" }
  return <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black ${status.className}`}>{status.label}</span>{request.latestQuotation?.status === "sent" && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-800">Có báo giá mới</span>}{Boolean(request.unreadCount) && <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white">{request.unreadCount} tin mới</span>}</div><p className="mt-4 leading-7 text-slate-700">{request.description}</p></div>{["submitted", "need_more_info"].includes(request.status) && <Button size="sm" variant="outline" onClick={onCancel}><XCircle className="size-4 text-red-600"/>Hủy yêu cầu</Button>}</div>{request.attachments.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{request.attachments.map(attachment => <button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-800" key={attachment._id} onClick={() => onDownload(attachment)}><Download className="size-4"/>{attachment.originalName}</button>)}</div>}<details className="group mt-5 border-t border-slate-100 pt-4"><summary className="flex min-h-10 cursor-pointer list-none items-center justify-between font-bold text-emerald-950">Tiến trình xử lý<ChevronDown className="size-5 transition group-open:rotate-180"/></summary><ol className="mt-3 space-y-3">{request.timeline.map((item, index) => <li className="flex gap-3 text-sm" key={`${item.at}-${index}`}><span className="mt-1 size-2 shrink-0 rounded-full bg-orange-500"/><div><strong>{statuses[item.status]?.label || item.status}</strong><p className="mt-1 text-slate-500">{item.message}</p><time className="mt-1 block text-xs text-slate-400">{dateTime(item.at)}</time></div></li>)}</ol></details><RequestConversation requestId={request._id}/></article>
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="mb-4 block text-sm font-bold text-slate-700"><span className="mb-2 block">{label}</span>{children}{error && <span className="mt-1 block text-sm text-red-600">{error}</span>}</label> }
const dateTime = (value: string) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
function Loading() { return <div className="grid min-h-60 place-items-center"><LoaderCircle className="size-8 animate-spin text-orange-600"/></div> }
