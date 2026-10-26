import { ClipboardList, FolderKanban, Headphones, LayoutDashboard, LogOut, PackageCheck } from "lucide-react"
import type { PropsWithChildren, ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { WorkspaceFrame } from "@/components/workspace-frame"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

const navigation = [
  { to: "/staff", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/staff/requests", label: "Yêu cầu", icon: ClipboardList },
  { to: "/staff/work-orders", label: "Dự án", icon: FolderKanban },
  { to: "/staff/orders", label: "Đơn sản phẩm", icon: PackageCheck },
  { to: "/staff/support", label: "Hỗ trợ khách hàng", icon: Headphones },
]

export function StaffShell({ title, description, action, children }: PropsWithChildren<{ title: string; description: string; action?: ReactNode }>) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const signOut = async () => { await logout(); navigate("/", { replace: true }) }
  return <WorkspaceFrame kicker={`Khu vực nhân viên · ${user?.name || "Nhân viên"}`} title={title} description={description} action={<><>{action}</><Button variant="outline" onClick={signOut}><LogOut className="size-4"/>Đăng xuất</Button></>} navLabel="Khu vực vận hành" navigation={navigation}>{children}</WorkspaceFrame>
}
