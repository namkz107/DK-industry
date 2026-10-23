import type { ReactNode } from "react"
import { Boxes, CircleDollarSign, PackageCheck, Target, TrendingUp } from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { FadeContent } from "@/components/react-bits/fade-content"
import type { AdminAnalytics, AdminOrderSummary } from "@/types/admin"

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 })
const compactMoney = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 })
const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xác nhận", color: "#f97316" },
  confirmed: { label: "Đã xác nhận", color: "#0f766e" },
  preparing: { label: "Đang chuẩn bị", color: "#0284c7" },
  shipping: { label: "Đang giao", color: "#7c3aed" },
  delivered: { label: "Hoàn tất", color: "#16a34a" },
  cancelled: { label: "Đã hủy", color: "#94a3b8" },
}

export interface AdminSalesSummary {
  revenue: number
  monthlyRevenue: number
  deliveredRevenue: number
  monthlyDeliveredRevenue: number
  deliveredOrders: number
}

export function AdminAnalyticsPanel({ analytics, sales, recentOrders }: { analytics?: AdminAnalytics; sales?: AdminSalesSummary; recentOrders?: AdminOrderSummary[] }) {
  const trend = analytics?.revenueTrend || []
  const productTotal = trend.reduce((sum, item) => sum + item.revenue, 0)
  const projectTotal = trend.reduce((sum, item) => sum + (item.projectRevenue || 0), 0)
  const total = productTotal + projectTotal
  const rate = analytics?.conversion.opportunities ? Math.round((analytics.conversion.wins / analytics.conversion.opportunities) * 100) : 0

  return <section className="relative mt-8 overflow-hidden rounded-[32px] border border-emerald-100/80 bg-[radial-gradient(circle_at_12%_8%,rgba(251,146,60,.28),transparent_28%),radial-gradient(circle_at_88%_0%,rgba(16,185,129,.22),transparent_26%),linear-gradient(165deg,#f8fafc_0%,#ecfdf5_48%,#fff7ed_100%)] p-4 shadow-[0_30px_80px_-48px_rgba(6,78,59,.65)] sm:p-6">
    <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(15,118,110,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,118,110,.08)_1px,transparent_1px)] [background-size:32px_32px]"/>
    <div className="pointer-events-none absolute -left-16 top-24 size-56 rounded-full bg-orange-300/30 blur-3xl"/>
    <div className="pointer-events-none absolute -right-10 bottom-10 size-64 rounded-full bg-emerald-300/30 blur-3xl"/>
    <div className="relative">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-orange-700">Phân tích kinh doanh</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-emerald-950">Doanh thu và xu hướng</h2>
        </div>
        <span className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm ring-1 ring-emerald-100">12 tháng gần nhất</span>
      </div>
      {sales && <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SalesCard label="Đã thu" value={money.format(sales.revenue)} note={`Tháng này ${money.format(sales.monthlyRevenue)}`} icon={CircleDollarSign}/>
        <SalesCard label="Đã giao thành công" value={money.format(sales.deliveredRevenue)} note={`${sales.deliveredOrders} đơn · tháng này ${money.format(sales.monthlyDeliveredRevenue)}`} icon={PackageCheck}/>
        <SalesCard label="Doanh thu 12 tháng" value={money.format(total)} note={`Sản phẩm ${money.format(productTotal)} · Dự án ${money.format(projectTotal)}`} icon={TrendingUp}/>
        <SalesCard label="Tỷ lệ chuyển đổi" value={`${rate}%`} note="Từ yêu cầu đến đơn hoặc dự án đã chốt" icon={Target}/>
      </div>}
      <FadeContent>
        <RevenueChart items={trend}/>
      </FadeContent>
      <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <FadeContent delay={0.05}><OrderStatusChart items={analytics?.orderStatuses || []}/></FadeContent>
        <FadeContent delay={0.1}><ConversionChart value={analytics?.conversion}/></FadeContent>
        <FadeContent delay={0.15} className="lg:col-span-2 xl:col-span-1"><TopProductsChart items={analytics?.topProducts || []}/></FadeContent>
      </div>
      {recentOrders && <RecentOrders items={recentOrders}/>}
    </div>
  </section>
}

