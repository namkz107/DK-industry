export type SimpleStage = "received" | "quoting" | "waiting" | "done" | "stopped"

export const stageLabel: Record<SimpleStage, string> = {
  received: "Đã nhận",
  quoting: "Đang báo giá",
  waiting: "Chờ xác nhận",
  done: "Đã chốt",
  stopped: "Không thực hiện",
}

export const stageStyle: Record<SimpleStage, string> = {
  received: "bg-orange-100 text-orange-900 ring-orange-300",
  quoting: "bg-sky-100 text-sky-900 ring-sky-400",
  waiting: "bg-violet-100 text-violet-900 ring-violet-300",
  done: "bg-emerald-100 text-emerald-900 ring-emerald-300",
  stopped: "bg-slate-100 text-slate-600 ring-slate-200",
}

export const unquotedStyle = "bg-amber-100 text-amber-950 ring-amber-400"
export const revisionStyle = "bg-rose-100 text-rose-950 ring-rose-400"

export const stageFilters: Array<[SimpleStage, string]> = [
  ["received", stageLabel.received],
  ["quoting", stageLabel.quoting],
  ["waiting", stageLabel.waiting],
  ["done", stageLabel.done],
  ["stopped", stageLabel.stopped],
]

const requestStages: Record<string, SimpleStage> = {
  submitted: "received",
  reviewing: "quoting",
  need_more_info: "quoting",
  quoted: "waiting",
  accepted: "done",
  rejected: "stopped",
  cancelled: "stopped",
}

const leadStages: Record<string, SimpleStage> = {
  new: "received",
  qualified: "received",
  contacted: "quoting",
  needs_analysis: "quoting",
  quoted: "waiting",
  won: "done",
  lost: "stopped",
  spam: "stopped",
}

export function requestStageOf(status: string): SimpleStage {
  return requestStages[status] || "received"
}

export function leadStageOf(status: string): SimpleStage {
  return leadStages[status] || "received"
}

export function requestStageLabel(status: string, revisionRequested = false) {
  if (revisionRequested) return "Báo giá lại"
  return stageLabel[requestStageOf(status)]
}

export function requestStageStyle(status: string, revisionRequested = false) {
  if (revisionRequested) return revisionStyle
  return stageStyle[requestStageOf(status)]
}

export function leadStageLabel(status: string) {
  return stageLabel[leadStageOf(status)]
}
