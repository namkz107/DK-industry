import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Check, CheckCheck, ChevronDown, ChevronUp, Download, Eye, FileText, Info, LoaderCircle, LockKeyhole, Mail, MessageSquareText, PanelLeftClose, PanelLeftOpen, Plus, Search, Send, Trash2, Wifi, WifiOff } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"
import { useSearchParams } from "react-router-dom"
import { StaffShell } from "@/components/staff/staff-shell"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IntegerInput, MoneyInput } from "@/components/ui/numeric-input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { usePageMeta } from "@/hooks/use-page-meta"
import { useRequestRealtime } from "@/hooks/use-request-realtime"
import { staffClient } from "@/lib/staff-client"
import { cn } from "@/lib/utils"
import { parseNumericInput } from "@/lib/numeric"
import type { Priority, RequestStatus, StaffMessage, StaffRequestDetail } from "@/types/staff"

const statusNames: Record<RequestStatus, string> = { submitted: "Mới gửi", reviewing: "Đang đánh giá", need_more_info: "Chờ bổ sung", quoted: "Đã báo giá", accepted: "Đã chấp thuận", rejected: "Từ chối", cancelled: "Đã hủy" }
const priorityNames: Record<Priority, string> = { low: "Thấp", normal: "Bình thường", high: "Cao", urgent: "Khẩn" }
const nextRequestStatuses: Record<RequestStatus, RequestStatus[]> = {
  submitted: ["need_more_info", "rejected", "cancelled"], reviewing: ["need_more_info", "rejected", "cancelled"],
  need_more_info: ["rejected", "cancelled"], quoted: ["cancelled"],
  accepted: [], rejected: ["reviewing"], cancelled: [],
}
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
type DetailResult = { success: boolean; data: StaffRequestDetail; message?: string }

