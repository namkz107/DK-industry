import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Banknote, CalendarClock, History, MapPin, Navigation, PackageCheck, Phone, Search, Truck, UserCheck, Wrench } from "lucide-react"
import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import { StaffShell } from "@/components/staff/staff-shell"
import { Pagination } from "@/components/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoneyInput } from "@/components/ui/numeric-input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { usePageMeta } from "@/hooks/use-page-meta"
import { staffClient } from "@/lib/staff-client"
import { googleMapsDirectionsUrl } from "@/lib/google-maps"
import { formatGroupedNumber, parseNumericInput } from "@/lib/numeric"
import { cn } from "@/lib/utils"
import type { OrderStatus, PaymentStatus, StaffOrder } from "@/types/staff"

const statusNames: Record<OrderStatus, string> = { pending: "Chờ xác nhận", confirmed: "Đã xác nhận", preparing: "Đã xác nhận", shipping: "Đang giao", delivered: "Hoàn tất", cancelled: "Đã hủy" }
const paymentNames: Record<PaymentStatus, string> = { unpaid: "Chưa thanh toán", pending: "Chờ đối soát", paid: "Đã thanh toán", refund_pending: "Chờ hoàn tiền", refunded: "Đã hoàn tiền" }
const nextStatuses: Record<OrderStatus, OrderStatus[]> = { pending: ["confirmed", "cancelled"], confirmed: ["shipping", "cancelled"], preparing: ["shipping", "cancelled"], shipping: ["delivered"], delivered: [], cancelled: [] }
const actionNames: Partial<Record<OrderStatus, string>> = { confirmed: "Xác nhận đơn", shipping: "Bắt đầu giao hàng", delivered: "Hoàn tất đơn" }
const paymentTransitions: Record<PaymentStatus, PaymentStatus[]> = { unpaid: ["pending", "paid"], pending: ["unpaid", "paid"], paid: ["refund_pending"], refund_pending: ["refunded"], refunded: [] }
const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })

