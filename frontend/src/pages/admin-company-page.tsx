import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { defaultOrgUnits, orgTierLabels } from "@/content/site-content"
import { usePageMeta } from "@/hooks/use-page-meta"
import { adminClient } from "@/lib/admin-client"
import type { OrgUnit } from "@/types/admin"

interface Draft { leaderImage: string; orgUnits: OrgUnit[] }

const fieldClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-700"

function move<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const next = [...items]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}

export function AdminCompanyPage() {
  usePageMeta("Giới thiệu doanh nghiệp", "Sửa ảnh giám đốc và sơ đồ tổ chức.")
  const queryClient = useQueryClient()
  const toast = useToast()
  const setting = useQuery({ queryKey: ["admin", "site-settings", "about"], queryFn: adminClient.aboutSettings })
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(0)
  const supportsCompanySettings = Array.isArray(setting.data?.data?.orgUnits)

  useEffect(() => {
    if (!setting.data || draft) return
    const data = setting.data.data
    setDraft({ leaderImage: data.leaderImage ?? "", orgUnits: (data.orgUnits ?? defaultOrgUnits).map(item => ({ name: item.name || "", note: item.note || "", tier: Number(item.tier) || 4 })) })
  }, [setting.data, draft])

  const save = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error("Chưa có nội dung để lưu")
      if (!supportsCompanySettings) throw new Error("API production chưa hỗ trợ lưu sơ đồ tổ chức. Hãy hoàn tất deploy backend mới trước khi lưu.")
      return adminClient.updateAboutSettings({ leaderImage: draft.leaderImage, orgUnits: draft.orgUnits.map(item => ({ name: item.name.trim(), note: item.note.trim(), tier: Number(item.tier) })) })
    },
    onSuccess: result => {
      const data = result.data
      setDraft({ leaderImage: data.leaderImage ?? "", orgUnits: (data.orgUnits || []).map(item => ({ ...item })) })
      toast.success(result.message || "Đã lưu phần giới thiệu")
      void queryClient.invalidateQueries({ queryKey: ["site-settings", "about"] })
      void queryClient.invalidateQueries({ queryKey: ["admin", "site-settings", "about"] })
    },
    onError: error => toast.error(error.message, { title: "Không thể lưu" }),
  })

  const updateUnit = (index: number, next: OrgUnit) => setDraft(current => current && ({ ...current, orgUnits: current.orgUnits.map((item, itemIndex) => itemIndex === index ? next : item) }))

  return <AdminShell title="Giới thiệu doanh nghiệp" description="Quản lý riêng ảnh giám đốc và sơ đồ tổ chức. Máy móc tại xưởng đã được tách sang mục riêng để thao tác nhanh hơn.">
    {setting.isLoading || !draft ? <p className="rounded-3xl border border-slate-200 bg-white py-16 text-center text-slate-500">Đang tải nội dung hiện tại...</p> : <div className="space-y-6">
      {!supportsCompanySettings && <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">API production đang là phiên bản cũ nên hệ thống đang hiển thị sơ đồ mặc định. Chức năng lưu được khóa để tránh báo lưu thành công nhưng không ghi đủ dữ liệu; hãy deploy backend mới rồi tải lại trang.</p>}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><h2 className="font-display text-2xl font-bold text-emerald-950">Ảnh giám đốc</h2><p className="mt-2 text-sm leading-6 text-slate-500">Ảnh xuất hiện tại phần lãnh đạo trên trang Giới thiệu.</p><div className="mt-5"><ImageUpload label="Ảnh giám đốc" value={draft.leaderImage} onChange={leaderImage => setDraft({ ...draft, leaderImage })} onBusyChange={value => setBusy(count => Math.max(0, count + (value ? 1 : -1)))}/></div></section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="font-display text-2xl font-bold text-emerald-950">Sơ đồ tổ chức</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Cấp 1 ở trên cùng, cấp 4 là các bộ phận thực hiện. Thứ tự trong cùng một cấp được hiển thị từ trái sang phải.</p></div><Button type="button" variant="outline" onClick={() => setDraft({ ...draft, orgUnits: [...draft.orgUnits, { name: "", note: "", tier: 4 }] })}><Plus className="size-4"/>Thêm phòng ban</Button></div>
        <div className="mt-6 space-y-4">{draft.orgUnits.map((unit, index) => <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1.1fr_1.4fr_220px_auto]" key={`${index}-${unit.name}`}><label className="block text-sm font-bold text-slate-700">Tên<input className={`${fieldClass} mt-2`} value={unit.name} onChange={event => updateUnit(index, { ...unit, name: event.target.value })}/></label><label className="block text-sm font-bold text-slate-700">Vai trò ngắn<textarea className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-700" value={unit.note} onChange={event => updateUnit(index, { ...unit, note: event.target.value })}/></label><label className="block text-sm font-bold text-slate-700">Cấp<select className={`${fieldClass} mt-2`} value={unit.tier} onChange={event => updateUnit(index, { ...unit, tier: Number(event.target.value) })}>{[1, 2, 3, 4].map(tier => <option value={tier} key={tier}>Cấp {tier} · {orgTierLabels[tier]}</option>)}</select></label><div className="flex items-end gap-2"><Button type="button" variant="outline" aria-label="Đưa lên" disabled={index === 0} onClick={() => setDraft({ ...draft, orgUnits: move(draft.orgUnits, index, -1) })}><ChevronUp className="size-4"/></Button><Button type="button" variant="outline" aria-label="Đưa xuống" disabled={index === draft.orgUnits.length - 1} onClick={() => setDraft({ ...draft, orgUnits: move(draft.orgUnits, index, 1) })}><ChevronDown className="size-4"/></Button><Button type="button" variant="outline" className="text-red-700" aria-label="Xóa phòng ban" onClick={() => setDraft({ ...draft, orgUnits: draft.orgUnits.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="size-4"/></Button></div></div>)}</div>
      </section>
      <div className="sticky bottom-4 flex justify-end"><Button disabled={!supportsCompanySettings || busy > 0 || save.isPending} onClick={() => save.mutate()}><Save className="size-4"/>{busy > 0 ? "Đang tải ảnh..." : save.isPending ? "Đang lưu..." : supportsCompanySettings ? "Lưu giới thiệu" : "Chờ cập nhật API"}</Button></div>
    </div>}
    {setting.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{setting.error.message}</p>}
  </AdminShell>
}
