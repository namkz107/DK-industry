import type { LucideIcon } from "lucide-react"
import type { PropsWithChildren, ReactNode } from "react"
import { NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"

export interface WorkspaceNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export function WorkspaceFrame({ kicker, title, description, action, navLabel, navigation, children }: PropsWithChildren<{
  kicker: string
  title: string
  description: string
  action?: ReactNode
  navLabel: string
  navigation: readonly WorkspaceNavItem[]
}>) {
  return <section className="min-h-[70vh] bg-stone-100 py-6 sm:py-8">
    <div className="container-page">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-orange-700">{kicker}</p>
          <h1 className="page-title mt-1 text-2xl text-emerald-950 sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-base leading-6 text-slate-600">{description}</p>
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
      </header>
      <nav className="-mx-1 mt-1 flex gap-1 overflow-x-auto" aria-label={navLabel}>
        {navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} end={end} to={to} className={({ isActive }) => cn("flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-semibold uppercase tracking-[.035em] transition-colors sm:text-sm", isActive ? "border-orange-600 text-emerald-950" : "border-transparent text-slate-600 hover:border-slate-300 hover:text-emerald-950")}><Icon className="size-4 shrink-0" aria-hidden="true"/>{label}</NavLink>)}
      </nav>
      <div className="workspace-content mt-6">{children}</div>
    </div>
  </section>
}
