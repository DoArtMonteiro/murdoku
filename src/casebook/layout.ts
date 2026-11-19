// Sizing the plan for the stage it has to fit in. The painted board has a wide
// lot of lawn around the house; the slice draws it big enough for comfortable
// cells and crops the lawn that does not carry numerals, so the whole playable
// plan always fits the stage without scrolling.
import type { BoardLayoutFn } from '../reference/contract'
import { planGeometry } from '../reference/shell/geometry'
import type { PlanGeometry } from '../reference/shell/geometry'

export interface PlanFit {
  /** Square frame handed to the board. */
  size: number
  cropL: number
  cropT: number
  /** Visible window of the frame. */
  visW: number
  visH: number
  cell: number
  geo: PlanGeometry
}

/** Cells never need to be bigger than this, even on a large screen. */
const CELL_CAP = 84

function frameAt(size: number, n: number, fn: BoardLayoutFn): PlanFit {
  const geo = planGeometry(size, n, fn)
  const u = geo.layout.cellW
  const cropL = Math.max(0, Math.floor(geo.gx - (0.2 * u + 24)))
  const cropT = Math.max(0, Math.floor(geo.gy - (0.2 * u + 16) - 6))
  const cropR = Math.max(0, Math.floor(size - (geo.gx + geo.gw) - 0.4 * u))
  const cropB = Math.max(0, Math.floor(size - (geo.gy + geo.gh) - 0.4 * u))
  return { size, cropL, cropT, visW: size - cropL - cropR, visH: size - cropT - cropB, cell: u, geo }
}

export function fitPlan(availW: number, availH: number, n: number, fn: BoardLayoutFn): PlanFit {
  let best: PlanFit | null = null
  for (let size = 200; size < Math.max(availW, availH) * 3; size += 2) {
    const frame = frameAt(size, n, fn)
    if (best && (frame.visW > availW || frame.visH > availH)) break
    best = frame
    if (frame.cell >= CELL_CAP) break
  }
  return best ?? { size: 200, cropL: 0, cropT: 0, visW: 200, visH: 200, cell: 20, geo: planGeometry(200, n, fn) }
}

/**
 * The height a plan needs for its squares to reach `cell` px, with the same sizing as fitPlan. A plan that
 * runs out of width first reports the height of the widest one that fits: more height would not help it.
 */
export function heightForCell(availW: number, n: number, cell: number, fn: BoardLayoutFn): number {
  let h = 0
  for (let size = 200; size < availW * 3; size += 2) {
    const frame = frameAt(size, n, fn)
    if (frame.visW > availW) break
    h = frame.visH
    if (frame.cell >= cell) break
  }
  return h
}
