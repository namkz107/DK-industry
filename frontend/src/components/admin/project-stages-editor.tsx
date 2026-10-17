import { Camera, Plus, Trash2 } from "lucide-react"
import { ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { defaultProjectStages, projectPhaseInfo } from "@/lib/project-stages"
import type { ProjectStage } from "@/types/admin"

type Props = { value: ProjectStage[]; onChange: (stages: ProjectStage[]) => void; onBusyChange: (busy: boolean) => void }

export function ProjectStagesEditor({ value, onChange, onBusyChange }: Props) {
  const stages = defaultProjectStages().map(fallback => value.find(stage => stage.phase === fallback.phase) || fallback)
  const updateStage = (phase: ProjectStage["phase"], changes: Partial<ProjectStage>) => onChange(stages.map(stage => stage.phase === phase ? { ...stage, ...changes } : stage))
  return <section className="md:col-span-2 xl:col-span-3 rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-6">
    <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-950 text-white"><Camera className="size-5"/></span><div><h3 className="font-display text-xl font-bold text-emerald-950">Nhật ký hình ảnh dự án</h3><p className="mt-1 text-sm leading-6 text-slate-600">Thêm ảnh thật và chú thích cụ thể cho từng giai đoạn. Có thể thêm tối đa 20 ảnh mỗi giai đoạn.</p></div></div>
    <div className="mt-6 space-y-6">{stages.map((stage, stageIndex) => <div className="rounded-2xl border bg-white p-4 sm:p-5" key={stage.phase}>
      <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-orange-600 text-sm font-black text-white">{stageIndex + 1}</span><div><h4 className="font-bold text-emerald-950">{projectPhaseInfo[stage.phase].label}</h4><p className="mt-0.5 text-xs leading-5 text-slate-500">{projectPhaseInfo[stage.phase].hint}</p></div></div>
      <div className="mt-4 grid gap-4 md:grid-cols-2"><label className="text-sm font-bold text-slate-700">Tiêu đề giai đoạn<Input className="mt-2" value={stage.title} onChange={event => updateStage(stage.phase, { title: event.target.value })}/></label><label className="text-sm font-bold text-slate-700 md:col-span-2">Mô tả chi tiết<Textarea className="mt-2 min-h-28" value={stage.description || ""} onChange={event => updateStage(stage.phase, { description: event.target.value })} placeholder="Mô tả công việc, tình trạng, kỹ thuật sử dụng và kết quả ở giai đoạn này..."/></label></div>
      <div className="mt-5 space-y-4">{stage.images.map((image, imageIndex) => <div className="rounded-2xl border border-slate-200 p-4" key={`${stage.phase}-${imageIndex}`}>
        <ImageUpload label={`Ảnh ${imageIndex + 1}`} value={image.url} onBusyChange={onBusyChange} onChange={url => updateStage(stage.phase, { images: stage.images.map((item, index) => index === imageIndex ? { ...item, url } : item) })}/>
        <label className="mt-3 block text-sm font-bold text-slate-700">Chú thích ảnh<Input className="mt-2" value={image.caption || ""} onChange={event => updateStage(stage.phase, { images: stage.images.map((item, index) => index === imageIndex ? { ...item, caption: event.target.value } : item) })} placeholder="Ví dụ: Kiểm tra độ phẳng khung băng tải trước khi sơn"/></label>
        <Button className="mt-3 text-red-700" type="button" size="sm" variant="ghost" onClick={() => updateStage(stage.phase, { images: stage.images.filter((_, index) => index !== imageIndex) })}><Trash2 className="size-4"/>Bỏ ảnh này</Button>
      </div>)}
      {stage.images.length < 20 && <Button type="button" size="sm" variant="outline" onClick={() => updateStage(stage.phase, { images: [...stage.images, { url: "", caption: "" }] })}><Plus className="size-4"/>Thêm ảnh cho giai đoạn</Button>}
      </div>
    </div>)}</div>
  </section>
}
