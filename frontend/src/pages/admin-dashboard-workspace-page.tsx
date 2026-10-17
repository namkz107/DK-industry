import { useQuery } from "@tanstack/react-query"
import { ArrowRight, Boxes, CircleDollarSign, ClipboardList, FolderKanban, PackageCheck, RefreshCw, UserCog, UsersRound } from "lucide-react"
import { Link } from "react-router-dom"
import { AdminAnalyticsPanel } from "@/components/admin/admin-analytics"
import { AdminShell } from "@/components/admin/admin-shell"
import { usePageMeta } from "@/hooks/use-page-meta"
import { adminClient } from "@/lib/admin-client"
import { cn, formatPrice } from "@/lib/utils"

export function AdminDashboardWorkspacePage() {
  usePageMeta("Quản trị hệ thống", "Tổng quan vận hành Cơ khí Đăng Khoa.")
  const summary = useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminClient.dashboard, refetchInterval: 60_000 })
  const data = summary.data?.data
  const operations = [
    { label: "Yêu cầu gia công", value: data?.openRequests, detail: "Hồ sơ đang chờ hoặc được staff xử lý", icon: ClipboardList, to: "/staff/requests?view=active", tone: "orange" },
    { label: "Dự án đang triển khai", value: data?.activeProjects, detail: "Dự án đã chốt và chưa hoàn thành", icon: FolderKanban, to: "/staff/work-orders?view=active&scope=all", tone: "emerald" },
    { label: "Đơn sản phẩm", value: data?.openOrders, detail: `${data?.pendingOrders || 0} đơn đang chờ xác nhận`, icon: PackageCheck, to: "/staff/orders", tone: "blue" },
  ] as const
  const resources = [
    { label: "Khách hàng", value: data?.customers, detail: "Tài khoản đã đăng ký", icon: UsersRound, to: "/admin/nhan-su?role=customer" },
    { label: "Nhân sự hoạt động", value: data?.staff, detail: `${data?.blockedUsers || 0} tài khoản đang khóa`, icon: UserCog, to: "/admin/nhan-su" },
    { label: "Sản phẩm hoạt động", value: data?.products, detail: `${data?.lowStock || 0} sản phẩm sắp hết`, icon: Boxes, to: "/admin/noi-dung?tab=products" },
  ]

  return <AdminShell title="Trung tâm quản trị" description="Theo dõi toàn bộ yêu cầu, dự án và đơn hàng bằng cùng một quy trình đang dùng ở khu vực staff và customer.">
    {summary.isError && <p className="mb-5 rounded-2xl bg-red-50 p-5 font-semibold text-red-700">Không tải được dữ liệu quản trị. Vui lòng thử lại.</p>}

    <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_55px_-35px_rgba(15,23,42,.4)]">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7"><div><p className="text-xs font-black uppercase tracking-[.18em] text-orange-700">Vận hành hôm nay</p><h2 className="mt-1 font-display text-2xl font-bold text-emerald-950">Ba luồng công việc chính</h2><p className="mt-1 text-sm text-slate-500">Mở trực tiếp workspace dùng chung để kiểm tra hoặc giám sát xử lý.</p></div><button type="button" onClick={() => void summary.refetch()} className="grid size-11 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-orange-300 hover:text-orange-700" aria-label="Làm mới tổng quan"><RefreshCw className={cn("size-5", summary.isFetching && "animate-spin")}/></button></header>
      <div className="grid gap-4 p-5 md:grid-cols-3 sm:p-7">{operations.map(({ label, value, detail, icon: Icon, to, tone }) => <Link key={label} to={to} className="group relative overflow-hidden rounded-[24px] bg-gradient-to-br from-emerald-950 to-slate-900 p-5 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"><span className={cn("grid size-11 place-items-center rounded-2xl", tone === "orange" ? "bg-orange-500" : tone === "blue" ? "bg-sky-500" : "bg-emerald-500")}><Icon className="size-5"/></span><strong className="mt-5 block font-display text-4xl text-orange-300">{summary.isLoading ? "–" : value ?? 0}</strong><h3 className="mt-1 text-lg font-bold">{label}</h3><p className="mt-2 min-h-10 text-sm leading-5 text-emerald-50/65">{detail}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white">Mở workspace<ArrowRight className="size-4 transition group-hover:translate-x-1"/></span></Link>)}</div>
    </section>

    <section className="mt-6"><div className="mb-4"><p className="text-xs font-black uppercase tracking-[.18em] text-orange-700">Nguồn lực hệ thống</p><h2 className="mt-1 font-display text-2xl font-bold text-emerald-950">Con người và nội dung</h2></div><div className="grid gap-4 md:grid-cols-3">{resources.map(({ label, value, detail, icon: Icon, to }) => <Link key={label} to={to} className="group flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-lg"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-950 text-white"><Icon className="size-6"/></span><span className="min-w-0 flex-1"><strong className="font-display text-3xl text-orange-700">{summary.isLoading ? "–" : value ?? 0}</strong><span className="block font-bold text-emerald-950">{label}</span><span className="mt-1 block text-sm text-slate-500">{detail}</span></span><ArrowRight className="size-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-600"/></Link>)}</div></section>

    <AdminAnalyticsPanel analytics={data?.analytics}/>

    <div className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
      <section className="rounded-[28px] bg-gradient-to-br from-emerald-950 to-slate-900 p-6 text-white"><div className="flex items-center gap-3"><CircleDollarSign className="size-7 text-orange-400"/><h2 className="font-display text-2xl font-bold">Kết quả bán hàng</h2></div><div className="mt-5 space-y-5"><div><p className="text-sm text-emerald-50/70">Đã thu tiền · tháng này {formatPrice(data?.monthlyRevenue || 0)}</p><strong className="mt-1 block font-display text-3xl text-orange-300">{formatPrice(data?.revenue || 0)}</strong></div><div className="border-t border-white/10 pt-5"><p className="text-sm text-emerald-50/70">Đã giao thành công · {data?.deliveredOrders || 0} đơn</p><strong className="mt-1 block font-display text-3xl text-emerald-300">{formatPrice(data?.deliveredRevenue || 0)}</strong><p className="mt-1 text-xs text-emerald-100/65">Tháng này {formatPrice(data?.monthlyDeliveredRevenue || 0)}</p></div></div></section>
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-display text-xl font-bold text-emerald-950">Đơn hàng gần đây</h2><p className="mt-1 text-sm text-slate-500">Các đơn mới nhất trên hệ thống.</p></div><Link className="text-sm font-bold text-orange-700" to="/staff/orders">Xem tất cả</Link></div><div className="divide-y divide-slate-100">{data?.recentOrders.length ? data.recentOrders.map(order => <div key={order._id} className="flex min-h-16 items-center justify-between gap-4 px-5 py-3 sm:px-6"><div><strong className="text-emerald-950">{order.code}</strong><p className="text-sm text-slate-500">{order.customer?.name || "Khách hàng"} · {new Date(order.createdAt).toLocaleDateString("vi-VN")}</p></div><strong className="text-orange-700">{formatPrice(order.total)}</strong></div>) : <p className="py-10 text-center text-slate-500">Chưa có đơn hàng.</p>}</div></section>
    </div>

    <section className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-display text-xl font-bold text-emerald-950">Hoạt động quản trị mới nhất</h2><p className="mt-1 text-sm text-slate-500">Những thay đổi gần đây của quản trị viên.</p></div><Link className="font-bold text-orange-700" to="/admin/nhat-ky">Xem tất cả</Link></div><div className="grid gap-3 p-5 md:grid-cols-2 sm:p-6">{data?.recentActivity.map(item => <div className="rounded-2xl bg-slate-50 p-4" key={item._id}><strong className="text-slate-800">{item.summary}</strong><p className="mt-1 text-sm text-slate-500">{item.actor?.name || "Admin"} · {new Date(item.createdAt).toLocaleString("vi-VN")}</p></div>)}</div></section>
  </AdminShell>
}
