import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Laptop, LoaderCircle, LogOut, ShieldCheck, Smartphone } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

function deviceName(userAgent: string) {
  const device = /Android|iPhone|iPad/i.test(userAgent) ? "Thiết bị di động" : "Máy tính"
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Chrome\//.test(userAgent) ? "Chrome" : /Firefox\//.test(userAgent) ? "Firefox" : /Safari\//.test(userAgent) ? "Safari" : "Trình duyệt"
  return `${device} · ${browser}`
}

export function SessionsCard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const sessions = useQuery({ queryKey: ["auth", "sessions"], queryFn: () => authClient.sessions() })
  const revoke = useMutation({
    mutationFn: (sessionId: string) => authClient.revokeSession(sessionId),
    onSuccess: result => {
      if (result.data.current) navigate("/dang-nhap", { replace: true })
      else void queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] })
    }
  })
  const logoutAll = useMutation({ mutationFn: () => authClient.logoutAll(), onSettled: () => navigate("/dang-nhap", { replace: true }) })

  return <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="flex items-center gap-2 font-display text-xl font-bold text-emerald-950"><ShieldCheck className="size-5 text-orange-600"/>Phiên đăng nhập</h2><p className="mt-1 text-sm text-slate-500">Thu hồi thiết bị lạ hoặc phiên không còn sử dụng.</p></div>
      <Button type="button" size="sm" variant="outline" disabled={logoutAll.isPending} onClick={() => { if (window.confirm("Đăng xuất khỏi tất cả thiết bị?")) logoutAll.mutate() }}>{logoutAll.isPending ? <LoaderCircle className="size-4 animate-spin"/> : <LogOut className="size-4"/>}Đăng xuất tất cả</Button>
    </div>
    {sessions.isLoading && <p className="mt-5 text-sm text-slate-500">Đang tải phiên đăng nhập…</p>}
    {sessions.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{sessions.error.message}</p>}
    <div className="mt-5 space-y-3">{sessions.data?.data.map(session => {
      const MobileIcon = /Android|iPhone|iPad/i.test(session.userAgent) ? Smartphone : Laptop
      return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4" key={session.id}>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><MobileIcon className="size-5"/></span>
        <div className="min-w-0 flex-1"><strong className="block text-sm text-emerald-950">{deviceName(session.userAgent)} {session.current && <span className="ml-1 text-emerald-700">· Hiện tại</span>}</strong><p className="mt-1 truncate text-xs text-slate-500">IP {session.ip || "không xác định"} · Hoạt động {new Date(session.lastUsedAt).toLocaleString("vi-VN")}</p></div>
        <Button type="button" size="sm" variant="ghost" disabled={revoke.isPending} onClick={() => { if (window.confirm(session.current ? "Đăng xuất phiên hiện tại?" : "Thu hồi phiên này?")) revoke.mutate(session.id) }}>{session.current ? "Đăng xuất" : "Thu hồi"}</Button>
      </div>
    })}</div>
    {(revoke.error || logoutAll.error) && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{(revoke.error || logoutAll.error)?.message}</p>}
  </article>
}
