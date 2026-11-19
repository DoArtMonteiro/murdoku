import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { fitPlan } from '../../src/casebook/layout'
import Board, { boardLayout } from '../../src/reference/boards/illustrated'
import { compassGeom } from '../../src/reference/boards/illustrated/frame'
import { ALL_CASES } from './cases'

describe('compass rose', () => {
  it('is one decorative aria-hidden mark, with an N, outside the gutter layer', () => {
    const p = ALL_CASES.find(x => x.id === 'depth-d-189')!
    const html = renderToStaticMarkup(createElement(Board, { puzzle: p, floor: 0, width: 390, height: 390, layout: boardLayout(390, 390, p.size), theme: 'dark' }))
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
    const rose = doc.querySelectorAll('[data-compass="north"]')
    expect(rose.length).toBe(1)
    expect(rose[0].closest('[aria-hidden="true"]')).toBeTruthy()
    expect(rose[0].getAttribute('pointer-events')).toBe('none')
    expect(rose[0].textContent).toBe('N')
    // the gutter layer keeps exactly its two feathered shade rects
    expect(doc.querySelector('[data-layer="gutter"]')!.children.length).toBe(2)
    expect(rose[0].closest('[data-layer="gutter"]')).toBeNull()
    // offline-safe and no handlers
    expect(rose[0].outerHTML).not.toMatch(/https?:|href|<image|onClick/)
  })

  it('sits in the corner of the plan window the numeral pills leave free, at every size the slice draws', () => {
    // the shell's numeral boxes (see casebook Plan.tsx): column numeral 20 x 16 at (gx + c u + u/2 - 10, gy - 0.2u - 16),
    // row numeral 22 wide, 16 high at (gx - 0.2u - 22, gy + r u + u/2 - 8)
    for (const [w, h] of [[358, 420], [390, 470], [412, 560], [768, 700], [1280, 800]] as const) for (const n of [6, 7, 8]) {
      const fit = fitPlan(w, h, n, boardLayout)
      const { gx, gy, layout } = fit.geo
      const u = layout.cellW
      const { cx, cy, r } = compassGeom(gx, gy, u)
      const box = [cx - r, cy - r, cx + r, cy + r]
      const at = `${w}x${h} n${n} u${u}`
      // inside the visible window of the plan, and in the corner left of and above the grid
      expect(box[0], at).toBeGreaterThanOrEqual(fit.cropL)
      expect(box[1], at).toBeGreaterThanOrEqual(fit.cropT)
      expect(box[2], at).toBeLessThanOrEqual(gx)
      expect(box[3], at).toBeLessThanOrEqual(gy)
      // big enough to read: 18 px or more across
      expect(r * 2, at).toBeGreaterThanOrEqual(18)
      const hit = (a: number[], b: number[]) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]
      for (let i = 0; i < n; i++) {
        const col = [gx + i * u + u / 2 - 10, Math.max(0, gy - 0.2 * u - 16), gx + i * u + u / 2 + 10, Math.max(0, gy - 0.2 * u - 16) + 16]
        const row = [Math.max(0, gx - 0.2 * u - 22), gy + i * u + u / 2 - 8, Math.max(0, gx - 0.2 * u - 22) + 22, gy + i * u + u / 2 + 8]
        expect(hit(box, col), `${at} column numeral ${i + 1}`).toBe(false)
        expect(hit(box, row), `${at} row numeral ${i + 1}`).toBe(false)
      }
    }
  })
})
