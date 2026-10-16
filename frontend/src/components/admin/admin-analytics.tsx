import { Boxes, PackageCheck, Target, TrendingUp } from "lucide-react"
import type { AdminAnalytics } from "@/types/admin"

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 })
const compactMoney = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 })
const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "#f97316" }, confirmed: { label: "Đã xác nhận", color: "#0f766e" },
  preparing: { label: "Đã xác nhận", color: "#0284c7" }, shipping: { label: "Đang giao", color: "#7c3aed" },
  delivered: { label: "Hoàn tất", color: "#16a34a" }, cancelled: { label: "Đã hủy", color: "#94a3b8" },
}

export function AdminAnalyticsPanel({ analytics }: { analytics?: AdminAnalytics }) {
  return <section className="mt-8">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-700">Phân tích kinh doanh</p><h2 className="mt-2 font-display text-3xl font-bold text-emerald-950">Nhìn nhanh xu hướng quan trọng</h2></div><span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800">12 tháng gần nhất</span></div>
    <RevenueChart items={analytics?.revenueTrend || []}/>
    <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
      <OrderStatusChart items={analytics?.orderStatuses || []}/>
      <ConversionChart value={analytics?.conversion}/>
      <TopProductsChart items={analytics?.topProducts || []}/>
    </div>
  </section>
}

function RevenueChart({ items }: { items: AdminAnalytics["revenueTrend"] }) {
  const width = 760; const baseline = 220; const max = Math.max(...items.map(item => item.revenue), 1)
  const points = items.map((item, index) => ({ ...item, x: 28 + index * ((width - 56) / Math.max(items.length - 1, 1)), y: baseline - item.revenue / max * 175 }))
  const line = points.map((point, index) => `${index ? "L" : "M"}${point.x},${point.y}`).join(" ")
  const area = points.length ? `${line} L${points.at(-1)!.x},${baseline} L${points[0].x},${baseline} Z` : ""
  const total = items.reduce((sum, item) => sum + item.revenue, 0)
  return <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2 text-emerald-950"><TrendingUp className="size-5 text-orange-600"/><h3 className="font-display text-2xl font-bold">Doanh thu theo tháng</h3></div><p className="mt-1 text-sm text-slate-500">Dựa trên thời điểm thanh toán thành công</p></div><div className="text-right"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng 12 tháng</p><strong className="text-xl text-orange-700">{money.format(total)}</strong></div></div>{items.length ? <div className="mt-5 overflow-x-auto"><svg className="h-auto min-w-[680px] w-full" viewBox={`0 0 ${width} 270`} role="img" aria-label="Biểu đồ doanh thu 12 tháng gần nhất"><defs><linearGradient id="revenue-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity=".32"/><stop offset="100%" stopColor="#f97316" stopOpacity=".02"/></linearGradient><linearGradient id="revenue-line" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#0f766e"/><stop offset="100%" stopColor="#f97316"/></linearGradient></defs>{[45, 103, 161, 220].map(y => <line key={y} x1="28" x2={width - 28} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="5 7"/>)}<path d={area} fill="url(#revenue-area)"/><path d={line} fill="none" stroke="url(#revenue-line)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>{points.map(point => <g key={point.key}><circle cx={point.x} cy={point.y} r="9" fill="white" stroke="#f97316" strokeWidth="4"><title>{point.label}: {money.format(point.revenue)} · {point.orders} đơn</title></circle><text x={point.x} y="252" textAnchor="middle" className="fill-slate-500 text-[12px] font-bold">{point.label}</text></g>)}</svg></div> : <EmptyChart/>}</section>
}

