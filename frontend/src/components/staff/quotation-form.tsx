import { Plus, Send, Trash2 } from "lucide-react"
import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IntegerInput, MoneyInput } from "@/components/ui/numeric-input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import type { QuotationDraft } from "@/lib/staff-client"
import { parseNumericInput } from "@/lib/numeric"
import { cn } from "@/lib/utils"

const amount = new Intl.NumberFormat("vi-VN")
const lineInput = "h-9 min-h-9 rounded-lg border-transparent bg-transparent px-2 text-sm font-semibold text-slate-950 shadow-none placeholder:font-medium placeholder:text-slate-500 hover:bg-slate-50 focus:border-orange-300 focus:bg-white focus:ring-2 focus:ring-orange-100"
const legalName = "CÔNG TY CỔ PHẦN TƯ VẤN ĐẦU TƯ XÂY DỰNG VÀ THƯƠNG MẠI ĐĂNG KHOA."

type QuoteLine = { description: string; spec: string; quantity: string; unit: string; unitPrice: string }
type QuoteDefaults = {
  workTitle: string
  recipientCompany: string
  recipientName: string
  recipientPhone: string
  recipientFax?: string
  senderName?: string
  senderPhone?: string
  senderFax?: string
  validityDays?: number
  paymentTerms?: string
  incoterm?: string
  leadTime?: string
  taxRate?: number
  notes?: string
  items?: Array<{ description: string; spec?: string; quantity: number; unit: string; unitPrice: number }>
  fromPrevious?: boolean
}

const emptyLine = (): QuoteLine => ({ description: "", spec: "", quantity: "1", unit: "cái", unitPrice: "" })
const copiedLines = (defaults: QuoteDefaults): QuoteLine[] => defaults.items?.length
  ? defaults.items.map(item => ({ description: item.description, spec: item.spec || "", quantity: String(item.quantity), unit: item.unit, unitPrice: String(item.unitPrice) }))
  : [emptyLine()]

