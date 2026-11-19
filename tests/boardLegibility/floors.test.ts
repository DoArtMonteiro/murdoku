import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import Board, { boardLayout } from '../../src/reference/boards/illustrated'
import { L_MAX, L_MIN, L_STEP_MIN, adjacency, familyOf, litLuminance, lstar, resolveFloors } from '../../src/reference/boards/illustrated/legibility'
import { illustratedPlan } from '../../src/reference/boards/illustrated/plan'
import { styleFor } from '../../src/reference/boards/illustrated/styles'
import { ALL_CASES, floorsOf } from './cases'

// The numbers this pass is held to (see legibility.ts). Luminance is WCAG relative luminance of the lit floor
// (night ambient on, averaged over the floor's own colours); contrast is the WCAG ratio between two lit floors.
const MIN_LUMINANCE = 0.0975      // L* 37.5: hard-2's clearest floor measured 0.077 before the pass; nothing is darker than 0.0975 now
const MAX_LUMINANCE = 0.45        // keeps a cream token (0.78) at 1.6:1 or better and lets the amber lens still read as a tint
const MIN_ADJACENT_CONTRAST = 1.38 // WCAG ratio between rooms that share a wall (about 9.5 L*)

describe('floors read as distinct regions, on every floor of every case', () => {
  it('no floor is too dark, none washes out, and adjacent rooms differ by value and by material', () => {
    let rooms = 0, pairs = 0, sameFamily = 0
    let minY = 9, maxY = 0, minContrast = 9, minDL = 99
    const bad: string[] = []
    for (const p of ALL_CASES) {
      const st = styleFor(p)
      for (const floor of floorsOf(p)) {
        const plan = illustratedPlan(p, floor, 40)
        const floors = resolveFloors(plan, st)
        expect(floors.size, `${p.id} f${floor}`).toBe(plan.rooms.length)
        for (const room of plan.rooms) {
          const fl = floors.get(room.id)!
          const y = litLuminance(fl.spec, st.nightFill)
          rooms++; minY = Math.min(minY, y); maxY = Math.max(maxY, y)
          if (y < MIN_LUMINANCE) bad.push(`${p.id} f${floor} ${room.name}: luminance ${y.toFixed(4)}`)
          if (y > MAX_LUMINANCE) bad.push(`${p.id} f${floor} ${room.name}: luminance ${y.toFixed(4)} washes out`)
          // the reported L is the one painted
          expect(lstar(y)).toBeCloseTo(fl.L, 6)
          expect(L_MIN).toBeLessThan(L_MAX)
        }
        for (const [a, set] of adjacency(plan)) for (const b of set) {
          if (a >= b) continue
          const A = floors.get(a)!, B = floors.get(b)!
          const ya = litLuminance(A.spec, st.nightFill), yb = litLuminance(B.spec, st.nightFill)
          const c = (Math.max(ya, yb) + 0.05) / (Math.min(ya, yb) + 0.05)
          const dl = Math.abs(A.L - B.L)
          pairs++; minContrast = Math.min(minContrast, c); minDL = Math.min(minDL, dl)
          const names = `${plan.rooms.find(r => r.id === a)!.name}/${plan.rooms.find(r => r.id === b)!.name}`
          if (c < MIN_ADJACENT_CONTRAST) bad.push(`${p.id} f${floor} ${names}: contrast ${c.toFixed(3)}`)
          if (dl < L_STEP_MIN) bad.push(`${p.id} f${floor} ${names}: dL* ${dl.toFixed(2)}`)
          if (A.spec.mat === B.spec.mat) bad.push(`${p.id} f${floor} ${names}: both ${A.spec.mat}`)
          if (familyOf(A.spec.mat) === familyOf(B.spec.mat)) sameFamily++
        }
      }
    }
    expect(bad.slice(0, 30)).toEqual([])
    expect(rooms).toBeGreaterThan(400)
    expect(pairs).toBeGreaterThan(400)
    // the measured numbers the report quotes
    expect(minY).toBeGreaterThanOrEqual(MIN_LUMINANCE)
    expect(maxY).toBeLessThanOrEqual(MAX_LUMINANCE)
    expect(minContrast).toBeGreaterThanOrEqual(MIN_ADJACENT_CONTRAST)
    expect(minDL).toBeGreaterThanOrEqual(L_STEP_MIN)
    // material families differ too wherever the kit has a family left (a few pairs run out in a four-room plan)
    expect(sameFamily / pairs).toBeLessThan(0.05)
  })

  it('does not depend on the cell size, and is deterministic', () => {
    for (const p of ALL_CASES) for (const floor of floorsOf(p)) {
      const st = styleFor(p)
      const at = (u: number) => JSON.stringify([...resolveFloors(illustratedPlan(p, floor, u), st)])
      expect(at(30), `${p.id} f${floor}`).toBe(at(92))
      expect(at(41)).toBe(at(41))
    }
  })

  it('keeps the floors that already read well: hard-2 keeps its terracotta dining room and its blue check kitchen', () => {
    const hard2 = ALL_CASES.find(p => p.id === 'hard-2')!
    const plan = illustratedPlan(hard2, 0, 40)
    const floors = resolveFloors(plan, styleFor(hard2))
    const by = (name: string) => floors.get(plan.rooms.find(r => r.name === name)!.id)!.spec
    expect(by('Dining Room').mat).toBe('quarry')
    expect(by('Kitchen').mat).toBe('hydraulic')
  })

  it('the board paints exactly the floors the pass resolved', () => {
    for (const id of ['depth-d-189', 'pt-08', 'hard-2', 'very-easy-1']) {
      const p = ALL_CASES.find(x => x.id === id)!
      for (const floor of floorsOf(p)) {
        const layout = boardLayout(390, 390, p.size)
        const html = renderToStaticMarkup(createElement(Board, { puzzle: p, floor, width: 390, height: 390, layout, theme: 'dark' }))
        const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')
        const plan = illustratedPlan(p, floor, layout.cellW)
        const floors = resolveFloors(plan, styleFor(p))
        for (const room of plan.rooms) {
          const el = doc.querySelector(`[data-room="${room.name}"]`)!
          expect(el.getAttribute('data-mat'), `${id} f${floor} ${room.name}`).toBe(floors.get(room.id)!.spec.mat)
        }
      }
    }
  })

})
