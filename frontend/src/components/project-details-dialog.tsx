import * as Dialog from "@radix-ui/react-dialog"
import { CalendarDays, CheckCircle2, Clock3, Images, ListChecks, MapPin, Quote, Ruler, ShieldCheck, Target, Users, Wrench, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export type ProjectDetails = {
  title: string
  category: string
  location?: string
  year?: string
  description?: string
  objective?: string
  projectScale?: string
  durationDays?: number | null
  teamSize?: number | null
  scope?: string[]
  requirements?: string[]
  workItems?: string[]
  technicalHighlights?: string[]
  challenge?: string
  solution?: string
  results?: string
  customerFeedback?: string
  stages?: Array<{ phase: "before" | "during" | "after"; title: string; description?: string; images: Array<{ url: string; caption?: string }> }>
  image?: string
  gallery?: string[]
}

type Props = { project: ProjectDetails | null; onOpenChange: (open: boolean) => void }

export function ProjectDetailsDialog({ project, onOpenChange }: Props) {
  return <Dialog.Root open={Boolean(project)} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-[120] bg-emerald-950/70 backdrop-blur-sm"/>
      {project && <Dialog.Content aria-describedby="project-details-description" className="fixed left-1/2 top-1/2 z-[121] max-h-[calc(100dvh-24px)] w-[min(1120px,calc(100%-24px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white shadow-2xl outline-none">
        {project.image && <div className="relative"><img className="h-64 w-full rounded-t-3xl object-cover sm:h-96" src={project.image} alt={project.title}/><div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-emerald-950/70 to-transparent"/></div>}
        <div className="p-6 sm:p-9">
          <span className="text-xs font-extrabold uppercase tracking-wider text-orange-700">{project.category}</span>
          <Dialog.Title className="mt-2 pr-10 font-display text-3xl font-bold text-emerald-950 sm:text-4xl">{project.title}</Dialog.Title>
          <Dialog.Description id="project-details-description" className="mt-4 text-base leading-7 text-slate-600">{project.description || "Thông tin chi tiết của dự án."}</Dialog.Description>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Meta icon={MapPin} label="Địa điểm" value={project.location || "Đang cập nhật"}/>
            <Meta icon={CalendarDays} label="Năm thực hiện" value={project.year || "Đang cập nhật"}/>
            <Meta icon={Clock3} label="Thời gian" value={project.durationDays ? `${project.durationDays} ngày` : "Đang cập nhật"}/>
            <Meta icon={Users} label="Nhân sự" value={project.teamSize ? `${project.teamSize} người` : "Đang cập nhật"}/>
            <Meta icon={Ruler} label="Quy mô" value={project.projectScale || "Đang cập nhật"}/>
          </div>
          {project.objective && <section className="mt-8 rounded-3xl bg-orange-50 p-6 sm:p-7"><h3 className="flex items-center gap-2 font-display text-xl font-bold text-emerald-950"><Target className="size-5 text-orange-600"/>Mục tiêu dự án</h3><p className="mt-3 leading-7 text-slate-700">{project.objective}</p></section>}
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <DetailList icon={ListChecks} title="Phạm vi dự án" items={project.scope}/>
            <DetailList icon={ShieldCheck} title="Yêu cầu kỹ thuật" items={project.requirements}/>
            <DetailList icon={Wrench} title="Các công việc đã thực hiện" items={project.workItems}/>
            <DetailList icon={Target} title="Điểm nổi bật kỹ thuật" items={project.technicalHighlights}/>
          </div>
          {(project.challenge || project.solution || project.results) && <div className="mt-8 grid gap-5">
            {project.challenge && <DetailText title="Thách thức" text={project.challenge}/>} 
            {project.solution && <DetailText title="Giải pháp triển khai" text={project.solution}/>} 
            {project.results && <DetailText title="Kết quả" text={project.results} success/>}
          </div>}
          {project.stages?.length ? <section className="mt-10"><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-emerald-950 text-white"><Images className="size-5"/></span><div><h3 className="font-display text-2xl font-bold text-emerald-950">Hành trình thực hiện dự án</h3><p className="mt-1 text-sm text-slate-500">Hình ảnh thực tế từ hiện trạng đến khi nghiệm thu và bàn giao.</p></div></div><div className="relative mt-7 space-y-8 before:absolute before:bottom-4 before:left-4 before:top-4 before:w-px before:bg-emerald-200 sm:before:left-5">{project.stages.map((stage, index) => <article className="relative pl-12 sm:pl-16" key={stage.phase}><span className="absolute left-0 top-0 grid size-9 place-items-center rounded-full border-4 border-white bg-orange-600 text-sm font-black text-white shadow sm:size-11">{index + 1}</span><div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 sm:p-7"><span className="text-xs font-black uppercase tracking-wider text-orange-700">{phaseLabel(stage.phase)}</span><h4 className="mt-1 font-display text-2xl font-bold text-emerald-950">{stage.title}</h4>{stage.description && <p className="mt-3 leading-7 text-slate-600">{stage.description}</p>}{stage.images?.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{stage.images.map((image, imageIndex) => <figure className="overflow-hidden rounded-2xl border bg-white shadow-sm" key={`${image.url}-${imageIndex}`}><img className="aspect-[4/3] w-full object-cover" src={image.url} alt={image.caption || `${stage.title} ${imageIndex + 1}`}/>{image.caption && <figcaption className="p-4 text-sm leading-6 text-slate-600">{image.caption}</figcaption>}</figure>)}</div> : <p className="mt-4 text-sm italic text-slate-500">Chưa có ảnh cho giai đoạn này.</p>}</div></article>)}</div></section> : null}
          {project.gallery?.length ? <div className="mt-8"><h3 className="font-display text-xl font-bold text-emerald-950">Hình ảnh dự án</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">{project.gallery.map((image, index) => <img className="aspect-video w-full rounded-2xl object-cover" src={image} alt={`${project.title} ${index + 1}`} key={`${image}-${index}`}/>)}</div></div> : null}
          {project.customerFeedback && <section className="mt-8 rounded-3xl bg-emerald-950 p-6 text-white sm:p-8"><Quote className="size-8 text-orange-400"/><blockquote className="mt-4 text-lg leading-8 text-emerald-50">“{project.customerFeedback}”</blockquote><p className="mt-4 text-sm font-bold text-orange-300">Phản hồi sau khi bàn giao</p></section>}
          <div className="mt-9 flex justify-end"><Dialog.Close asChild><Button type="button" variant="outline">Đóng</Button></Dialog.Close></div>
        </div>
        <Dialog.Close className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl bg-white/90 text-slate-700 shadow transition hover:bg-white" aria-label="Đóng chi tiết dự án"><X className="size-5"/></Dialog.Close>
      </Dialog.Content>}
    </Dialog.Portal>
  </Dialog.Root>
}

function Meta({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-4"><Icon className="size-5 text-orange-600"/><span className="mt-2 block text-xs font-bold uppercase tracking-wide text-slate-500">{label}</span><strong className="mt-1 block text-emerald-950">{value}</strong></div> }
function DetailList({ icon: Icon, title, items }: { icon: typeof ListChecks; title: string; items?: string[] }) { return <section><h3 className="flex items-center gap-2 font-display text-xl font-bold text-emerald-950"><Icon className="size-5 text-orange-600"/>{title}</h3>{items?.length ? <ul className="mt-4 space-y-3">{items.map(item => <li className="flex gap-3 leading-6 text-slate-600" key={item}><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600"/>{item}</li>)}</ul> : <p className="mt-3 text-slate-500">Đang cập nhật.</p>}</section> }
function DetailText({ title, text, success = false }: { title: string; text: string; success?: boolean }) { return <section className={success ? "rounded-2xl bg-emerald-50 p-5" : "rounded-2xl border border-slate-200 p-5"}><h3 className="font-display text-lg font-bold text-emerald-950">{title}</h3><p className="mt-2 leading-7 text-slate-600">{text}</p></section> }
function phaseLabel(phase: "before" | "during" | "after") { return phase === "before" ? "Trước khi thực hiện" : phase === "during" ? "Trong quá trình thực hiện" : "Sau khi hoàn thành" }