export function QuotationForm({ busy, submitLabel, defaults, onSubmit }: { busy: boolean; submitLabel: string; defaults: QuoteDefaults; onSubmit: (body: QuotationDraft) => void }) {
  const { user } = useAuth()
  const [items, setItems] = useState<QuoteLine[]>(() => copiedLines(defaults))
  const [workTitle, setWorkTitle] = useState(defaults.workTitle)
  const senderName = user?.name || ""
  const [senderPhone, setSenderPhone] = useState(defaults.senderPhone || user?.phone || "")
  const [senderFax, setSenderFax] = useState(defaults.senderFax || "")
  const [recipientCompany, setRecipientCompany] = useState(defaults.recipientCompany)
  const [recipientName, setRecipientName] = useState(defaults.recipientName)
  const [recipientPhone, setRecipientPhone] = useState(defaults.recipientPhone)
  const [recipientFax, setRecipientFax] = useState(defaults.recipientFax || "")
  const [validityDays, setValidityDays] = useState(String(defaults.validityDays || 30))
  const [paymentTerms, setPaymentTerms] = useState(defaults.paymentTerms || "")
  const [incoterm, setIncoterm] = useState(defaults.incoterm || "")
  const [leadTime, setLeadTime] = useState(defaults.leadTime || "")
  const [taxRate, setTaxRate] = useState(String(defaults.taxRate ?? 0))
  const [notes, setNotes] = useState(defaults.notes || "")
  const [formError, setFormError] = useState("")
  const subtotal = items.reduce((sum, item) => sum + parseNumericInput(item.quantity) * parseNumericInput(item.unitPrice), 0)
  const tax = parseNumericInput(taxRate)
  const total = Math.round(subtotal * (1 + tax / 100))
  const today = new Date().toLocaleDateString("vi-VN")
  const locked = Boolean(defaults.fromPrevious)

  const updateItem = (index: number, patch: Partial<QuoteLine>) => setItems(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))

  const submit = () => {
    if (!workTitle.trim()) return setFormError("Nhập tên công việc.")
    if (!recipientCompany.trim() && !recipientName.trim()) return setFormError("Nhập công ty hoặc người nhận báo giá.")
    if (!senderName.trim()) return setFormError("Nhập người gửi báo giá.")
    const days = parseNumericInput(validityDays)
    if (days < 1 || days > 365) return setFormError("Hiệu lực báo giá là số ngày từ 1 đến 365.")
    if (tax < 0 || tax > 100) return setFormError("Thuế VAT phải từ 0 đến 100%.")
    if (items.some(item => !item.description.trim() || !item.unit.trim() || !item.unitPrice || parseNumericInput(item.quantity) < 1 || parseNumericInput(item.unitPrice) < 0)) return setFormError("Mỗi dòng vật tư cần tên, số lượng nguyên dương, đơn vị và đơn giá.")
    setFormError("")
    onSubmit({
      items: items.map(item => ({ description: item.description.trim(), spec: item.spec.trim(), quantity: parseNumericInput(item.quantity), unit: item.unit.trim(), unitPrice: parseNumericInput(item.unitPrice) })),
      taxRate: tax,
      validityDays: days,
      workTitle: workTitle.trim(),
      leadTime: leadTime.trim(),
      paymentTerms: paymentTerms.trim(),
      incoterm: incoterm.trim(),
      notes: notes.trim(),
      senderName: senderName.trim(),
      senderPhone: senderPhone.trim(),
      senderFax: senderFax.trim(),
      recipientCompany: recipientCompany.trim(),
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      recipientFax: recipientFax.trim()
    })
  }

  return <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-sm">
    <header className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-3 border-b border-slate-300 px-4 py-4 sm:px-6">
      <img src="/brand/dk-logo.png" alt="Đăng Khoa" className="h-16 w-20 object-contain"/>
      <div className="text-center">
        <p className="text-sm font-bold tracking-wide text-slate-950 sm:text-base">DANG KHOA CIC AND T.,JSC</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-600 sm:text-xs">ADD: CỤM 3 - DUYEN TRUONG - DUYEN THAI - THUONG TIN - HA NOI</p>
        <p className="text-[11px] leading-5 text-slate-600 sm:text-xs">TEL: 098 3688326</p>
        <p className="text-[11px] leading-5 text-slate-600 sm:text-xs">MST: 0106426038 · Email: ctydangkhoa8386@gmail.com</p>
      </div>
    </header>
    <div className="space-y-4 px-4 py-5 sm:px-6">
      <Field label="Supplier/ Công ty gửi báo giá"><Input value={legalName} readOnly className="bg-slate-50"/></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="PIC/ Người phụ trách báo giá"><Input value={senderName} readOnly className="bg-slate-50"/></Field>
        <Field label="Hand phone/ Số điện thoại"><Input value={senderPhone} onChange={event => setSenderPhone(event.target.value)}/></Field>
        <Field label="Quotation Date/ Ngày báo giá"><Input value={today} readOnly className="bg-slate-50"/></Field>
        <Field label="Fax No/ Số Fax"><Input value={senderFax} onChange={event => setSenderFax(event.target.value)} placeholder="Để trống nếu không có"/></Field>
        <Field label="Quotation's Validity/ Hiệu lực báo giá (ngày) *"><IntegerInput min={1} max={365} value={validityDays} onChange={event => setValidityDays(event.target.value)}/></Field>
      </div>
      <Field label="To: Công ty nhận báo giá"><Input value={recipientCompany} onChange={event => setRecipientCompany(event.target.value)} placeholder="Tên công ty khách hàng"/></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="PIC/ Người nhận báo giá"><Input value={recipientName} onChange={event => setRecipientName(event.target.value)}/></Field>
        <Field label="Hand phone/ Số điện thoại"><Input value={recipientPhone} onChange={event => setRecipientPhone(event.target.value)}/></Field>
        <Field label="Fax No/ Số Fax"><Input value={recipientFax} onChange={event => setRecipientFax(event.target.value)} placeholder="Để trống nếu không có"/></Field>
      </div>
      {locked && <p className="rounded-xl bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-950">Báo giá lại giữ đúng vật tư của đơn cũ. Chỉ chỉnh đơn giá, không thêm hoặc xóa dòng.</p>}
      <p className="text-sm leading-6 text-slate-600">Please check quotation's detail as following/ Công ty chúng tôi xin gửi tới Quý công ty báo giá cụ thể như sau</p>
      <Field label="+ Working Title/ Tên công việc *"><Input value={workTitle} onChange={event => setWorkTitle(event.target.value)}/></Field>
      <Field label="+ Payment Term/ Điều kiện thanh toán"><Input value={paymentTerms} onChange={event => setPaymentTerms(event.target.value)} placeholder="T/T 15 days after completing date."/></Field>
      <Field label="+ Incoterm/ Điều kiện giao hàng"><Input value={incoterm} onChange={event => setIncoterm(event.target.value)} placeholder="Giao tại xưởng / giao tại công trình"/></Field>
      <Field label="+ Leadtime/ Thời gian giao hàng"><Input value={leadTime} onChange={event => setLeadTime(event.target.value)} placeholder="Within 4 weeks after submitted."/></Field>
      <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <h4 className="text-sm font-bold text-slate-950">Vật tư chính</h4>
            <p className="text-xs font-medium text-slate-700">Chi phí vật tư</p>
          </div>
          {!locked && <Button type="button" size="sm" variant="ghost" className="min-h-9 px-3 font-bold text-orange-700 hover:bg-orange-50" onClick={() => setItems(current => [...current, emptyLine()])}><Plus className="size-4"/>Thêm dòng</Button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="border-y border-slate-300 bg-slate-50 text-left text-xs font-bold text-slate-800">
                <th className="w-10 px-3 py-2.5">#</th>
                <th className="px-2 py-2.5">Vật tư</th>
                <th className="w-[16%] px-2 py-2.5">Spec</th>
                <th className="w-[11%] px-2 py-2.5">Đơn vị</th>
                <th className="w-[9%] px-2 py-2.5 text-right">SL</th>
                <th className="w-[16%] px-2 py-2.5 text-right">Đơn giá</th>
                <th className="w-[18%] px-3 py-2.5 text-right">Thành tiền</th>
                <th className="w-9"/>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const lineTotal = parseNumericInput(item.quantity) * parseNumericInput(item.unitPrice)
                return <tr className="group border-b border-slate-200 last:border-0" key={index}>
                  <td className="px-3 py-1.5 text-sm font-bold text-slate-800">{index + 1}</td>
                  <td className="px-1 py-1.5"><Input value={item.description} readOnly={locked} onChange={event => updateItem(index, { description: event.target.value })} placeholder="Tên vật tư" className={cn(lineInput, locked && "bg-slate-50")}/></td>
                  <td className="px-1 py-1.5"><Input value={item.spec} readOnly={locked} onChange={event => updateItem(index, { spec: event.target.value })} placeholder="Model" className={cn(lineInput, locked && "bg-slate-50")}/></td>
                  <td className="px-1 py-1.5"><Input value={item.unit} readOnly={locked} onChange={event => updateItem(index, { unit: event.target.value })} className={cn(lineInput, locked && "bg-slate-50")}/></td>
                  <td className="px-1 py-1.5"><IntegerInput min={1} readOnly={locked} value={item.quantity} onChange={event => updateItem(index, { quantity: event.target.value })} className={cn(lineInput, "text-right", locked && "bg-slate-50")}/></td>
                  <td className="px-1 py-1.5"><MoneyInput min={0} value={item.unitPrice} onChange={event => updateItem(index, { unitPrice: event.target.value })} placeholder="0" className={cn(lineInput, "text-right", defaults.fromPrevious && "bg-orange-50")}/></td>
                  <td className="px-3 py-1.5 text-right text-sm font-bold tabular-nums text-slate-950">{amount.format(lineTotal)}</td>
                  <td className="pr-2">{!locked && items.length > 1 && <button type="button" aria-label={`Xóa dòng ${index + 1}`} className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600" onClick={() => setItems(current => current.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4"/></button>}</td>
                </tr>
              })}
            </tbody>
          </table>
        </div>
        <footer className="space-y-1 border-t border-slate-300 bg-slate-50 px-4 py-3">
          {tax > 0 && <p className="flex items-center justify-between text-sm font-semibold text-slate-800"><span>VAT {tax}%</span><span className="tabular-nums">{amount.format(total - subtotal)}</span></p>}
          <p className="flex items-center justify-between gap-4"><span className="text-sm font-bold text-slate-900">Tổng giá trị đơn hàng</span><strong className="text-xl font-bold tabular-nums tracking-tight text-orange-700">{amount.format(total)} <span className="text-sm font-bold">đ</span></strong></p>
        </footer>
      </section>
      <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)]">
        <Field label="Thuế VAT (%)"><IntegerInput min={0} max={100} value={taxRate} onChange={event => setTaxRate(event.target.value)}/></Field>
        <Field label="Ghi chú"><Textarea rows={2} value={notes} onChange={event => setNotes(event.target.value)} placeholder="Ghi chú in ở cuối báo giá, nếu có"/></Field>
      </div>
      {formError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{formError}</p>}
      <div className="flex justify-end"><Button disabled={busy} onClick={submit}><Send className="size-4"/>{busy ? "Đang gửi..." : submitLabel}</Button></div>
    </div>
  </div>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700">{label}<span className="mt-1.5 block font-normal">{children}</span></label>
}
