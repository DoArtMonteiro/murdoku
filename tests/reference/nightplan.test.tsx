import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { getAllPuzzles, initCatalog } from '../../src/core/catalog'
import type { FurnitureType, Puzzle } from '../../src/core/types'
import Board, { boardLayout } from '../../src/reference/boards/nightplan'
import { FURNITURE_TYPES } from '../../src/reference/boards/nightplan/furnitureTypes'
import { PALETTE_VALUES, P } from '../../src/reference/boards/nightplan/palette'
import { buildPlan, doorGeom, DOOR_GAP, labelBox } from '../../src/reference/boards/nightplan/plan'

initCatalog()
const puzzles = getAllPuzzles()
const veryEasy1 = puzzles.find(p => p.id === 'very-easy-1') as Puzzle

const ALL_TYPES: FurnitureType[] = [
  'chair', 'sofa', 'bed', 'table', 'box', 'rug', 'plant', 'shrub', 'lamp', 'counter', 'tv', 'bathtub',
  'bookshelf', 'stove', 'fridge', 'clock', 'desk', 'toilet', 'shower',
]

function floorsOf(p: Puzzle) { return Array.from({ length: p.floors ?? 1 }, (_, i) => i) }

describe('nightplan boardLayout (F-spec §3, §10)', () => {
  it.each([[812, 116], [358, 51], [328, 46]])('box %i gives u=%i', (box, u) => {
    const l = boardLayout(box, box, 6)
    expect(l.cellW).toBe(u)
    expect(l.cellH).toBe(u)
    // 0.6u numeral margin top and left, and the grid fits the sheet
    expect(Math.abs(l.x0 - (box - 7 * u) / 2 - 0.6 * u)).toBeLessThanOrEqual(1)
    expect(l.x0 + 6 * u).toBeLessThanOrEqual(box)
    expect(l.x0).toBeGreaterThanOrEqual(22)
  })
  it('scales 7..10 and centres the sheet in a wide box', () => {
    for (const n of [7, 8, 9, 10]) {
      const l = boardLayout(900, 600, n)
      expect(l.cellW).toBe(Math.floor(600 / (n + 1)))
      expect(l.x0).toBeGreaterThan(l.y0)
    }
  })
})