function OrderStatusChart({ items }: { items: AdminAnalytics["orderStatuses"] }) {
  const values = items.map(item => ({ ...item, ...(statusConfig[item.status] || { label: item.status, color: "#64748b" }) })).filter(item => item.count > 0)
  const total = values.reduce((sum, item) => sum + item.count, 0); let offset = 0
  const segments = values.map(item => { const start = offset; offset += item.count / Math.max(total, 1) * 100; return `${item.color} ${start}% ${offset}%` })
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-2"><PackageCheck className="size-5 text-orange-600"/><h3 className="font-display text-xl font-bold text-emerald-950">Trạng thái đơn hàng</h3></div><p className="mt-1 text-sm text-slate-500">Phân bổ đơn trong 12 tháng gần nhất</p>{total ? <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row"><div className="relative size-40 shrink-0 rounded-full" style={{ background: `conic-gradient(${segments.join(",")})` }}><div className="absolute inset-5 grid place-items-center rounded-full bg-white text-center shadow-inner"><div><strong className="font-display text-3xl text-emerald-950">{total}</strong><span className="block text-xs font-bold text-slate-400">TỔNG ĐƠN</span></div></div></div><div className="w-full space-y-2.5">{values.map(item => <div className="flex items-center justify-between gap-3 text-sm" key={item.status}><span className="flex items-center gap-2 font-semibold text-slate-600"><i className="size-2.5 rounded-full" style={{ backgroundColor: item.color }}/>{item.label}</span><strong className="text-emerald-950">{item.count}</strong></div>)}</div></div> : <EmptyChart/>}</section>
}

function ConversionChart({ value }: { value?: AdminAnalytics["conversion"] }) {
  const stages = [{ label: "Cơ hội tiếp nhận", value: value?.opportunities || 0, color: "from-emerald-950 to-emerald-700" }, { label: "Hồ sơ đã báo giá", value: value?.quotations || 0, color: "from-teal-700 to-teal-500" }, { label: "Đơn / công việc", value: value?.wins || 0, color: "from-orange-600 to-orange-400" }]
  const max = Math.max(...stages.map(stage => stage.value), 1); const rate = value?.opportunities ? Math.round((value.wins / value.opportunities) * 100) : 0
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Target className="size-5 text-orange-600"/><h3 className="font-display text-xl font-bold text-emerald-950">Chuyển đổi kinh doanh</h3></div><strong className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-700">{rate}%</strong></div><p className="mt-1 text-sm text-slate-500">Hiệu quả trong 12 tháng gần nhất</p><div className="mt-7 space-y-5">{stages.map(stage => <div key={stage.label}><div className="mb-2 flex items-center justify-between text-sm"><span className="font-bold text-slate-600">{stage.label}</span><strong className="text-emerald-950">{stage.value}</strong></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full bg-gradient-to-r ${stage.color} transition-all duration-700`} style={{ width: `${stage.value ? Math.max(6, stage.value / max * 100) : 0}%` }}/></div></div>)}</div><p className="mt-6 text-xs leading-5 text-slate-400">Cơ hội gồm Lead hợp lệ và yêu cầu trực tiếp; kết quả chốt gồm đơn thương mại và công việc sau khi khách duyệt báo giá.</p></section>
}

function TopProductsChart({ items }: { items: AdminAnalytics["topProducts"] }) {
  const max = Math.max(...items.map(item => item.revenue), 1)
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 xl:col-span-1"><div className="flex items-center gap-2"><Boxes className="size-5 text-orange-600"/><h3 className="font-display text-xl font-bold text-emerald-950">Sản phẩm nổi bật</h3></div><p className="mt-1 text-sm text-slate-500">Top doanh thu đã thanh toán trong 12 tháng</p>{items.length ? <div className="mt-6 space-y-4">{items.map((item, index) => <div key={`${item.productId || item.name}-${index}`}><div className="flex items-end justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-emerald-950">{index + 1}. {item.name}</p><span className="text-xs text-slate-500">{item.quantity.toLocaleString("vi-VN")} sản phẩm</span></div><strong className="shrink-0 text-sm text-orange-700">{compactMoney.format(item.revenue)}đ</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-emerald-800 to-orange-500" style={{ width: `${Math.max(5, item.revenue / max * 100)}%` }}/></div></div>)}</div> : <EmptyChart/>}</section>
}

function EmptyChart() { return <div className="mt-6 grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center text-sm font-semibold text-slate-400">Chưa có đủ dữ liệu để hiển thị biểu đồ.</div> }
