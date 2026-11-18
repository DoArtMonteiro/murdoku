import type { FloorMaterial, PlanRect, SceneSpec } from './schema'
import { CELL, FLOOR_THICKNESS } from './units'

const EPS = 1e-8

export interface FloorBox {
  min: [number, number, number]
  max: [number, number, number]
}

export interface FloorPatch {
  row: number
  col: number
  material: FloorMaterial
  y: number
  /** Bounds in authored cell units. */
  bounds: PlanRect
  box: FloorBox
}

export interface FloorGeometrySource {
  n: number
  floorY: number[][]
  floorMaterial: FloorMaterial[][]
  floorPresent: boolean[][]
  stairwellBounds?: PlanRect
}

export function validPlanRect(bounds: PlanRect, n: number): boolean {
  const [x0, z0, x1, z1] = bounds
  return bounds.every(Number.isFinite)
    && x0 >= 0 && z0 >= 0 && x1 <= n && z1 <= n
    && x0 < x1 && z0 < z1
}

export function resolveFootprint(spec: SceneSpec, n: number): { present: boolean[][]; problems: string[] } {
  const present = Array.from({ length: n }, () => Array<boolean>(n).fill(false))
  const problems: string[] = []
  const footprint = spec.storeyFootprint
  if (!footprint || footprint.kind === 'full') {
    for (const row of present) row.fill(true)
    return { present, problems }
  }
  if (!footprint.rects.length) problems.push('storey footprint has no cell rectangles')
  for (const rect of footprint.rects) {
    const [c0, r0, c1, r1] = rect
    if (!rect.every(Number.isInteger) || c0 < 0 || r0 < 0 || c1 >= n || r1 >= n || c0 > c1 || r0 > r1) {
      problems.push(`storey footprint rectangle [${rect.join(',')}] is outside the ${n}×${n} logical extent`)
      continue
    }
    for (let row = r0; row <= r1; row++) for (let col = c0; col <= c1; col++) present[row][col] = true
  }
  return { present, problems }
}

export function resolveStairwell(spec: SceneSpec, n: number): {
  bounds?: PlanRect
  source?: 'legacy' | 'bounds'
  problems: string[]
} {
  const problems: string[] = []
  if (spec.stairwell && spec.stairwellBounds) {
    problems.push('scene declares both legacy stairwell and stairwellBounds')
    return { problems }
  }
  if (spec.stairwellBounds) {
    if (!validPlanRect(spec.stairwellBounds, n)) {
      problems.push(`stairwellBounds [${spec.stairwellBounds.join(',')}] lies outside the ${n}×${n} logical extent`)
    }
    return { bounds: spec.stairwellBounds, source: 'bounds', problems }
  }
  if (!spec.stairwell) return { problems }
  const [c0, r0, c1, r1] = spec.stairwell
  if (!spec.stairwell.every(Number.isInteger) || c0 < 0 || r0 < 0 || c1 >= n || r1 >= n || c0 > c1 || r0 > r1) {
    problems.push(`stairwell [${spec.stairwell.join(',')}] lies outside the ${n}×${n} logical extent`)
  }
  return { bounds: [c0, r0, c1 + 1, r1 + 1], source: 'legacy', problems }
}

function intersection(a: PlanRect, b: PlanRect): PlanRect | undefined {
  const overlap: PlanRect = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])]
  return overlap[0] < overlap[2] - EPS && overlap[1] < overlap[3] - EPS ? overlap : undefined
}

export function subtractPlanRect(base: PlanRect, cut?: PlanRect): PlanRect[] {
  if (!cut) return [base]
  const overlap = intersection(base, cut)
  if (!overlap) return [base]
  const [x0, z0, x1, z1] = base
  const [ix0, iz0, ix1, iz1] = overlap
  return [
    [x0, z0, x1, iz0],
    [x0, iz1, x1, z1],
    [x0, iz0, ix0, iz1],
    [ix1, iz0, x1, iz1],
  ].filter(rect => rect[2] - rect[0] > EPS && rect[3] - rect[1] > EPS) as PlanRect[]
}