function mergeMessage(messages: StaffMessage[], incoming: StaffMessage) {
  const values = messages.filter(item => item._id !== incoming._id && (!incoming.clientMessageId || item.clientMessageId !== incoming.clientMessageId))
  return [...values, incoming].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export function StaffRequestsPage() {
  usePageMeta("Yêu cầu dịch vụ", "Xử lý hồ sơ kỹ thuật, trao đổi và báo giá.")
  const [params] = useSearchParams(); const client = useQueryClient()
  const toast = useToast()
  const [filters, setFilters] = useState({ q: "", status: "", priority: params.get("priority") || "", assigned: params.get("assigned") || "" })
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState("")
  const [listCollapsed, setListCollapsed] = useState(false)
  const list = useQuery({ queryKey: ["staff", "requests", filters, page], queryFn: () => staffClient.requests({ ...filters, page }) })
  const detail = useQuery({ queryKey: ["staff", "request", selected], queryFn: () => staffClient.request(selected), enabled: Boolean(selected) })
  useEffect(() => setPage(1), [filters])
  useEffect(() => { const items = list.data?.data.items; if (items?.length && !items.some(item => item._id === selected)) setSelected(items[0]._id) }, [list.data, selected])
  const detailKey = ["staff", "request", selected] as const
  const updateDetail = (updater: (value: StaffRequestDetail) => StaffRequestDetail) => client.setQueryData<DetailResult>(detailKey, current => current ? { ...current, data: updater(current.data) } : current)
  const refresh = () => { void client.invalidateQueries({ queryKey: ["staff", "requests"] }); void client.invalidateQueries({ queryKey: detailKey }); void client.invalidateQueries({ queryKey: ["staff", "dashboard"] }) }
  const update = useMutation({ mutationFn: (body: Parameters<typeof staffClient.updateRequest>[1]) => staffClient.updateRequest(selected, body), onSuccess: result => { toast.success(result.message || "Đã cập nhật hồ sơ"); refresh() }, onError: error => toast.error(error.message) })
  const message = useMutation({
    mutationFn: (body: { content: string; visibility: "customer" | "internal"; clientMessageId: string }) => staffClient.sendMessage(selected, body.content, body.visibility, body.clientMessageId),
    onMutate: body => updateDetail(value => ({ ...value, messages: mergeMessage(value.messages, { _id: `pending:${body.clientMessageId}`, clientMessageId: body.clientMessageId, senderRole: "staff", visibility: body.visibility, content: body.content, attachments: [], createdAt: new Date().toISOString(), deliveryStatus: "sending" }) })),
    onSuccess: (result, variables) => { updateDetail(value => ({ ...value, messages: mergeMessage(value.messages.filter(item => item.clientMessageId !== variables.clientMessageId), result.data) })); toast.success(result.message || (variables.visibility === "internal" ? "Đã lưu ghi chú nội bộ" : "Đã gửi khách hàng")) },
    onError: (error, variables) => { updateDetail(value => ({ ...value, messages: value.messages.map(item => item.clientMessageId === variables.clientMessageId ? { ...item, deliveryStatus: "failed" } : item) })); toast.error(error.message) },
  })
  const quotation = useMutation({ mutationFn: (body: Parameters<typeof staffClient.createQuotation>[1]) => staffClient.createQuotation(selected, body), onSuccess: result => { toast.success(result.message || "Đã lưu báo giá"); refresh() }, onError: error => toast.error(error.message) })
  const sendQuote = useMutation({ mutationFn: (id: string) => staffClient.sendQuotation(selected, id), onSuccess: result => { toast.success(result.message || "Đã gửi báo giá"); refresh(); window.scrollTo({ top: 0, behavior: "smooth" }) }, onError: error => toast.error(error.message) })
  const realtime = useRequestRealtime(selected, Boolean(selected), {
    onMessage: incoming => updateDetail(value => ({ ...value, messages: mergeMessage(value.messages, incoming as unknown as StaffMessage) })),
    onRequestUpdated: refresh,
    onRead: (role, readAt) => updateDetail(value => ({ ...value, messages: value.messages.map(item => role === "customer" && item.senderRole !== "customer" && item.visibility === "customer" ? { ...item, readByCustomerAt: readAt } : item) })),
    onSync: refresh,
    onInboxUpdated: requestId => { void client.invalidateQueries({ queryKey: ["staff", "requests"] }); void client.invalidateQueries({ queryKey: ["staff", "dashboard"] }); if (requestId === selected) void client.invalidateQueries({ queryKey: detailKey }) },
  })
  const loadOlder = async () => {
    const page = detail.data?.data.messagePage
    if (!selected || !page?.hasMore) return
    const result = await staffClient.requestMessages(selected, page.nextCursor)
    updateDetail(value => ({ ...value, messages: [...result.data.items, ...value.messages].filter((item, index, all) => all.findIndex(candidate => candidate._id === item._id) === index), messagePage: { hasMore: result.data.hasMore, nextCursor: result.data.nextCursor } }))
  }
  return <StaffShell title="Yêu cầu dịch vụ" description="Trao đổi hoặc gửi báo giá trực tiếp; trạng thái được cập nhật tự động.">
    <div className="mb-5 grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950 md:grid-cols-3">
      <p><strong className="block">1. Kiểm tra yêu cầu</strong><span className="text-emerald-800">Xem nội dung, tệp và chọn mức ưu tiên.</span></p>
      <p><strong className="block">2. Trao đổi khi cần</strong><span className="text-emerald-800">Tin gửi khách sẽ vào cổng khách hàng và email thông báo.</span></p>
      <p><strong className="block">3. Lập và gửi báo giá</strong><span className="text-emerald-800">Khách xem, chấp thuận hoặc yêu cầu sửa trong tài khoản.</span></p>
    </div>
    <div className="mb-5 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_190px_170px_170px]"><label className="relative"><Search className="absolute left-3 top-3.5 size-5 text-slate-400"/><Input className="pl-10" value={filters.q} onChange={event => setFilters({ ...filters, q: event.target.value })} placeholder="Tìm mã, tiêu đề, khách hàng..."/></label><Filter value={filters.status} onChange={status => setFilters({ ...filters, status })} first="Mọi trạng thái" options={Object.entries(statusNames)}/><Filter value={filters.priority} onChange={priority => setFilters({ ...filters, priority })} first="Mọi ưu tiên" options={Object.entries(priorityNames)}/><Filter value={filters.assigned} onChange={assigned => setFilters({ ...filters, assigned })} first="Tất cả phụ trách" options={[["mine", "Của tôi"], ["unassigned", "Chưa phân công"]]}/></div>
    <div className="mb-3 flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-500">{list.data ? `${list.data.data.total} yêu cầu · trang ${list.data.data.page}/${list.data.data.pages}` : "Danh sách yêu cầu"}</p><Button size="sm" variant="outline" onClick={() => setListCollapsed(value => !value)}>{listCollapsed ? <PanelLeftOpen className="size-4"/> : <PanelLeftClose className="size-4"/>}{listCollapsed ? "Hiện danh sách" : "Thu gọn danh sách"}</Button></div>
    <div className={cn("grid gap-5", !listCollapsed && "xl:grid-cols-[390px_minmax(0,1fr)]")}>{!listCollapsed && <aside className="h-fit xl:sticky xl:top-24"><div className="max-h-[calc(100vh-15rem)] space-y-3 overflow-y-auto overscroll-contain pr-1">{list.isLoading && <p className="rounded-2xl bg-white p-5">Đang tải danh sách...</p>}{list.error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-red-700">{list.error.message}</p>}{list.data?.data.items.map(item => <button key={item._id} onClick={() => setSelected(item._id)} className={cn("w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:border-orange-300", selected === item._id && "border-orange-500 ring-2 ring-orange-100")}><div className="flex items-start justify-between gap-3"><div><strong className="font-display text-lg text-emerald-950">{item.title}</strong><p className="mt-1 text-sm font-bold text-slate-500">{item.code}</p></div><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800">{priorityNames[item.priority]}</span></div><p className="mt-3 flex items-center justify-between gap-2 text-slate-700"><span>{item.customer.name}</span>{Boolean(item.unreadCount) && <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-black text-white">{item.unreadCount} mới</span>}</p><div className="mt-3 flex items-center justify-between text-sm"><span className="font-bold text-emerald-700">{statusNames[item.status]}</span><span className="text-slate-500">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span></div></button>)}{!list.isLoading && !list.data?.data.items.length && <p className="rounded-2xl bg-white p-6 text-center text-slate-500">Không có hồ sơ phù hợp.</p>}</div><Pagination page={list.data?.data.page || page} pages={list.data?.data.pages || 1} onChange={setPage}/></aside>}
      <div>{detail.data?.data ? <RequestDetail detail={detail.data.data} busy={update.isPending || message.isPending || quotation.isPending || sendQuote.isPending} error={(update.error || message.error || quotation.error || sendQuote.error) as Error | null} connected={realtime.connected} typingName={realtime.typingName} onTyping={realtime.setTyping} onLoadOlder={() => void loadOlder()} onUpdate={body => update.mutate(body)} onMessage={body => message.mutate({ ...body, clientMessageId: crypto.randomUUID() })} onQuotation={(body, onSuccess) => quotation.mutate(body, { onSuccess })} onSendQuote={id => sendQuote.mutate(id)}/> : <div className="rounded-3xl border bg-white p-10 text-center text-slate-500">Chọn một yêu cầu để xử lý.</div>}</div></div>
  </StaffShell>
}

function RequestDetail({ detail, busy, error, connected, typingName, onTyping, onLoadOlder, onUpdate, onMessage, onQuotation, onSendQuote }: { detail: StaffRequestDetail; busy: boolean; error: Error | null; connected: boolean; typingName: string; onTyping: (value: boolean) => void; onLoadOlder: () => void; onUpdate: (body: Parameters<typeof staffClient.updateRequest>[1]) => void; onMessage: (body: { content: string; visibility: "customer" | "internal" }) => void; onQuotation: (body: Parameters<typeof staffClient.createQuotation>[1], onSuccess: () => void) => void; onSendQuote: (id: string) => void }) {
  const { request, messages, quotations } = detail
  const [status, setStatus] = useState<RequestStatus | "">("")
  const [priority, setPriority] = useState<Priority>(request.priority)
  const [statusMessage, setStatusMessage] = useState("")
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState<"customer" | "internal">("customer")
  const [messageOpen, setMessageOpen] = useState(false)
  useEffect(() => { setStatus(""); setPriority(request.priority); setStatusMessage(""); setContent("") }, [request._id, request.status, request.priority])
  const nextOptions = nextRequestStatuses[request.status].map(value => [value, statusNames[value]])
  const requiresMessage = status === "need_more_info" || status === "rejected" || status === "cancelled"
  const statusAction = status === "need_more_info" ? "Gửi yêu cầu bổ sung" : status === "cancelled" ? "Xác nhận hủy" : status === "rejected" ? "Xác nhận từ chối" : status === "reviewing" ? "Mở lại hồ sơ" : "Cập nhật trạng thái"
  const download = async (attachmentId: string, filename: string, messageId?: string) => { const blob = messageId ? await staffClient.downloadMessageAttachment(request._id, messageId, attachmentId) : await staffClient.downloadAttachment(request._id, attachmentId); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url) }

  return <article className="space-y-6">
    <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black uppercase tracking-wider text-orange-700">{request.code}</p><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">{statusNames[request.status]}</span></div><h2 className="mt-2 font-display text-3xl font-bold text-emerald-950">{request.title}</h2><p className="mt-2 text-slate-600">{request.customer.name} · {request.customer.company || request.customer.email}</p></div><p className="text-sm font-semibold text-slate-500">{request.assignedTo ? `Phụ trách: ${request.assignedTo.name}` : "Sẽ tự nhận khi bạn phản hồi hoặc cập nhật"}</p></div>
      <div className="mt-6 rounded-2xl bg-slate-50 p-5"><p className="leading-7 text-slate-800">{request.description}</p><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[["Vật liệu", request.material], ["Số lượng", request.quantity], ["Kích thước", request.dimensions], ["Ngân sách", request.budget]].filter(([, value]) => value && value !== "-").map(([label, value]) => <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3"><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">{label}</span><strong className="mt-1 block text-sm text-emerald-950">{value}</strong></div>)}</div>{request.attachments.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{request.attachments.map(file => <Button key={file._id} variant="outline" size="sm" onClick={() => download(file._id, file.originalName)}><Download className="size-4"/>{file.originalName}</Button>)}</div>}</div>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-4 font-semibold text-red-700">{error.message}</p>}
      <div className="mt-6 grid items-stretch gap-4 border-t pt-6 md:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-emerald-950">Mức ưu tiên nội bộ</h3><p className="mt-1 min-h-10 text-sm text-slate-500">Chỉ nhân viên nhìn thấy thông tin này.</p><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"><Select ariaLabel="Mức ưu tiên" value={priority} onChange={value => setPriority(value as Priority)} options={Object.entries(priorityNames).map(([value, label]) => ({ value, label }))}/><Button className="whitespace-nowrap" type="button" variant="outline" disabled={busy || priority === request.priority} onClick={() => onUpdate({ priority })}>Lưu ưu tiên</Button></div></div>
        <div className="flex flex-col rounded-2xl border border-slate-200 p-5"><h3 className="font-bold text-emerald-950">Thay đổi trạng thái</h3><p className="mt-1 min-h-10 text-sm text-slate-500">Báo giá được gửi sẽ tự chuyển hồ sơ sang “Đã báo giá”.</p>{nextOptions.length ? <form onSubmit={(event: FormEvent) => { event.preventDefault(); if (status) onUpdate({ status, message: statusMessage, visibility: "customer" }) }} className="mt-4 space-y-3"><Filter value={status} onChange={value => setStatus(value as RequestStatus)} first="Chọn trạng thái" options={nextOptions}/>{status && <Input value={statusMessage} onChange={event => setStatusMessage(event.target.value)} placeholder={status === "need_more_info" ? "Nêu rõ khách cần bổ sung gì" : requiresMessage ? "Nhập lý do" : "Ghi chú (không bắt buộc)"}/>}<Button className="w-full sm:w-auto" disabled={busy || !status || (requiresMessage && statusMessage.trim().length < 3)}>{statusAction}</Button></form> : <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Hồ sơ đã kết thúc, không còn trạng thái cần thay đổi.</p>}</div>
      </div>
    </section>

    <div className="flex justify-end"><Button type="button" variant="outline" onClick={() => setMessageOpen(value => !value)}><MessageSquareText className="size-4"/>{messageOpen ? "Đóng trao đổi" : "Liên hệ khách hàng"}{messageOpen ? <ChevronUp className="size-4"/> : <ChevronDown className="size-4"/>}</Button></div>
    {messageOpen && <section className="rounded-3xl border bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 font-display text-2xl font-bold text-emerald-950"><MessageSquareText className="size-6 text-orange-600"/>Trao đổi với khách hàng</h3><p className="mt-1 text-sm text-slate-500">Khách xem nội dung trong tài khoản và nhận thông báo tại <strong>{request.customer.email}</strong>.</p></div><span className={cn("flex items-center gap-1 text-xs font-bold", connected ? "text-emerald-700" : "text-slate-400")}>{connected ? <Wifi className="size-4"/> : <WifiOff className="size-4"/>}{connected ? "Đang kết nối trực tiếp" : "Đang kết nối"}</span></div>
      <div className="mt-5 max-h-[32rem] space-y-3 overflow-y-auto rounded-2xl border bg-slate-50 p-4">{detail.messagePage?.hasMore && <div className="text-center"><Button type="button" size="sm" variant="ghost" onClick={onLoadOlder}><LoaderCircle className="size-4"/>Tải tin nhắn cũ</Button></div>}{messages.map((item, index) => <div key={item._id} className={cn("rounded-2xl p-4", item.visibility === "internal" ? "border border-amber-200 bg-amber-50" : item.senderRole === "customer" ? "bg-white" : "bg-emerald-50", item.deliveryStatus === "failed" && "ring-2 ring-red-300")}><div className="flex justify-between gap-3 text-xs font-bold text-slate-500"><span>{item.visibility === "internal" ? "Ghi chú nội bộ · khách không thấy" : item.senderRole === "customer" ? request.customer.name : item.sender?.name || "Nhân viên"}</span><span>{new Date(item.createdAt).toLocaleString("vi-VN")}</span></div><p className="mt-2 whitespace-pre-wrap text-slate-800">{item.content}</p>{item.attachments.map(file => <button key={file._id} onClick={() => download(file._id, file.originalName, item._id)} className="mt-2 flex items-center gap-2 font-bold text-orange-700"><Download className="size-4"/>{file.originalName}</button>)}{item.senderRole !== "customer" && item.visibility === "customer" && !messages.slice(index + 1).some(next => next.senderRole !== "customer" && next.visibility === "customer") && <span className="mt-2 flex items-center justify-end gap-1 text-xs text-emerald-700">{item.deliveryStatus === "sending" ? "Đang gửi" : item.deliveryStatus === "failed" ? "Gửi lỗi" : item.readByCustomerAt ? <><CheckCheck className="size-4"/>Khách đã xem</> : <><Check className="size-4"/>Đã gửi khách</>}</span>}</div>)}{!messages.length && <p className="py-8 text-center text-sm text-slate-500">Chưa có trao đổi nào.</p>}</div>
      <div className="h-6 pt-1 text-xs font-semibold text-slate-500">{typingName && `${typingName} đang nhập...`}</div>
      <form className="space-y-3" onSubmit={event => { event.preventDefault(); if (content.trim()) { onMessage({ content: content.trim(), visibility }); setContent(""); onTyping(false) } }}>
        <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant={visibility === "customer" ? "default" : "outline"} onClick={() => setVisibility("customer")}><Mail className="size-4"/>Gửi khách hàng</Button><Button type="button" size="sm" variant={visibility === "internal" ? "default" : "outline"} onClick={() => setVisibility("internal")}><LockKeyhole className="size-4"/>Ghi chú nội bộ</Button></div>
        <div className={cn("rounded-2xl border p-3 text-sm", visibility === "customer" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900")}>{visibility === "customer" ? `Nội dung sẽ gửi cho ${request.customer.name} qua cổng khách hàng và thông báo email ${request.customer.email}.` : "Nội dung chỉ nhân viên và quản trị viên nhìn thấy; khách hàng không nhận được."}</div>
        <Textarea rows={4} value={content} onChange={event => { setContent(event.target.value); onTyping(Boolean(event.target.value.trim())) }} onBlur={() => onTyping(false)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() } }} placeholder={visibility === "customer" ? "Nhập nội dung gửi khách hàng..." : "Nhập ghi chú nội bộ..."}/>
        <div className="flex justify-end"><Button disabled={busy || !content.trim()}><Send className="size-4"/>{visibility === "customer" ? `Gửi cho ${request.customer.name}` : "Lưu ghi chú nội bộ"}</Button></div>
      </form>
    </section>}

    <QuotationPanel customerName={request.customer.name} customerEmail={request.customer.email} quotations={quotations} busy={busy} onCreate={onQuotation} onSend={onSendQuote}/>
  </article>
}

const quotationStatusNames: Record<string, string> = { draft: "Bản nháp", sent: "Đã gửi khách", accepted: "Khách đã chấp thuận", rejected: "Khách yêu cầu sửa", superseded: "Đã thay thế", expired: "Hết hiệu lực" }
type QuoteFormItem = { description: string; quantity: string; unit: string; unitPrice: string }

function QuotationPanel({ customerName, customerEmail, quotations, busy, onCreate, onSend }: { customerName: string; customerEmail: string; quotations: StaffRequestDetail["quotations"]; busy: boolean; onCreate: (body: Parameters<typeof staffClient.createQuotation>[1], onSuccess: () => void) => void; onSend: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<QuoteFormItem[]>([{ description: "", quantity: "1", unit: "cái", unitPrice: "" }])
  const [taxRate, setTaxRate] = useState("10")
  const [validUntil, setValidUntil] = useState("")
  const [leadTime, setLeadTime] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("")
  const [notes, setNotes] = useState("")
  const [formError, setFormError] = useState("")
  const [expandedQuote, setExpandedQuote] = useState("")
  const subtotal = items.reduce((sum, item) => sum + parseNumericInput(item.quantity) * parseNumericInput(item.unitPrice), 0)
  const tax = parseNumericInput(taxRate)
  const total = subtotal * (1 + tax / 100)
  const minValidUntil = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const resetForm = () => { setItems([{ description: "", quantity: "1", unit: "cái", unitPrice: "" }]); setTaxRate("10"); setValidUntil(""); setLeadTime(""); setPaymentTerms(""); setNotes(""); setFormError(""); setOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }) }
  const submit = () => {
    if (items.some(item => !item.description.trim() || !item.unit.trim() || !item.unitPrice || parseNumericInput(item.quantity) < 1 || parseNumericInput(item.unitPrice) < 0)) return setFormError("Vui lòng nhập đủ tên hạng mục, số lượng nguyên dương, đơn vị và đơn giá hợp lệ.")
    if (!validUntil || validUntil < minValidUntil) return setFormError("Vui lòng chọn ngày hiệu lực từ ngày mai trở đi.")
    if (tax < 0 || tax > 100) return setFormError("Thuế VAT phải nằm trong khoảng từ 0 đến 100%.")
    if (leadTime && parseNumericInput(leadTime) < 1) return setFormError("Thời gian thực hiện phải là số ngày nguyên dương.")
    if (paymentTerms && parseNumericInput(paymentTerms) > 100) return setFormError("Tỷ lệ đặt cọc không được vượt quá 100%.")
    setFormError("")
    onCreate({ items: items.map(item => ({ ...item, quantity: parseNumericInput(item.quantity), unitPrice: parseNumericInput(item.unitPrice) })), taxRate: tax, validUntil, leadTimeDays: leadTime ? parseNumericInput(leadTime) : null, depositPercent: paymentTerms ? parseNumericInput(paymentTerms) : null, notes, status: "sent" }, resetForm)
  }
  return <section className="rounded-3xl border bg-white p-6 sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="flex items-center gap-2 font-display text-2xl font-bold text-emerald-950"><FileText className="size-6 text-orange-600"/>Báo giá cho khách hàng</h3><p className="mt-1 text-sm text-slate-500">Gửi cho <strong>{customerName}</strong> trong cổng khách hàng và thông báo tới <strong>{customerEmail}</strong>.</p></div><Button onClick={() => setOpen(!open)}><Plus className="size-4"/>{open ? "Đóng form" : "Tạo báo giá mới"}</Button></div>
    {open && <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
      <div><h4 className="font-bold text-emerald-950">1. Các hạng mục báo giá</h4><p className="mt-1 text-sm text-slate-500">Mỗi dòng là một sản phẩm, công việc hoặc chi phí.</p></div>
      <div className="space-y-4">{items.map((item, index) => <div className="rounded-2xl border bg-white p-4" key={index}><div className="flex items-center justify-between"><strong className="text-sm text-emerald-950">Hạng mục {index + 1}</strong>{items.length > 1 && <Button type="button" size="sm" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== index))}><Trash2 className="size-4"/>Xóa</Button>}</div><div className="mt-3 grid gap-3 md:grid-cols-3"><Field label="Tên hạng mục *" className="md:col-span-3"><Input value={item.description} onChange={event => setItems(items.map((value, i) => i === index ? { ...value, description: event.target.value } : value))} placeholder="Ví dụ: Gia công chi tiết CNC"/></Field><Field label="Số lượng *"><IntegerInput min={1} value={item.quantity} onChange={event => setItems(items.map((value, i) => i === index ? { ...value, quantity: event.target.value } : value))} placeholder="1"/></Field><Field label="Đơn vị *"><Input value={item.unit} onChange={event => setItems(items.map((value, i) => i === index ? { ...value, unit: event.target.value } : value))} placeholder="cái, bộ, kg..."/></Field><Field label="Đơn giá (VND) *"><MoneyInput min={0} value={item.unitPrice} onChange={event => setItems(items.map((value, i) => i === index ? { ...value, unitPrice: event.target.value } : value))} placeholder="1.000.000"/></Field></div><p className="mt-3 text-right text-sm font-bold text-slate-600">Thành tiền: {money.format(parseNumericInput(item.quantity) * parseNumericInput(item.unitPrice))}</p></div>)}</div>
      <Button type="button" size="sm" variant="outline" onClick={() => setItems([...items, { description: "", quantity: "1", unit: "cái", unitPrice: "" }])}><Plus className="size-4"/>Thêm hạng mục</Button>
      <div><h4 className="font-bold text-emerald-950">2. Điều kiện báo giá</h4><p className="mt-1 text-sm text-slate-500">Chỉ nhập số; hệ thống tự thêm “ngày”, “%” và nội dung đặt cọc khi xuất báo giá.</p><div className="mt-3 grid gap-4 md:grid-cols-2"><Field label="Thuế VAT (%)"><IntegerInput min={0} max={100} value={taxRate} onChange={event => setTaxRate(event.target.value)} placeholder="10"/></Field><Field label="Báo giá có hiệu lực đến *"><Input type="date" min={minValidUntil} value={validUntil} onChange={event => setValidUntil(event.target.value)}/></Field><Field label="Thời gian thực hiện (ngày)"><IntegerInput min={1} value={leadTime} onChange={event => setLeadTime(event.target.value)} placeholder="3"/></Field><Field label="Tỷ lệ đặt cọc (%)"><IntegerInput min={0} max={100} value={paymentTerms} onChange={event => setPaymentTerms(event.target.value)} placeholder="50"/></Field><Field label="Ghi chú cho khách" className="md:col-span-2"><Textarea rows={3} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Phạm vi công việc, điều kiện giao hàng hoặc lưu ý khác..."/></Field></div></div>
      {formError && <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 p-4 font-semibold text-red-700"><AlertTriangle className="size-5 shrink-0"/>{formError}</p>}
      <div className="rounded-2xl bg-emerald-950 p-5 text-white"><div className="ml-auto max-w-md space-y-2"><p className="flex justify-between"><span>Tạm tính</span><strong>{money.format(subtotal)}</strong></p><p className="flex justify-between"><span>VAT ({tax}%)</span><strong>{money.format(total - subtotal)}</strong></p><p className="flex justify-between border-t border-white/20 pt-3 text-xl"><span>Tổng cộng</span><strong className="text-orange-300">{money.format(total)}</strong></p></div></div>
      <div className="flex justify-end"><Button disabled={busy} onClick={submit}><Send className="size-4"/>{busy ? "Đang gửi..." : "Gửi báo giá cho khách"}</Button></div>
    </div>}
    <div className="mt-6"><h4 className="font-bold text-emerald-950">Các báo giá đã tạo</h4><div className="mt-3 space-y-3">{quotations.map(item => <div key={item._id} className="rounded-2xl border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><strong className="text-emerald-950">{item.code} · Phiên bản {item.version}</strong><p className="mt-1 text-sm text-slate-500">Hiệu lực đến {new Date(item.validUntil).toLocaleDateString("vi-VN")}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{quotationStatusNames[item.status] || item.status}</span></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><Button size="sm" variant="outline" onClick={() => setExpandedQuote(expandedQuote === item._id ? "" : item._id)}><Eye className="size-4"/>{expandedQuote === item._id ? "Ẩn chi tiết" : "Xem chi tiết"}</Button><strong className="text-xl text-orange-700">{money.format(item.total)}</strong></div>{expandedQuote === item._id && <QuotationDetail quotation={item}/>} {item.status === "draft" && <div className="mt-3 rounded-xl bg-orange-50 p-3"><p className="text-sm text-orange-900"><Info className="mr-1 inline size-4"/>Bản nháp cũ này chưa gửi cho khách.</p><Button className="mt-2 w-full" size="sm" onClick={() => onSend(item._id)} disabled={busy}>Gửi báo giá này cho {customerName}</Button></div>}</div>)}{!quotations.length && <p className="rounded-2xl bg-slate-50 py-8 text-center text-slate-500">Chưa có báo giá. Bấm “Tạo báo giá mới” để bắt đầu.</p>}</div></div>
  </section>
}

function QuotationDetail({ quotation }: { quotation: StaffRequestDetail["quotations"][number] }) { return <div className="mt-4 rounded-2xl bg-slate-50 p-4"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="text-slate-500"><tr><th className="pb-2">Hạng mục</th><th className="pb-2 text-right">SL</th><th className="pb-2">Đơn vị</th><th className="pb-2 text-right">Đơn giá</th><th className="pb-2 text-right">Thành tiền</th></tr></thead><tbody>{quotation.items.map((item, index) => <tr className="border-t border-slate-200" key={`${quotation._id}-${index}`}><td className="py-3 font-semibold text-slate-800">{item.description}</td><td className="py-3 text-right">{item.quantity}</td><td className="py-3">{item.unit}</td><td className="py-3 text-right">{money.format(item.unitPrice)}</td><td className="py-3 text-right font-bold">{money.format(item.lineTotal)}</td></tr>)}</tbody></table></div><div className="ml-auto mt-4 max-w-sm space-y-2 border-t pt-3 text-sm"><p className="flex justify-between"><span>Tạm tính</span><strong>{money.format(quotation.subtotal)}</strong></p><p className="flex justify-between"><span>VAT ({quotation.taxRate}%)</span><strong>{money.format(quotation.taxAmount)}</strong></p><p className="flex justify-between text-lg text-orange-700"><span className="font-bold">Tổng cộng</span><strong>{money.format(quotation.total)}</strong></p></div>{quotation.leadTime && <p className="mt-3 text-sm"><strong>Thời gian thực hiện:</strong> {quotation.leadTime}</p>}{quotation.paymentTerms && <p className="mt-1 text-sm"><strong>Thanh toán:</strong> {quotation.paymentTerms}</p>}{quotation.notes && <p className="mt-1 whitespace-pre-wrap text-sm"><strong>Ghi chú:</strong> {quotation.notes}</p>}</div> }

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) { return <label className={cn("text-sm font-bold text-slate-700", className)}>{label}<span className="mt-2 block">{children}</span></label> }

function Filter({ value, onChange, first, options }: { value: string; onChange: (value: string) => void; first: string; options: string[][] }) { return <Select ariaLabel={first} value={value} onChange={onChange} options={[{ value: "", label: first }, ...options.map(([optionValue, label]) => ({ value: optionValue, label }))]}/> }
