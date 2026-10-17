import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  ArrowLeft, Check, ClipboardList, Clock3, Download, Eye, FileCog, FileText,
  FileUp, LoaderCircle, MessageSquareText, Plus, Send, Sparkles, XCircle,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { FormEventHandler, RefObject } from "react"
import { useForm } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"
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
import { cn, scrollToPageTop } from "@/lib/utils"
import type { CustomerRequest, RequestAttachment } from "@/types/customer"

const schema = z.object({
  requestType: z.enum(["machining", "product_quote", "consulting"]),
  title: z.string().trim().min(5, "Tiêu đề cần ít nhất 5 ký tự").max(200),
  description: z.string().trim().min(10, "Mô tả cần ít nhất 10 ký tự").max(5000),
  material: z.string().trim().max(200),
  quantity: z.string().regex(/^(|[1-9][0-9]{0,6})$/, "Số lượng không hợp lệ"),
  dimensions: z.string().trim().max(300),
  desiredDate: z.string(),
  budget: z.string().trim().max(100),
})
type RequestData = z.infer<typeof schema>
type DetailSection = "overview" | "quotes" | "messages" | "agreement"

const statuses: Record<string, { label: string; className: string }> = {
  submitted: { label: "Đang chờ tiếp nhận", className: "bg-blue-50 text-blue-800" },
  reviewing: { label: "Đang xử lý", className: "bg-violet-50 text-violet-800" },
  need_more_info: { label: "Cần bạn bổ sung", className: "bg-amber-50 text-amber-800" },
  quoted: { label: "Chờ bạn xác nhận", className: "bg-orange-50 text-orange-800" },
  accepted: { label: "Đã chuyển thành dự án", className: "bg-emerald-50 text-emerald-800" },
  rejected: { label: "Không thực hiện", className: "bg-red-50 text-red-700" },
  cancelled: { label: "Đã hủy", className: "bg-slate-100 text-slate-700" },
}
const typeNames: Record<CustomerRequest["requestType"], string> = {
  machining: "Gia công theo yêu cầu",
  product_quote: "Báo giá sản phẩm",
  consulting: "Tư vấn kỹ thuật",
}

