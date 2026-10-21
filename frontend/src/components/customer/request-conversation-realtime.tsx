import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, CheckCheck, Download, FileText, FileUp, FolderKanban, LoaderCircle, MessageSquareText, Paperclip, Send, Wifi, WifiOff, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Textarea } from "@/components/ui/textarea"
import { useRequestRealtime } from "@/hooks/use-request-realtime"
import { customerClient } from "@/lib/customer-client"
import { cn, formatPrice } from "@/lib/utils"
import type { Quotation, RequestDetail, RequestMessage } from "@/types/customer"

type DetailResult = { success: boolean; data: RequestDetail; message?: string }
const quoteStatuses: Record<string, string> = { sent: "Chờ xác nhận", accepted: "Đã chốt", rejected: "Nhờ sửa", superseded: "Bản cũ", expired: "Hết hiệu lực" }

function mergeMessage(messages: RequestMessage[], incoming: RequestMessage) {
  const values = messages.filter(item => item._id !== incoming._id && (!incoming.clientMessageId || item.clientMessageId !== incoming.clientMessageId))
  return [...values, incoming].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export function RequestConversation({ requestId, mode = "messages" }: { requestId: string; mode?: "quotes" | "messages" | "agreement" | "workspace" }) {
  const queryClient = useQueryClient()
  const fileInput = useRef<HTMLInputElement>(null)
  const messageList = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [content, setContent] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState("")
  const [rejecting, setRejecting] = useState<string>()
  const [rejectNote, setRejectNote] = useState("")
  const [outcome, setOutcome] = useState("")
  const [loadingOlder, setLoadingOlder] = useState(false)
  const queryKey = ["customer", "request", requestId] as const
  const detail = useQuery({ queryKey, queryFn: () => customerClient.requestDetail(requestId) })

  const updateDetail = (updater: (value: RequestDetail) => RequestDetail) => queryClient.setQueryData<DetailResult>(queryKey, current => current ? { ...current, data: updater(current.data) } : current)
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey })
    void queryClient.invalidateQueries({ queryKey: ["customer", "requests"] })
    void queryClient.invalidateQueries({ queryKey: ["customer", "summary"] })
  }
  const realtime = useRequestRealtime(requestId, mode === "messages" || mode === "workspace", {
    onMessage: message => updateDetail(value => ({ ...value, messages: mergeMessage(value.messages, message as RequestMessage) })),
    onRequestUpdated: refresh,
    onRead: (role, readAt) => updateDetail(value => ({ ...value, messages: value.messages.map(message => role === "staff" && message.senderRole === "customer" ? { ...message, readByStaffAt: readAt } : message) })),
    onSync: refresh,
  })

  const send = useMutation({
    mutationFn: ({ body }: { body: FormData; clientMessageId: string }) => customerClient.sendRequestMessage(requestId, body),
    onMutate: ({ body, clientMessageId }) => {
      const optimistic: RequestMessage = {
        _id: `pending:${clientMessageId}`, clientMessageId, senderRole: "customer", visibility: "customer",
        content: String(body.get("content") || "Khách hàng đã gửi thêm tệp đính kèm."),
        attachments: files.map((file, index) => ({ _id: `pending-file:${index}`, originalName: file.name, mimeType: file.type, size: file.size })),
        createdAt: new Date().toISOString(), deliveryStatus: "sending",
      }
      updateDetail(value => ({ ...value, messages: mergeMessage(value.messages, optimistic) }))
    },
    onSuccess: (result, variables) => {
      updateDetail(value => ({ ...value, messages: mergeMessage(value.messages.filter(item => item.clientMessageId !== variables.clientMessageId), result.data) }))
      setContent(""); setFiles([]); realtime.setTyping(false)
      if (fileInput.current) fileInput.current.value = ""
      void queryClient.invalidateQueries({ queryKey: ["customer", "requests"] })
    },
    onError: (_, variables) => updateDetail(value => ({ ...value, messages: value.messages.map(item => item.clientMessageId === variables.clientMessageId ? { ...item, deliveryStatus: "failed" } : item) })),
  })
  const respond = useMutation({
    mutationFn: ({ quote, decision, note }: { quote: Quotation; decision: "accepted" | "rejected"; note?: string }) => customerClient.respondQuotation(requestId, quote._id, decision, note),
    onSuccess: result => { setRejecting(undefined); setRejectNote(""); setOutcome(result.message || "Đã ghi nhận phản hồi báo giá"); refresh() },
  })

  const messages = detail.data?.data.messages || []
  const latestSenderRole = messages.at(-1)?.senderRole
  useEffect(() => {
    const element = messageList.current
    if ((mode !== "messages" && mode !== "workspace") || !element || !messages.length) return
    const nearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 180
    if (nearBottom || latestSenderRole === "customer") element.scrollTo({ top: element.scrollHeight, behavior: "smooth" })
  }, [messages.length, latestSenderRole, mode])
  useEffect(() => () => clearTimeout(typingTimer.current), [])

  const changeContent = (value: string) => {
    setContent(value); realtime.setTyping(Boolean(value.trim())); clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => realtime.setTyping(false), 1_500)
  }
  const submitMessage = () => {
    setError("")
    if (!content.trim() && !files.length) return setError("Nhập nội dung hoặc chọn tệp đính kèm")
    if (files.length > 3 || files.some(file => file.size > 10 * 1024 * 1024)) return setError("Tối đa 3 tệp, mỗi tệp không quá 10MB")
    const clientMessageId = crypto.randomUUID()
    const body = new FormData(); body.append("clientMessageId", clientMessageId)
    if (content.trim()) body.append("content", content.trim())
    files.forEach(file => body.append("attachments", file))
    send.mutate({ body, clientMessageId })
  }
  const loadOlder = async () => {
    const page = detail.data?.data.messagePage
    if (!page?.hasMore || loadingOlder) return
    setLoadingOlder(true)
    try {
      const result = await customerClient.requestMessages(requestId, page.nextCursor)
      updateDetail(value => ({ ...value, messages: [...result.data.items, ...value.messages].filter((item, index, all) => all.findIndex(candidate => candidate._id === item._id) === index), messagePage: { hasMore: result.data.hasMore, nextCursor: result.data.nextCursor } }))
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải tin nhắn cũ") }
    finally { setLoadingOlder(false) }
  }
  const download = async (message: RequestMessage, attachmentId: string, name: string) => {
    if (attachmentId.startsWith("pending-")) return
    try {
      const blob = await customerClient.downloadMessageAttachment(requestId, message._id, attachmentId)
      const url = URL.createObjectURL(blob); const anchor = document.createElement("a")
      anchor.href = url; anchor.download = name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1_000)
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tải tệp") }
  }

  if (detail.isLoading) return <section className="grid min-h-72 place-items-center rounded-[28px] border border-slate-200 bg-white shadow-sm"><LoaderCircle className="size-7 animate-spin text-orange-600"/></section>
  if (detail.error) return <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"><ErrorText text={detail.error.message}/></section>

  const agreementPanel = <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
    <header className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-white px-5 py-5 sm:px-7"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-900 text-white"><FolderKanban className="size-5"/></span><div><h3 className="font-display text-xl font-bold text-emerald-950">Thỏa thuận & dự án</h3><p className="mt-0.5 text-sm text-slate-500">Kết quả sau khi hai bên thống nhất báo giá.</p></div></header>
    <div className="p-5 sm:p-7">
      {detail.data?.data.workOrder ? <div className="grid gap-5 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6"><div><span className="inline-flex rounded-full bg-emerald-900 px-3 py-1 text-xs font-black text-white">Đã thống nhất</span><h4 className="mt-3 font-display text-2xl font-bold text-emerald-950">Dự án {detail.data.data.workOrder.code}</h4><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-800">Báo giá đã được hai bên chấp thuận. Đây là xác nhận thỏa thuận của yêu cầu; không cần nhập lại một biểu mẫu hợp đồng trùng lặp.</p><div className="mt-4 flex flex-wrap gap-2"><span className="rounded-xl bg-white px-3 py-2 text-sm text-slate-600">Giá trị: <strong className="text-emerald-950">{formatPrice(detail.data.data.workOrder.agreedTotal)}</strong></span>{detail.data.data.workOrder.quotation?.code && <span className="rounded-xl bg-white px-3 py-2 text-sm text-slate-600">Báo giá: <strong className="text-emerald-950">{detail.data.data.workOrder.quotation.code}</strong></span>}</div></div><Button asChild><a href={`/tai-khoan/du-an?projectId=${detail.data.data.workOrder._id}`}>Theo dõi dự án</a></Button></div> : <EmptyPanel icon={FolderKanban} title="Chưa có thỏa thuận" text="Khi bạn đồng ý báo giá, hệ thống sẽ tạo dự án và hiển thị kết quả đã chốt tại đây."/>}
    </div>
  </section>

  const quotesPanel = <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-orange-50 via-white to-white px-5 py-5 sm:px-7">
      <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-200"><FileText className="size-5"/></span><div><h3 className="font-display text-xl font-bold text-emerald-950">Báo giá</h3><p className="mt-0.5 text-sm text-slate-500">Xem chi phí, thời gian và xác nhận phương án phù hợp.</p></div></div>
      <span className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-black text-orange-800">{detail.data?.data.quotations.length || 0} báo giá</span>
    </header>
    <div className="p-5 sm:p-7">
      {outcome && <div role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-900">{outcome}</div>}
      {!detail.data?.data.workOrder && detail.data?.data.request.status === "reviewing" && detail.data.data.quotations[0]?.status === "rejected" && <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-4"><strong className="text-orange-950">Đã gửi yêu cầu điều chỉnh</strong><p className="mt-1 text-sm leading-6 text-orange-900">Nhân viên đã nhận phản hồi của bạn. Báo giá mới sẽ xuất hiện tại khu vực này; bạn không cần tạo yêu cầu khác.</p></div>}
      {detail.data?.data.quotations.length ? <div className="space-y-5">{detail.data.data.quotations.map(quote => <QuoteCard key={quote._id} quote={quote} busy={respond.isPending} rejecting={rejecting} rejectNote={rejectNote} onRejecting={setRejecting} onRejectNote={setRejectNote} onRespond={(decision, note) => respond.mutate({ quote, decision, note })}/>)}</div> : <EmptyPanel icon={FileText} title="Chưa có báo giá" text="Kỹ thuật đang kiểm tra hồ sơ. Báo giá sẽ hiển thị tại đây ngay khi được gửi."/>}
      {(error || respond.error) && <ErrorText text={error || respond.error?.message || "Có lỗi xảy ra"}/>}
    </div>
  </section>

  const messagesPanel = <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-white to-white px-5 py-5 sm:px-7">
      <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-950 text-white"><MessageSquareText className="size-5"/></span><div><h3 className="font-display text-xl font-bold text-emerald-950">Trao đổi kỹ thuật</h3><p className="mt-0.5 text-sm text-slate-500">Hỏi đáp và bổ sung thông tin trực tiếp với nhân viên phụ trách.</p></div></div>
      <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold", realtime.connected ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500")}>{realtime.connected ? <Wifi className="size-3.5"/> : <WifiOff className="size-3.5"/>}{realtime.connected ? "Trực tuyến" : "Đang kết nối"}</span>
    </header>
    <div className="p-4 sm:p-6">
      <div ref={messageList} className="max-h-[34rem] min-h-72 space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-3 sm:p-5" aria-live="polite">
        {detail.data?.data.messagePage?.hasMore && <div className="text-center"><Button size="sm" variant="ghost" disabled={loadingOlder} onClick={() => void loadOlder()}>{loadingOlder && <LoaderCircle className="size-4 animate-spin"/>}Tải tin nhắn cũ</Button></div>}
        {messages.map((message, index) => <MessageBubble key={message._id} message={message} showRead={message.senderRole === "customer" && !messages.slice(index + 1).some(item => item.senderRole === "customer")} onDownload={download}/>) }
        {!messages.length && <EmptyPanel icon={MessageSquareText} title="Chưa có trao đổi" text="Bạn có thể gửi câu hỏi hoặc bổ sung thông tin ở khung bên dưới."/>}
      </div>
      <div className="h-7 px-1 pt-1 text-xs font-medium text-slate-500">{realtime.typingName && `${realtime.typingName} đang nhập...`}</div>
      {!['accepted', 'rejected', 'cancelled'].includes(detail.data?.data.request.status || '') ? <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="sr-only" htmlFor={`message-${requestId}`}>Nội dung trao đổi</label>
        <Textarea id={`message-${requestId}`} className="min-h-24 border-0 px-0 shadow-none focus-visible:ring-0" value={content} onChange={event => changeContent(event.target.value)} onBlur={() => realtime.setTyping(false)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitMessage() } }} placeholder="Nhập nội dung cần trao đổi... (Enter để gửi, Shift+Enter để xuống dòng)"/>
        {!!files.length && <div className="mb-3 flex flex-wrap gap-2">{files.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600"><Paperclip className="size-3"/>{file.name}<button type="button" aria-label={`Bỏ ${file.name}`} onClick={() => setFiles(current => current.filter((_, itemIndex) => itemIndex !== index))}><X className="size-3.5"/></button></span>)}</div>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"><label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700"><FileUp className="size-5"/><span>Đính kèm tệp</span><input ref={fileInput} className="sr-only" type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.dxf,.dwg,.step,.stp,.iges,.igs,.zip" onChange={event => setFiles(Array.from(event.target.files || []))}/></label><Button disabled={send.isPending || (!content.trim() && !files.length)} onClick={submitMessage}>{send.isPending ? <LoaderCircle className="size-5 animate-spin"/> : <Send className="size-5"/>}Gửi tin nhắn</Button></div>
      </div> : <p className="rounded-2xl bg-slate-100 p-4 text-sm font-semibold text-slate-600">Yêu cầu đã kết thúc. Nội dung trao đổi được giữ lại để bạn tra cứu.</p>}
      {(error || send.error) && <ErrorText text={error || send.error?.message || "Có lỗi xảy ra"}/>}
    </div>
  </section>
  const settled = Boolean(detail.data?.data.workOrder) || detail.data?.data.request.status === "accepted"
  if (mode === "workspace") return <div className="space-y-5">{detail.data?.data.quotations.length ? quotesPanel : null}{messagesPanel}{settled ? agreementPanel : null}</div>
  if (mode === "agreement") return agreementPanel
  if (mode === "quotes") return quotesPanel
  return messagesPanel
}

function EmptyPanel({ icon: Icon, title, text }: { icon: typeof FileText; title: string; text: string }) {
  return <div className="grid min-h-52 place-items-center px-5 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon className="size-6"/></span><strong className="mt-4 block text-emerald-950">{title}</strong><p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{text}</p></div></div>
}

function MessageBubble({ message, showRead, onDownload }: { message: RequestMessage; showRead: boolean; onDownload: (message: RequestMessage, attachmentId: string, name: string) => void }) {
  const mine = message.senderRole === "customer"
  return <article className={cn("max-w-[92%] rounded-2xl px-4 py-3 text-sm", mine ? "ml-auto rounded-br-md bg-emerald-950 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm", message.deliveryStatus === "failed" && "ring-2 ring-red-300")}>
    <p className="mb-1 text-[11px] font-black uppercase tracking-wider opacity-60">{mine ? "Bạn" : message.senderRole === "system" ? "Hệ thống" : "Cơ khí Đăng Khoa"}</p><p className="whitespace-pre-wrap leading-6">{message.content}</p>
    {!!message.attachments?.length && <div className="mt-3 flex flex-wrap gap-2">{message.attachments.map(file => <button className={cn("inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold", mine ? "bg-white/15" : "bg-slate-100 text-orange-700")} key={file._id} onClick={() => onDownload(message, file._id, file.originalName)}><Download className="size-4"/>{file.originalName}</button>)}</div>}
    <div className="mt-2 flex items-center justify-end gap-1 text-[11px] opacity-60"><time>{dateTime(message.createdAt)}</time>{message.deliveryStatus === "sending" && <span>· Đang gửi</span>}{message.deliveryStatus === "failed" && <span className="text-red-200">· Gửi lỗi</span>}{showRead && !message.deliveryStatus && (message.readByStaffAt ? <CheckCheck className="size-3.5" aria-label="Đã xem"/> : <Check className="size-3.5" aria-label="Đã gửi"/>)}</div>
  </article>
}

function QuoteCard({ quote, busy, rejecting, rejectNote, onRejecting, onRejectNote, onRespond }: { quote: Quotation; busy: boolean; rejecting?: string; rejectNote: string; onRejecting: (value?: string) => void; onRejectNote: (value: string) => void; onRespond: (decision: "accepted" | "rejected", note?: string) => void }) {
  const [confirming, setConfirming] = useState(false)
  return <article className="overflow-hidden rounded-2xl border border-orange-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 bg-orange-50 px-4 py-3"><div><strong className="text-emerald-950">{quote.code} · Lần {quote.version}</strong><p className="mt-1 text-xs text-slate-500">Hiệu lực đến {date(quote.validUntil)}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-orange-800">{quoteStatuses[quote.status] || quote.status}</span></div><div className="p-4">
    {quote.workTitle && <p className="mb-3 text-sm text-slate-700"><strong>Tên công việc:</strong> {quote.workTitle}</p>}
    <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="text-slate-500"><tr><th className="pb-2">Tên vật tư</th><th className="pb-2">Spec</th><th className="pb-2 text-right">SL</th><th className="pb-2 text-right">Đơn giá</th><th className="pb-2 text-right">Số tiền</th></tr></thead><tbody>{quote.items.map(item => <tr className="border-t border-slate-100" key={item._id}><td className="py-3 font-semibold text-slate-800">{item.description}</td><td className="py-3 text-slate-600">{item.spec || "—"}</td><td className="py-3 text-right">{item.quantity} {item.unit}</td><td className="py-3 text-right">{formatPrice(item.unitPrice)}</td><td className="py-3 text-right font-bold">{formatPrice(item.lineTotal)}</td></tr>)}</tbody></table></div>
    <div className="ml-auto mt-4 max-w-sm space-y-2 border-t border-slate-200 pt-3 text-sm">{quote.taxAmount > 0 && <><p className="flex justify-between"><span>Tạm tính</span><strong>{formatPrice(quote.subtotal)}</strong></p><p className="flex justify-between"><span>VAT ({quote.taxRate}%)</span><strong>{formatPrice(quote.taxAmount)}</strong></p></>}<p className="flex justify-between text-lg text-orange-700"><span className="font-bold">Tổng giá trị đơn hàng</span><strong>{formatPrice(quote.total)}</strong></p></div>
    {quote.leadTime && <p className="mt-4 text-sm text-slate-600"><strong>Thời gian giao hàng:</strong> {quote.leadTime}</p>}{quote.paymentTerms && <p className="mt-2 text-sm text-slate-600"><strong>Điều kiện thanh toán:</strong> {quote.paymentTerms}</p>}{quote.incoterm && <p className="mt-2 text-sm text-slate-600"><strong>Điều kiện giao hàng:</strong> {quote.incoterm}</p>}{quote.notes && <p className="mt-2 text-sm text-slate-600"><strong>Ghi chú:</strong> {quote.notes}</p>}
    {quote.status === "sent" && <div className="mt-5 border-t border-slate-100 pt-4">{rejecting === quote._id ? <div><Textarea value={rejectNote} onChange={event => onRejectNote(event.target.value)} placeholder="Điểm cần điều chỉnh về giá, thời gian hoặc phạm vi..."/><div className="mt-3 flex flex-wrap gap-2"><Button disabled={!rejectNote.trim() || busy} onClick={() => onRespond("rejected", rejectNote)}><Send className="size-4"/>Gửi nhờ báo giá lại</Button><Button variant="ghost" onClick={() => onRejecting(undefined)}>Quay lại</Button></div></div> : <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => setConfirming(true)}><Check className="size-5"/>Đồng ý báo giá</Button><Button variant="outline" disabled={busy} onClick={() => onRejecting(quote._id)}><X className="size-5"/>Nhờ báo giá lại</Button></div>}</div>}
  </div><ConfirmDialog open={confirming} title="Đồng ý báo giá?" description={`Bạn xác nhận đồng ý báo giá ${quote.code} với tổng giá trị ${formatPrice(quote.total)}. Dự án sẽ được tạo tự động để hai bên theo dõi tiến độ.`} confirmLabel="Đồng ý và tạo dự án" busy={busy} onOpenChange={setConfirming} onConfirm={() => { setConfirming(false); onRespond("accepted") }}/></article>
}

const date = (value: string) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value))
const dateTime = (value: string) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value))
function ErrorText({ text }: { text: string }) { return <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{text}</p> }
