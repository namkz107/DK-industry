import type { ProjectStage } from "@/types/admin"

export const projectPhaseInfo = {
  before: { label: "Trước khi thực hiện", hint: "Hiện trạng ban đầu, mặt bằng, thiết bị cũ hoặc vấn đề khách hàng cần giải quyết." },
  during: { label: "Trong quá trình thực hiện", hint: "Gia công, lắp ráp, thi công, kiểm tra chất lượng và các mốc triển khai quan trọng." },
  after: { label: "Sau khi hoàn thành", hint: "Thành phẩm, nghiệm thu, vận hành thực tế và kết quả bàn giao." },
} as const

export const defaultProjectStages = (): ProjectStage[] => (Object.keys(projectPhaseInfo) as ProjectStage["phase"][]).map(phase => ({ phase, title: projectPhaseInfo[phase].label, description: "", images: [] }))
