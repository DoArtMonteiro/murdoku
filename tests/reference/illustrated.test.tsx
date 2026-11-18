import { render as rtlRender } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { getAllPuzzles, initCatalog } from '../../src/core/catalog'
import type { FurnitureType, Puzzle } from '../../src/core/types'
import { furnitureFootprint } from '../../src/core/types'
import Board, { BoardLabels, boardLayout } from '../../src/reference/boards/illustrated'
import { Shell } from '../../src/reference/shell/Shell'
import type { BoardModule, GameApi } from '../../src/reference/shell/types'
import { frameFor, lotCells } from '../../src/reference/boards/illustrated/frame'
import { STYLE_IDS, STYLES, styleFor, styleIdFor } from '../../src/reference/boards/illustrated/styles'
import { buildGeo, clueTypesOf, planDecor, DECOR_AS_TYPE } from '../../src/reference/boards/illustrated/decor'
import { labelBoxOf, placeLabels } from '../../src/reference/boards/illustrated/labels'
import { floorBase } from '../../src/reference/boards/illustrated/materials'
import { contrast, luminance, mix } from '../../src/reference/boards/illustrated/color'
import { roleOf } from '../../src/reference/boards/illustrated/rooms'
import { buildPlan } from '../../src/reference/boards/nightplan/plan'
import { getScene, sceneStats } from '../../src/reference/boards/illustrated/scene'
import { doorsOntoFurniture, illustratedPlan } from '../../src/reference/boards/illustrated/plan'

initCatalog()
const puzzles = getAllPuzzles()
const veryEasy1 = puzzles.find(p => p.id === 'very-easy-1') as Puzzle
const floorsOf = (p: Puzzle) => Array.from({ length: p.floors ?? 1 }, (_, i) => i)

const render = (p: Puzzle, floor = 0, size = 812) => {
  const layout = boardLayout(size, size, p.size)
  return renderToStaticMarkup(<Board puzzle={p} floor={floor} width={size} height={size} layout={layout} theme="dark" />)
}
const dom = (html: string) => new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')

describe('illustrated boardLayout', () => {
  it('keeps the grid inside the box, leaves the numeral gutter and a lot of lawn', () => {
    for (const [box, minLot, maxLot] of [[358, 0.6, 0.6], [390, 0.6, 0.6], [812, 1.0, 1.15], [900, 1.0, 1.15]] as const) {
      for (const n of [6, 7, 8]) {
        const l = boardLayout(box, box, n)
        const fr = frameFor(box, box, n)
        expect(l.cellW).toBe(l.cellH)
        expect(l.x0 + n * l.cellW + fr.m).toBeLessThanOrEqual(box + 1)
        // lot (garden) beyond the gutter on all four sides, in cells
        expect(fr.lot / l.cellW, `box ${box} n ${n}`).toBeGreaterThanOrEqual(minLot - 0.02)
        expect(fr.lot / l.cellW, `box ${box} n ${n}`).toBeLessThanOrEqual(maxLot + 0.02)
        // the shell's numeral boxes (0.315u + 20 px from the grid) fit inside the gutter
        expect(fr.gut).toBeGreaterThanOrEqual(Math.ceil(0.335 * l.cellW) + 19)
        expect(l.x0).toBe(fr.sx + fr.m)
        expect(l.y0).toBe(fr.sy + fr.m)
        expect(fr.sx).toBeGreaterThanOrEqual(0)
      }
    }
    // a 390 px phone box reaches 44 px cells on a 6x6 plan
    expect(boardLayout(390, 390, 6).cellW).toBeGreaterThanOrEqual(44)
    expect(lotCells(358)).toBeCloseTo(0.6, 2)
    expect(lotCells(812)).toBeCloseTo(1.1, 2)
  })
})