function SalesCard({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof CircleDollarSign }) {
  return <article className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-md">
    <span className="grid size-10 place-items-center rounded-2xl bg-emerald-950 text-orange-300"><Icon className="size-5"/></span>
    <p className="mt-4 text-xs font-black uppercase tracking-[.14em] text-slate-500">{label}</p>
    <strong className="mt-1 block font-display text-2xl text-emerald-950">{value}</strong>
    <p className="mt-1 text-sm leading-5 text-slate-500">{note}</p>
  </article>
}

function RevenueChart({ items }: { items: AdminAnalytics["revenueTrend"] }) {
  const hasValue = items.some(item => item.revenue > 0 || item.projectRevenue > 0)
  return <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 text-emerald-950"><TrendingUp className="size-5 text-orange-600"/><h3 className="font-display text-2xl font-bold">Doanh thu theo tháng</h3></div>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">Sản phẩm tính khi đơn đã thu tiền. Dự án tính theo giá trị đã chốt lúc hai bên thống nhất báo giá, không gồm dự án đã hủy.</p>
      </div>
      <div className="flex gap-4 text-sm font-bold text-slate-600"><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-orange-500"/>Sản phẩm</span><span className="flex items-center gap-2"><i className="size-2.5 rounded-full bg-emerald-600"/>Dự án</span></div>
    </div>
    {items.length ? <div className="mt-4 h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={items} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="admin-revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.38}/>
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.03}/>
            </linearGradient>
            <linearGradient id="admin-project-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.35}/>
              <stop offset="100%" stopColor="#059669" stopOpacity={0.03}/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 8" vertical={false}/>
          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false}/>
          <YAxis tickFormatter={value => compactMoney.format(Number(value))} width={64} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false}/>
          <Tooltip content={<RevenueTooltip/>}/>
          <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={3} fill="url(#admin-revenue-fill)" dot={{ r: 4, fill: "#fff", stroke: "#f97316", strokeWidth: 3 }} activeDot={{ r: 6 }}/>
          <Area type="monotone" dataKey="projectRevenue" stroke="#047857" strokeWidth={3} fill="url(#admin-project-fill)" dot={{ r: 4, fill: "#fff", stroke: "#047857", strokeWidth: 3 }} activeDot={{ r: 6 }}/>
        </AreaChart>
      </ResponsiveContainer>
      {!hasValue && <p className="text-center text-sm font-semibold text-slate-400">Chưa có doanh thu sản phẩm hoặc dự án trong 12 tháng này.</p>}
    </div> : <EmptyChart/>}
  </section>
}

function RevenueTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: { label?: string; revenue?: number; orders?: number; projectRevenue?: number; projects?: number } }> }) {
  const point = payload?.[0]?.payload
  if (!active || !point) return null
  const product = point.revenue || 0
  const project = point.projectRevenue || 0
  return <div className="rounded-2xl bg-emerald-950 px-3 py-2 text-white shadow-xl">
    <p className="text-xs text-emerald-100">{point.label}</p>
    <p className="mt-1 text-sm"><span className="text-orange-200">Sản phẩm</span> · {money.format(product)} · {point.orders || 0} đơn</p>
    <p className="text-sm"><span className="text-emerald-200">Dự án</span> · {money.format(project)} · {point.projects || 0} dự án</p>
    <strong className="mt-1 block text-sm">Tổng {money.format(product + project)}</strong>
  </div>
}

function OrderStatusChart({ items }: { items: AdminAnalytics["orderStatuses"] }) {
  const values = items.map(item => ({ ...item, ...(statusConfig[item.status] || { label: item.status, color: "#64748b" }) })).filter(item => item.count > 0)
  const total = values.reduce((sum, item) => sum + item.count, 0)
  return <ChartCard icon={PackageCheck} title="Trạng thái đơn hàng" caption="Phân bổ đơn trong 12 tháng gần nhất">
    {total ? <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
      <div className="h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={values} dataKey="count" nameKey="label" innerRadius={52} outerRadius={76} paddingAngle={3} stroke="none">
              {values.map(item => <Cell key={item.status} fill={item.color}/>)}
            </Pie>
            <Tooltip formatter={(value, _name, item) => [`${value} đơn`, item.payload.label]}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-full space-y-2.5">{values.map(item => <div className="flex items-center justify-between gap-3 text-sm" key={item.status}><span className="flex items-center gap-2 font-semibold text-slate-600"><i className="size-2.5 rounded-full" style={{ backgroundColor: item.color }}/>{item.label}</span><strong className="text-emerald-950">{item.count}</strong></div>)}</div>
    </div> : <EmptyChart/>}
  </ChartCard>
}

