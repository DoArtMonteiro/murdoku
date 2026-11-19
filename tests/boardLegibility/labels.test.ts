import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { BoardLabels, boardLayout } from '../../src/reference/boards/illustrated'
import { LABEL_MIN_FS, labelBoxOf, labelPlateOf, placeLabels, variants } from '../../src/reference/boards/illustrated/labels'
import { evidenceKeepClear } from '../../src/reference/boards/illustrated/keepClear'
import { illustratedPlan } from '../../src/reference/boards/illustrated/plan'
import { ALL_CASES, SIZES, floorsOf } from './cases'

// Room names sit INSIDE their room. Definitions used below, all on the painted plate (text plus 0.03 cell each side):
//  - inside its room: every cell the plate overlaps belongs to the labelled room, and the plate is inside the grid;
//  - clear of a cell centre: the plate stays at least 1.5 px from the centre point of every cell;
//  - apart: two plates are at least 6 px from each other.
const MIN_CENTRE_PX = 1.5
const MIN_APART_PX = 6

describe('room-name labels, every floor of every case, cell sizes 30 to 92', () => {
  it('are horizontal, at least 11 px, inside their own room, clear of every cell centre and of each other', () => {
    let labels = 0, full = 0
    let minCentre = 99, minApart = 99, maxToken = 0
    const bad: string[] = []
    for (const p of ALL_CASES) for (const floor of floorsOf(p)) for (const u of SIZES) {
      const plan = illustratedPlan(p, floor, u)
      const ls = placeLabels(plan, u, evidenceKeepClear(p.id))
      const at = `${p.id} f${floor} @${u}`
      expect(ls.length, at).toBe(plan.rooms.length)
      expect(new Set(ls.map(l => l.roomId)).size, at).toBe(plan.rooms.length)
      const tok = u < 60 ? 0.84 : 0.78
      const lo = (1 - tok) / 2, hi = 1 - lo
      const plates = ls.map(labelPlateOf)
      ls.forEach((l, i) => {
        labels++
        const room = plan.rooms.find(r => r.id === l.roomId)!
        if (l.text === variants(room.name)[0]) full++
        if (l.rot !== 0) bad.push(`${at} ${l.text}: rotated`)
        if (l.fs < LABEL_MIN_FS || l.fs < 11) bad.push(`${at} ${l.text}: ${l.fs}px`)
        if (l.text.length < 3) bad.push(`${at} ${l.text}: shorter than 3 letters`)
        if (l.halo || l.mode !== 'floor') bad.push(`${at} ${l.text}: mode ${l.mode}`)
        const [x0, y0, x1, y1] = plates[i]
        const [tx0, ty0, tx1, ty1] = labelBoxOf(l)
        if (!(tx0 >= x0 && tx1 <= x1 && ty0 >= y0 && ty1 <= y1)) bad.push(`${at} ${l.text}: text outside its plate`)
        if (x0 < 0 || y0 < 0 || x1 > plan.n || y1 > plan.n) bad.push(`${at} ${l.text}: leaves the grid`)
        // inside its own room, cell by cell (rooms can be L-shaped)
        for (let r = Math.floor(y0); r <= Math.floor(y1 - 1e-9); r++) for (let c = Math.floor(x0); c <= Math.floor(x1 - 1e-9); c++) {
          if (plan.roomAt[r]?.[c] !== l.roomId) bad.push(`${at} ${l.text}: covers ${r},${c} of another room`)
        }
        for (let r = 0; r < plan.n; r++) for (let c = 0; c < plan.n; c++) {
          // distance from the cell centre to the plate, px (0 when the plate covers it)
          const dx = Math.max(x0 - (c + 0.5), 0, c + 0.5 - x1), dy = Math.max(y0 - (r + 0.5), 0, r + 0.5 - y1)
          const d = Math.hypot(dx, dy) * u
          if (x0 < c + 1 && x1 > c && y0 < r + 1 && y1 > r) minCentre = Math.min(minCentre, d)
          if (d < MIN_CENTRE_PX - 0.01 && x0 < c + 1 && x1 > c && y0 < r + 1 && y1 > r) bad.push(`${at} ${l.text}: ${d.toFixed(2)} px from the centre of ${r},${c}`)
          // the share of the token box under the plate (labels paint above tokens)
          const ox = Math.max(0, Math.min(x1, c + hi) - Math.max(x0, c + lo)), oy = Math.max(0, Math.min(y1, r + hi) - Math.max(y0, r + lo))
          maxToken = Math.max(maxToken, (ox * oy) / (tok * tok))
        }
      })
      for (let i = 0; i < plates.length; i++) for (let j = i + 1; j < plates.length; j++) {
        const a = plates[i], b = plates[j]
        const gx = Math.max(a[0] - b[2], b[0] - a[2]), gy = Math.max(a[1] - b[3], b[1] - a[3])
        const apart = Math.max(gx, gy) * u
        minApart = Math.min(minApart, apart)
        if (apart < MIN_APART_PX - 0.01) bad.push(`${at} ${ls[i].text}/${ls[j].text}: ${apart.toFixed(1)} px apart`)
      }
    }
    expect(bad.slice(0, 30)).toEqual([])
    expect(labels).toBeGreaterThan(20000)
    expect(minCentre).toBeGreaterThanOrEqual(MIN_CENTRE_PX - 0.01)
    expect(minApart).toBeGreaterThanOrEqual(MIN_APART_PX - 0.01)
    // the full name is the rule; an abbreviation is the exception (a two-cell room)
    expect(full / labels).toBeGreaterThan(0.98)
    // the price of a plate above the tokens: the top of a token box standing in the strip under it (measured worst case)
    expect(maxToken).toBeLessThanOrEqual(0.4)
  })

  it('stay off the cell a hinged door swings into', () => {
    let hits = 0
    for (const p of ALL_CASES) for (const floor of floorsOf(p)) for (const u of [30, 37, 44, 60, 92]) {
      const plan = illustratedPlan(p, floor, u)
      const plates = placeLabels(plan, u, evidenceKeepClear(p.id)).map(labelPlateOf)
      for (const d of plan.doors) {
        if (d.pocket) continue
        const [r, c] = d.axis === 'h' ? [d.swing === -1 ? d.line - 1 : d.line, d.pos] : [d.pos, d.swing === -1 ? d.line - 1 : d.line]
        for (const [x0, y0, x1, y1] of plates) if (x0 < c + 1 && x1 > c && y0 < r + 1 && y1 > r) hits++
      }
    }
    expect(hits).toBe(0)
  })

  it('keep clear of the evidence markers the reference shell lays over the plan (very-easy-1 carries five)', () => {
    const p = ALL_CASES.find(x => x.id === 'very-easy-1')!
    const keep = evidenceKeepClear(p.id)
    expect(keep.length).toBe(5)
    for (const u of SIZES) {
      const plates = placeLabels(illustratedPlan(p, 0, u), u, keep).map(labelPlateOf)
      for (const [x0, y0, x1, y1] of plates) for (const k of keep) expect(x0 < k[2] && x1 > k[0] && y0 < k[3] && y1 > k[1], `@${u}`).toBe(false)
    }
  })

  it('are drawn horizontally, with a dark plate and the full name as the title (BoardLabels)', () => {
    for (const id of ['depth-d-189', 'pt-08', 'hard-2']) {
      const p = ALL_CASES.find(x => x.id === id)!
      for (const floor of floorsOf(p)) {
        const layout = boardLayout(390, 390, p.size)
        const html = renderToStaticMarkup(createElement(BoardLabels, { puzzle: p, floor, width: 390, height: 390, layout, theme: 'dark' }))
        expect(html).not.toContain('rotate(')
        expect(html).toContain('aria-hidden="true"')
        const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
        const groups = [...doc.querySelectorAll('[data-label]')]
        expect(groups.length).toBe(illustratedPlan(p, floor, layout.cellW).rooms.length)
        for (const g of groups) {
          expect(+g.getAttribute('data-label-fs')!).toBeGreaterThanOrEqual(11)
          // the painted type size in px: font-size is in cell units inside the scaled group
          const fsPx = +g.querySelector('text')!.getAttribute('font-size')! * layout.cellW
          expect(fsPx).toBeGreaterThanOrEqual(10.95)
        }
      }
    }
  })
})
