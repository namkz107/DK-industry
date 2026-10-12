import { LoaderCircle, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { authClient } from "@/lib/auth-client"

type Setup = { manualKey: string; otpAuthUrl: string; expiresAt: string }

export function MfaCard() {
  const { user, updateUser } = useAuth()
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [setup, setSetup] = useState<Setup | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  if (!user || user.role !== "admin") return null
  const enabled = Boolean(user.mfaEnabled)

  const start = async () => {
    setBusy(true); setError(""); setMessage("")
    try { setSetup((await authClient.setupMfa(password)).data); setPassword("") }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể bắt đầu thiết lập MFA") }
    finally { setBusy(false) }
  }
  const confirm = async () => {
    setBusy(true); setError("")
    try {
      const result = await authClient.confirmMfa(code)
      setRecoveryCodes(result.data.recoveryCodes); setSetup(null); setCode(""); updateUser({ mfaEnabled: true }); setMessage(result.message || "Đã bật MFA")
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể xác nhận MFA") }
    finally { setBusy(false) }
  }
  const disable = async () => {
    setBusy(true); setError(""); setMessage("")
    try { const result = await authClient.disableMfa(password, code); updateUser({ mfaEnabled: false }); setPassword(""); setCode(""); setRecoveryCodes([]); setMessage(result.message) }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Không thể tắt MFA") }
    finally { setBusy(false) }
  }
  const downloadCodes = () => {
    const blob = new Blob([`DK Industry - mã khôi phục MFA\n\n${recoveryCodes.join("\n")}\n`], { type: "text/plain" })
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "dk-industry-mfa-recovery-codes.txt"; anchor.click(); URL.revokeObjectURL(url)
  }

  return <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
    <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-800"><ShieldCheck className="size-5"/></span><div><h2 className="font-display text-xl font-bold text-emerald-950">Xác thực hai bước cho Admin</h2><p className="text-sm text-slate-500">{enabled ? "Đang bật" : "Chưa bật — bắt buộc trước khi production"}</p></div></div>
    {!enabled && !setup && !recoveryCodes.length && <div className="mt-5"><label className="text-sm font-bold text-slate-700">Nhập mật khẩu hiện tại<Input className="mt-2" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)}/></label><Button className="mt-4" type="button" disabled={busy || !password} onClick={() => void start()}>{busy && <LoaderCircle className="size-4 animate-spin"/>}Bắt đầu thiết lập</Button></div>}
    {setup && <div className="mt-5 space-y-4"><p className="text-sm leading-6 text-slate-600">Trong Google Authenticator hoặc Microsoft Authenticator, chọn thêm tài khoản bằng khóa thiết lập rồi nhập khóa dưới đây:</p><code className="block break-all rounded-xl bg-slate-100 p-4 text-sm font-bold text-emerald-950">{setup.manualKey}</code><a className="inline-block text-sm font-bold text-orange-700 underline" href={setup.otpAuthUrl}>Mở trực tiếp bằng ứng dụng Authenticator</a><label className="block text-sm font-bold text-slate-700">Mã 6 chữ số<Input className="mt-2" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value)}/></label><Button type="button" disabled={busy || !/^\d{6}$/.test(code.trim())} onClick={() => void confirm()}>{busy && <LoaderCircle className="size-4 animate-spin"/>}Xác nhận và bật MFA</Button></div>}
    {recoveryCodes.length > 0 && <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5"><strong className="text-amber-950">Lưu các mã khôi phục ngay bây giờ</strong><p className="mt-2 text-sm leading-6 text-amber-900">Mỗi mã chỉ dùng một lần. Hệ thống sẽ không hiển thị lại.</p><div className="mt-3 grid grid-cols-2 gap-2 font-mono text-sm">{recoveryCodes.map(item => <code key={item}>{item}</code>)}</div><Button className="mt-4" type="button" variant="outline" onClick={downloadCodes}>Tải tệp mã khôi phục</Button></div>}
    {enabled && !recoveryCodes.length && <details className="mt-5 rounded-2xl border border-slate-200 p-4"><summary className="cursor-pointer font-bold text-slate-700">Tắt MFA</summary><div className="mt-4 space-y-3"><Input type="password" autoComplete="current-password" placeholder="Mật khẩu hiện tại" value={password} onChange={event => setPassword(event.target.value)}/><Input autoComplete="one-time-code" placeholder="Mã Authenticator hoặc mã khôi phục" value={code} onChange={event => setCode(event.target.value)}/><Button type="button" variant="outline" disabled={busy || !password || !code} onClick={() => void disable()}>Xác nhận tắt MFA</Button></div></details>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{message}</p>}
  </article>
}
