import * as Dialog from "@radix-ui/react-dialog"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Boxes, ChevronDown, ChevronUp, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { AdminShell } from "@/components/admin/admin-shell"
import { ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/toast"
import { completeMachines } from "@/content/site-content"
import { usePageMeta } from "@/hooks/use-page-meta"
import { adminClient } from "@/lib/admin-client"
import { publicAssetUrl } from "@/lib/assets"
import type { WorkshopMachine } from "@/types/admin"

const emptyMachine = (): WorkshopMachine => ({ name: "", summary: "", purpose: "", notes: "", images: ["", ""] })
const normalizeMachine = (machine: WorkshopMachine): WorkshopMachine => ({ ...machine, images: [machine.images?.[0] || "", machine.images?.[1] || ""] })

function move<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const next = [...items]
  const [item] = next.splice(index, 1)
  next.splice(target, 0, item)
  return next
}

export function AdminWorkshopPage() {
  usePageMeta("Máy móc tại xưởng", "Quản lý hình ảnh và nội dung máy móc tại xưởng.")
  const queryClient = useQueryClient()
  const toast = useToast()
  const setting = useQuery({ queryKey: ["admin", "site-settings", "about"], queryFn: adminClient.aboutSettings })
  const [machines, setMachines] = useState<WorkshopMachine[] | null>(null)
  const [search, setSearch] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [machineDraft, setMachineDraft] = useState<WorkshopMachine | null>(null)
  const [busy, setBusy] = useState(0)
  const supportsWorkshopSettings = Array.isArray(setting.data?.data?.equipment)

  useEffect(() => {
    if (!setting.data || machines) return
    setMachines(completeMachines(setting.data.data.equipment).map(normalizeMachine))
  }, [setting.data, machines])

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi")
    return (machines || []).map((machine, index) => ({ machine, index })).filter(({ machine }) => !query || `${machine.name} ${machine.summary} ${machine.purpose}`.toLocaleLowerCase("vi").includes(query))
  }, [machines, search])

  const save = useMutation({
    mutationFn: () => {
      if (!supportsWorkshopSettings) throw new Error("API production chưa hỗ trợ lưu máy móc. Hãy hoàn tất deploy backend mới trước khi lưu.")
      return adminClient.updateAboutSettings({ equipment: (machines || []).map(item => ({ name: item.name.trim(), summary: item.summary.trim(), purpose: item.purpose.trim(), notes: item.notes.trim(), images: (item.images || []).map(image => image.trim()).filter(Boolean) })) })
    },
    onSuccess: result => {
      setMachines(completeMachines(result.data.equipment).map(normalizeMachine))
      toast.success(result.message || "Đã lưu máy móc tại xưởng")
      void queryClient.invalidateQueries({ queryKey: ["site-settings", "about"] })
      void queryClient.invalidateQueries({ queryKey: ["admin", "site-settings", "about"] })
    },
    onError: error => toast.error(error.message, { title: "Không thể lưu" }),
  })

  const openCreate = () => { setEditingIndex(null); setMachineDraft(emptyMachine()) }
  const openEdit = (index: number) => { if (machines) { setEditingIndex(index); setMachineDraft(normalizeMachine(machines[index])) } }
  const closeEditor = () => { if (busy === 0) { setMachineDraft(null); setEditingIndex(null) } }
  const applyEditor = () => {
    if (!machineDraft || !machines) return
    if (!machineDraft.name.trim()) { toast.error("Vui lòng nhập tên máy"); return }
    const next = normalizeMachine(machineDraft)
    setMachines(editingIndex === null ? [...machines, next] : machines.map((item, index) => index === editingIndex ? next : item))
    closeEditor()
  }

  return <AdminShell title="Máy móc tại xưởng" description="Danh sách dạng thẻ giúp tìm, chọn và sửa từng máy mà không cần cuộn qua một biểu mẫu dài." action={<Button onClick={openCreate}><Plus className="size-4"/>Thêm máy</Button>}>
    {!machines || setting.isLoading ? <p className="rounded-3xl border border-slate-200 bg-white py-16 text-center text-slate-500">Đang tải danh sách máy...</p> : <>
      {!supportsWorkshopSettings && <p role="alert" className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-900">API production đang là phiên bản cũ nên hệ thống đang hiển thị danh sách máy mặc định. Chức năng lưu được khóa để tránh làm mất dữ liệu; hãy deploy backend mới rồi tải lại trang.</p>}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_auto] lg:items-center"><label className="relative block"><Search className="absolute left-3.5 top-3.5 size-5 text-slate-400"/><Input className="border-transparent bg-slate-50 pl-11 shadow-none focus:bg-white" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc công dụng máy..."/></label><span className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{filtered.length} / {machines.length} máy</span></div></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map(({ machine, index }) => <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm" key={`${index}-${machine.name}`}>
        {machine.images?.[0] ? <img className="h-44 w-full object-cover" src={publicAssetUrl(machine.images[0])} alt={machine.name}/> : <div className="grid h-44 place-items-center bg-slate-100"><Boxes className="size-11 text-slate-300"/></div>}
        <div className="p-5"><div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Máy #{String(index + 1).padStart(2, "0")}</span><h2 className="mt-3 font-display text-xl font-bold text-emerald-950">{machine.name || "Chưa đặt tên"}</h2></div><span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">{(machine.images || []).filter(Boolean).length} ảnh</span></div><p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{machine.summary || "Chưa có mô tả ngắn."}</p><div className="mt-5 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => openEdit(index)}><Pencil className="size-4"/>Sửa</Button><Button size="sm" variant="ghost" aria-label="Đưa máy lên" disabled={index === 0} onClick={() => setMachines(move(machines, index, -1))}><ChevronUp className="size-4"/></Button><Button size="sm" variant="ghost" aria-label="Đưa máy xuống" disabled={index === machines.length - 1} onClick={() => setMachines(move(machines, index, 1))}><ChevronDown className="size-4"/></Button><Button size="sm" variant="ghost" className="text-red-700" onClick={() => setMachines(machines.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4"/>Xóa</Button></div></div>
      </article>)}</div>
      {!filtered.length && <div className="mt-4 rounded-2xl border border-dashed bg-white p-10 text-center"><p className="text-slate-500">Không tìm thấy máy phù hợp.</p></div>}
      <div className="sticky bottom-4 mt-6 flex justify-end"><Button disabled={!supportsWorkshopSettings || save.isPending || busy > 0} onClick={() => save.mutate()}><Save className="size-4"/>{save.isPending ? "Đang lưu..." : supportsWorkshopSettings ? "Lưu danh sách máy" : "Chờ cập nhật API"}</Button></div>
    </>}
    {setting.error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">{setting.error.message}</p>}
    <Dialog.Root open={Boolean(machineDraft)} onOpenChange={open => { if (!open) closeEditor() }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-emerald-950/60 backdrop-blur-sm"/><Dialog.Content className="fixed inset-x-3 top-1/2 z-50 flex max-h-[92vh] -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-[min(900px,calc(100vw-2rem))] sm:-translate-x-1/2">
      <header className="border-b border-slate-200 px-5 py-5 sm:px-7"><Dialog.Title className="font-display text-2xl font-bold text-emerald-950">{editingIndex === null ? "Thêm máy mới" : `Sửa ${machineDraft?.name || "máy"}`}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-500">Chỉnh nội dung và tối đa hai ảnh cho máy này.</Dialog.Description></header>
      {machineDraft && <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7"><div className="grid gap-4"><label className="text-sm font-bold text-slate-700">Tên máy<Input className="mt-2" value={machineDraft.name} onChange={event => setMachineDraft({ ...machineDraft, name: event.target.value })}/></label><label className="text-sm font-bold text-slate-700">Đây là máy gì<textarea className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-700" value={machineDraft.summary} onChange={event => setMachineDraft({ ...machineDraft, summary: event.target.value })}/></label><label className="text-sm font-bold text-slate-700">Công dụng<textarea className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-700" value={machineDraft.purpose} onChange={event => setMachineDraft({ ...machineDraft, purpose: event.target.value })}/></label><label className="text-sm font-bold text-slate-700">Thông tin chung<textarea className="mt-2 min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-700" value={machineDraft.notes} onChange={event => setMachineDraft({ ...machineDraft, notes: event.target.value })}/></label><div className="grid gap-4 lg:grid-cols-2">{[0, 1].map(slot => <ImageUpload key={slot} label={slot === 0 ? "Ảnh trên thẻ" : "Ảnh bổ sung"} value={machineDraft.images?.[slot] || ""} onChange={url => { const images = [...(machineDraft.images || ["", ""])]; images[slot] = url; setMachineDraft({ ...machineDraft, images }) }} onBusyChange={value => setBusy(count => Math.max(0, count + (value ? 1 : -1)))}/>)}</div></div></div>}
      <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7"><Button variant="outline" disabled={busy > 0} onClick={closeEditor}>Hủy</Button><Button disabled={busy > 0} onClick={applyEditor}>{busy > 0 ? "Đang tải ảnh..." : editingIndex === null ? "Thêm vào danh sách" : "Lưu thay đổi"}</Button></footer><Dialog.Close className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng"><X className="size-5"/></Dialog.Close>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </AdminShell>
}