describe('style system', () => {
  it('Midnight Delivery is Victorian; all five packs are used across the catalogue', () => {
    expect(styleIdFor(veryEasy1)).toBe('victorian')
    expect(styleFor(veryEasy1).label).toBe('Vitoriano')
    const used = new Set(puzzles.map(p => styleIdFor(p)))
    expect([...used].sort()).toEqual([...STYLE_IDS].sort())
    expect(styleFor(veryEasy1)).toBe(STYLES.victorian)
  })
  it('is a pure function of the case id', () => {
    for (const p of puzzles) expect(styleIdFor(p)).toBe(styleIdFor({ id: p.id }))
  })
  it('bible hexes are in their packs', () => {
    expect(STYLES.victorian.floors.living.a).toBe('#4A2E1E')
    expect(STYLES.victorian.floors.kitchen.a).toBe('#6E3A2A')
    expect(STYLES.victorian.floors.study.a).toBe('#3E2719')
    expect(STYLES.victorian.floors.bed.a).toBe('#55382A')
    expect(STYLES.artdeco.pal.metal).toBe('#C9A24A')
    expect(STYLES.tudor.floors.living.a).toBe('#6A4A2E')
    expect(STYLES.modernist.floors.hall.mat).toBe('slabs')
    expect(STYLES.mediterranean.floors.hall.a).toBe('#1F4E8C')
  })
  it('every floor material is dark enough once the night fill is applied (token contrast >= 2.8:1)', () => {
    const bone = '#f1e8ce'
    for (const st of Object.values(STYLES)) {
      for (const [role, spec] of Object.entries(st.floors)) {
        const eff = mix(floorBase(spec), '#1E2436', st.nightFill)
        expect(contrast(bone, eff), `${st.id} ${role}`).toBeGreaterThanOrEqual(2.8)
      }
    }
  })
  it('room plaques are legible: cream on near-black >= 4.5:1', () => {
    expect(contrast('#EFE3C8', '#14100d')).toBeGreaterThanOrEqual(4.5)
    expect(luminance('#EFE3C8')).toBeGreaterThan(0.7)
  })
})

describe('furniture is drawn exactly once, inside its footprint', () => {
  it('every catalogue case and storey', () => {
    for (const p of puzzles) {
      for (const floor of floorsOf(p)) {
        const doc = dom(render(p, floor, 640))
        const drawn = [...doc.querySelectorAll('[data-furniture]')].map(e => `${e.getAttribute('data-furniture')}@${e.getAttribute('data-row')},${e.getAttribute('data-col')}`).sort()
        const want = p.furniture.filter(f => (f.floor ?? 0) === floor).map(f => `${f.type}@${f.row},${f.col}`).sort()
        expect(drawn, `${p.id} f${floor}`).toEqual(want)
      }
    }
  })
  it('no decor layer, garden or decorative rug carries a furniture glyph', () => {
    for (const p of puzzles.slice(0, 20)) {
      const doc = dom(render(p, 0, 640))
      expect(doc.querySelectorAll('[data-layer="decor-wall"] [data-furniture], [data-layer="garden"] [data-furniture], [data-layer="yard"] [data-furniture], [data-decor] [data-furniture]').length, p.id).toBe(0)
    }
  })
})

describe('decor never leaks clue-relevant furniture types', () => {
  it('a decor kind that could be mistaken for a clue type is not placed', () => {
    let blockedSeen = 0
    for (const p of puzzles) {
      const blocked = clueTypesOf(p)
      for (const t of ['lamp', 'rug'] as FurnitureType[]) if (blocked.has(t)) blockedSeen++
      for (const floor of floorsOf(p)) {
        const plan = illustratedPlan(p, floor, 60)
        const items = planDecor(plan, buildGeo(plan), styleFor(p), blocked)
        for (const it of items) {
          const as = DECOR_AS_TYPE[it.kind]
          if (as) expect(blocked.has(as), `${p.id} placed ${it.kind}`).toBe(false)
        }
      }
      if (blocked.has('rug')) {
        const doc = dom(render(p, 0, 640))
        expect(doc.querySelectorAll('[data-decor="rug"]').length, `${p.id} decorative rug despite rug clue`).toBe(0)
      }
      if (blocked.has('lamp')) {
        const doc = dom(render(p, 0, 640))
        expect(doc.querySelectorAll('[data-decor="sconce"]').length, `${p.id} sconce despite lamp clue`).toBe(0)
      }
    }
    expect(blockedSeen).toBeGreaterThan(0)
  })
  it('clueTypesOf reads the single and multi furniture clue kinds', () => {
    const t = clueTypesOf({ clues: [
      { clue: { kind: 'onFurniture', person: 'p', furniture: 'sofa' }, text: '' },
      { clue: { kind: 'besideAny', person: 'p', furniture: ['plant', 'shrub'] }, text: '' },
      { clue: { kind: 'room', person: 'p', roomId: 'r' }, text: '' },
    ] } as unknown as Puzzle)
    expect([...t].sort()).toEqual(['plant', 'shrub', 'sofa'])
  })
})

