import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { ArrowRight, Building2, CalendarDays, ChevronRight, FolderKanban, MapPin, MoveUpRight, Sparkles, Timer } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Pagination } from "@/components/pagination"
import { ProjectDetailsDialog } from "@/components/project-details-dialog"
import { Button } from "@/components/ui/button"
import { usePageMeta } from "@/hooks/use-page-meta"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { Project } from "@/types"

const allCategory = "Tất cả"

export function ProjectsPage() {
  usePageMeta("Dự án", "Công trình đường ống, ống gió, hook-up cơ điện, sàn thao tác và bảo ôn của Cơ khí Đăng Khoa.")
  const [selected, setSelected] = useState<Project | null>(null)
  const [category, setCategory] = useState(allCategory)
  const [page, setPage] = useState(1)
  const query = useQuery({ queryKey: ["projects", { category, page }], queryFn: () => api.projects({ page, limit: 9, category: category === allCategory ? undefined : category }), placeholderData: keepPreviousData, staleTime: 5 * 60_000, retry: 1 })
  const categoryRow = useRef<HTMLDivElement>(null)
  const projects = query.data?.data || []
  const categories = [allCategory, ...(query.data?.categories || [])]
  const featured = projects[0]
  const remaining = projects.slice(1)
  const latestYear = projects.map(project => {
    const years = String(project.year || "").match(/\d{4}/g)?.map(Number) || []
    return years.length ? Math.max(...years) : NaN
  }).filter(Number.isFinite).sort((a, b) => b - a)[0]
  useEffect(() => {
    const row = categoryRow.current
    if (!row) return
    const onWheel = (event: WheelEvent) => {
      if (row.scrollWidth <= row.clientWidth + 1 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const max = row.scrollWidth - row.clientWidth
      const atStart = row.scrollLeft <= 0 && event.deltaY < 0
      const atEnd = row.scrollLeft >= max - 1 && event.deltaY > 0
      if (atStart || atEnd) return
      event.preventDefault()
      row.scrollLeft += event.deltaY
    }
    row.addEventListener("wheel", onWheel, { passive: false })
    return () => row.removeEventListener("wheel", onWheel)
  }, [categories.length])

  return <>
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <img className="absolute inset-0 -z-20 size-full object-cover object-center" src={projects[0]?.image || "/images/equipment/xe-nang-xuong.png"} alt="Hình ảnh thi công thực tế của Cơ khí Đăng Khoa" fetchPriority="high"/>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,6,23,.96)_0%,rgba(2,6,23,.86)_44%,rgba(2,6,23,.42)_72%,rgba(2,6,23,.22)_100%)]"/>
      <div className="container-page relative flex min-h-[38rem] items-center py-16 sm:min-h-[42rem] lg:min-h-[46rem] lg:py-24">
        <div className="relative z-10 max-w-3xl">
          <div className="eyebrow-pill"><Sparkles className="size-4"/>Hồ sơ năng lực thực tế</div>
          <h1 className="heading-hero mt-7">Năng lực được chứng minh bằng <span className="text-orange-400">công trình.</span></h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-slate-100/78 sm:text-lg">Khám phá cách chúng tôi khảo sát, thiết kế, chế tạo và bàn giao từng dự án—minh bạch từ hiện trạng ban đầu đến kết quả hoàn thiện.</p>
          <div className="mt-10 flex flex-wrap gap-x-10 gap-y-5 border-t border-white/15 pt-7"><HeroMetric value={query.data?.total ?? query.data?.count ?? projects.length} label="Dự án công bố"/><HeroMetric value={Math.max(0, categories.length - 1)} label="Nhóm năng lực"/><HeroMetric value={latestYear || "—"} label="Cập nhật gần nhất"/></div>
        </div>
      </div>
    </section>

    <section className="bg-[#f6f7f5] py-16 sm:py-20 lg:py-24"><div className="container-page">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-black uppercase tracking-[.2em] text-orange-600">Công trình đã thực hiện</p>
          <h2 className="heading-section mt-3">Mỗi dự án là một câu chuyện về giải pháp.</h2>
          <p className="mt-4 leading-7 text-slate-600">Chọn một nhóm năng lực hoặc mở từng hồ sơ để xem quy trình, yêu cầu kỹ thuật và hình ảnh theo từng giai đoạn.</p>
        </div>
        <p className="text-sm font-semibold text-slate-500 lg:max-w-xs lg:text-right">{category === allCategory ? "Đang xem toàn bộ công trình." : <>Đang lọc <span className="text-emerald-950">{category}.</span> Bấm lại mục đó để xem tất cả.</>}</p>
      </div>
      <div className="mt-8 min-w-0 rounded-card border border-slate-200 bg-white p-2 sm:p-2.5" role="group" aria-label="Lọc dự án theo nhóm năng lực">
        <div ref={categoryRow} className="flex gap-2 overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:thin]">{categories.map(item => {
          const active = category === item
          return <button type="button" key={item} aria-pressed={active} onClick={() => { setCategory(current => current === item && item !== allCategory ? allCategory : item); setPage(1) }} className={cn("inline-flex min-h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-control px-3.5 text-sm font-bold transition", active ? "bg-emerald-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-800")}><span className={cn("size-2 shrink-0 rounded-full", active ? "bg-orange-400" : "bg-slate-300")} aria-hidden="true"/>{item}</button>
        })}</div>
      </div>
      {query.isLoading ? <ProjectsSkeleton/> : query.error ? <div role="alert" className="mt-12 rounded-panel border border-red-100 bg-red-50 p-8 text-center"><p className="font-bold text-red-700">Không thể tải danh sách dự án.</p><button className="mt-3 text-sm font-bold text-red-700 underline underline-offset-4" onClick={() => void query.refetch()}>Thử tải lại</button></div> : featured ? <div className="mt-12"><div className="grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3"><FeaturedProject project={featured} onView={() => setSelected(featured)}/>{remaining.map((project, index) => <ProjectCard project={project} index={(page - 1) * 9 + index + 2} onView={() => setSelected(project)} key={project._id}/>)}</div><Pagination page={query.data?.page || page} pages={query.data?.pages || 1} onChange={nextPage => { setPage(nextPage); window.scrollTo({ top: 560, behavior: "smooth" }) }}/></div> : <div className="mt-12 rounded-panel border border-dashed border-slate-300 bg-white p-12 text-center"><FolderKanban className="mx-auto size-10 text-slate-300"/><p className="mt-4 font-bold text-slate-600">Chưa có dự án trong nhóm này.</p></div>}
      <div className="mt-16 overflow-hidden rounded-panel bg-emerald-950 text-white lg:grid lg:grid-cols-[1fr_auto] lg:items-center"><div className="p-7 sm:p-10 lg:p-12"><p className="text-xs font-black uppercase tracking-[.18em] text-orange-400">Có một bài toán tương tự?</p><h2 className="heading-section mt-3 max-w-2xl text-white">Hãy bắt đầu bằng một buổi trao đổi kỹ thuật.</h2><p className="mt-4 max-w-xl leading-7 text-emerald-50/65">Chúng tôi sẽ cùng bạn làm rõ yêu cầu, khảo sát hiện trạng và đề xuất phương án phù hợp trước khi triển khai.</p></div><div className="border-t border-white/10 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12"><Button asChild size="lg"><Link to="/lien-he">Trao đổi dự án<ArrowRight className="size-5"/></Link></Button></div></div>
    </div></section>
    <ProjectDetailsDialog project={selected} onOpenChange={open => { if (!open) setSelected(null) }}/>
  </>
}

