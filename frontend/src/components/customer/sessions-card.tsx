import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Laptop, LoaderCircle, LogOut, ShieldCheck, Smartphone } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"
import { authClient } from "@/lib/auth-client"

function deviceName(userAgent: string) {
  const device = /Android|iPhone|iPad/i.test(userAgent) ? "Thiết bị di động" : "Máy tính"
  const browser = /Edg\//.test(userAgent) ? "Edge" : /Chrome\//.test(userAgent) ? "Chrome" : /Firefox\//.test(userAgent) ? "Firefox" : /Safari\//.test(userAgent) ? "Safari" : "Trình duyệt"
  return `${device} · ${browser}`
}

export function SessionsCard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [pendingAction, setPendingAction] = useState<{ type: "all" } | { type: "session"; sessionId: string; current: boolean; label: string } | null>(null)
  const sessions = useQuery({ queryKey: ["auth", "sessions"], queryFn: () => authClient.sessions() })
  const revoke = useMutation({
    mutationFn: (sessionId: string) => authClient.revokeSession(sessionId),
    onSuccess: result => {
      setPendingAction(null)
      toast.success(result.message || "Đã thu hồi phiên đăng nhập")
      if (result.data.current) navigate("/dang-nhap", { replace: true })
      else void queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] })
    },
    onError: error => toast.error(error.message, { title: "Không thể thu hồi phiên" }),
  })
  const logoutAll = useMutation({ mutationFn: () => authClient.logoutAll(), onSuccess: result => { setPendingAction(null); toast.success(result.message || "Đã đăng xuất khỏi tất cả thiết bị") }, onError: error => toast.error(error.message, { title: "Không thể đăng xuất" }), onSettled: () => navigate("/dang-nhap", { replace: true }) })
  const pendingSession = pendingAction?.type === "session" ? pendingAction : null

  return <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="flex items-center gap-2 font-display text-xl font-bold text-emerald-950"><ShieldCheck className="size-5 text-orange-600"/>Phiên đăng nhập</h2><p className="mt-1 text-sm text-slate-500">Thu hồi thiết bị lạ hoặc phiên không còn sử dụng.</p></div>
      <Button type="button" size="sm" variant="outline" disabled={logoutAll.isPending} onClick={() => setPendingAction({ type: "all" })}>{logoutAll.isPending ? <LoaderCircle className="size-4 animate-spin"/> : <LogOut className="size-4"/>}Đăng xuất tất cả</Button>
    </div>
    {sessions.isLoading && <p className="mt-5 text-sm text-slate-500">Đang tải phiên đăng nhập…</p>}
    {sessions.error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{sessions.error.message}</p>}
    <div className="mt-5 space-y-3">{sessions.data?.data.map(session => {
      const MobileIcon = /Android|iPhone|iPad/i.test(session.userAgent) ? Smartphone : Laptop
      return <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4" key={session.id}>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600"><MobileIcon className="size-5"/></span>
        <div className="min-w-0 flex-1"><strong className="block text-sm text-emerald-950">{deviceName(session.userAgent)} {session.current && <span className="ml-1 text-emerald-700">· Hiện tại</span>}</strong><p className="mt-1 truncate text-xs text-slate-500">IP {session.ip || "không xác định"} · Hoạt động {new Date(session.lastUsedAt).toLocaleString("vi-VN")}</p></div>
        <Button type="button" size="sm" variant="ghost" disabled={revoke.isPending} onClick={() => setPendingAction({ type: "session", sessionId: session.id, current: session.current, label: deviceName(session.userAgent) })}>{session.current ? "Đăng xuất" : "Thu hồi"}</Button>
      </div>
    })}</div>
    <ConfirmDialog open={Boolean(pendingAction)} title={pendingAction?.type === "all" ? "Đăng xuất khỏi tất cả thiết bị?" : pendingSession?.current ? "Đăng xuất phiên hiện tại?" : "Thu hồi phiên đăng nhập?"} description={pendingAction?.type === "all" ? "Tất cả thiết bị, bao gồm thiết bị này, sẽ phải đăng nhập lại." : pendingSession ? `${pendingSession.label} sẽ mất quyền truy cập và phải đăng nhập lại.` : ""} confirmLabel={pendingAction?.type === "all" ? "Đăng xuất tất cả" : pendingSession?.current ? "Đăng xuất" : "Thu hồi phiên"} destructive busy={logoutAll.isPending || revoke.isPending} onOpenChange={open => { if (!open) setPendingAction(null) }} onConfirm={() => { if (pendingAction?.type === "all") logoutAll.mutate(); else if (pendingSession) revoke.mutate(pendingSession.sessionId) }}/>
  </article>
}
