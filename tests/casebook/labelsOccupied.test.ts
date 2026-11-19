import { describe, expect, it } from 'vitest'
import { labelPlateOf, placeLabels } from '../../src/reference/boards/illustrated/labels'
import { evidenceKeepClear } from '../../src/reference/boards/illustrated/keepClear'
import { illustratedPlan } from '../../src/reference/boards/illustrated/plan'
import { occupiedBoxes, tokenBox } from '../../src/reference/tokenGeometry'
import { ALL_CASES, floorsOf } from '../boardLegibility/cases'

const SIZES = [30, 37, 44, 56, 72, 92]
const hit = (a: number[], b: number[]) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]

// A small seeded generator, so a failure names a reproducible case.
function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32 }
}

/** What a real board holds: about n tokens (a permutation of rows and columns), a ghost and a ring for someone upstairs. */
function randomOccupied(n: number, rand: () => number): Set<string> {
  const cols = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cols[i], cols[j]] = [cols[j], cols[i]] }
  const out = new Set<string>()
  cols.forEach((c, r) => { if (rand() < 0.85) out.add(`${r}:${c}`) })
  for (let k = 0; k < 2; k++) out.add(`${Math.floor(rand() * n)}:${Math.floor(rand() * n)}`)
  return out
}

describe('room-name plates yield to tokens', () => {
  it('no plate drawn at full opacity touches a token, ghost or ring, on every floor of every case', () => {
    const bad: string[] = []
    let plates = 0, faded = 0, moved = 0
    for (const p of ALL_CASES) for (const floor of floorsOf(p)) for (const u of SIZES) {
      const plan = illustratedPlan(p, floor, u)
      const base = placeLabels(plan, u, evidenceKeepClear(p.id))
      for (let k = 0; k < 4; k++) {
        const rand = rng(p.id.length * 7919 + floor * 131 + u * 17 + k)
        const occ = randomOccupied(p.size, rand)
        const boxes = occupiedBoxes(occ, u)
        const ls = placeLabels(plan, u, evidenceKeepClear(p.id), boxes)
        ls.forEach((l, i) => {
          plates++
          const plate = labelPlateOf(l)
          if (l.faded) faded++
          else if (boxes.some(b => hit(plate, b))) bad.push(`${p.id} f${floor} @${u} #${k}: ${l.text} covers a token`)
          if (l.x !== base[i].x || l.cy !== base[i].cy) moved++
        })
      }
    }
    expect(bad.slice(0, 20)).toEqual([])
    // Relocation does the work; fading is the rare fallback.
    expect(moved).toBeGreaterThan(0)
    expect(faded / plates).toBeLessThan(0.05)
  })

  it('fades a plate, and only then, when its room has no clear spot', () => {
    for (const p of ALL_CASES.slice(0, 12)) {
      const u = 37, plan = illustratedPlan(p, 0, u)
      const every = new Set(Array.from({ length: p.size * p.size }, (_, i) => `${Math.floor(i / p.size)}:${i % p.size}`))
      const ls = placeLabels(plan, u, evidenceKeepClear(p.id), occupiedBoxes(every, u))
      expect(ls.every(l => l.faded)).toBe(true)
      expect(placeLabels(plan, u, evidenceKeepClear(p.id), []).every(l => !l.faded)).toBe(true)
    }
  })

  it('is deterministic for a given occupied set and unchanged when nothing is occupied', () => {
    for (const p of ALL_CASES.slice(0, 10)) {
      const u = 37, plan = illustratedPlan(p, 0, u)
      const keep = evidenceKeepClear(p.id)
      const occ = [...randomOccupied(p.size, rng(5))]
      const a = placeLabels(plan, u, keep, occupiedBoxes(occ, u))
      const b = placeLabels(plan, u, keep, occupiedBoxes([...occ].reverse(), u))
      expect(b.map(l => [l.text, l.x, l.cy, l.faded])).toEqual(a.map(l => [l.text, l.x, l.cy, l.faded]))
      expect(placeLabels(plan, u, keep, [])).toEqual(placeLabels(plan, u, keep))
    }
  })

  it('the token box of a square stays inside the square', () => {
    for (const u of [24, 30, 37, 56, 92]) {
      const [x0, y0, x1, y1] = tokenBox(2, 3, u)
      expect(x0).toBeGreaterThanOrEqual(3 - 1e-9); expect(x1).toBeLessThanOrEqual(4 + 1e-9)
      expect(y0).toBeGreaterThanOrEqual(2 - 1e-9); expect(y1).toBeLessThanOrEqual(3 + 1e-9)
    }
  })
})
