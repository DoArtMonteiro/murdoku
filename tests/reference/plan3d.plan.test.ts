import { beforeAll, describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { buildAuthoredPuzzle } from '../../src/core/authored'
import { AUTHORED_CASES } from '../../src/data/cases'
import { getAllPuzzles, getPuzzleById, initCatalog } from '../../src/core/catalog'
import type { Puzzle } from '../../src/core/types'
import Board, { boardLayout } from '../../src/reference/boards/plan3d'
import { FURNITURE_HEIGHT_U, WALL_HEIGHT_U, WALL_T_INNER, WALL_T_OUTER, buildPlan, type Plan, type PlanRect } from '../../src/reference/boards/plan3d/plan'
import { elevationOf, makePlanCamera } from '../../src/reference/boards/plan3d/layout'

const veryEasy1 = () => buildAuthoredPuzzle(AUTHORED_CASES['very-easy-1'], 'Case No. I')
beforeAll(() => { initCatalog() }, 120000)

const overlap = (a: PlanRect, b: PlanRect) =>
  Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0))

/** Walls on grid lines only: every wall piece is centred on an integer line and separates two different regions. */
function checkWalls(plan: Plan) {
  const n = plan.n
  for (const p of plan.pieces.filter(p => p.kind === 'wall')) {
    const w = p.x1 - p.x0, d = p.z1 - p.z0
    const isT = (v: number) => [WALL_T_INNER, WALL_T_OUTER].some(t => Math.abs(t - v) < 1e-9)
    const onLine = (a: number, b: number) => Math.abs((a + b) / 2 - Math.round((a + b) / 2)) < 1e-9
    // a stub shorter than the wall is thick may be ambiguous: accept either reading
    const asH = isT(d) && onLine(p.z0, p.z1), asV = isT(w) && onLine(p.x0, p.x1)
    expect(asH || asV).toBe(true)
    const horizontal = asH && (!asV || w >= d)
    const line = horizontal ? (p.z0 + p.z1) / 2 : (p.x0 + p.x1) / 2
    expect(p.h).toBeLessThanOrEqual(WALL_HEIGHT_U + 0.001)
    // sample the middle of the piece: the two cells it separates belong to different regions
    const mid = horizontal ? (p.x0 + p.x1) / 2 : (p.z0 + p.z1) / 2
    const L = Math.round(line), m = Math.min(n - 1, Math.max(0, Math.floor(mid)))
    const a = horizontal ? plan.region[L - 1]?.[m] ?? 'OUT' : plan.region[m]?.[L - 1] ?? 'OUT'
    const b = horizontal ? plan.region[L]?.[m] ?? 'OUT' : plan.region[m]?.[L] ?? 'OUT'
    expect(a).not.toBe(b)
  }
}

/** Every room that has a wall around it is reachable from every other through doors (outside included). */
function checkConnected(plan: Plan) {
  const n = plan.n
  const solid = (id: string) => id !== 'OUT' && id !== 'VOID'
  const nodes = new Set<string>()
  const at = (r: number, c: number) => (r < 0 || c < 0 || r >= n || c >= n ? 'OUT' : plan.region[r][c])
  for (let r = 0; r <= n; r++) for (let c = 0; c <= n; c++) {
    for (const [a, b] of [[at(r - 1, c), at(r, c)], [at(r, c - 1), at(r, c)]]) {
      if (a !== b && (solid(a) || solid(b)) && a !== 'VOID' && b !== 'VOID') { nodes.add(a); nodes.add(b) }
    }
  }
  const adj = new Map<string, string[]>()
  for (const d of plan.doors) { adj.set(d.a, [...(adj.get(d.a) ?? []), d.b]); adj.set(d.b, [...(adj.get(d.b) ?? []), d.a]) }
  const seen = new Set<string>(), stack = [[...nodes][0]]
  while (stack.length) { const x = stack.pop()!; if (seen.has(x)) continue; seen.add(x); (adj.get(x) ?? []).forEach(y => stack.push(y)) }
  for (const id of nodes) expect(seen.has(id), `${plan.puzzleId}#${plan.floor}: ${id} unreachable`).toBe(true)
}

