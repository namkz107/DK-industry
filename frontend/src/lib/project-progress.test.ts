import { describe, expect, it } from "vitest"
import { projectHasStarted, projectStageIndex, projectStageLabel } from "@/lib/project-progress"

describe("project progress", () => {
  it("gom trạng thái cũ về ba bước", () => {
    expect(projectStageLabel("scheduled")).toBe("Nhận dự án thành công")
    expect(projectStageLabel("in_progress")).toBe("Đang triển khai")
    expect(projectStageLabel("ready_for_delivery")).toBe("Đang triển khai")
    expect(projectStageLabel("completed")).toBe("Đã hoàn thành")
    expect(projectStageIndex("scheduled")).toBe(0)
    expect(projectStageIndex("quality_check")).toBe(1)
    expect(projectStageIndex("completed")).toBe(2)
    expect(projectHasStarted("scheduled")).toBe(false)
    expect(projectHasStarted("in_progress")).toBe(true)
  })
})
