import { useQuery } from "@tanstack/react-query"
import { ClipboardList, FolderKanban, Mail, PackageCheck } from "lucide-react"
import { Link } from "react-router-dom"
import { StaffShell } from "@/components/staff/staff-shell"
import { usePageMeta } from "@/hooks/use-page-meta"
import { staffClient } from "@/lib/staff-client"

export function StaffDashboardPage() {
  usePageMeta("Tổng quan công việc", "Những việc cần xử lý của bạn tại Cơ khí Đăng Khoa.")
  const summary = useQuery({ queryKey: ["staff", "dashboard"], queryFn: staffClient.dashboard, refetchInterval: 60_000 })
  const data = summary.data?.data
  const cards = [
    { label: "Yêu cầu mới", value: data?.newRequests, detail: "Chưa báo giá và chưa từ chối", icon: ClipboardList, to: "/staff/requests?view=new" },
    { label: "Chờ khách", value: data?.waitingQuotes, detail: "Báo giá đã gửi, chờ khách chốt", icon: Mail, to: "/staff/requests?view=waiting" },
    { label: "Đang làm", value: data?.activeProjects, detail: "Đã chốt ngày giao, chờ khách nhận hàng", icon: FolderKanban, to: "/staff/work-orders?view=active" },
    { label: "Đơn sản phẩm mới", value: data?.pendingOrders, detail: "Kiểm tra tồn kho và xác nhận đơn", icon: PackageCheck, to: "/staff/orders?status=pending" },
  ]
  return <StaffShell title="Tổng quan công việc" description="Nhìn nhanh các việc cần ưu tiên và đi thẳng tới hồ sơ cần xử lý.">
    {summary.isError && <p className="rounded-2xl bg-red-50 p-5 font-semibold text-red-700">Không tải được dữ liệu. Vui lòng thử lại.</p>}
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, detail, icon: Icon, to }) => <Link key={label} to={to} className="border border-slate-200 bg-white p-5 transition hover:border-orange-400"><div className="flex items-start justify-between gap-3"><h2 className="text-sm font-semibold text-slate-600">{label}</h2><Icon className="size-4 text-emerald-900" aria-hidden="true"/></div><strong className="mt-3 block font-display text-3xl text-emerald-950">{summary.isLoading ? "–" : value ?? 0}</strong><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p></Link>)}</div>
    <div className="mt-7 rounded-3xl bg-emerald-950 p-7 text-white"><h2 className="font-display text-2xl font-bold">Quy trình gia công</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["1", "Mở yêu cầu", "Báo giá hoặc từ chối ngay trong hồ sơ."], ["2", "Chờ khách", "Khách đồng ý, nhờ báo giá lại hoặc từ chối."], ["3", "Đang làm", "Chốt ngày giao. Khách xác nhận khi nhận hàng."], ["4", "Hoàn thành", "Hàng lỗi thì nhận sửa hoặc báo giá sửa."]].map(([step, title, text]) => <div key={step} className="rounded-2xl bg-white/5 p-4"><span className="text-sm font-black text-orange-300">BƯỚC {step}</span><strong className="mt-2 block">{title}</strong><p className="mt-1 text-sm text-emerald-50/70">{text}</p></div>)}</div></div>
  </StaffShell>
}
