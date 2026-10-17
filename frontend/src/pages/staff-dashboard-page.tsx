import { useQuery } from "@tanstack/react-query"
import { ClipboardList, FolderKanban, PackageCheck, UserCheck } from "lucide-react"
import { Link } from "react-router-dom"
import { StaffShell } from "@/components/staff/staff-shell"
import { usePageMeta } from "@/hooks/use-page-meta"
import { staffClient } from "@/lib/staff-client"

export function StaffDashboardPage() {
  usePageMeta("Tổng quan công việc", "Những việc cần xử lý của bạn tại Cơ khí Đăng Khoa.")
  const summary = useQuery({ queryKey: ["staff", "dashboard"], queryFn: staffClient.dashboard, refetchInterval: 60_000 })
  const data = summary.data?.data
  const cards = [
    { label: "Yêu cầu mới", value: data?.newRequests, detail: "Chưa có nhân viên tiếp nhận", icon: ClipboardList, to: "/staff/requests?view=new" },
    { label: "Yêu cầu của tôi", value: data?.myRequests, detail: "Kiểm tra, trao đổi và gửi báo giá", icon: UserCheck, to: "/staff/requests?view=mine" },
    { label: "Dự án đang triển khai", value: data?.activeProjects, detail: "Cập nhật tiến độ và bàn giao", icon: FolderKanban, to: "/staff/work-orders?view=active" },
    { label: "Đơn sản phẩm mới", value: data?.pendingOrders, detail: "Kiểm tra tồn kho và xác nhận đơn", icon: PackageCheck, to: "/staff/orders?status=pending" },
  ]
  return <StaffShell title="Tổng quan công việc" description="Nhìn nhanh các việc cần ưu tiên và đi thẳng tới hồ sơ cần xử lý.">
    {summary.isError && <p className="rounded-2xl bg-red-50 p-5 font-semibold text-red-700">Không tải được dữ liệu. Vui lòng thử lại.</p>}
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, detail, icon: Icon, to }) => <Link key={label} to={to} className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl"><div className="flex items-start justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-emerald-950 text-white"><Icon className="size-6"/></span><strong className="font-display text-4xl text-orange-700">{summary.isLoading ? "–" : value ?? 0}</strong></div><h2 className="mt-5 text-xl font-bold text-emerald-950">{label}</h2><p className="mt-2 text-base text-slate-600">{detail}</p></Link>)}</div>
    <div className="mt-7 rounded-3xl bg-emerald-950 p-7 text-white"><h2 className="font-display text-2xl font-bold">Quy trình gia công</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["1", "Nhận yêu cầu", "Kiểm tra thông tin và nhận xử lý."], ["2", "Gửi báo giá", "Chốt giá và thời gian với khách."], ["3", "Triển khai", "Cập nhật tiến độ dự án."], ["4", "Hoàn thành", "Bàn giao và đóng dự án."]].map(([step, title, text]) => <div key={step} className="rounded-2xl bg-white/5 p-4"><span className="text-sm font-black text-orange-300">BƯỚC {step}</span><strong className="mt-2 block">{title}</strong><p className="mt-1 text-sm text-emerald-50/70">{text}</p></div>)}</div></div>
  </StaffShell>
}