describe('nightplan plan derivation', () => {
  it('very-easy-1: five doors incl. one front door, four windows, five labels', () => {
    const plan = buildPlan(veryEasy1, 0, 116)
    const inner = plan.doors.filter(d => !d.front)
    expect(inner).toHaveLength(4)
    expect(plan.doors.filter(d => d.front)).toHaveLength(1)
    // each non-hall room is joined to the hallway
    const names = new Map(plan.rooms.map(r => [r.id, r.name]))
    const joined = inner.map(d => {
      const at = (r: number, c: number) => names.get(plan.roomAt[r][c]!)
      const [a, b] = d.axis === 'h' ? [at(d.line - 1, d.pos), at(d.line, d.pos)] : [at(d.pos, d.line - 1), at(d.pos, d.line)]
      return [a, b].sort().join('|')
    }).sort()
    expect(joined).toEqual(['Bedroom|Hallway', 'Hallway|Kitchen', 'Hallway|Living Room', 'Hallway|Office'])
    // front door: east exterior wall of the hallway at (2,5), swinging outward
    const fd = plan.frontDoor!
    expect(fd).toMatchObject({ axis: 'v', line: 6, pos: 2, swing: 1 })
    expect(plan.windows).toHaveLength(4)
    expect(plan.windows.map(w => names.get(w.room)).sort()).toEqual(['Bedroom', 'Kitchen', 'Living Room', 'Office'])
    expect(plan.labels.map(l => l.text).sort()).toEqual(['BEDROOM', 'HALLWAY', 'KITCHEN', 'LIVING ROOM', 'OFFICE'])
  })

  it('all catalog cases: every room has a door, one front door on the ground floor, openings never collide', () => {
    expect(puzzles.length).toBeGreaterThanOrEqual(60)
    for (const p of puzzles) for (const floor of floorsOf(p)) {
      const plan = buildPlan(p, floor, 60)
      const interior = plan.rooms.filter(r => !r.exterior)
      const hasDoor = new Set<string>()
      const edgeKey = (d: { axis: string; line: number; pos: number }) => `${d.axis}${d.line}.${d.pos}`
      const kinds = new Map(plan.edges.map(e => [edgeKey(e), e]))
      const used = new Set<string>()
      for (const d of plan.doors) {
        const e = kinds.get(edgeKey(d))!
        expect(e, `${p.id} door edge exists`).toBeTruthy()
        expect(['int', 'ext', 'extx']).toContain(e.kind)
        expect(used.has(edgeKey(d)), `${p.id} one door per edge`).toBe(false)
        used.add(edgeKey(d))
        for (const c of [e.m, e.p]) if (c) hasDoor.add(plan.roomAt[c[0]][c[1]]!)
        const g = doorGeom(d)
        expect(Math.abs(g.gap[1] - g.gap[0] - DOOR_GAP)).toBeLessThan(1e-9)
      }
      if (interior.length > 1) for (const r of interior) expect(hasDoor.has(r.id), `${p.id} f${floor} ${r.name} has a door`).toBe(true)
      expect(plan.doors.filter(d => d.front)).toHaveLength(floor === 0 && interior.length ? 1 : 0)
      for (const w of plan.windows) {
        expect(used.has(edgeKey(w)), `${p.id} window/door collision`).toBe(false)
        expect(['ext', 'extx']).toContain(kinds.get(edgeKey(w))!.kind)
      }
      for (const r of plan.rooms) expect(plan.labels.some(l => l.roomId === r.id)).toBe(true)
    }
  })

  it('no door swing area intersects furniture (pocket door when nowhere is clear); every room keeps a door', () => {
    let pockets = 0
    for (const p of puzzles) for (const floor of floorsOf(p)) {
      const plan = buildPlan(p, floor, 60)
      const solid = new Set<string>()
      for (const f of plan.furniture) {
        if (f.type === 'rug') continue
        for (let dr = 0; dr < (f.h ?? 1); dr++) for (let dc = 0; dc < (f.w ?? 1); dc++) solid.add(`${f.row + dr},${f.col + dc}`)
      }
      for (const d of plan.doors) {
        if (d.pocket) { pockets++; continue }
        // the leaf sweeps a 0.6u quarter circle inside the cell on its swing side
        const [r, c] = d.axis === 'h'
          ? [d.swing === -1 ? d.line - 1 : d.line, d.pos]
          : [d.pos, d.swing === -1 ? d.line - 1 : d.line]
        expect(solid.has(`${r},${c}`), `${p.id} f${floor} door swing cell ${r},${c} holds furniture`).toBe(false)
      }
    }
    // pocket doors are a last resort, not the norm
    expect(pockets).toBeLessThan(15)
  })

  it('room labels sit on the poché, never under a token (every cell holds a 0.84u token)', () => {
    let floorLabels = 0
    for (const p of puzzles) for (const floor of floorsOf(p)) for (const cellPx of [44, 115]) {
      const plan = buildPlan(p, floor, cellPx)
      for (const l of plan.labels) {
        if (l.mode === 'floor') { floorLabels++; continue }
        const [x0, y0, x1, y1] = labelBox(l)
        for (let r = 0; r < plan.n; r++) for (let c = 0; c < plan.n; c++) {
          const hit = x1 > c + 0.08 && x0 < c + 0.92 && y1 > r + 0.08 && y0 < r + 0.92
          expect(hit, `${p.id} f${floor} u${cellPx}: ${l.text} under a token at ${r},${c}`).toBe(false)
        }
        // set in paper on espresso: font >= 10 px at u=44 and cap height inside the wall
        expect(l.fs).toBeGreaterThanOrEqual(cellPx >= 60 ? 10 : 9)
        expect(l.capH * cellPx).toBeLessThan(0.18 * cellPx)
      }
    }
    expect(floorLabels, 'every room name sits on a wall or a lot line').toBe(0)
  })

  it('no two room labels intersect and every room keeps one (u=44 and u=115, all storeys)', () => {
    for (const p of puzzles) for (const floor of floorsOf(p)) for (const cellPx of [44, 115]) {
      const plan = buildPlan(p, floor, cellPx)
      expect(plan.labels.length, `${p.id} f${floor}`).toBe(plan.rooms.length)
      const boxes = plan.labels.map(l => ({ l, b: labelBox(l) }))
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i].b, b = boxes[j].b
        const hit = a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]
        expect(hit, `${p.id} f${floor} u${cellPx}: ${boxes[i].l.text} / ${boxes[j].l.text}`).toBe(false)
      }
      for (const { l } of boxes) expect(l.fs, `${p.id} ${l.text}`).toBeGreaterThanOrEqual(8)
    }
  })

  it('is deterministic', () => {
    for (const p of puzzles.slice(0, 12)) {
      expect(JSON.stringify(buildPlan(p, 0, 80))).toBe(JSON.stringify(buildPlan(p, 0, 80)))
    }
  })
})

describe('nightplan render', () => {
  const render = (p: Puzzle, floor = 0, size = 812) => {
    const layout = boardLayout(size, size, p.size)
    return renderToStaticMarkup(<Board puzzle={p} floor={floor} width={size} height={size} layout={layout} theme="dark" />)
  }

  it('is aria-hidden, pointer-free and renders identically twice', () => {
    const a = render(veryEasy1)
    expect(a).toContain('aria-hidden="true"')
    expect(a).not.toMatch(/onClick|href=|<image|<img|url\(http/)
    expect(render(veryEasy1)).toBe(a)
  })

  it('covers every FurnitureType', () => {
    expect([...FURNITURE_TYPES].sort()).toEqual([...ALL_TYPES].sort())
    const fake = { ...veryEasy1, furniture: ALL_TYPES.map((type, i) => ({ type, row: Math.floor(i / 6), col: i % 6, w: 1, h: 1 })) } as Puzzle
    const html = render(fake)
    for (const t of ALL_TYPES) expect(html).toContain(`data-furniture="${t}"`)
  })

  it('uses only the twelve palette colours (plus the vignette graphite)', () => {
    const allowed = new Set([...PALETTE_VALUES, '#111511', 'none', 'url'].map(s => s.toLowerCase()))
    for (const id of ['very-easy-1', 'very-easy-2', 'easy-3', 'medium-10', 'hard-1']) {
      const p = puzzles.find(x => x.id === id)!
      for (const floor of floorsOf(p)) {
        const html = render(p, floor)
        const colours = [...html.matchAll(/(?:fill|stroke|stop-color|stopColor)(?:="|:\s*)(#[0-9a-fA-F]{3,8}|[a-z]+)/g)].map(m => m[1].toLowerCase())
        for (const c of colours) expect(allowed.has(c), `${id}: colour ${c}`).toBe(true)
      }
    }
    expect(PALETTE_VALUES).toHaveLength(12)
    expect(P.wall).toBe('#2A1D16')
  })
})
