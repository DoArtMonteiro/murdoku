import { describe, expect, it } from 'vitest'
import { boardLayout, elevationOf, makePlanCamera, projectToBox, sheetRect } from '../../src/reference/boards/plan3d/layout'

const BOXES: Array<[number, number]> = [[896, 812], [1440, 900], [358, 358], [328, 328], [390, 600], [1200, 500]]

describe('plan3d layout and camera', () => {
  it('fits the sheet in the box with an integer cell grid at ~72 degrees', () => {
    for (const [w, h] of BOXES) for (const n of [4, 6, 8, 10]) {
      const l = boardLayout(w, h, n)
      expect(Number.isInteger(l.cellW) && Number.isInteger(l.cellH)).toBe(true)
      expect(l.cellH / l.cellW).toBeGreaterThan(0.92)
      expect(l.cellH / l.cellW).toBeLessThan(0.98)
      const s = sheetRect(l, n)
      expect(s.left).toBeGreaterThanOrEqual(-1.01)
      expect(s.top).toBeGreaterThanOrEqual(-1.01)
      expect(s.right).toBeLessThanOrEqual(w + 1)
      expect(s.bottom).toBeLessThanOrEqual(h + 1)
      expect((elevationOf(l) * 180) / Math.PI).toBeGreaterThan(67)
      expect((elevationOf(l) * 180) / Math.PI).toBeLessThan(78)
    }
  })

  it('projects ground cell corners onto the layout rectangles within 1 px (camera matrices, no fitting)', () => {
    let worst = 0
    for (const [w, h] of BOXES) for (const n of [4, 6, 7, 8, 10]) {
      const l = boardLayout(w, h, n)
      const cam = makePlanCamera(l, w, h, n)
      const cells: Array<[number, number]> = [[0, 0], [0, n - 1], [n - 1, 0], [n - 1, n - 1], [2, 3], [Math.floor(n / 2), Math.floor(n / 3)]]
      for (const [r, c] of cells) {
        const corners: Array<[number, number, number, number]> = [
          [c, r, l.x0 + c * l.cellW, l.y0 + r * l.cellH],
          [c + 1, r, l.x0 + (c + 1) * l.cellW, l.y0 + r * l.cellH],
          [c + 1, r + 1, l.x0 + (c + 1) * l.cellW, l.y0 + (r + 1) * l.cellH],
          [c, r + 1, l.x0 + c * l.cellW, l.y0 + (r + 1) * l.cellH],
        ]
        for (const [x, z, px, py] of corners) {
          const [sx, sy] = projectToBox(cam, w, h, x, 0, z)
          worst = Math.max(worst, Math.abs(sx - px), Math.abs(sy - py))
        }
      }
    }
    expect(worst).toBeLessThan(1)
    console.info(`plan3d: worst corner error over ${BOXES.length * 5 * 6 * 4} projected corners = ${worst.toExponential(2)} px`)
  })

  it('raises a point by cell-height-scaled y (a 0.3 wall top moves up by 0.3*cos(el) cells)', () => {
    const [w, h, n] = [896, 812, 6]
    const l = boardLayout(w, h, n)
    const cam = makePlanCamera(l, w, h, n)
    const [, y0] = projectToBox(cam, w, h, 2, 0, 2)
    const [, y1] = projectToBox(cam, w, h, 2, 0.3, 2)
    expect((y0 - y1) / l.cellW).toBeCloseTo(0.3 * Math.cos(elevationOf(l)), 3)
  })
})