describe('plan3d plan: very-easy-1 (F-spec 4)', () => {
  const plan = buildPlan(veryEasy1(), 0)

  it('encloses five rooms with five doors (4 to the hall + the front door) and four windows', () => {
    expect(plan.problems).toEqual([])
    expect(plan.doors.length).toBe(5)
    expect(plan.doors.filter(d => d.kind === 'entry').length).toBe(1)
    expect(plan.windows.length).toBe(4)
    expect(plan.labels.map(l => l.text).sort()).toEqual(['BEDROOM', 'HALLWAY', 'KITCHEN', 'LIVING ROOM', 'OFFICE'])
    checkWalls(plan)
    checkConnected(plan)
  })

  it('is 0.6 gaps, never a frame: every door gap is clear of furniture (swing zone)', () => {
    const obstacles = plan.objects.filter(o => o.kind !== 'rug').map(o => o.rect)
    for (const d of plan.doors) {
      expect(d.width).toBeCloseTo(0.6, 5)
      const lo = Math.min(d.line, d.line + d.swing * d.width), hi = Math.max(d.line, d.line + d.swing * d.width)
      const zone: PlanRect = d.axis === 'h'
        ? { x0: d.t - d.width / 2, x1: d.t + d.width / 2, z0: lo, z1: hi }
        : { x0: lo, x1: hi, z0: d.t - d.width / 2, z1: d.t + d.width / 2 }
      for (const o of obstacles) expect(overlap(zone, o)).toBeLessThan(0.02)
    }
  })

  it('caps heights: walls 0.30u, furniture 0.25u; nothing taller', () => {
    expect(Math.max(...plan.pieces.map(p => p.h))).toBeLessThanOrEqual(WALL_HEIGHT_U + 0.001)
    expect(Math.max(...plan.objects.map(o => o.top))).toBeLessThanOrEqual(FURNITURE_HEIGHT_U + 1e-9)
  })

  it('tints rooms by use (F-spec 1.1)', () => {
    expect(plan.tint[0][0]).toBe('rose')
    expect(plan.tint[0][4]).toBe('olive')
    expect(plan.tint[2][2]).toBe('stone')
    expect(plan.tint[4][1]).toBe('wood')
    expect(plan.tint[4][4]).toBe('tile')
  })
})

describe('plan3d plan: invariants over the catalogue', () => {
  it('keeps walls on grid lines, rooms connected and every cell visible from its centre (AABB sight test)', () => {
    let cases = 0, hiddenTotal = 0
    for (const puzzle of getAllPuzzles() as Puzzle[]) {
      for (let floor = 0; floor < (puzzle.floors ?? 1); floor++) {
        const plan = buildPlan(puzzle, floor)
        cases++
        checkWalls(plan)
        checkConnected(plan)
        expect(Math.max(0, ...plan.objects.map(o => o.top))).toBeLessThanOrEqual(FURNITURE_HEIGHT_U + 1e-9)
        // sight line from each cell centre toward the camera over boxes
        const l = boardLayout(896, 812, plan.n)
        const el = elevationOf(l)
        void makePlanCamera
        const dz = Math.cos(el) / Math.sin(el)   // ground distance travelled per unit of height
        const boxes: Array<{ r: PlanRect; h: number; id?: string }> = [
          ...plan.pieces.filter(p => p.kind === 'wall').map(p => ({ r: p, h: p.h })),
          ...plan.objects.filter(o => o.kind !== 'rug').map(o => ({ r: o.rect, h: o.top, id: o.id })),
        ]
        for (let r = 0; r < plan.n; r++) for (let c = 0; c < plan.n; c++) {
          if (plan.region[r][c] === 'VOID') continue
          const px = c + 0.5, pz = r + 0.5
          const own = (b: { r: PlanRect }) => b.r.x1 > c + 0.01 && b.r.x0 < c + 0.99 && b.r.z1 > r + 0.01 && b.r.z0 < r + 0.99
          let hidden = false
          for (const b of boxes) {
            if (own(b)) continue
            // ray: z increases by dz per unit height; it is inside the box column when z in [z0, z1] and x in range
            if (px < b.r.x0 || px > b.r.x1) continue
            // height of the ray when it reaches the box's back face / leaves its front face
            const hAtBack = Math.max(0, (b.r.z0 - pz) / dz)
            if (b.r.z1 > pz && hAtBack < b.h) hidden = true
          }
          if (hidden) hiddenTotal++
        }
      }
    }
    expect(cases).toBeGreaterThan(60)
    console.info(`plan3d: ${cases} storeys, ${hiddenTotal} cells hidden from the centre by AABB sight test`)
    expect(hiddenTotal).toBe(0)
  })

  it('derives a plan from puzzle.furniture when no SceneSpec exists, and from the spec when one does', () => {
    const p = getPuzzleById('very-easy-2')!
    expect(buildPlan(p, 0).authored).toBe(true)
    const generated = getAllPuzzles().find(x => !buildPlan(x, 0).authored)
    if (generated) expect(buildPlan(generated, 0).objects.length).toBeGreaterThan(0)
  })
})

describe('plan3d Board without WebGL', () => {
  it('renders an empty aria-hidden box (jsdom has no WebGL)', async () => {
    const puzzle = veryEasy1()
    const layout = boardLayout(400, 360, puzzle.size)
    const { container, findByText } = render(createElement(Board, { puzzle, floor: 0, width: 400, height: 360, layout, theme: 'dark' }))
    void findByText
    await new Promise(r => setTimeout(r, 50))
    const box = container.firstElementChild as HTMLElement
    expect(box.getAttribute('aria-hidden')).toBe('true')
    expect(box.style.width).toBe('400px')
  })
})