function HeroMetric({ value, label }: { value: string | number; label: string }) { return <div><strong className="font-display text-3xl font-bold text-white">{value}</strong><span className="mt-1 block text-xs font-bold uppercase tracking-wider text-emerald-100/45">{label}</span></div> }

function FeaturedProject({ project, onView }: { project: Project; onView: () => void }) { return <article className="catalog-card group overflow-hidden rounded-panel border border-slate-200 bg-white md:col-span-2 md:grid md:grid-cols-[1.12fr_.88fr] xl:col-span-2"><button type="button" className="relative min-h-72 overflow-hidden text-left sm:min-h-[410px]" onClick={onView} aria-label={`Xem chi tiết ${project.title}`}>{project.image ? <img className="absolute inset-0 size-full object-cover" src={project.image} alt={project.title}/> : <div className="absolute inset-0 bg-slate-200"/>}<div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 via-transparent to-transparent"/><span className="media-chip absolute left-6 top-6 px-4 py-2 text-xs font-black uppercase tracking-wider">Nổi bật</span><span className="absolute bottom-6 right-6 grid size-14 place-items-center rounded-full bg-orange-600 text-white"><MoveUpRight className="size-6"/></span></button><div className="flex flex-col justify-center p-7 sm:p-9"><div className="flex items-center gap-3"><span className="font-display text-sm font-black text-orange-600">01</span><span className="h-px w-10 bg-orange-300"/><span className="text-xs font-black uppercase tracking-[.16em] text-slate-500">{project.category}</span></div><h3 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-emerald-950">{project.title}</h3><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-500"><span className="flex items-center gap-2"><MapPin className="size-4 text-orange-600"/>{project.location || "Đang cập nhật"}</span><span className="flex items-center gap-2"><CalendarDays className="size-4 text-orange-600"/>{project.year || "Đang cập nhật"}</span>{project.durationDays && <span className="flex items-center gap-2"><Timer className="size-4 text-orange-600"/>{project.durationDays} ngày</span>}</div>{project.description && <p className="mt-5 line-clamp-3 leading-7 text-slate-600">{project.description}</p>}<button type="button" className="mt-7 flex min-h-12 items-center justify-between border-t border-slate-200 pt-5 text-left font-bold text-emerald-950 transition hover:text-orange-700" onClick={onView}><span>Xem hồ sơ dự án</span><ArrowRight className="size-5"/></button></div></article> }

function ProjectCard({ project, index, onView }: { project: Project; index: number; onView: () => void }) { return <article className="catalog-card group overflow-hidden rounded-card border border-slate-200 bg-white"><button type="button" className="relative block aspect-[16/10] w-full overflow-hidden text-left" onClick={onView} aria-label={`Xem chi tiết ${project.title}`}>{project.image ? <img className="size-full object-cover" src={project.image} alt={project.title}/> : <div className="size-full bg-slate-200"/>}<div className="absolute inset-0 bg-gradient-to-t from-emerald-950/35 to-transparent"/><span className="media-chip absolute bottom-5 left-5 px-3 py-1.5 text-xs font-bold">{project.category}</span></button><div className="p-6 sm:p-7"><div className="flex items-start justify-between gap-5"><div><span className="text-xs font-black text-orange-600">{String(index).padStart(2, "0")}</span><h3 className="mt-2 font-display text-2xl font-bold leading-tight text-emerald-950">{project.title}</h3></div><button type="button" className="grid size-11 shrink-0 place-items-center rounded-full border border-slate-200 text-emerald-950 transition group-hover:border-orange-600 group-hover:bg-orange-600 group-hover:text-white" onClick={onView} aria-label="Xem chi tiết"><ChevronRight className="size-5"/></button></div><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-5 text-sm text-slate-500"><span className="flex items-center gap-2"><MapPin className="size-4 text-orange-600"/>{project.location || "Đang cập nhật"}</span><span className="flex items-center gap-2"><Building2 className="size-4 text-orange-600"/>{project.projectScale || project.year || "Đang cập nhật"}</span></div></div></article> }

function ProjectsSkeleton() { return <div className="mt-12 animate-pulse overflow-hidden rounded-panel border bg-white lg:grid lg:grid-cols-[1.18fr_.82fr]"><div className="min-h-80 bg-slate-200 lg:min-h-[500px]"/><div className="space-y-5 p-8 lg:p-12"><div className="h-4 w-32 rounded bg-slate-200"/><div className="h-10 w-4/5 rounded bg-slate-200"/><div className="h-4 w-1/2 rounded bg-slate-100"/><div className="h-24 rounded bg-slate-100"/></div></div> }