export function CustomerRequestsWorkspacePage() {
  usePageMeta("Yêu cầu gia công", "Gửi bản vẽ và theo dõi yêu cầu kỹ thuật.")
  const [params] = useSearchParams()
  const productId = params.get("productId") || ""
  const productName = params.get("product") || ""
  const queryClient = useQueryClient()
  const toast = useToast()
  const fileInput = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState("")
  const [cancellingRequest, setCancellingRequest] = useState<CustomerRequest | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<CustomerRequest | null>(null)
  const [showCreate, setShowCreate] = useState(Boolean(productName))
  const form = useForm<RequestData>({
    resolver: zodResolver(schema),
    defaultValues: {
      requestType: productName ? "product_quote" : "machining",
      title: productName ? `Báo giá ${productName}` : "",
      description: productName ? `Tôi cần tư vấn và báo giá sản phẩm ${productName}.` : "",
      material: "", quantity: "", dimensions: "", desiredDate: "", budget: "Chưa xác định",
    },
  })
  const requestType = form.watch("requestType")
  const requests = useQuery({ queryKey: ["customer", "requests"], queryFn: customerClient.requests })
  const activeRequest = selectedRequest
    ? requests.data?.data.find(item => item._id === selectedRequest._id) || selectedRequest
    : null

  useEffect(() => {
    const requestId = params.get("requestId")
    const item = requests.data?.data.find(value => value._id === requestId)
    if (item) setSelectedRequest(item)
  }, [params, requests.data])

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["customer", "requests"] })
    void queryClient.invalidateQueries({ queryKey: ["customer", "summary"] })
  }
  const create = useMutation({
    mutationFn: customerClient.createRequest,
    onSuccess: result => {
      toast.success(`Đã gửi yêu cầu ${result.data.code}. Kỹ thuật sẽ kiểm tra trong giờ làm việc.`, { title: "Gửi yêu cầu thành công" })
      form.reset({ requestType: "machining", title: "", description: "", material: "", quantity: "", dimensions: "", desiredDate: "", budget: "Chưa xác định" })
      setFiles([])
      setShowCreate(false)
      if (fileInput.current) fileInput.current.value = ""
      scrollToPageTop()
      refresh()
    },
    onError: error => toast.error(error.message, { title: "Không thể gửi yêu cầu" }),
  })
  const cancel = useMutation({
    mutationFn: customerClient.cancelRequest,
    onSuccess: result => {
      toast.success(result.message || "Đã hủy yêu cầu")
      setCancellingRequest(null)
      setSelectedRequest(null)
      scrollToPageTop()
      refresh()
    },
    onError: error => toast.error(error.message),
  })

  const submit = form.handleSubmit(data => {
    setFileError("")
    if (files.length > 5 || files.some(file => file.size > 10 * 1024 * 1024)) {
      setFileError("Tối đa 5 tệp, mỗi tệp không quá 10MB")
      return
    }
    const body = new FormData()
    const normalized = data.requestType === "machining"
      ? data
      : { ...data, material: "", quantity: "", dimensions: "", desiredDate: "" }
    Object.entries(normalized).forEach(([key, value]) => { if (value) body.append(key, value) })
    if (productId) body.append("productId", productId)
    files.forEach(file => body.append("attachments", file))
    create.mutate(body)
  })

  const download = async (request: CustomerRequest, attachment: RequestAttachment) => {
    try {
      const blob = await customerClient.downloadAttachment(request._id, attachment._id)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = attachment.originalName
      anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải tệp")
    }
  }

  if (requests.error) return <CustomerShell title="Yêu cầu gia công & báo giá" description="Không thể tải lịch sử yêu cầu."><p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{requests.error.message}</p></CustomerShell>

  return <CustomerShell title="Yêu cầu gia công & báo giá" description="Mỗi yêu cầu có một hồ sơ riêng: thông tin, báo giá và trao đổi được tách rõ ràng.">
    {activeRequest
      ? <div className="space-y-5">
        <Button variant="outline" onClick={() => setSelectedRequest(null)}><ArrowLeft className="size-4"/>Quay lại danh sách</Button>
        <CustomerRequestDetail request={activeRequest} onDownload={attachment => void download(activeRequest, attachment)} onCancel={() => setCancellingRequest(activeRequest)}/>
      </div>
      : showCreate
        ? <CreateRequestForm form={form} requestType={requestType} files={files} fileError={fileError} fileInput={fileInput} busy={create.isPending} onFiles={setFiles} onSubmit={submit} onBack={() => { setShowCreate(false); scrollToPageTop() }}/>
        : <RequestList requests={requests.data?.data || []} loading={requests.isLoading} onCreate={() => { setShowCreate(true); scrollToPageTop() }} onSelect={request => { setSelectedRequest(request); scrollToPageTop() }}/>
    }
    <ConfirmDialog open={Boolean(cancellingRequest)} title="Hủy yêu cầu này?" description={cancellingRequest ? `Yêu cầu ${cancellingRequest.code} sẽ được chuyển sang trạng thái đã hủy và không tiếp tục xử lý.` : ""} confirmLabel="Hủy yêu cầu" destructive busy={cancel.isPending} onOpenChange={open => { if (!open) setCancellingRequest(null) }} onConfirm={() => { if (cancellingRequest) cancel.mutate(cancellingRequest._id) }}/>
  </CustomerShell>
}

