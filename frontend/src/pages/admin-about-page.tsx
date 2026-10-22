import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { completeMachines, orgTierLabels } from "@/content/site-content"
import { usePageMeta } from "@/hooks/use-page-meta"
import { adminClient } from "@/lib/admin-client"
import type { OrgUnit, WorkshopMachine } from "@/types/admin"

interface Draft {
  leaderImage: string
  equipment: WorkshopMachine[]
  orgUnits: OrgUnit[]
}

const fieldClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-700"

function equipmentDraft(machines: WorkshopMachine[]): WorkshopMachine[] {
  return completeMachines(machines).map(item => ({ ...item, images: [item.images[0] || "", item.images[1] || ""] }))
}

export function AdminAboutPage() {
  usePageMeta("Giới thiệu và xưởng", "Sửa ảnh giám đốc, sơ đồ tổ chức và ảnh máy móc xưởng.")
  const queryClient = useQueryClient()
  const toast = useToast()
  const setting = useQuery({ queryKey: ["admin", "site-settings", "about"], queryFn: adminClient.aboutSettings })
  const [draft, setDraft] = useState<Draft | null>(null)
  const [busy, setBusy] = useState(0)

  useEffect(() => {
    if (!setting.data || draft) return
    const data = setting.data.data
    setDraft({
      leaderImage: data.leaderImage ?? "",
      equipment: equipmentDraft(data.equipment),
      orgUnits: (data.orgUnits || []).map(item => ({ name: item.name, note: item.note || "", tier: item.tier })),
    })
  }, [setting.data, draft])

  const save = useMutation({
    mutationFn: () => {
      if (!draft) throw new Error("Chưa có nội dung để lưu")
      return adminClient.updateAboutSettings({
        leaderImage: draft.leaderImage,
        equipment: draft.equipment.map(item => ({ name: item.name.trim(), summary: item.summary.trim(), purpose: item.purpose.trim(), notes: item.notes.trim(), images: item.images.map(image => image.trim()).filter(Boolean) })),
        orgUnits: draft.orgUnits.map(item => ({ name: item.name.trim(), note: item.note.trim(), tier: Number(item.tier) })),
      })
    },
    onSuccess: result => {
      const data = result.data
      setDraft({
        leaderImage: data.leaderImage ?? "",
        equipment: equipmentDraft(data.equipment),
        orgUnits: data.orgUnits.map(item => ({ ...item })),
      })
      toast.success(result.message || "Nội dung đã được cập nhật")
      void queryClient.invalidateQueries({ queryKey: ["site-settings", "about"] })
      void queryClient.invalidateQueries({ queryKey: ["admin", "site-settings", "about"] })
    },
    onError: error => toast.error(error.message, { title: "Không thể lưu" }),
  })

  const updateMachine = (index: number, next: WorkshopMachine) => setDraft(current => current && { ...current, equipment: current.equipment.map((item, itemIndex) => itemIndex === index ? next : item) })
  const updateUnit = (index: number, next: OrgUnit) => setDraft(current => current && { ...current, orgUnits: current.orgUnits.map((item, itemIndex) => itemIndex === index ? next : item) })
  const move = <T,>(items: T[], index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return items
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    return next
  }

  return <AdminShell title="Giới thiệu và xưởng" description="Sửa ảnh giám đốc, sơ đồ tổ chức và ảnh từng loại máy. Thay đổi xuất hiện trên website ngay sau khi lưu, không cần nhờ kỹ thuật.">
    {setting.isLoading || !draft ? <p className="rounded-3xl border border-slate-200 bg-white py-16 text-center text-slate-500">Đang tải nội dung hiện tại...</p> : <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="font-display text-2xl font-bold text-emerald-950">Ảnh giám đốc</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Ảnh này nằm ở phần lãnh đạo trên trang Giới thiệu.</p>
        <div className="mt-5">
          <ImageUpload label="Ảnh giám đốc" value={draft.leaderImage} onChange={leaderImage => setDraft({ ...draft, leaderImage })} onBusyChange={value => setBusy(count => count + (value ? 1 : -1))}/>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-emerald-950">Sơ đồ tổ chức</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Cấp 1 ở trên cùng, cấp 4 là các bộ phận làm việc trên công trình. Thứ tự trong cùng một cấp là thứ tự hiển thị từ trái sang phải.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setDraft({ ...draft, orgUnits: [...draft.orgUnits, { name: "", note: "", tier: 4 }] })}><Plus className="size-4"/>Thêm phòng ban</Button>
        </div>
        <div className="mt-6 space-y-4">
          {draft.orgUnits.map((unit, index) => <div className="grid gap-3 rounded-2xl border border-slate-200 p-4 lg:grid-cols-[1.1fr_1.4fr_220px_auto]" key={`${unit.name}-${index}`}>
            <label className="block text-sm font-bold text-slate-700">Tên<input className={`${fieldClass} mt-2`} value={unit.name} onChange={event => updateUnit(index, { ...unit, name: event.target.value })}/></label>
            <label className="block text-sm font-bold text-slate-700">Vai trò ngắn<textarea className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-700" value={unit.note} onChange={event => updateUnit(index, { ...unit, note: event.target.value })}/></label>
            <label className="block text-sm font-bold text-slate-700">Cấp<select className={`${fieldClass} mt-2`} value={unit.tier} onChange={event => updateUnit(index, { ...unit, tier: Number(event.target.value) })}>{[1, 2, 3, 4].map(tier => <option value={tier} key={tier}>Cấp {tier} · {orgTierLabels[tier]}</option>)}</select></label>
            <div className="flex items-end gap-2">
              <Button type="button" variant="outline" aria-label="Đưa lên" onClick={() => setDraft({ ...draft, orgUnits: move(draft.orgUnits, index, -1) })}><ChevronUp className="size-4"/></Button>
              <Button type="button" variant="outline" aria-label="Đưa xuống" onClick={() => setDraft({ ...draft, orgUnits: move(draft.orgUnits, index, 1) })}><ChevronDown className="size-4"/></Button>
              <Button type="button" variant="outline" aria-label="Xóa phòng ban" onClick={() => setDraft({ ...draft, orgUnits: draft.orgUnits.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="size-4"/></Button>
            </div>
          </div>)}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-emerald-950">Máy móc tại xưởng</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Mỗi máy có ảnh, câu giới thiệu trên thẻ và ba đoạn hiện khi khách bấm vào: máy là gì, công dụng, thông tin chung.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => setDraft({ ...draft, equipment: [...draft.equipment, { name: "", summary: "", purpose: "", notes: "", images: ["", ""] }] })}><Plus className="size-4"/>Thêm máy</Button>
        </div>
        <div className="mt-6 space-y-5">
          {draft.equipment.map((machine, index) => <article className="rounded-2xl border border-slate-200 p-4" key={`${machine.name}-${index}`}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <label className="block min-w-[240px] flex-1 text-sm font-bold text-slate-700">Tên máy<input className={`${fieldClass} mt-2`} value={machine.name} onChange={event => updateMachine(index, { ...machine, name: event.target.value })}/></label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" aria-label="Đưa máy lên" onClick={() => setDraft({ ...draft, equipment: move(draft.equipment, index, -1) })}><ChevronUp className="size-4"/></Button>
                <Button type="button" variant="outline" aria-label="Đưa máy xuống" onClick={() => setDraft({ ...draft, equipment: move(draft.equipment, index, 1) })}><ChevronDown className="size-4"/></Button>
                <Button type="button" variant="outline" aria-label="Xóa máy" onClick={() => setDraft({ ...draft, equipment: draft.equipment.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 className="size-4"/></Button>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="block text-sm font-bold text-slate-700">Đây là máy gì<textarea className="mt-2 min-h-16 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-700" value={machine.summary} onChange={event => updateMachine(index, { ...machine, summary: event.target.value })}/></label>
              <label className="block text-sm font-bold text-slate-700">Công dụng<textarea className="mt-2 min-h-16 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-700" value={machine.purpose} onChange={event => updateMachine(index, { ...machine, purpose: event.target.value })}/></label>
              <label className="block text-sm font-bold text-slate-700">Thông tin chung<textarea className="mt-2 min-h-16 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-700" value={machine.notes} onChange={event => updateMachine(index, { ...machine, notes: event.target.value })}/></label>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {[0, 1].map(slot => <ImageUpload key={slot} label={slot === 0 ? "Ảnh trên thẻ" : "Ảnh bổ sung"} value={machine.images[slot] || ""} onChange={url => updateMachine(index, { ...machine, images: machine.images.map((image, imageIndex) => imageIndex === slot ? url : image) })} onBusyChange={value => setBusy(count => count + (value ? 1 : -1))}/>)}
            </div>
          </article>)}
        </div>
      </section>

      <div className="sticky bottom-4 flex justify-end">
        <Button disabled={busy > 0 || save.isPending} onClick={() => save.mutate()}>{busy > 0 ? "Đang tải ảnh..." : save.isPending ? "Đang lưu..." : "Lưu toàn bộ nội dung"}</Button>
      </div>
    </div>}
    {setting.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{setting.error.message}</p>}
  </AdminShell>
}
