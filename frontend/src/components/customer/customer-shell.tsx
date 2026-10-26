import { ClipboardList, FolderKanban, LayoutDashboard, PackageCheck } from "lucide-react"
import type { PropsWithChildren, ReactNode } from "react"
import { WorkspaceFrame } from "@/components/workspace-frame"

const navigation = [
  { to: "/tai-khoan", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/tai-khoan/yeu-cau", label: "Yêu cầu gia công", icon: ClipboardList },
  { to: "/tai-khoan/du-an", label: "Dự án của tôi", icon: FolderKanban },
  { to: "/tai-khoan/don-hang", label: "Đơn sản phẩm", icon: PackageCheck },
]

export function CustomerShell({ title, description, action, children }: PropsWithChildren<{ title: string; description: string; action?: ReactNode }>) {
  return <WorkspaceFrame kicker="Trung tâm khách hàng" title={title} description={description} action={action} navLabel="Khu vực khách hàng" navigation={navigation}>{children}</WorkspaceFrame>
}