function RequestList({ requests, loading, onCreate, onSelect }: { requests: CustomerRequest[]; loading: boolean; onCreate: () => void; onSelect: (request: CustomerRequest) => void }) {
  return <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_-38px_rgba(15,23,42,.4)]">
    <header className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 px-5 py-7 text-white sm:px-8">
      <div className="absolute -right-16 -top-20 size-56 rounded-full bg-orange-400/10 blur-2xl"/>
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-300">Hồ sơ của bạn</p><h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">Yêu cầu gia công</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100/75">Chọn một yêu cầu để xem đúng phần bạn cần. Báo giá và trao đổi không còn trộn chung trong một cửa sổ.</p></div>
        <Button size="lg" onClick={onCreate}><Plus className="size-5"/>Tạo yêu cầu mới</Button>
      </div>
      <div className="relative mt-6 flex flex-wrap gap-3"><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold ring-1 ring-white/10">{requests.length} yêu cầu</span><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold ring-1 ring-white/10">{requests.filter(item => !["accepted", "rejected", "cancelled"].includes(item.status)).length} đang xử lý</span></div>
    </header>
    {loading ? <Loading/> : !requests.length ? <div className="grid min-h-80 place-items-center px-6 text-center"><div><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-orange-50 text-orange-600"><FileCog className="size-7"/></span><p className="mt-4 font-bold text-emerald-950">Bạn chưa có yêu cầu nào</p><p className="mt-1 text-sm text-slate-500">Tạo hồ sơ đầu tiên để gửi thông số và nhận báo giá.</p><Button className="mt-5" onClick={onCreate}><Plus className="size-4"/>Tạo yêu cầu</Button></div></div> : <>
      <div className="hidden grid-cols-[minmax(0,1.35fr)_minmax(160px,.7fr)_140px_210px_90px] gap-5 border-b border-slate-200 bg-slate-50/80 px-6 py-3 text-[11px] font-black uppercase tracking-[.12em] text-slate-500 lg:grid"><span>Yêu cầu</span><span>Loại</span><span>Ngày gửi</span><span>Trạng thái</span><span className="text-right">Thao tác</span></div>
      <div>{requests.map(request => {
        const status = statuses[request.status] || { label: request.status, className: "bg-slate-100 text-slate-700" }
        return <button type="button" key={request._id} onClick={() => onSelect(request)} className="group block w-full border-b border-slate-100 px-5 py-5 text-left transition last:border-b-0 hover:bg-orange-50/50 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(160px,.7fr)_140px_210px_90px] lg:items-center lg:gap-5 lg:px-6 lg:py-4">
          <div className="min-w-0"><span className="text-xs font-black uppercase tracking-wider text-orange-700">{request.code}</span><strong className="mt-1 block truncate text-base text-emerald-950">{request.title}</strong><div className="mt-3 flex flex-wrap items-center gap-2 lg:hidden"><span className="text-xs text-slate-500">{typeNames[request.requestType]}</span><span className="text-slate-300">•</span><span className="text-xs text-slate-500">{date(request.createdAt)}</span><span className={cn("rounded-full px-2.5 py-1 text-xs font-black", status.className)}>{status.label}</span></div></div>
          <span className="hidden truncate text-sm text-slate-600 lg:block">{typeNames[request.requestType]}</span><span className="hidden text-sm text-slate-500 lg:block">{date(request.createdAt)}</span>
          <div className="hidden flex-wrap items-center gap-2 lg:flex"><span className={cn("rounded-full px-3 py-1.5 text-xs font-black", status.className)}>{status.label}</span>{request.latestQuotation?.status === "sent" && <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-black text-orange-800">Báo giá mới</span>}{Boolean(request.unreadCount) && <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-black text-white">{request.unreadCount} mới</span>}</div>
          <span className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-orange-50 px-3 text-sm font-bold text-orange-700 transition group-hover:bg-orange-600 group-hover:text-white lg:mt-0 lg:justify-self-end">Mở<Eye className="size-4"/></span>
        </button>
      })}</div>
    </>}
  </section>
}

interface CreateRequestFormProps {
  form: UseFormReturn<RequestData>
  requestType: RequestData["requestType"]
  files: File[]
  fileError: string
  fileInput: RefObject<HTMLInputElement | null>
  busy: boolean
  onFiles: (files: File[]) => void
  onSubmit: FormEventHandler<HTMLFormElement>
  onBack: () => void
}

