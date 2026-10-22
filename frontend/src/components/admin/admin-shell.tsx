import { Boxes, ClipboardClock, Image, LayoutDashboard, ShieldCheck, UserCog } from "lucide-react"
import type { PropsWithChildren, ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

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
  return <section className="workspace-shell min-h-[78vh] bg-slate-100 py-8 sm:py-10"><div className="container-page">
    <header className="workspace-heading relative overflow-hidden rounded-[32px] bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 px-5 py-7 text-white shadow-[0_24px_65px_-35px_rgba(2,44,34,.85)] sm:px-8 sm:py-8"><span className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-orange-400/15 blur-3xl"/><div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-orange-300"><ShieldCheck className="size-4"/>Quản trị hệ thống · {user?.name}</p><h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">{title}</h1><p className="mt-3 max-w-3xl text-base leading-7 text-emerald-50/70 sm:text-lg">{description}</p></div>{action && <div className="flex flex-wrap gap-2">{action}</div>}</div></header>
    <nav className="workspace-nav my-6 flex gap-2 overflow-x-auto rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm" aria-label="Khu vực quản trị">{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} end={end} to={to} className={({ isActive }) => cn("flex min-h-12 shrink-0 items-center gap-2 rounded-[14px] px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-100", isActive && "bg-emerald-950 text-white shadow-md hover:bg-emerald-900")}><Icon className="size-5"/>{label}</NavLink>)}</nav>
    <div className="workspace-content">{children}</div>
  </div></section>
}
