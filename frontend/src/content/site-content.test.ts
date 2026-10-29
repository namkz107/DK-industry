import { describe, expect, it } from "vitest"
import { completeMachines, defaultEquipment } from "@/content/site-content"

describe("completeMachines", () => {
  it("uses the default workshop list when an older API omits equipment", () => {
    expect(completeMachines()).toHaveLength(defaultEquipment.length)
    expect(completeMachines().map(machine => machine.name)).toEqual(defaultEquipment.map(machine => machine.name))
  })

  it("preserves an explicitly empty list from a compatible API", () => {
    expect(completeMachines([])).toEqual([])
  })
})