function CreateRequestForm({ form, requestType, files, fileError, fileInput, busy, onFiles, onSubmit, onBack }: CreateRequestFormProps) {
  return <div className="space-y-5">
    <Button variant="outline" onClick={onBack}><ArrowLeft className="size-4"/>Quay lại danh sách</Button>
    <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_24px_70px_-38px_rgba(15,23,42,.4)]">
      <header className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 px-5 py-7 text-white sm:px-8"><div className="flex items-center gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-orange-500 shadow-lg shadow-black/20"><FileCog className="size-6"/></span><div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">Hồ sơ mới</p><h2 className="mt-1 font-display text-2xl font-bold">Tạo yêu cầu gia công</h2><p className="mt-1 text-sm text-emerald-100/70">Điền thông tin một lần. Kỹ thuật sẽ kiểm tra và phản hồi trên chính hồ sơ này.</p></div></div></header>
      <form className="p-5 sm:p-8" onSubmit={onSubmit}>
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-orange-50 p-4 text-sm leading-6 text-orange-950"><Sparkles className="size-5 shrink-0 text-orange-600"/><span><strong>Mẹo:</strong> Mô tả rõ vật liệu, số lượng và tiến độ mong muốn để báo giá chính xác hơn.</span></div>
        <div className="grid gap-x-5 lg:grid-cols-2">
          <Field label="Loại yêu cầu *" error={form.formState.errors.requestType?.message}><Select ariaLabel="Loại yêu cầu" value={requestType} onChange={value => form.setValue("requestType", value as RequestData["requestType"], { shouldDirty: true, shouldValidate: true })} options={[{ value: "machining", label: "Gia công theo yêu cầu" }, { value: "product_quote", label: "Báo giá sản phẩm" }, { value: "consulting", label: "Tư vấn kỹ thuật" }]}/></Field>
          <Field label="Tiêu đề *" error={form.formState.errors.title?.message}><Input placeholder="Ví dụ: Gia công 200 chi tiết inox 304" {...form.register("title")}/></Field>
        </div>
        <Field label="Mô tả yêu cầu *" error={form.formState.errors.description?.message}><Textarea className="min-h-32" placeholder={requestType === "machining" ? "Công dụng, dung sai, bề mặt, tiến độ và yêu cầu nghiệm thu..." : "Mô tả ngắn nhu cầu để chúng tôi tư vấn chính xác..."} {...form.register("description")}/></Field>
        {requestType === "machining" && <div className="grid gap-x-5 sm:grid-cols-2"><Field label="Vật liệu"><Input placeholder="Inox 304, thép SS400..." {...form.register("material")}/></Field><Field label="Số lượng" error={form.formState.errors.quantity?.message}><IntegerInput min="1" placeholder="100" {...form.register("quantity")}/></Field><Field label="Kích thước / dung sai"><Input placeholder="200 × 100 × 3mm" {...form.register("dimensions")}/></Field><Field label="Ngày mong muốn"><Input type="date" {...form.register("desiredDate")}/></Field></div>}
        <Field label="Ngân sách dự kiến"><Select ariaLabel="Ngân sách dự kiến" value={form.watch("budget")} onChange={value => form.setValue("budget", value, { shouldDirty: true })} options={["Chưa xác định", "Dưới 10 triệu", "10 - 50 triệu", "50 - 200 triệu", "Trên 200 triệu"].map(value => ({ value, label: value }))}/></Field>
        <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center transition hover:border-orange-400 hover:bg-orange-50/40"><FileUp className="mx-auto size-8 text-orange-600"/><span className="mt-2 block font-bold text-emerald-950">{requestType === "machining" ? "Đính kèm bản vẽ" : "Đính kèm tài liệu (nếu có)"}</span><span className="mt-1 block text-xs leading-5 text-slate-500">PDF, ảnh, DXF, DWG, STEP, IGES hoặc ZIP · tối đa 5 tệp × 10MB</span><input ref={fileInput} className="mx-auto mt-3 block max-w-md text-sm" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.dxf,.dwg,.step,.stp,.iges,.igs,.zip" onChange={event => onFiles(Array.from(event.target.files || []))}/></label>
        {files.length > 0 && <p className="mt-2 text-sm font-semibold text-slate-600">Đã chọn {files.length} tệp</p>}{fileError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{fileError}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3"><Button type="button" variant="outline" onClick={onBack}>Hủy</Button><Button size="lg" disabled={busy}>{busy ? <><LoaderCircle className="size-5 animate-spin"/>Đang gửi...</> : <><Send className="size-5"/>Gửi yêu cầu</>}</Button></div>
      </form>
    </section>
  </div>
}