export function floorPatches(scene: FloorGeometrySource): FloorPatch[] {
  const patches: FloorPatch[] = []
  for (let row = 0; row < scene.n; row++) for (let col = 0; col < scene.n; col++) {
    if (!scene.floorPresent[row][col]) continue
    for (const bounds of subtractPlanRect([col, row, col + 1, row + 1], scene.stairwellBounds)) {
      const y = scene.floorY[row][col]
      patches.push({
        row, col, material: scene.floorMaterial[row][col], y, bounds,
        box: {
          min: [bounds[0] * CELL, y - FLOOR_THICKNESS, bounds[1] * CELL],
          max: [bounds[2] * CELL, y, bounds[3] * CELL],
        },
      })
    }
  }
  return patches
}

export interface WorldRect { minX: number; maxX: number; minZ: number; maxZ: number }

export function planRectToWorld(bounds: PlanRect): WorldRect {
  return { minX: bounds[0] * CELL, minZ: bounds[1] * CELL, maxX: bounds[2] * CELL, maxZ: bounds[3] * CELL }
}

export function worldRectCoveredByFloor(scene: FloorGeometrySource, rect: WorldRect, tolerance = 1e-6): boolean {
  const wanted = Math.max(0, rect.maxX - rect.minX) * Math.max(0, rect.maxZ - rect.minZ)
  const covered = floorPatches(scene).reduce((sum, patch) => {
    const width = Math.max(0, Math.min(rect.maxX, patch.box.max[0]) - Math.max(rect.minX, patch.box.min[0]))
    const depth = Math.max(0, Math.min(rect.maxZ, patch.box.max[2]) - Math.max(rect.minZ, patch.box.min[2]))
    return sum + width * depth
  }, 0)
  return covered >= wanted - tolerance
}

export function pointHasFloor(scene: FloorGeometrySource, x: number, z: number): boolean {
  return floorPatches(scene).some(patch => x >= patch.box.min[0] - EPS && x <= patch.box.max[0] + EPS
    && z >= patch.box.min[2] - EPS && z <= patch.box.max[2] + EPS)
}

export function worldRectOverlapsPlanRect(rect: WorldRect, bounds?: PlanRect): boolean {
  if (!bounds) return false
  const other = planRectToWorld(bounds)
  return rect.minX < other.maxX - EPS && other.minX < rect.maxX - EPS
    && rect.minZ < other.maxZ - EPS && other.minZ < rect.maxZ - EPS
}

/** Continuous boxes used by the companion floor; no logical cell edges survive. */
export function mergedFloorBoxes(scene: FloorGeometrySource): FloorBox[] {
  const patches = floorPatches(scene)
  if (!patches.length) return []
  const xs = [...new Set(patches.flatMap(patch => [patch.bounds[0], patch.bounds[2]]))].sort((a, b) => a - b)
  const zs = [...new Set(patches.flatMap(patch => [patch.bounds[1], patch.bounds[3]]))].sort((a, b) => a - b)
  const rows = zs.length - 1, cols = xs.length - 1
  const heights = Array.from({ length: rows }, () => Array<number | undefined>(cols).fill(undefined))
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const x = (xs[col] + xs[col + 1]) / 2, z = (zs[row] + zs[row + 1]) / 2
    heights[row][col] = patches.find(patch => (
      x > patch.bounds[0] - EPS && x < patch.bounds[2] + EPS
      && z > patch.bounds[1] - EPS && z < patch.bounds[3] + EPS
    ))?.y
  }
  const visited = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false))
  const boxes: FloorBox[] = []
  for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
    const y = heights[row][col]
    if (y === undefined || visited[row][col]) continue
    let colEnd = col
    while (colEnd + 1 < cols && !visited[row][colEnd + 1] && heights[row][colEnd + 1] === y) colEnd++
    let rowEnd = row
    while (rowEnd + 1 < rows && Array.from({ length: colEnd - col + 1 }, (_, i) => col + i)
      .every(candidate => !visited[rowEnd + 1][candidate] && heights[rowEnd + 1][candidate] === y)) rowEnd++
    for (let r = row; r <= rowEnd; r++) for (let c = col; c <= colEnd; c++) visited[r][c] = true
    boxes.push({
      min: [xs[col] * CELL, y - FLOOR_THICKNESS, zs[row] * CELL],
      max: [xs[colEnd + 1] * CELL, y, zs[rowEnd + 1] * CELL],
    })
  }
  return boxes
}