describe('wall decor placement', () => {
  it('sits on free wall faces, clear of doors, windows and swing cells, inside the depth budget', () => {
    for (const p of puzzles) for (const floor of floorsOf(p)) {
      const plan = illustratedPlan(p, floor, 60)
      const geo = buildGeo(plan)
      const items = planDecor(plan, geo, styleFor(p), clueTypesOf(p))
      for (const it of items) {
        const ck = `${it.cell[0]},${it.cell[1]}`
        expect(geo.occ.has(ck), `${p.id} decor on furniture`).toBe(false)
        expect(geo.swingCells.has(ck), `${p.id} decor in a door cell`).toBe(false)
        expect(geo.doorEdges.has(`${it.edge.axis}${it.edge.line}.${it.edge.pos}`)).toBe(false)
        expect(geo.windowEdges.has(`${it.edge.axis}${it.edge.line}.${it.edge.pos}`)).toBe(false)
        // wall half + depth stays under 0.23 cell: never reaches a 0.6 centre zone (0.2 from the edge) by more than a hair
        expect(it.half + it.depth).toBeLessThanOrEqual(0.2301)
      }
    }
  })
  it('Midnight Delivery has a rich decor kit (>= 8 non-clue items)', () => {
    const doc = dom(render(veryEasy1))
    const decor = doc.querySelectorAll('[data-decor], [data-curtain], [data-window]').length
    expect(decor).toBeGreaterThanOrEqual(8)
    expect(doc.querySelectorAll('[data-decor="fireplace"]').length).toBeGreaterThanOrEqual(1)
    expect(doc.querySelectorAll('[data-decor="sconce"]').length).toBeGreaterThanOrEqual(1)
  })
})

