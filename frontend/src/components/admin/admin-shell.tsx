import { Boxes, ClipboardClock, Image, LayoutDashboard, ShieldCheck, UserCog } from "lucide-react"
import type { PropsWithChildren, ReactNode } from "react"
import { WorkspaceFrame } from "@/components/workspace-frame"
import { useAuth } from "@/contexts/auth-context"

const navigation = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/admin/nhan-su", label: "Nhân sự", icon: UserCog },
  { to: "/admin/noi-dung", label: "Nội dung website", icon: Boxes },
  { to: "/admin/gioi-thieu", label: "Giới thiệu & xưởng", icon: Image },
  { to: "/admin/nhat-ky", label: "Nhật ký", icon: ClipboardClock },
  { to: "/admin/quyen-rieng-tu", label: "Quyền riêng tư", icon: ShieldCheck },
]

export function AdminShell({ title, description, action, children }: PropsWithChildren<{ title: string; description: string; action?: ReactNode }>) {
  const { user } = useAuth()
  return <WorkspaceFrame kicker={`Quản trị hệ thống · ${user?.name || "Quản trị viên"}`} title={title} description={description} action={action} navLabel="Khu vực quản trị" navigation={navigation}>{children}</WorkspaceFrame>
}