export function StaffOrdersPage() {
  usePageMeta("Quản lý đơn hàng", "Xác nhận đơn, giao hàng và hoàn tất trong ba bước.")
  const [params] = useSearchParams()
  const client = useQueryClient()
  const toast = useToast()
  const [filters, setFilters] = useState({ q: "", status: params.get("status") || "", paymentStatus: "", assigned: params.get("assigned") || "" })
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState("")
  const list = useQuery({ queryKey: ["staff", "orders", filters, page], queryFn: () => staffClient.orders({ ...filters, page }) })
  const detail = useQuery({ queryKey: ["staff", "order", selected], queryFn: () => staffClient.order(selected), enabled: Boolean(selected) })
  useEffect(() => setPage(1), [filters])
  useEffect(() => { const items = list.data?.data.items; if (items?.length && !items.some(item => item._id === selected)) setSelected(items[0]._id) }, [list.data, selected])
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["staff", "orders"] })
    void client.invalidateQueries({ queryKey: ["staff", "order", selected] })
    void client.invalidateQueries({ queryKey: ["staff", "dashboard"] })
  }
  const update = useMutation({ mutationFn: (body: Parameters<typeof staffClient.updateOrder>[1]) => staffClient.updateOrder(selected, body), onSuccess: result => { toast.success(result.message || "Đã lưu thay đổi đơn hàng"); refresh() }, onError: error => toast.error(error.message) })
  const afterSales = useMutation({ mutationFn: ({ requestId, status, resolution }: { requestId: string; status: string; resolution?: string }) => staffClient.updateAfterSales(selected, requestId, { status, resolution }), onSuccess: result => { toast.success(result.message || "Đã cập nhật yêu cầu hậu mãi"); refresh() }, onError: error => toast.error(error.message) })

  return <StaffShell title="Đơn hàng thương mại" description="Nhận đơn, xác nhận, giao hàng và hoàn tất trong ít thao tác nhất.">
    <div className="mb-5 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-[1fr_180px_180px_170px]">
      <label className="relative"><Search className="absolute left-3 top-3.5 size-5 text-slate-400"/><Input className="pl-10" value={filters.q} onChange={event => setFilters({ ...filters, q: event.target.value })} placeholder="Mã đơn, người nhận, điện thoại..."/></label>
      <Filter value={filters.status} onChange={status => setFilters({ ...filters, status })} first="Mọi trạng thái" options={[["pending", "Chờ xác nhận"], ["confirmed", "Đã xác nhận"], ["shipping", "Đang giao"], ["delivered", "Hoàn tất"], ["cancelled", "Đã hủy"]]}/>
      <Filter value={filters.paymentStatus} onChange={paymentStatus => setFilters({ ...filters, paymentStatus })} first="Mọi thanh toán" options={Object.entries(paymentNames)}/>
      <Filter value={filters.assigned} onChange={assigned => setFilters({ ...filters, assigned })} first="Tất cả phụ trách" options={[["mine", "Của tôi"], ["unassigned", "Chưa phân công"]]}/>
    </div>
    <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
      <div><div className="space-y-3">{list.data?.data.items.map(item => <button key={item._id} onClick={() => setSelected(item._id)} className={cn("w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:border-orange-300", selected === item._id && "border-orange-500 ring-2 ring-orange-100")}><div className="flex justify-between gap-3"><strong className="text-lg text-emerald-950">{item.code}</strong><span className="text-sm font-black text-orange-700">{money.format(item.total)}</span></div><p className="mt-2 text-slate-700">{item.shippingAddress.recipientName}</p><div className="mt-3 flex justify-between gap-2 text-sm"><span className="font-bold text-emerald-700">{statusNames[item.status]}</span><span className="text-slate-500">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span></div><div className="mt-2 flex items-center justify-between gap-2 text-xs font-semibold"><span className="text-slate-500">{paymentNames[item.paymentStatus]}</span>{!item.assignedTo && <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">Chưa có người nhận</span>}</div></button>)}{list.isLoading && <p className="rounded-2xl bg-white p-5">Đang tải đơn hàng...</p>}{list.error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-red-700">{list.error.message}</p>}{!list.isLoading && !list.data?.data.items.length && <p className="rounded-2xl bg-white p-6 text-center text-slate-500">Không có đơn phù hợp.</p>}</div><Pagination page={list.data?.data.page || page} pages={list.data?.data.pages || 1} onChange={setPage}/></div>
      {detail.data?.data ? <OrderDetail order={detail.data.data} busy={update.isPending || afterSales.isPending} onUpdate={body => update.mutate(body)} onAfterSales={(requestId, status, resolution) => afterSales.mutate({ requestId, status, resolution })}/> : <div className="rounded-3xl border bg-white p-10 text-center text-slate-500">Chọn một đơn hàng để xử lý.</div>}
    </div>
  </StaffShell>
}

function OrderDetail({ order, busy, onUpdate, onAfterSales }: { order: StaffOrder; busy: boolean; onUpdate: (body: Parameters<typeof staffClient.updateOrder>[1]) => void; onAfterSales: (requestId: string, status: string, resolution?: string) => void }) {
  const [nextStatus, setNextStatus] = useState("")
  const [paymentStatus, setPaymentStatus] = useState("")
  const [message, setMessage] = useState("")
  const [amountPaid, setAmountPaid] = useState(formatGroupedNumber(order.total))
  const [paymentReference, setPaymentReference] = useState(order.paymentReference || "")
  const [internalNote, setInternalNote] = useState(order.internalNote || "")
  const [shippingFee, setShippingFee] = useState(formatGroupedNumber(order.shippingFee || 0))
  const [shippingProvider, setShippingProvider] = useState(order.shippingProvider || "")
  const [trackingCode, setTrackingCode] = useState(order.trackingCode || "")
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState(order.estimatedDeliveryAt?.slice(0, 16) || "")
  const [deliveryRecipientName, setDeliveryRecipientName] = useState(order.deliveryRecipientName || order.shippingAddress.recipientName)
  const [deliveryConfirmed, setDeliveryConfirmed] = useState(false)

  useEffect(() => {
    setNextStatus(nextStatuses[order.status].find(status => status !== "cancelled") || ""); setPaymentStatus(""); setMessage(""); setAmountPaid(formatGroupedNumber(order.total)); setPaymentReference(order.paymentReference || ""); setInternalNote(order.internalNote || "")
    setShippingFee(formatGroupedNumber(order.shippingFee || 0)); setShippingProvider(order.shippingProvider || ""); setTrackingCode(order.trackingCode || ""); setEstimatedDeliveryAt(order.estimatedDeliveryAt?.slice(0, 16) || "")
    setDeliveryRecipientName(order.deliveryRecipientName || order.shippingAddress.recipientName); setDeliveryConfirmed(false)
  }, [order])

  const allowedPayments = paymentTransitions[order.paymentStatus].filter(status => (status !== "refund_pending" || order.status === "cancelled") && !(status === "paid" && order.paymentMethod === "cod"))
  const directionsUrl = order.shippingAddress.latitude !== undefined && order.shippingAddress.longitude !== undefined
    ? googleMapsDirectionsUrl(order.shippingAddress.latitude, order.shippingAddress.longitude)
    : ""
  const submitProgress = (event: FormEvent) => {
    event.preventDefault()
    const body: Parameters<typeof staffClient.updateOrder>[1] = { message, shippingProvider, trackingCode, estimatedDeliveryAt }
    if (["pending", "confirmed", "preparing"].includes(order.status)) body.shippingFee = parseNumericInput(shippingFee)
    if (nextStatus) body.status = nextStatus as OrderStatus
    if (nextStatus === "delivered") { body.deliveryConfirmed = deliveryConfirmed; body.deliveryRecipientName = deliveryRecipientName.trim() }
    if (paymentStatus) {
      body.paymentStatus = paymentStatus as PaymentStatus
      if (paymentStatus === "paid") { body.amountPaid = parseNumericInput(amountPaid); body.paymentReference = paymentReference }
      if (paymentStatus === "refunded") body.paymentReference = paymentReference
    }
    onUpdate(body)
  }

  return <article className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
    <div className="flex flex-col justify-between gap-4 md:flex-row"><div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">{statusNames[order.status]}</span><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-800">{paymentNames[order.paymentStatus]}</span></div><p className="mt-3 text-sm font-black uppercase tracking-wider text-orange-700">{order.code}</p><h2 className="mt-1 font-display text-3xl font-bold text-emerald-950">{order.shippingAddress.recipientName}</h2><p className="mt-2 text-slate-600">{order.customer.name} · {order.paymentMethod === "cod" ? "Thanh toán khi nhận" : "Chuyển khoản"}</p></div>{order.assignedTo ? <p className="text-sm font-semibold text-slate-500">Phụ trách: {order.assignedTo.name}</p> : <Button disabled={busy} onClick={() => onUpdate({ assignedTo: "me" })}><UserCheck className="size-5"/>Nhận xử lý đơn</Button>}</div>

    <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2"><p className="flex gap-3"><MapPin className="mt-1 size-5 shrink-0 text-orange-600"/><span>{order.shippingAddress.addressLine}, {order.shippingAddress.ward && `${order.shippingAddress.ward}, `}{order.shippingAddress.district}, {order.shippingAddress.province}</span></p><a className="flex min-h-11 items-center gap-3 font-bold text-emerald-800" href={`tel:${order.shippingAddress.phone}`}><Phone className="size-5 text-orange-600"/>{order.shippingAddress.phone}</a></div>
    {directionsUrl && <a className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-800 hover:border-orange-300 hover:text-orange-700" href={directionsUrl} target="_blank" rel="noreferrer"><Navigation className="size-4"/>Chỉ đường đến điểm giao hàng</a>}

    <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead className="border-b text-sm text-slate-500"><tr><th className="py-3">Sản phẩm</th><th>SL</th><th>Đơn giá</th><th className="text-right">Thành tiền</th></tr></thead><tbody>{order.items.map(item => <tr key={item._id} className="border-b"><td className="py-4 font-bold text-emerald-950">{item.name}<span className="block text-xs font-normal text-slate-500">{item.sku}</span></td><td>{item.quantity} {item.unit}</td><td>{money.format(item.price)}</td><td className="text-right font-bold">{money.format(item.lineTotal)}</td></tr>)}</tbody></table><div className="ml-auto mt-5 max-w-sm space-y-2 text-sm"><p className="flex justify-between"><span className="text-slate-500">Tiền hàng</span><strong>{money.format(order.subtotal)}</strong></p><p className="flex justify-between"><span className="text-slate-500">Vận chuyển</span><strong>{money.format(order.shippingFee)}</strong></p><p className="flex justify-between border-t pt-2 font-display text-xl"><span>Tổng</span><strong className="text-orange-700">{money.format(order.total)}</strong></p></div></div>

    <Section icon={<Truck/>} title="Thông tin giao hàng">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Phí vận chuyển (VND)"><MoneyInput min="0" disabled={Boolean(order.paymentLockedAt) || ["shipping", "delivered", "cancelled"].includes(order.status)} value={shippingFee} onChange={event => setShippingFee(event.target.value)}/></Field>
        <Field label="Đơn vị / hình thức vận chuyển"><Input disabled={["delivered", "cancelled"].includes(order.status)} value={shippingProvider} onChange={event => setShippingProvider(event.target.value)} placeholder="Ví dụ: Viettel Post hoặc xe công ty"/></Field>
        <Field label="Mã vận đơn"><Input disabled={["delivered", "cancelled"].includes(order.status)} value={trackingCode} onChange={event => setTrackingCode(event.target.value)} placeholder="Có thể để trống nếu giao xe công ty"/></Field>
        <Field label="Thời gian giao dự kiến"><Input disabled={["delivered", "cancelled"].includes(order.status)} type="datetime-local" value={estimatedDeliveryAt} onChange={event => setEstimatedDeliveryAt(event.target.value)}/></Field>
        {!(["delivered", "cancelled"] as OrderStatus[]).includes(order.status) && <p className="md:col-span-2 text-sm text-slate-500">Thông tin này sẽ được lưu cùng nút xử lý bên dưới.</p>}
      </div>
    </Section>

    <Section icon={<PackageCheck/>} title="Bước xử lý tiếp theo">
      {!order.assignedTo ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><strong className="text-amber-900">Đơn chưa có người phụ trách</strong><p className="mt-1 text-sm text-amber-800">Chọn “Nhận xử lý đơn” phía trên trước khi cập nhật tồn kho, thanh toán hoặc giao hàng.</p></div> : !nextStatuses[order.status].length && !allowedPayments.length ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Đơn hàng đã kết thúc, không còn bước xử lý tiếp theo.</p> : <form className="grid gap-3 lg:grid-cols-2" onSubmit={submitProgress}>
        <Filter value={nextStatus} onChange={setNextStatus} first="Không đổi tiến trình" options={nextStatuses[order.status].map(status => [status, statusNames[status]])}/>
        <Filter value={paymentStatus} onChange={setPaymentStatus} first="Không đổi thanh toán" options={allowedPayments.map(status => [status, paymentNames[status]])}/>
        {paymentStatus === "paid" && <><Field label="Số tiền thực nhận (VND)"><MoneyInput min="0" value={amountPaid} onChange={event => setAmountPaid(event.target.value)}/></Field><Field label="Mã / nội dung giao dịch"><Input value={paymentReference} onChange={event => setPaymentReference(event.target.value)} placeholder="Ví dụ: FT24200123456"/></Field></>}
        {paymentStatus === "refunded" && <Field label="Mã giao dịch hoàn tiền"><Input value={paymentReference} onChange={event => setPaymentReference(event.target.value)} placeholder="Mã đối soát hoàn tiền"/></Field>}
        {nextStatus === "delivered" && <><Field label="Người đã nhận hàng"><Input value={deliveryRecipientName} onChange={event => setDeliveryRecipientName(event.target.value)} placeholder="Tên người nhận thực tế"/></Field><label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-900"><input className="size-5 accent-emerald-700" type="checkbox" checked={deliveryConfirmed} onChange={event => setDeliveryConfirmed(event.target.checked)}/>Tôi xác nhận hàng đã được giao đủ</label></>}
        <Input value={message} onChange={event => setMessage(event.target.value)} placeholder={nextStatus === "cancelled" ? "Bắt buộc nhập lý do hủy" : "Nội dung khách hàng sẽ nhìn thấy"}/>
        <Button disabled={busy || (!nextStatus && !paymentStatus) || (nextStatus === "cancelled" && message.trim().length < 5) || (nextStatus === "delivered" && (!deliveryConfirmed || deliveryRecipientName.trim().length < 2)) || (paymentStatus === "paid" && order.paymentMethod === "bank_transfer" && paymentReference.trim().length < 3)}>{nextStatus ? actionNames[nextStatus as OrderStatus] || statusNames[nextStatus as OrderStatus] : "Cập nhật thanh toán"}</Button>
      </form>}
      {order.paymentMethod === "bank_transfer" && order.paymentStatus !== "paid" && <p className="mt-3 flex items-center gap-2 text-sm text-amber-700"><Banknote className="size-4"/>Đơn chuyển khoản phải được xác nhận “Đã thanh toán” trước khi xuất giao.</p>}
    </Section>

    <Section icon={<History/>} title="Lịch sử xử lý">
      <div className="grid gap-6 md:grid-cols-2"><Timeline title="Tiến trình đơn hàng" entries={order.timeline.map(item => ({ label: statusNames[item.status as OrderStatus] || item.status, message: item.message, at: item.at }))}/><Timeline title="Đối soát thanh toán" entries={(order.paymentTimeline || []).map(item => ({ label: paymentNames[item.status], message: item.message, at: item.at }))}/></div>
      {order.status === "delivered" && <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900"><strong>Giao thành công:</strong> {order.deliveryRecipientName || order.shippingAddress.recipientName}{order.customerConfirmedAt ? ` · Khách đã xác nhận lúc ${new Date(order.customerConfirmedAt).toLocaleString("vi-VN")}` : " · Đang chờ khách xác nhận thêm"}</p>}
    </Section>

    {order.afterSalesRequests?.length ? <Section icon={<Wrench/>} title="Bảo hành, đổi trả và khiếu nại"><div className="space-y-4">{order.afterSalesRequests.map(item => <AfterSalesItem key={item._id} item={item} busy={busy} onUpdate={(status, resolution) => onAfterSales(item._id, status, resolution)}/>)}</div></Section> : null}
    <div className="mt-6"><label className="text-sm font-bold text-slate-700">Ghi chú nội bộ<Textarea className="mt-2" value={internalNote} onChange={event => setInternalNote(event.target.value)} placeholder="Thông tin kho, hóa đơn VAT, vận chuyển..."/></label><Button className="mt-3" variant="outline" disabled={busy} onClick={() => onUpdate({ internalNote })}>Lưu ghi chú</Button></div>
  </article>
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) { return <section className="mt-7 border-t border-slate-200 pt-6"><h3 className="mb-4 flex items-center gap-2 font-display text-xl font-bold text-emerald-950"><span className="grid size-9 place-items-center rounded-xl bg-orange-50 text-orange-700 [&>svg]:size-5">{icon}</span>{title}</h3>{children}</section> }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="text-sm font-bold text-slate-700">{label}<span className="mt-2 block">{children}</span></label> }
function AfterSalesItem({ item, busy, onUpdate }: { item: NonNullable<StaffOrder["afterSalesRequests"]>[number]; busy: boolean; onUpdate: (status: string, resolution?: string) => void }) { const options: Record<string, string[]> = { submitted: ["reviewing", "rejected"], reviewing: ["approved", "rejected"], approved: ["received", "resolved"], received: ["resolved"], rejected: [], resolved: [] }; const [status, setStatus] = useState(""); const [resolution, setResolution] = useState(item.resolution || ""); return <div className="rounded-2xl border bg-slate-50 p-4"><strong className="text-emerald-950">{item.type === "warranty" ? "Bảo hành" : item.type === "return" ? "Đổi / trả" : "Khiếu nại"} · {item.status}</strong><p className="mt-2 text-sm text-slate-600">{item.reason}</p>{options[item.status]?.length > 0 && <div className="mt-3 grid gap-3 sm:grid-cols-[190px_1fr_auto]"><Filter value={status} onChange={setStatus} first="Chọn bước xử lý" options={options[item.status].map(value => [value, value])}/><Input value={resolution} onChange={event => setResolution(event.target.value)} placeholder="Kết quả / hướng xử lý"/><Button disabled={busy || !status || (["rejected", "resolved"].includes(status) && resolution.trim().length < 5)} onClick={() => onUpdate(status, resolution.trim())}>Cập nhật</Button></div>}</div> }
function Timeline({ title, entries }: { title: string; entries: Array<{ label: string; message?: string; at: string }> }) { return <div><h4 className="mb-3 font-bold text-slate-800">{title}</h4>{entries.length ? <ol className="space-y-3">{entries.map((item, index) => <li className="flex gap-3 text-sm" key={`${item.at}-${index}`}><span className="mt-1.5 size-2 shrink-0 rounded-full bg-orange-500"/><div><strong>{item.label}</strong>{item.message && <p className="mt-1 text-slate-500">{item.message}</p>}<time className="mt-1 flex items-center gap-1 text-xs text-slate-400"><CalendarClock className="size-3"/>{new Date(item.at).toLocaleString("vi-VN")}</time></div></li>)}</ol> : <p className="text-sm text-slate-400">Chưa có cập nhật.</p>}</div> }
function Filter({ value, onChange, first, options }: { value: string; onChange: (value: string) => void; first: string; options: string[][] }) { return <Select ariaLabel={first} value={value} onChange={onChange} options={[{ value: "", label: first }, ...options.map(([optionValue, label]) => ({ value: optionValue, label }))]}/> }