function ConversionChart({ value }: { value?: AdminAnalytics["conversion"] }) {
  const stages = [
    { label: "Yêu cầu tiếp nhận", value: value?.opportunities || 0, color: "#064e3b" },
    { label: "Hồ sơ đã báo giá", value: value?.quotations || 0, color: "#0f766e" },
    { label: "Đơn / dự án", value: value?.wins || 0, color: "#f97316" },
  ]
  const max = Math.max(...stages.map(stage => stage.value), 1)
  const rate = value?.opportunities ? Math.round((value.wins / value.opportunities) * 100) : 0
  return <ChartCard icon={Target} title="Chuyển đổi yêu cầu" caption="Hiệu quả trong 12 tháng gần nhất" extra={<strong className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-700">{rate}%</strong>}>
    <div className="mt-6 h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={stages} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 4 }}>
          <XAxis type="number" hide domain={[0, max]}/>
          <YAxis type="category" dataKey="label" width={118} tick={{ fill: "#475569", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false}/>
          <Tooltip formatter={amount => [`${amount}`, "Số lượng"]}/>
          <Bar dataKey="value" radius={10} barSize={18}>
            {stages.map(stage => <Cell key={stage.label} fill={stage.color}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
}

function TopProductsChart({ items }: { items: AdminAnalytics["topProducts"] }) {
  const rows = items.map(item => ({ ...item, shortName: item.name.length > 22 ? `${item.name.slice(0, 20)}…` : item.name }))
  return <ChartCard icon={Boxes} title="Sản phẩm nổi bật" caption="Top doanh thu đã thanh toán trong 12 tháng">
    {rows.length ? <div className="mt-4 h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
          <XAxis type="number" hide/>
          <YAxis type="category" dataKey="shortName" width={128} tick={{ fill: "#0f172a", fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false}/>
          <Tooltip formatter={(value, _name, item) => [money.format(Number(value || 0)), `${item.payload.quantity} sản phẩm`]}/>
          <Bar dataKey="revenue" radius={10} barSize={16} fill="#0f766e"/>
        </BarChart>
      </ResponsiveContainer>
    </div> : <EmptyChart/>}
  </ChartCard>
}

function RecentOrders({ items }: { items: AdminOrderSummary[] }) {
  return <section className="mt-5 overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-sm">
    <header className="border-b border-slate-100 px-5 py-4"><h3 className="font-display text-xl font-bold text-emerald-950">Đơn hàng gần đây</h3><p className="mt-1 text-sm text-slate-500">Các đơn mới nhất trên hệ thống.</p></header>
    <div className="divide-y divide-slate-100">{items.length ? items.map(order => <div key={order._id} className="flex min-h-16 items-center justify-between gap-4 px-5 py-3"><div><strong className="text-emerald-950">{order.code}</strong><p className="text-sm text-slate-500">{order.customer?.name || "Khách hàng"} · {new Date(order.createdAt).toLocaleDateString("vi-VN")}</p></div><strong className="text-orange-700">{money.format(order.total)}</strong></div>) : <p className="px-5 py-8 text-center text-sm font-semibold text-slate-400">Chưa có đơn hàng.</p>}</div>
  </section>
}

function ChartCard({ icon: Icon, title, caption, extra, children }: { icon: typeof Boxes; title: string; caption: string; extra?: ReactNode; children: ReactNode }) {
  return <section className="rounded-[28px] border border-white/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6">
    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><Icon className="size-5 text-orange-600"/><h3 className="font-display text-xl font-bold text-emerald-950">{title}</h3></div>{extra}</div>
    <p className="mt-1 text-sm text-slate-500">{caption}</p>
    {children}
  </section>
}

function EmptyChart() {
  return <div className="mt-6 grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 text-center text-sm font-semibold text-slate-400">Chưa có đủ dữ liệu để hiển thị biểu đồ.</div>
}
