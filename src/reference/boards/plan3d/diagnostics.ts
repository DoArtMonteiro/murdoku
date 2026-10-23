// ============================================================================
// plan3d DIAGNOSTICS — a render-ID pass. The same scene is drawn with flat ID
// colours (floor cell, wall, object), read back, and compared per cell against
// the layout rectangles. Used by the harness and the report; never by the board.
// ============================================================================

import * as THREE from 'three'
import type { BoardLayout } from '../../contract'
import { makePlanCamera } from './layout'
import type { Plan } from './plan'
import { buildScene, type Models } from './scene'

export interface CellReport {
  row: number
  col: number
  /** What the centre pixel of the cell rectangle shows. */
  centre: string
  /** Centre pixel is a wall or an object whose footprint is not on this cell. */
  hidden: boolean
  /** Fraction of the cell rectangle showing its own floor. */
  floorVisible: number
  /** Fraction of the cell rectangle covered by a wall or by an object not on this cell. */
  foreign: number
}

export interface OcclusionReport {
  cells: CellReport[]
  hiddenCells: number
  maxForeign: number
  meanFloorVisible: number
  /** Floor ID edges versus the layout grid: max |offset| in px of any cell corner. */
  maxEdgeError: number
}

export function measureOcclusion(plan: Plan, models: Models, layout: BoardLayout, width: number, height: number): OcclusionReport {
  const canvas = document.createElement('canvas')
  const gl = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true })
  gl.setPixelRatio(1)
  gl.setSize(width, height, false)
  gl.outputColorSpace = THREE.LinearSRGBColorSpace
  gl.toneMapping = THREE.NoToneMapping
  gl.setClearColor(0x000000, 1)
  const built = buildScene(plan, models, layout, 'id')
  const cam = makePlanCamera(layout, width, height, plan.n)
  gl.render(built.scene, cam)
  const px = new Uint8Array(width * height * 4)
  const ctx = gl.getContext()
  ctx.readPixels(0, 0, width, height, ctx.RGBA, ctx.UNSIGNED_BYTE, px)
  const n = plan.n
  const idAt = (x: number, y: number): number => {
    const o = ((height - 1 - y) * width + x) * 4
    return (px[o] << 16) | (px[o + 1] << 8) | px[o + 2]
  }
  const label = (id: number): string => {
    if (id === 0) return 'paper'
    if (id <= n * n) return `floor:${Math.floor((id - 1) / n)},${(id - 1) % n}`
    if (id === n * n + 1) return 'wall'
    return `obj:${plan.objects[id - n * n - 2]?.id ?? id}`
  }
  const { x0, y0, cellW, cellH } = layout
  const cells: CellReport[] = []
  let maxEdgeError = 0
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const own = r * n + c + 1
    const left = Math.round(x0 + c * cellW), right = Math.round(x0 + (c + 1) * cellW)
    const top = Math.round(y0 + r * cellH), bottom = Math.round(y0 + (r + 1) * cellH)
    let ownPx = 0, foreignPx = 0, total = 0
    const overlapsCell = (idx: number) => {
      const o = plan.objects[idx]
      if (!o) return false
      return o.rect.x1 > c + 0.01 && o.rect.x0 < c + 0.99 && o.rect.z1 > r + 0.01 && o.rect.z0 < r + 0.99
    }
    for (let y = top; y < bottom; y++) for (let x = left; x < right; x++) {
      total++
      const id = idAt(x, y)
      if (id === own) ownPx++
      else if (id === n * n + 1) foreignPx++
      else if (id > n * n + 1 && !overlapsCell(id - n * n - 2)) foreignPx++
    }
    const cx = Math.round(x0 + (c + 0.5) * cellW), cy = Math.round(y0 + (r + 0.5) * cellH)
    const cid = idAt(cx, cy)
    const hidden = cid === n * n + 1 || (cid > n * n + 1 && !overlapsCell(cid - n * n - 2))
    cells.push({ row: r, col: c, centre: label(cid), hidden, floorVisible: ownPx / total, foreign: foreignPx / total })
    // edge check: the floor ID must switch exactly at the layout's cell boundary (top-left corner pixel)
    if (r === 0 || c === 0) continue
  }
  // horizontal/vertical edge placement: scan one row/column of cells that are not walled off
  for (let c = 1; c < n; c++) {
    // find, along the middle of row r, where floor id changes from col c-1 to col c
    for (let r = 0; r < n; r++) {
      const y = Math.round(y0 + (r + 0.5) * cellH)
      let edge = -1
      for (let x = Math.round(x0 + (c - 1) * cellW + 4); x < Math.round(x0 + (c + 1) * cellW - 4); x++) {
        if (idAt(x, y) === r * n + c - 1 + 1 && idAt(x + 1, y) === r * n + c + 1) { edge = x + 1; break }
      }
      if (edge >= 0) maxEdgeError = Math.max(maxEdgeError, Math.abs(edge - (x0 + c * cellW)))
    }
  }
  for (let r = 1; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = Math.round(x0 + (c + 0.5) * cellW)
      let edge = -1
      for (let y = Math.round(y0 + (r - 1) * cellH + 4); y < Math.round(y0 + (r + 1) * cellH - 4); y++) {
        if (idAt(x, y) === (r - 1) * n + c + 1 && idAt(x, y + 1) === r * n + c + 1) { edge = y + 1; break }
      }
      if (edge >= 0) maxEdgeError = Math.max(maxEdgeError, Math.abs(edge - (y0 + r * cellH)))
    }
  }
  built.dispose()
  gl.dispose()
  gl.forceContextLoss()
  const hiddenCells = cells.filter(c => c.hidden).length
  return {
    cells, hiddenCells,
    maxForeign: Math.max(...cells.map(c => c.foreign)),
    meanFloorVisible: cells.reduce((a, c) => a + c.floorVisible, 0) / cells.length,
    maxEdgeError,
  }
}