function CustomerRequestDetail({ request, onDownload, onCancel }: { request: CustomerRequest; onDownload: (attachment: RequestAttachment) => void; onCancel: () => void }) {
  const [section, setSection] = useState<DetailSection>(request.latestQuotation?.status === "sent" ? "quotes" : "overview")
  const status = statuses[request.status] || { label: request.status, className: "bg-slate-100 text-slate-700" }
  const progress = requestProgress(request.status)
  const facts = [
    request.material && ["Vật liệu", request.material],
    request.quantity && ["Số lượng", String(request.quantity)],
    request.dimensions && ["Kích thước / dung sai", request.dimensions],
    request.desiredDate && ["Ngày mong muốn", date(request.desiredDate)],
    request.budget && ["Ngân sách dự kiến", request.budget],
    request.productSnapshot?.name && ["Sản phẩm", request.productSnapshot.name],
  ].filter(Boolean) as string[][]
  const tabs: Array<{ id: DetailSection; label: string; description: string; icon: typeof ClipboardList; badge?: number | string }> = [
    { id: "overview", label: "Hồ sơ yêu cầu", description: "Thông tin & tiến trình", icon: ClipboardList },
    { id: "quotes", label: "Báo giá", description: "Chi phí & xác nhận", icon: FileText, badge: request.latestQuotation?.status === "sent" ? "Mới" : undefined },
    { id: "messages", label: "Trao đổi", description: "Chat với kỹ thuật", icon: MessageSquareText, badge: request.unreadCount },
    { id: "agreement", label: "Thỏa thuận", description: "Kết quả đã chốt", icon: FileCog, badge: request.status === "accepted" ? "Xong" : undefined },
  ]

  return <div className="space-y-5">
    <section className="relative overflow-hidden rounded-[30px] bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 px-5 py-7 text-white shadow-[0_24px_70px_-35px_rgba(2,44,34,.8)] sm:px-8 sm:py-8">
      <div className="absolute -right-10 -top-20 size-64 rounded-full bg-orange-500/15 blur-3xl"/>
      <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-start"><div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-black uppercase tracking-[.18em] text-orange-300">{request.code}</span><span className="text-emerald-100/30">•</span><span className="text-sm text-emerald-100/70">{typeNames[request.requestType]}</span></div><h2 className="mt-3 max-w-4xl font-display text-2xl font-bold leading-tight sm:text-4xl">{request.title}</h2><p className="mt-3 flex items-center gap-2 text-sm text-emerald-100/65"><Clock3 className="size-4"/>Gửi lúc {dateTime(request.createdAt)}</p></div><div className="flex flex-wrap gap-2"><span className={cn("rounded-full px-3.5 py-2 text-xs font-black", status.className)}>{status.label}</span>{Boolean(request.unreadCount) && <button type="button" onClick={() => setSection("messages")} className="rounded-full bg-red-500 px-3.5 py-2 text-xs font-black text-white">{request.unreadCount} tin mới</button>}</div></div>
      {!['rejected', 'cancelled'].includes(request.status) && <div className="relative mt-8 grid grid-cols-4 gap-1 sm:gap-4">{["Tiếp nhận", "Kiểm tra", "Báo giá", "Dự án"].map((label, index) => <div key={label} className="relative text-center"><div className={cn("absolute left-1/2 top-4 h-0.5 w-full", index === 3 ? "hidden" : "block", index < progress ? "bg-emerald-400" : "bg-white/15")}/><span className={cn("relative mx-auto grid size-8 place-items-center rounded-full border-2 text-xs font-black", index < progress ? "border-emerald-400 bg-emerald-500 text-white" : index === progress ? "border-orange-400 bg-orange-500 text-white" : "border-white/25 bg-emerald-950 text-white/45")}>{index < progress ? <Check className="size-4"/> : index + 1}</span><span className={cn("mt-2 block text-[11px] font-bold sm:text-xs", index <= progress ? "text-white" : "text-white/40")}>{label}</span></div>)}</div>}
    </section>

    <nav aria-label="Các phần của yêu cầu" className="grid gap-2 rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-2 xl:grid-cols-4">{tabs.map(({ id, label, description, icon: Icon, badge }) => <button key={id} type="button" aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)} className={cn("relative flex min-h-20 items-center gap-3 rounded-[18px] px-4 text-left transition", section === id ? "bg-emerald-950 text-white shadow-lg" : "text-slate-600 hover:bg-slate-50 hover:text-emerald-950")}><span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", section === id ? "bg-white/10 text-orange-300" : "bg-slate-100 text-slate-500")}><Icon className="size-5"/></span><span><strong className="block text-sm">{label}</strong><span className={cn("mt-0.5 block text-xs", section === id ? "text-emerald-100/65" : "text-slate-400")}>{description}</span></span>{Boolean(badge) && <span className="absolute right-3 top-3 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-black text-white">{badge}</span>}</button>)}</nav>

    {section === "overview" && <section className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(290px,.75fr)]">
      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.16em] text-orange-700">Nội dung yêu cầu</p><h3 className="mt-1 font-display text-xl font-bold text-emerald-950">Thông tin kỹ thuật</h3></div>{["submitted", "need_more_info"].includes(request.status) && <Button size="sm" variant="outline" onClick={onCancel}><XCircle className="size-4 text-red-600"/>Hủy yêu cầu</Button>}</div><p className="mt-5 whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 leading-7 text-slate-700">{request.description}</p>
        {facts.length > 0 && <dl className="mt-5 grid gap-3 sm:grid-cols-2">{facts.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-100 p-4"><dt className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</dt><dd className="mt-1 font-bold text-emerald-950">{value}</dd></div>)}</dl>}
        <div className="mt-6 border-t border-slate-100 pt-5"><h4 className="font-bold text-emerald-950">Tài liệu đính kèm</h4>{request.attachments.length ? <div className="mt-3 flex flex-wrap gap-2">{request.attachments.map(attachment => <button className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-700 transition hover:bg-orange-50 hover:text-orange-800" key={attachment._id} onClick={() => onDownload(attachment)}><Download className="size-4"/>{attachment.originalName}</button>)}</div> : <p className="mt-2 text-sm text-slate-500">Không có tệp đính kèm.</p>}</div>
      </article>
      <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><p className="text-xs font-black uppercase tracking-[.16em] text-orange-700">Cập nhật</p><h3 className="mt-1 font-display text-xl font-bold text-emerald-950">Tiến trình xử lý</h3><ol className="mt-6 space-y-0">{[...request.timeline].reverse().map((item, index) => <li className="relative flex gap-3 pb-6 last:pb-0" key={`${item.at}-${index}`}>{index < request.timeline.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-slate-200"/>}<span className={cn("relative mt-1 size-4 shrink-0 rounded-full border-4 border-white ring-2", index === 0 ? "bg-orange-500 ring-orange-200" : "bg-emerald-600 ring-emerald-100")}/><div><strong className="text-sm text-emerald-950">{statuses[item.status]?.label || item.status}</strong><p className="mt-1 text-sm leading-6 text-slate-500">{item.message}</p><time className="mt-1 block text-xs text-slate-400">{dateTime(item.at)}</time></div></li>)}</ol></article>
    </section>}
    {section === "quotes" && <RequestConversation requestId={request._id} mode="quotes"/>}
    {section === "messages" && <RequestConversation requestId={request._id} mode="messages"/>}
    {section === "agreement" && <RequestConversation requestId={request._id} mode="agreement"/>}
  </div>
}

function requestProgress(status: string) {
  if (status === "accepted") return 3
  if (status === "quoted") return 2
  if (["reviewing", "need_more_info"].includes(status)) return 1
  return 0
}
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <label className="mb-4 block text-sm font-bold text-slate-700"><span className="mb-2 block">{label}</span>{children}{error && <span className="mt-1 block text-sm text-red-600">{error}</span>}</label> }
const date = (value: string) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value))
const dateTime = (value: string) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
function Loading() { return <div className="grid min-h-72 place-items-center"><LoaderCircle className="size-8 animate-spin text-orange-600"/></div> }
