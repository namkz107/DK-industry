export const projectStages = ["Nhận dự án thành công", "Đang triển khai", "Đã hoàn thành"] as const

const acceptedStatuses = new Set(["awaiting_contract", "awaiting_deposit", "scheduled"])
const implementingStatuses = new Set(["in_progress", "quality_check", "ready_for_delivery"])

export function projectStageIndex(status: string) {
  if (status === "completed") return 2
  if (implementingStatuses.has(status)) return 1
  if (acceptedStatuses.has(status)) return 0
  return -1
}

export function projectStageLabel(status: string) {
  if (status === "cancelled") return "Đã hủy"
  const stage = projectStageIndex(status)
  return stage >= 0 ? projectStages[stage] : "Cập nhật"
}

export function projectHasStarted(status: string) {
  return projectStageIndex(status) >= 1
}