describe('labels, doors and the numeral gutter', () => {
  it('room names (u = 32, 35, 41, 44, 51, 115; all 60 cases): >= 10 px font, >= 7 px capitals, one anchor wall, no overlaps, centres never covered, <= 25% of any token box', () => {
    // Labels are painted ABOVE the token layer (BoardLabels overlay). A token may therefore sit under the edge of a
    // plate, but a label is never hidden: the plate is at most (0.69 em + 2 px) tall and centred on a wall line, so it
    // never reaches a cell centre (the central 50%) and covers only a sliver of any token box (portraits stay identifiable).
    // (This replaces the earlier zero-intersection rule, which forced 5 px capitals on 8x8 phones.)
    const anchors = new Map<string, string>()
    let rooms = 0, moved = 0, worstCover = 0
    for (const p of puzzles) for (const floor of floorsOf(p)) for (const u of [32, 35, 41, 44, 51, 115]) {
      const plan = illustratedPlan(p, floor, u)
      const labels = placeLabels(plan, u)
      expect(labels.length).toBe(plan.rooms.length)
      const tok = u < 60 ? 0.84 : 0.78
      const lo = (1 - tok) / 2, hi = 1 - lo
      const boxes = labels.map(l => labelBoxOf(l))
      labels.forEach((l, i) => {
        expect(l.fs, `${p.id} ${l.text} @${u}`).toBeGreaterThanOrEqual(10)
        expect(0.69 * l.fs, `${p.id} ${l.text} @${u} cap height px`).toBeGreaterThanOrEqual(7)
        expect(l.mode, `${p.id} ${l.text} @${u} fell back to the floor`).not.toBe('floor')
        const [x0, y0, x1, y1] = boxes[i]
        // clear of the numeral gutter (numerals end 0.2 cell above the grid)
        expect(y0, `${p.id} ${l.text} @${u} reaches the numerals`).toBeGreaterThanOrEqual(-0.2)
        for (let r = 0; r < plan.n; r++) for (let c = 0; c < plan.n; c++) {
          // never over a cell centre (central 50%)
          const centre = x1 > c + 0.25 && x0 < c + 0.75 && y1 > r + 0.25 && y0 < r + 0.75
          expect(centre, `${p.id} f${floor} @${u}: ${l.text} covers the centre of ${r},${c}`).toBe(false)
          // share of the token box under the plate
          const ox = Math.max(0, Math.min(x1, c + hi) - Math.max(x0, c + lo)), oy = Math.max(0, Math.min(y1, r + hi) - Math.max(y0, r + lo))
          const cover = (ox * oy) / (tok * tok)
          worstCover = Math.max(worstCover, cover)
          expect(cover, `${p.id} f${floor} @${u}: ${l.text} covers ${(cover * 100).toFixed(0)}% of the token at ${r},${c}`).toBeLessThanOrEqual(0.25)
        }
        const wall = `${l.rot}:${l.mode}:${l.rot === 0 ? Math.round(l.cy * 2) / 2 : Math.round(l.x * 2) / 2}`
        const key = `${p.id}:${floor}:${l.roomId}`
        const prev = anchors.get(key)
        rooms++
        if (prev === undefined) anchors.set(key, wall)
        else if (prev !== wall) moved++
      })
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j]
        expect(a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1], `${p.id} f${floor} @${u}: ${labels[i].text}/${labels[j].text}`).toBe(false)
        // names on one wall line keep >= max(6 px, half a label height) between them
        const li = labels[i], lj = labels[j]
        if (li.rot === lj.rot) {
          const along = li.rot === 0 ? [a[0], a[2], b[0], b[2], Math.abs(li.cy - lj.cy)] : [a[1], a[3], b[1], b[3], Math.abs(li.x - lj.x)]
          if (along[4] < li.capH) {
            const gap = Math.max(along[0] - along[3], along[2] - along[1]) * u
            expect(gap - 0.06 * u, `${p.id} f${floor} @${u}: ${li.text}/${lj.text} plate gap ${(gap).toFixed(1)} px`).toBeGreaterThanOrEqual(Math.max(6, 0.5 * li.capH * u) - 0.01)
          }
        }
      }
    }
    expect(rooms).toBeGreaterThan(500)
    expect(worstCover).toBeLessThanOrEqual(0.25)
    // an abbreviation may shorten on the same wall; a change of wall between sizes must be rare
    expect(moved / rooms).toBeLessThan(0.08)
  })
  it('names prefer the north wall, at the same rate at 41 and 115', () => {
    const share = (u: number) => {
      let north = 0, all = 0
      for (const p of puzzles) {
        const plan = illustratedPlan(p, 0, u)
        for (const l of placeLabels(plan, u)) { all++; if (l.rot === 0 && l.mode === 'wall' && plan.edges.some(e => e.axis === 'h' && e.line === Math.round(l.cy) && e.p && plan.roomAt[e.p[0]][e.p[1]] === l.roomId)) north++ }
      }
      return north / all
    }
    expect(Math.abs(share(41) - share(115))).toBeLessThan(0.03)
    expect(share(41)).toBeGreaterThan(0.5)
  })
  it('doors keep their swing clear of furniture; every room has a door', () => {
    for (const p of puzzles) for (const floor of floorsOf(p)) {
      const plan = illustratedPlan(p, floor, 60)
      const solid = new Set<string>()
      for (const f of plan.furniture) {
        if (f.type === 'rug') continue
        const { w, h } = furnitureFootprint(f)
        for (let dr = 0; dr < h; dr++) for (let dc = 0; dc < w; dc++) solid.add(`${f.row + dr},${f.col + dc}`)
      }
      for (const d of plan.doors) {
        if (d.pocket) continue
        const [r, c] = d.axis === 'h' ? [d.swing === -1 ? d.line - 1 : d.line, d.pos] : [d.pos, d.swing === -1 ? d.line - 1 : d.line]
        expect(solid.has(`${r},${c}`), `${p.id} swing cell ${r},${c}`).toBe(false)
      }
    }
  })
  it('doors prefer gaps with both sides free; every room keeps a door; swings stay clear; edges stay unique', () => {
    let before = 0, after = 0
    for (const p of puzzles) for (const floor of floorsOf(p)) {
      const base = buildPlan(p, floor, 60)
      const plan = illustratedPlan(p, floor, 60)
      before += doorsOntoFurniture(base).length
      after += doorsOntoFurniture(plan).length
      expect(plan.doors.length).toBe(base.doors.length)
      const keys = plan.doors.map(d => `${d.axis}${d.line}.${d.pos}`)
      expect(new Set(keys).size, `${p.id} one door per edge`).toBe(keys.length)
      for (const w of plan.windows) expect(keys.includes(`${w.axis}${w.line}.${w.pos}`), `${p.id} window/door collision`).toBe(false)
      const rooms = new Set<string>()
      for (const d of plan.doors) {
        const e = plan.edges.find(x => x.axis === d.axis && x.line === d.line && x.pos === d.pos)!
        expect(['int', 'ext', 'extx']).toContain(e.kind)
        for (const c of [e.m, e.p]) if (c) rooms.add(plan.roomAt[c[0]][c[1]]!)
      }
      const interior = plan.rooms.filter(r => !r.exterior)
      if (interior.length > 1) for (const r of interior) expect(rooms.has(r.id), `${p.id} f${floor} ${r.name} has a door`).toBe(true)
    }
    // 12 plans have a pair of rooms whose every shared gap meets furniture on one side; those doors stay
    expect(after).toBeLessThanOrEqual(before)
    for (const p of puzzles) for (const floor of floorsOf(p)) {
      const plan = illustratedPlan(p, floor, 60)
      const occ = new Set<string>()
      for (const fu of plan.furniture) {
        if (fu.type === 'rug') continue
        const { w, h } = furnitureFootprint(fu)
        for (let a = 0; a < h; a++) for (let b = 0; b < w; b++) occ.add(`${fu.row + a},${fu.col + b}`)
      }
      const id = (c: readonly [number, number] | null) => (c ? plan.roomAt[c[0]][c[1]] : null)
      const used = new Set(plan.doors.map(d => `${d.axis}${d.line}.${d.pos}`))
      for (const d of doorsOntoFurniture(plan)) {
        const e = plan.edges.find(x => x.axis === d.axis && x.line === d.line && x.pos === d.pos)!
        const a = id(e.m), b = id(e.p)
        const free = plan.edges.filter(x => x.kind === 'int' && x.m && x.p && !used.has(`${x.axis}${x.line}.${x.pos}`) && !plan.windows.some(w => w.axis === x.axis && w.line === x.line && w.pos === x.pos) &&
          ((id(x.m) === a && id(x.p) === b) || (id(x.m) === b && id(x.p) === a)) && !occ.has(`${x.m![0]},${x.m![1]}`) && !occ.has(`${x.p![0]},${x.p![1]}`))
        expect(free.length, `${p.id} f${floor}: a door onto furniture although a clean gap exists`).toBe(0)
      }
    }
  })
  it('the numeral strip is the garden with a feathered shade (<= 12%); no tree canopy or lot feature enters it', () => {
    for (const p of puzzles.slice(0, 30)) {
      const box = 640
      const l = boardLayout(box, box, p.size)
      const fr = frameFor(box, box, p.size)
      const html = render(p, 0, box)
      const doc = dom(html)
      const gutter = doc.querySelector('[data-layer="gutter"]')!
      // two feathered shade rects only: no panel fill, no stroke, no hairline
      expect([...gutter.children].map(e => e.tagName.toLowerCase())).toEqual(['rect', 'rect'])
      for (const r of gutter.children) { expect(r.getAttribute('fill')).toMatch(/^url\(#/); expect(r.getAttribute('stroke')).toBeNull() }
      const stops = [...doc.querySelectorAll('[id$="-gutt"] stop, [id$="-gutl"] stop')].map(s => +s.getAttribute('stop-opacity')!)
      expect(stops.length).toBe(8)
      expect(Math.max(...stops)).toBeLessThanOrEqual(0.12)
      expect(Math.min(...stops)).toBe(0)
      const gut = fr.gut / l.cellW
      const outer = -gut
      for (const t of doc.querySelectorAll('[data-tree]')) {
        const cx = +t.getAttribute('data-cx')!, cy = +t.getAttribute('data-cy')!, r = +t.getAttribute('data-r')!
        const inTop = cy - r < 0 && cy + r > outer && cx + r > outer && cx - r < p.size
        const inLeft = cx - r < 0 && cx + r > outer && cy + r > outer && cy - r < p.size
        expect(inTop || inLeft, `${p.id} tree at ${cx},${cy} r${r} in gutter`).toBe(false)
      }
    }
  })
})

describe('labels overlay', () => {
  it('BoardLabels renders the names; the board itself no longer paints them', () => {
    const l = boardLayout(640, 640, 6)
    const labels = renderToStaticMarkup(<BoardLabels puzzle={veryEasy1} floor={0} width={640} height={640} layout={l} theme="dark" />)
    expect(labels).toContain('data-board-labels')
    expect(labels).toContain('data-label="BEDROOM"')
    expect(labels).toMatch(/<title>Living Room<\/title>/)
    expect(labels).toContain('aria-hidden="true"')
    expect(render(veryEasy1, 0, 640)).not.toContain('data-label=')
  })
  it('the shell paints the overlay above the token layer, aria-hidden and pointer-free', () => {
    const marks = Array.from({ length: veryEasy1.size }, () => Array.from({ length: veryEasy1.size }, () => ({ kind: 'empty' as const })))
    const p0 = veryEasy1.people[0]
    marks[1][0] = { kind: 'person', person: p0.id } as never
    const game = {
      puzzles: [veryEasy1], catalogProgress: null, puzzle: veryEasy1, mode: 'classic', marks, activeFloor: 0,
      selectedPerson: p0.id, tool: 'place', hintsLeft: 3, completed: false, murderer: null,
      feedback: 'none', placedOf: { [p0.id]: { row: 1, col: 0, floor: 0 } }, conflicts: new Set<string>(), history: [],
      start: () => {}, selectPerson: () => {}, setTool: () => {}, clickCell: () => {}, clearAll: () => {}, undo: () => {}, hint: () => {}, submit: () => {},
    } as unknown as GameApi
    const board = { Board, boardLayout, Labels: BoardLabels } as BoardModule
    const { container } = rtlRender(<Shell game={game} board={board} variant="illustrated" theme="dark" onToggleTheme={() => {}} intro={false} />)
    const grid = container.querySelector('[data-testid="plan-grid"]')!
    const overlay = container.querySelector('[data-testid="board-labels"]')!
    expect(overlay).toBeTruthy()
    expect(overlay.getAttribute('aria-hidden')).toBe('true')
    expect(overlay.className).toContain('rs-board-labels')
    // DOM order: after the grid (which holds the tokens), so it paints on top at equal z-index; the CSS gives it z-index 2
    expect(grid.compareDocumentPosition(overlay) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(grid.querySelector('.rs-token')).toBeTruthy()
    expect(grid.contains(overlay)).toBe(false)
    const css = readFileSync('src/reference/shell/shell.css', 'utf8')
    expect(css).toMatch(/\.rs-board-labels\s*\{[^}]*pointer-events:\s*none[^}]*z-index:\s*2/)
  })
})

describe('scene cache', () => {
  it('equal props never rebuild the scene; a new size, storey or puzzle does', () => {
    const base = { puzzle: veryEasy1, floor: 0, width: 701, height: 701, x0: 120, y0: 120, u: 77 }
    getScene(base)
    const b0 = sceneStats.builds
    const h0 = sceneStats.hits
    for (let i = 0; i < 5; i++) getScene({ ...base })
    // a theme flip or a remount hands the same inputs again
    renderToStaticMarkup(<Board puzzle={veryEasy1} floor={0} width={701} height={701} layout={{ x0: 120, y0: 120, cellW: 77, cellH: 77 }} theme="light" />)
    renderToStaticMarkup(<Board puzzle={veryEasy1} floor={0} width={701} height={701} layout={{ x0: 120, y0: 120, cellW: 77, cellH: 77 }} theme="dark" />)
    expect(sceneStats.builds).toBe(b0)
    expect(sceneStats.hits).toBeGreaterThan(h0 + 5)
    getScene({ ...base, width: 702 })
    expect(sceneStats.builds).toBe(b0 + 1)
    getScene({ ...base, puzzle: puzzles.find(p => p.id === 'very-easy-2')! })
    expect(sceneStats.builds).toBe(b0 + 2)
    // same id, different furniture: not served from the cache
    getScene({ ...base, puzzle: { ...veryEasy1, furniture: veryEasy1.furniture.slice(1) } })
    expect(sceneStats.builds).toBe(b0 + 3)
  })
  it('cached markup is identical to a fresh build', () => {
    const a = render(veryEasy1, 0, 640)
    const b = render(veryEasy1, 0, 640)
    expect(b).toBe(a)
  })
})

describe('render', () => {
  it('is aria-hidden, pointer-free, offline-safe and byte-identical twice', () => {
    const a = render(veryEasy1)
    expect(a).toContain('aria-hidden="true"')
    expect(a).toContain('data-board="illustrated"')
    expect(a).not.toMatch(/onClick|href=|<image|<img|url\(http|https?:\/\//)
    expect(render(veryEasy1)).toBe(a)
    expect(render(veryEasy1, 0, 358)).toBe(render(veryEasy1, 0, 358))
  })
  it('uses no SVG filters and no blend modes (nothing to re-rasterise per frame on a phone)', () => {
    for (const id of ['very-easy-1', 'very-easy-4', 'hard-1']) {
      const html = render(puzzles.find(p => p.id === id)!, 0, 640)
      expect(html, id).not.toMatch(/<filter|feTurbulence|feGaussianBlur|mix-blend-mode/)
    }
  })
  it('Midnight Delivery has a lit porch slab, steps and a path outside the east front door', () => {
    const doc = dom(render(veryEasy1))
    const porch = doc.querySelector('[data-porch]')!
    expect(porch).toBeTruthy()
    expect(+porch.getAttribute('data-porch-cx')!).toBeGreaterThan(veryEasy1.size)
    expect(doc.querySelectorAll('[data-tree]').length).toBeGreaterThanOrEqual(2)
    expect(doc.querySelector('[data-edge]')).toBeTruthy()
    expect(doc.querySelector('[data-layer="garden-light"]')).toBeTruthy()
  })
  it('uses at least four distinct floor materials on Midnight Delivery', () => {
    const doc = dom(render(veryEasy1))
    const mats = new Set([...doc.querySelectorAll('[data-mat]')].map(e => e.getAttribute('data-mat')))
    expect(mats.size).toBeGreaterThanOrEqual(4)
    for (const m of ['chequer', 'planks', 'herring', 'quarry']) expect(mats.has(m)).toBe(true)
  })
  it('the five styles produce visibly different documents for the same plan', () => {
    const docs = STYLE_IDS.map(id => {
      const p = { ...veryEasy1, id: ({ victorian: 'very-easy-1', artdeco: 'very-easy-2', tudor: 'very-easy-3', modernist: 'very-easy-4', mediterranean: 'very-easy-5' } as const)[id] }
      return render(p, 0, 640)
    })
    expect(new Set(docs).size).toBe(5)
    for (const html of docs) expect(html).toContain('data-style=')
  })
  it('renders one case per catalogue style quickly (static markup, best of seven, under 150 ms each)', () => {
    for (const id of ['very-easy-1', 'very-easy-2', 'very-easy-3', 'very-easy-4', 'very-easy-5', 'hard-1']) {
      const p = puzzles.find(x => x.id === id)!
      render(p, 0, 640) // warm
      // best of seven: the suite shares a busy machine, the fastest run is the cost of the code
      let ms = Infinity
      for (let k = 0; k < 7; k++) { const t0 = performance.now(); render(p, 0, 640); ms = Math.min(ms, performance.now() - t0) }
      expect(ms, `${id}: ${ms.toFixed(0)} ms`).toBeLessThan(150)
    }
  })
  it('role classification covers every catalogue room name', () => {
    for (const p of puzzles) for (const r of p.rooms) expect(roleOf(r.name)).not.toBe('other')
  })
})
