import { Check } from "lucide-react"
import { projectStageIndex, projectStages } from "@/lib/project-progress"
import { cn } from "@/lib/utils"

export function ProjectProgress({ status }: { status: string }) {
  if (status === "cancelled") return null
  const stage = projectStageIndex(status)
  const completed = status === "completed"
  const last = projectStages.length - 1
  return <ol className="mt-7 grid grid-cols-3" aria-label={`Tiến độ: ${projectStages[stage] || "Đã hủy"}`}>{projectStages.map((label, index) => <li key={label} className="relative flex min-w-0 flex-col items-center text-center"><span className={cn("absolute left-0 right-1/2 top-4 h-0.5", index === 0 && "hidden", index <= stage ? "bg-emerald-600" : "bg-slate-200")}/><span className={cn("absolute left-1/2 right-0 top-4 h-0.5", index === last && "hidden", index < stage || completed ? "bg-emerald-600" : "bg-slate-200")}/><span className={cn("relative z-10 grid size-8 place-items-center rounded-full border-2 bg-white", index < stage || completed ? "border-emerald-600 bg-emerald-600 text-white" : index === stage ? "border-orange-500 text-orange-600" : "border-slate-300 text-slate-300")}>{index < stage || completed ? <Check className="size-4"/> : <span className="size-2 rounded-full bg-current"/>}</span><span className="mt-2 px-1 text-[11px] font-bold leading-4 text-slate-600 sm:text-sm">{label}</span></li>)}</ol>
}

export function ProjectProgressBars({ status }: { status: string }) {
  if (status === "cancelled") return <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">Đã hủy</span>
  const stage = projectStageIndex(status)
  return <div className="flex gap-1" aria-label={`Tiến độ: ${projectStages[stage]}`}>{projectStages.map((label, index) => <span title={label} key={label} className={cn("h-2 flex-1 rounded-full", index <= stage ? "bg-emerald-600" : "bg-slate-200")}/>)}</div>
}
