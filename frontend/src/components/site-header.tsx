import { useQuery } from "@tanstack/react-query"
import { Bell, LogIn, LogOut, Mail, Menu, Phone, ShoppingCart, UserRound, X } from "lucide-react"
import { useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { company } from "@/config/company"
import { useAuth } from "@/contexts/auth-context"
import { customerClient } from "@/lib/customer-client"
import { notificationClient } from "@/lib/notification-client"
import { cn } from "@/lib/utils"

const links = [{ to: "/", label: "Trang chủ" }, { to: "/gioi-thieu", label: "Giới thiệu" }, { to: "/dich-vu", label: "Dịch vụ" }, { to: "/du-an", label: "Dự án" }, { to: "/san-pham", label: "Sản phẩm" }, { to: "/lien-he", label: "Liên hệ" }]
const logoUrl = import.meta.env.VITE_CLOUDINARY_LOGO_URL || "https://res.cloudinary.com/dgbounqav/image/upload/f_auto,q_auto/logo_dk_uhmnyn"
const roleHome = (role?: "customer" | "staff" | "admin") => role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/tai-khoan"
const headerBtn = "h-8 min-h-8 px-2.5 text-[12px] font-semibold"
const headerIconBtn = "size-8 min-h-8 p-0"

export function SiteHeader({ onQuote }: { onQuote: () => void }) {
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { user, ready, logout } = useAuth()
  const navigate = useNavigate()
  const signOut = async () => {
    setLoggingOut(true)
    try { await logout() } finally { setOpen(false); setLoggingOut(false); navigate("/dang-nhap", { replace: true }) }
  }
  const cart = useQuery({ queryKey: ["customer", "cart"], queryFn: customerClient.cart, enabled: user?.role === "customer", staleTime: 30_000 })
  const notifications = useQuery({ queryKey: ["notifications"], queryFn: () => notificationClient.list(), enabled: Boolean(user), staleTime: 30_000, refetchInterval: 60_000 })
  const cartCount = cart.data?.data.itemCount || 0
  const unread = notifications.data?.data.unread || 0
  const canRequestQuote = ready && (!user || user.role === "customer")
  return <header className="sticky top-0 z-40 overflow-x-clip border-b border-slate-200 bg-stone-50">
    <div className="mx-auto grid h-20 w-full max-w-[1440px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:px-4 lg:gap-4 lg:px-5">
      <Link to="/" className="flex shrink-0 items-center rounded-lg border border-slate-200 bg-white px-2 py-1 shadow-sm transition hover:border-orange-200 hover:shadow-md" aria-label="Cơ khí Đăng Khoa - Trang chủ"><img className="h-9 w-auto max-w-[108px] rounded-md object-contain lg:h-10 lg:max-w-[120px]" src={logoUrl} alt="Logo Cơ khí Đăng Khoa"/></Link>
      <nav className="hidden min-w-0 items-center justify-center  gap-3 lg:flex xl:gap-4" aria-label="Điều hướng chính">{links.map(link => <NavLink key={link.to} to={link.to} className={({ isActive }) => cn("whitespace-nowrap rounded-md px-2 py-1.5 text-[13px] font-bold text-slate-600 uppercase transition hover:bg-slate-100 hover:text-emerald-950", isActive && "bg-emerald-50 font-semibold text-emerald-800")}>{link.label}</NavLink>)}</nav>
      <div className="hidden min-w-0 items-center justify-end gap-1 lg:flex">
          <div className="hidden min-w-0 items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm lg:flex">
          <a href={`tel:${company.phone}`} className="flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[11px] font-medium text-emerald-950 transition hover:bg-slate-100"><Phone className="size-3.5 text-orange-600"/>{company.phoneLabel}</a>
          <span className="hidden h-4 w-px bg-slate-200 xl:block" aria-hidden="true"/>
          <a href={`mailto:${company.email}`} className="hidden h-7 min-w-0 max-w-[170px] items-center gap-1.5 truncate rounded-md px-2 text-[11px] font-medium text-emerald-950 transition hover:bg-slate-100 xl:flex"><Mail className="size-3.5 shrink-0 text-orange-600"/>{company.email}</a>
        </div>
        {user && <Button asChild size="icon" variant="ghost" className={cn("relative shrink-0", headerIconBtn)}><Link to="/thong-bao" aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}><Bell className="size-4"/>{unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">{Math.min(unread, 99)}</span>}</Link></Button>}
        {user?.role === "customer" && <Button asChild size="icon" variant="ghost" className={cn("relative shrink-0", headerIconBtn)}><Link to="/gio-hang" aria-label={cartCount > 0 ? `Giỏ hàng, ${cartCount} sản phẩm` : "Giỏ hàng"}><ShoppingCart className="size-4"/>{cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-orange-600 px-1 text-[9px] font-black text-white">{Math.min(cartCount, 99)}</span>}</Link></Button>}
        {ready && (user ? <>
          <Button asChild variant="outline" className={cn("max-w-36 shrink-0 whitespace-nowrap", headerBtn)}><Link to={roleHome(user.role)}><UserRound className="size-3.5 shrink-0"/><span className="hidden truncate xl:inline">{user.name}</span></Link></Button>
          <Button className={cn("shrink-0 whitespace-nowrap", headerBtn)} variant="ghost" onClick={signOut} disabled={loggingOut} aria-label={loggingOut ? "Đang đăng xuất" : "Đăng xuất"}><LogOut className="size-3.5 shrink-0"/><span className="hidden 2xl:inline">Đăng xuất</span></Button>
        </> : <Button asChild variant="ghost" className={cn("shrink-0 whitespace-nowrap", headerBtn)}><Link to="/dang-nhap"><LogIn className="size-3.5"/>Đăng nhập</Link></Button>)}
        {canRequestQuote && <Button className={cn("shrink-0 whitespace-nowrap uppercase tracking-[.02em]", headerBtn, "px-3")} onClick={onQuote}>Nhận báo giá</Button>}
      </div>
      <button className="col-start-3 grid size-10 place-items-center justify-self-end rounded-control border border-slate-200 bg-white lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Đóng menu" : "Mở menu"}>{open ? <X className="size-5"/> : <Menu className="size-5"/>}</button>
    </div>
    {open && <nav className="border-t border-slate-200 bg-white p-4 lg:hidden" aria-label="Điều hướng di động">{links.map(link => <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100">{link.label}</NavLink>)}{user && <Link onClick={() => setOpen(false)} className="mt-2 flex min-h-11 items-center gap-3 rounded-xl bg-emerald-50 px-4 text-sm font-semibold text-emerald-900" to="/thong-bao"><Bell className="size-4"/>Thông báo ({unread})</Link>}{user?.role === "customer" && <Link onClick={() => setOpen(false)} className="mt-2 flex min-h-11 items-center gap-3 rounded-xl bg-orange-50 px-4 text-sm font-semibold text-orange-800" to="/gio-hang"><ShoppingCart className="size-4"/>Giỏ hàng ({cartCount})</Link>}<Link onClick={() => setOpen(false)} className="mt-2 flex min-h-11 items-center gap-3 rounded-xl bg-slate-100 px-4 text-sm font-semibold text-emerald-950" to={user ? roleHome(user.role) : "/dang-nhap"}>{user ? <UserRound className="size-4"/> : <LogIn className="size-4"/>}{user ? `Tài khoản: ${user.name}` : "Đăng nhập / Đăng ký"}</Link>{user && <Button variant="outline" className="mt-3 w-full" onClick={signOut} disabled={loggingOut}><LogOut className="size-5"/>{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</Button>}{canRequestQuote && <Button className="mt-3 w-full" onClick={() => { setOpen(false); onQuote() }}>Gửi yêu cầu</Button>}</nav>}
  </header>
}
