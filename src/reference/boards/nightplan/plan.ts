// ============================================================================
// Night Plan — pure plan derivation (no React). Everything the drawing needs is
// computed from the Puzzle object: which grid lines carry walls, where the
// doors and windows go, where the labels sit. Deterministic: no randomness, no
// clock, ties broken by fixed orderings. All coordinates are in cell units (u),
// cell (r,c) = [c, c+1] x [r, r+1], so the same output scales to any cell size.
// ============================================================================
import type { Furniture, Puzzle } from '../../../core/types'
import { furnitureFootprint } from '../../../core/types'
import { classifyRoom, type RoomClass } from './palette'

// ---- constants (F-spec §4) --------------------------------------------------
export const WALL_INT = 0.18
export const WALL_EXT = 0.27
export const DOOR_GAP = 0.6
export const WINDOW_GAP = 0.5

export type Axis = 'h' | 'v'
export type Side = -1 | 1
type RC = readonly [number, number]

export interface PlanRoom extends RoomClass {
  id: string
  name: string
  cells: RC[]
  /** Bounding box in cells: rows [r0,r1], cols [c0,c1] inclusive. */
  r0: number; r1: number; c0: number; c1: number
}

/** A wall-carrying (or boundary) segment on a grid line, one cell long. */
export interface Edge {
  axis: Axis
  /** Grid line index: y for 'h' edges, x for 'v' edges. */
  line: number
  /** Cell index along the line (x for 'h', y for 'v'). */
  pos: number
  kind: 'int' | 'ext' | 'extx' | 'fence' | 'soft' | 'seam'
  /** Cells on the - side (above / left) and + side (below / right); null = off the grid. */
  m: RC | null
  p: RC | null
}

export interface Door {
  axis: Axis
  line: number
  pos: number
  /** Side the leaf swings toward (-1 = toward the - cell). */
  swing: Side
  /** No clear swing area anywhere: drawn as a sliding / pocket door (no arc). */
  pocket?: boolean
  front: boolean
}
export interface Win { axis: Axis; line: number; pos: number; room: string }

export interface Label {
  roomId: string
  text: string
  /** Centre of the text box, and the baseline y of the UNROTATED text, in cell units. */
  x: number
  y: number
  cy: number
  /** 0 = horizontal; -90 = reading bottom-to-top on a vertical wall. */
  rot: 0 | -90
  /** Font size in px and tracking in em, chosen so the text fits. */
  fs: number
  ls: number
  /**
   * 'wall': set in paper on the poché of one of the room's own walls, where no
   * token (0.78u / 0.84u square centred in a cell) can ever cover it.
   * 'fence': a yard bounded by a fence line, not a wall: centred on the lot line (paper halo).
   * 'floor': last resort in a free floor band.
   */
  mode: 'wall' | 'fence' | 'floor'
  /** Text extent along the reading direction (w) and cap height (capH), cell units. */
  w: number
  capH: number
  /** No free band anywhere: draw over furniture with a paper halo. */
  halo?: boolean
}

/** Axis-aligned box of a label in cell units: [x0, y0, x1, y1]. */
export function labelBox(l: Label): [number, number, number, number] {
  return l.rot === 0
    ? [l.x - l.w / 2, l.cy - l.capH / 2, l.x + l.w / 2, l.cy + l.capH / 2]
    : [l.x - l.capH / 2, l.cy - l.w / 2, l.x + l.capH / 2, l.cy + l.w / 2]
}

export interface Plan {
  n: number
  floor: number
  rooms: PlanRoom[]
  roomAt: (string | null)[][]
  edges: Edge[]
  doors: Door[]
  windows: Win[]
  labels: Label[]
  furniture: Furniture[]
  frontDoor: Door | null
}

export function edgeHalf(e: Edge): number {
  return e.kind === 'int' ? WALL_INT / 2 : WALL_EXT / 2
}
export const isWall = (e: Edge) => e.kind === 'int' || e.kind === 'ext' || e.kind === 'extx'

const key = (r: number, c: number) => r * 1000 + c

// ---- furniture penalties ----------------------------------------------------
const DOOR_PEN: Record<string, number> = { rug: 0, chair: 1, table: 2, plant: 2, shrub: 2, lamp: 2, box: 2 }
const WINDOW_BLOCKERS = new Set(['bookshelf', 'fridge', 'tv', 'shower', 'clock'])

function floorOf(f: Furniture): number { return f.floor ?? 0 }

export function buildPlan(puzzle: Puzzle, floor: number, cellPx: number): Plan {
  const n = puzzle.size
  const grid = puzzle.roomOfByFloor?.[floor] ?? puzzle.roomOf
  const roomAt: (string | null)[][] = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => grid[r]?.[c] ?? null))
  const furniture = puzzle.furniture.filter(f => floorOf(f) === floor)

  // rooms present on this floor
  const byId = new Map<string, PlanRoom>()
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const id = roomAt[r][c]
    if (!id) continue
    let pr = byId.get(id)
    if (!pr) {
      const src = puzzle.rooms.find(x => x.id === id)
      const name = src?.name ?? id
      pr = { ...classifyRoom(name), id, name, cells: [], r0: r, r1: r, c0: c, c1: c }
      byId.set(id, pr)
    }
    pr.cells.push([r, c])
    pr.r1 = Math.max(pr.r1, r); pr.c0 = Math.min(pr.c0, c); pr.c1 = Math.max(pr.c1, c)
  }
  const rooms = [...byId.values()]
  const roomById = (id: string | null) => (id ? byId.get(id) ?? null : null)

  // furniture occupancy
  const occ = new Map<number, Furniture>()
  for (const f of furniture) {
    const { w, h } = furnitureFootprint(f)
    for (let dr = 0; dr < h; dr++) for (let dc = 0; dc < w; dc++) {
      const k = key(f.row + dr, f.col + dc)
      const prev = occ.get(k)
      if (!prev || prev.type === 'rug') occ.set(k, f)
    }
  }
  const doorPen = (cell: RC | null) => (cell ? (occ.has(key(cell[0], cell[1])) ? DOOR_PEN[occ.get(key(cell[0], cell[1]))!.type] ?? 3 : 0) : 0)
  const windowBlocked = (cell: RC | null) => !!cell && WINDOW_BLOCKERS.has(occ.get(key(cell[0], cell[1]))?.type ?? '')

  // ---- edges ----------------------------------------------------------------
  const edges: Edge[] = []
  const cellAt = (r: number, c: number): RC | null => (r >= 0 && r < n && c >= 0 && c < n ? [r, c] : null)
  const idOf = (cell: RC | null) => (cell ? roomAt[cell[0]][cell[1]] : null)
  const mk = (axis: Axis, line: number, pos: number, m: RC | null, p: RC | null) => {
    const a = idOf(m), b = idOf(p)
    if (!m && !p) return
    let kind: Edge['kind'] | null = null
    if (m && p) {
      if (a === b) kind = 'seam'
      else {
        const ea = roomById(a)?.exterior ?? false, eb = roomById(b)?.exterior ?? false
        kind = !ea && !eb ? 'int' : ea && eb ? 'soft' : 'extx'
      }
    } else {
      const inside = roomById(a ?? b)
      kind = inside && !inside.exterior ? 'ext' : 'fence'
    }
    edges.push({ axis, line, pos, kind, m, p })
  }
  for (let r = 0; r <= n; r++) for (let c = 0; c < n; c++) mk('h', r, c, cellAt(r - 1, c), cellAt(r, c))
  for (let c = 0; c <= n; c++) for (let r = 0; r < n; r++) mk('v', c, r, cellAt(r, c - 1), cellAt(r, c))

  // ---- doors ----------------------------------------------------------------
  const doors: Door[] = []
  const doorCells = new Set<number>()   // cells beside a door (either side)
  const swingCells = new Set<number>()  // cells a leaf swings into (or the entry cell of a front door)
  const labelBlock = new Set<number>()  // cells whose top band a door leaf / arc crosses
  const doorEdgeKey = (e: { axis: Axis; line: number; pos: number }) => `${e.axis}${e.line}.${e.pos}`
  const doorEdges = new Set<string>()

  const interior = rooms.filter(r => !r.exterior)
  const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)
  const pairEdges = new Map<string, Edge[]>()
  for (const e of edges) {
    if (e.kind !== 'int') continue
    const k = pairKey(idOf(e.m)!, idOf(e.p)!)
    ;(pairEdges.get(k) ?? pairEdges.set(k, []).get(k)!).push(e)
  }
  for (const list of pairEdges.values()) list.sort((a, b) => (a.axis === b.axis ? a.line - b.line || a.pos - b.pos : a.axis < b.axis ? -1 : 1))

  const furnished = (cell: RC | null) => {
    const f = cell ? occ.get(key(cell[0], cell[1])) : undefined
    return !!f && f.type !== 'rug'
  }
  /** Best edge of a pair: [edge, swing, score, pocket]. The leaf's swept quarter
   *  circle lies in the swing cell, so that cell must be free of furniture: try the
   *  destination side, then the other room, then another gap, else a pocket door. */
  function bestEdge(a: PlanRoom, b: PlanRoom, swingInto: PlanRoom | null): [Edge, Side, number, boolean] | null {
    const list = pairEdges.get(pairKey(a.id, b.id))
    if (!list?.length) return null
    let best: { e: Edge; swing: Side; score: number; mid: number; pocket: boolean } | null = null
    const m = list.length
    list.forEach((e, i) => {
      if (doorEdges.has(doorEdgeKey(e))) return
      const pm = doorPen(e.m), pp = doorPen(e.p)
      const pref: Side = swingInto ? (idOf(e.m) === swingInto.id ? -1 : 1) : pm <= pp ? -1 : 1
      const side = (s: Side) => (s === -1 ? e.m : e.p)
      let swing = pref, pocket = false, score = pm + pp
      if (furnished(side(pref))) {
        if (!furnished(side(-pref as Side))) { swing = -pref as Side; score += 0.5 }
        else pocket = true
      }
      if (pocket) score += 6
      const sc = side(swing)
      if (!pocket && sc && swingCells.has(key(sc[0], sc[1]))) score += 4
      const mid = Math.abs(i - (m - 1) / 2)
      if (!best || score < best.score || (score === best.score && mid < best.mid)) best = { e, swing, score, mid, pocket }
    })
    const r = best as { e: Edge; swing: Side; score: number; pocket: boolean } | null
    return r ? [r.e, r.swing, r.score, r.pocket] : null
  }
  function addDoor(e: Edge, swing: Side, front = false, pocket = false) {
    doors.push({ axis: e.axis, line: e.line, pos: e.pos, swing, front, ...(pocket ? { pocket } : {}) })
    doorEdges.add(doorEdgeKey(e))
    for (const cell of [e.m, e.p]) if (cell) doorCells.add(key(cell[0], cell[1]))
    const sc = swing === -1 ? e.m : e.p
    if (sc && !pocket) {
      swingCells.add(key(sc[0], sc[1]))
      // an arc swinging up into a cell from its bottom wall never reaches the label band
      if (e.axis === 'v' || swing === 1) labelBlock.add(key(sc[0], sc[1]))
    }
  }

  const hubs = interior.filter(r => r.hub)
  const connected = new Map<string, string>() // union-find over interior rooms
  const find = (x: string): string => (connected.get(x) === x || !connected.has(x) ? x : find(connected.get(x)!))
  interior.forEach(r => connected.set(r.id, r.id))
  const union = (a: string, b: string) => connected.set(find(a), find(b))
  const hasDoor = new Set<string>()

  // A: every non-hub room next to a hub gets a door to the hub it shares most wall with.
  for (const room of interior) {
    if (room.hub) continue
    let pick: PlanRoom | null = null, pickLen = 0
    for (const h of hubs) {
      const len = pairEdges.get(pairKey(room.id, h.id))?.length ?? 0
      if (len > pickLen) { pick = h; pickLen = len }
    }
    if (!pick) continue
    const be = bestEdge(pick, room, room)
    if (!be) continue
    addDoor(be[0], be[1], false, be[3])
    union(room.id, pick.id)
    hasDoor.add(room.id); hasDoor.add(pick.id)
  }
  // B: Kruskal over the remaining adjacent pairs until the house is one component.
  const rest: { a: PlanRoom; b: PlanRoom; score: number; len: number }[] = []
  for (const k of [...pairEdges.keys()].sort()) {
    const [ia, ib] = k.split('|')
    const a = byId.get(ia)!, b = byId.get(ib)!
    const be = bestEdge(a, b, null)
    if (be) rest.push({ a, b, score: be[2], len: pairEdges.get(k)!.length })
  }
  rest.sort((x, y) => (x.score >= 3 ? 1 : 0) - (y.score >= 3 ? 1 : 0) || y.len - x.len || (x.a.id + x.b.id < y.a.id + y.b.id ? -1 : 1))
  for (const { a, b } of rest) {
    if (find(a.id) === find(b.id)) continue
    const be = bestEdge(a, b, null)
    if (!be) continue
    addDoor(be[0], be[1], false, be[3])
    union(a.id, b.id)
    hasDoor.add(a.id); hasDoor.add(b.id)
  }

  // ---- exterior wall edges (windows + front door candidates) ------------------
  const extEdges = edges.filter(e => e.kind === 'ext' || e.kind === 'extx')
  /** Which compass side of its interior room an exterior edge faces. */
  function sideOf(e: Edge): 'N' | 'E' | 'W' | 'S' {
    const outsideIsMinus = !e.m || (roomById(idOf(e.m))?.exterior ?? false)
    return e.axis === 'h' ? (outsideIsMinus ? 'N' : 'S') : (outsideIsMinus ? 'W' : 'E')
  }
  const interiorCell = (e: Edge): RC => {
    const outsideIsMinus = !e.m || (roomById(idOf(e.m))?.exterior ?? false)
    return (outsideIsMinus ? e.p : e.m)!
  }
  const SIDE_ORDER = { N: 0, E: 1, W: 2, S: 3 } as const

  // Best exterior wall edge of a room for an entrance: S / E walls first (N / W
  // collide with the numeral chips), then the freest cell, facing a yard first.
  const SIDE_RANK = { S: 0, E: 1, N: 2, W: 3 } as const
  /** The cell an outward-swinging leaf sweeps (exterior room cell; off-grid margin is always free). */
  const outsideCell = (e: Edge): RC | null => ((!e.m || (roomById(idOf(e.m))?.exterior ?? false)) ? e.m : e.p)
  const outsideBlocked = (e: Edge) => furnished(outsideCell(e) && roomById(idOf(outsideCell(e)))?.exterior ? outsideCell(e) : null)
  const extCost = (e: Edge) => doorPen(interiorCell(e)) + (sideOf(e) === 'N' || sideOf(e) === 'W' ? 1.5 : 0) + (outsideBlocked(e) ? 6 : 0)
  function exteriorCandidates(room: PlanRoom): Edge[] {
    return extEdges
      .filter(e => idOf(interiorCell(e)) === room.id && !doorEdges.has(doorEdgeKey(e)))
      .sort((a, b) =>
        (a.kind === 'extx' ? 0 : 1) - (b.kind === 'extx' ? 0 : 1) ||
        extCost(a) - extCost(b) ||
        SIDE_RANK[sideOf(a)] - SIDE_RANK[sideOf(b)] ||
        a.line - b.line || a.pos - b.pos)
  }
  function exteriorDoorFor(room: PlanRoom, front: boolean): Door | null {
    const e = exteriorCandidates(room)[0]
    if (!e) return null
    const out: Side = e.axis === 'h' ? (sideOf(e) === 'N' ? -1 : 1) : (sideOf(e) === 'W' ? -1 : 1)
    const pocket = outsideBlocked(e)
    const door: Door = { axis: e.axis, line: e.line, pos: e.pos, swing: out, front, ...(pocket ? { pocket } : {}) }
    doors.push(door)
    doorEdges.add(doorEdgeKey(e))
    for (const cell of [e.m, e.p]) if (cell) { doorCells.add(key(cell[0], cell[1])); swingCells.add(key(cell[0], cell[1])); labelBlock.add(key(cell[0], cell[1])) }
    hasDoor.add(room.id)
    return door
  }

  // front door: exactly one, on floor 0 only
  let frontDoor: Door | null = null
  if (floor === 0 && extEdges.length) {
    const roomsByPref = [...interior].sort((a, b) => {
      const sc = (r: PlanRoom) => (r.hub ? 0 : /living|lounge|sitting|reception/i.test(r.name) ? 1 : 2)
      return sc(a) - sc(b) || b.cells.length - a.cells.length || (a.id < b.id ? -1 : 1)
    })
    // first preferred room whose entrance is on a clear S / E wall; else the cheapest
    let pick: PlanRoom | null = null, pickCost = Infinity
    for (const room of roomsByPref) {
      const e = exteriorCandidates(room)[0]
      if (!e) continue
      const c = extCost(e) + (e.kind === 'extx' ? -0.5 : 0)
      if (c < pickCost - 1e-9) { pick = room; pickCost = c }
      if (c < 1.5) break
    }
    if (pick) frontDoor = exteriorDoorFor(pick, true)
  }
  // A room no interior door reaches (a house split by its own yard) gets its own
  // door onto the exterior so every room has at least one.
  if (interior.length) for (const room of interior) if (!hasDoor.has(room.id)) exteriorDoorFor(room, false)

  // ---- windows: one per non-hub interior room -----------------------------------
  const windows: Win[] = []
  for (const room of interior) {
    if (room.hub) continue
    const mine = extEdges.filter(e => idOf(interiorCell(e)) === room.id && !doorEdges.has(doorEdgeKey(e)))
    // group into straight runs
    type Run = { side: 'N' | 'E' | 'W' | 'S'; line: number; edges: Edge[] }
    const runs: Run[] = []
    const sorted = [...mine].sort((a, b) => (a.axis === b.axis ? a.line - b.line || a.pos - b.pos : a.axis < b.axis ? -1 : 1))
    for (const e of sorted) {
      const s = sideOf(e)
      const last = runs[runs.length - 1]
      if (last && last.side === s && last.line === e.line && last.edges[last.edges.length - 1].pos === e.pos - 1) last.edges.push(e)
      else runs.push({ side: s, line: e.line, edges: [e] })
    }
    runs.sort((a, b) => b.edges.length - a.edges.length || SIDE_ORDER[a.side] - SIDE_ORDER[b.side] || a.line - b.line)
    for (const run of runs) {
      const L = run.edges.length
      const order = run.edges.map((e, i) => ({ e, d: Math.abs(i - (L - 1) / 2), i }))
        .sort((a, b) => a.d - b.d || b.i - a.i)
      const ok = order.find(o => !windowBlocked(interiorCell(o.e)))
      if (ok) { windows.push({ axis: ok.e.axis, line: ok.e.line, pos: ok.e.pos, room: room.id }); break }
    }
  }

  // ---- labels ----------------------------------------------------------------------
  // Tokens are 0.78u (0.84u on phones) squares centred in their cell, so the only
  // places a label is never covered are the poché and the 0.08-0.11u band against it.
  // Labels therefore sit ON a wall of the room, in paper on espresso (12.5:1), the cap
  // height inside the wall's thickness. Placement is collision-aware across the whole
  // storey: for each room try top walls, bottom walls, left / right walls (rotated),
  // sliding along each run, then a shorter name, then a smaller size (never under 10 px
  // until the very last resort), then the lot line of a yard, then a free floor band.
  const CAP = 0.66   // cap height / em (conservative: fallback monospace faces run taller than Courier Prime)
  const LS = 0.08    // tracking, em
  const PAD = 0.14   // clearance between label boxes, cells
  const baseFs = cellPx >= 60 ? 11 : 10
  const gapKey = new Map<string, [number, number][]>()
  const addGap = (axis: Axis, line: number, pos: number, w: number) => {
    const k = `${axis}${line}.${pos}`
    const g0 = pos + (1 - w) / 2
    ;(gapKey.get(k) ?? gapKey.set(k, []).get(k)!).push([g0, g0 + w])
  }
  for (const d of doors) addGap(d.axis, d.line, d.pos, DOOR_GAP)
  for (const w of windows) addGap(w.axis, w.line, w.pos, WINDOW_GAP)
  const widthOf = (text: string, fs: number) => text.length * (0.6 + LS) * fs / cellPx

  interface Run { axis: Axis; line: number; a: number; b: number; half: number; out: number }
  const abbreviations = (name: string): string[] => {
    const up = name.toUpperCase()
    const words = up.split(/\s+/)
    const v = [up]
    if (words.length > 1) {
      const noSuffix = words.filter(w => w !== 'ROOM').join(' ')
      const noPrefix = words.filter(w => !['FRONT', 'BACK', 'MAIN', 'THE'].includes(w)).join(' ')
      for (const c of [noSuffix, noPrefix, words[words.length - 1], words[0]]) if (c.length >= 3 && !v.includes(c)) v.push(c)
    }
    const cut = up.slice(0, 5) + '.'
    if (up.length > 6 && !v.includes(cut)) v.push(cut)
    return v
  }

  /** Open wall runs a room owns on one side, minus door / window gaps, split where thickness changes. */
  function runsOf(room: PlanRoom): Run[] {
    const out: Run[] = []
    const sides: { axis: Axis; plus: boolean }[] = [
      { axis: 'h', plus: true }, { axis: 'h', plus: false }, { axis: 'v', plus: true }, { axis: 'v', plus: false },
    ]
    for (const { axis, plus } of sides) {
      const mine = edges.filter(e => e.axis === axis && isWall(e) && idOf(plus ? e.p : e.m) === room.id)
      const lines = [...new Set(mine.map(e => e.line))].sort((x, y) => (axis === 'h' && !plus ? y - x : axis === 'v' && !plus ? y - x : x - y))
      for (const line of lines) {
        // the left perimeter (x = 0) and the top perimeter belong to the shell's numeral chips: keep vertical labels off x = 0
        if (axis === 'v' && line === 0) continue
        const run = mine.filter(e => e.line === line).sort((x, y) => x.pos - y.pos)
        const ivs: Run[] = []
        for (const e of run) {
          const half = edgeHalf(e)
          const nudge = e.kind === 'ext' ? 0.03 : 0
          // outward direction for perimeter walls: top / left lines go -, bottom / right lines go +
          const outDir = axis === 'h' ? (plus ? -1 : 1) : (plus ? -1 : 1)
          const gs = (gapKey.get(`${axis}${line}.${e.pos}`) ?? []).slice().sort((p, q) => p[0] - q[0])
          let a = e.pos
          const push = (x0: number, x1: number) => {
            if (x1 - x0 <= 0.01) return
            const last = ivs[ivs.length - 1]
            if (last && Math.abs(last.b - x0) < 1e-6 && last.half === half) last.b = x1
            else ivs.push({ axis, line, a: x0, b: x1, half, out: nudge * outDir })
          }
          for (const [g0, g1] of gs) { push(a, g0); a = g1 }
          push(a, e.pos + 1)
        }
        out.push(...ivs)
      }
    }
    return out
  }

  const placedBoxes: [number, number, number, number][] = []
  const hits = (b: [number, number, number, number]) =>
    placedBoxes.some(p => b[0] < p[2] + PAD && b[2] > p[0] - PAD && b[1] < p[3] + PAD && b[3] > p[1] - PAD)
  const mkLabel = (room: PlanRoom, text: string, fs: number, run: Run, along: number): Label => {
    const w = widthOf(text, fs)
    const capH = CAP * fs / cellPx
    if (run.axis === 'h') {
      const cy = run.line + run.out
      return { roomId: room.id, text, x: along, y: cy + capH / 2, cy, rot: 0, fs, ls: LS, mode: 'wall', w, capH }
    }
    const cx = run.line + run.out
    return { roomId: room.id, text, x: cx, y: along + capH / 2, cy: along, rot: -90, fs, ls: LS, mode: 'wall', w, capH }
  }

  function tryWalls(room: PlanRoom, runs: Run[], fsFloor: number): Label | null {
    const centre = (run: Run) => (run.axis === 'h' ? (room.c0 + room.c1 + 1) / 2 : (room.r0 + room.r1 + 1) / 2)
    for (const text of abbreviations(room.name)) {
      for (let shrink = 0; shrink <= 3; shrink++) {
        for (const run of runs) {
          const runMax = Math.min(baseFs, Math.floor((run.half * 2 * cellPx - 1.2) / CAP))
          const fs = runMax - shrink
          if (fs < Math.min(fsFloor, runMax)) continue
          if (fs < 8) continue
          const w = widthOf(text, fs)
          const lo = run.a + 0.06 + w / 2, hi = run.b - 0.06 - w / 2
          if (hi < lo) continue
          const pc = centre(run)
          const cands: number[] = [Math.min(Math.max(pc, lo), hi)]
          for (let k = 1; k * 0.05 <= hi - lo + 1e-9; k++) {
            for (const d of [-1, 1]) {
              const x = cands[0] + d * k * 0.05
              if (x >= lo - 1e-9 && x <= hi + 1e-9) cands.push(x)
            }
          }
          for (const along of cands.sort((p, q) => Math.abs(p - pc) - Math.abs(q - pc))) {
            const lab = mkLabel(room, text, fs, run, along)
            if (!hits(labelBox(lab))) return lab
          }
        }
      }
    }
    return null
  }

  const labelsById = new Map<string, Label>()
  const runsByRoom = new Map(rooms.map(r => [r.id, runsOf(r)]))
  const order = [...rooms].sort((a, b) => runsByRoom.get(a.id)!.length - runsByRoom.get(b.id)!.length || (a.id < b.id ? -1 : 1))
  for (const room of order) {
    const runs = runsByRoom.get(room.id)!
    const pc = (room.c0 + room.c1 + 1) / 2
    // 1: wall, >= 10 px;  2: wall, down to 8 px
    let placed: Label | null = tryWalls(room, runs, 10) ?? tryWalls(room, runs, 8)

    if (!placed) {
      // a yard bounded by fence: centred on a horizontal lot line (bottom first: the top margin holds the numerals)
      const fenceOwn = (e: Edge) => e.kind === 'fence' && e.axis === 'h' && (idOf(e.m) === room.id || idOf(e.p) === room.id)
      for (const text of abbreviations(room.name)) {
        for (const line of [n, 0]) {
          if (placed) break
          const fs = Math.min(baseFs, 10)
          const w = widthOf(text, fs)
          const capH = CAP * fs / cellPx
          const run = edges.filter(e => e.line === line && fenceOwn(e)).sort((a, b) => a.pos - b.pos)
          let i = 0
          while (i < run.length && !placed) {
            let j = i
            while (j + 1 < run.length && run[j + 1].pos === run[j].pos + 1) j++
            const a = run[i].pos, b = run[j].pos + 1
            const lo = a + 0.07 + w / 2, hi = b - 0.07 - w / 2
            if (hi >= lo) {
              const cands = [Math.min(Math.max(pc, lo), hi)]
              for (let k = 1; k * 0.05 <= hi - lo; k++) for (const d of [-1, 1]) { const x = cands[0] + d * k * 0.05; if (x >= lo && x <= hi) cands.push(x) }
              for (const x of cands.sort((p, q) => Math.abs(p - pc) - Math.abs(q - pc))) {
                const lab: Label = { roomId: room.id, text, x, y: line + capH / 2, cy: line, rot: 0, fs, ls: LS, mode: 'fence', w, capH }
                if (!hits(labelBox(lab))) { placed = lab; break }
              }
            }
            i = j + 1
          }
        }
        if (placed) break
      }
    }

    if (!placed) {
      // no wall or lot line can carry it: first free floor band
      const fs = Math.min(baseFs, 10)
      const text = room.name.toUpperCase()
      const w = widthOf(text, fs)
      const capH = CAP * fs / cellPx
      const free = (r: number, c: number) => roomAt[r][c] === room.id && !occ.has(key(r, c)) && !labelBlock.has(key(r, c))
      for (let r = room.r0; r <= room.r1 && !placed; r++) {
        let bestX = -1, bd = Infinity
        let c = 0
        while (c < n) {
          if (!free(r, c)) { c++; continue }
          let e = c
          while (e + 1 < n && free(r, e + 1)) e++
          if (e + 1 - c - 0.14 >= w) {
            const x = Math.min(Math.max(pc, c + 0.07 + w / 2), e + 1 - 0.07 - w / 2)
            if (Math.abs(x - pc) < bd) { bd = Math.abs(x - pc); bestX = x }
          }
          c = e + 1
        }
        if (bestX >= 0) placed = { roomId: room.id, text, x: bestX, y: r + 0.12 + capH, cy: r + 0.12 + capH / 2, rot: 0, fs, ls: LS, mode: 'floor', w, capH }
      }
      if (!placed) placed = { roomId: room.id, text, x: pc, y: room.r0 + 0.12 + capH, cy: room.r0 + 0.12 + capH / 2, rot: 0, fs, ls: LS, mode: 'floor', w, capH, halo: true }
    }
    labelsById.set(room.id, placed)
    placedBoxes.push(labelBox(placed))
  }
  const labels: Label[] = rooms.map(r => labelsById.get(r.id)!)

  return { n, floor, rooms, roomAt, edges, doors, windows, labels, furniture, frontDoor }
}

// ---- geometry helpers used by the renderer -----------------------------------

/** World point on an edge: `a` along the line, `d` perpendicular offset. */
export function pt(axis: Axis, line: number, a: number, d: number): [number, number] {
  return axis === 'h' ? [a, line + d] : [line + d, a]
}

export interface DoorGeom {
  hinge: [number, number]
  tip: [number, number]
  jamb: [number, number]
  /** Gap along the edge, in cell-edge coordinates. */
  gap: [number, number]
  sweep: 0 | 1
}
export function doorGeom(d: Door): DoorGeom {
  const g0 = d.pos + (1 - DOOR_GAP) / 2
  const g1 = g0 + DOOR_GAP
  const hinge = pt(d.axis, d.line, g0, 0)
  const jamb = pt(d.axis, d.line, g1, 0)
  const tip = pt(d.axis, d.line, g0, d.swing * DOOR_GAP)
  // arc from the leaf tip to the far jamb; sweep chosen by the sign of the turn
  const ax = tip[0] - hinge[0], ay = tip[1] - hinge[1]
  const bx = jamb[0] - hinge[0], by = jamb[1] - hinge[1]
  const cross = ax * by - ay * bx
  return { hinge, tip, jamb, gap: [g0, g1], sweep: cross > 0 ? 1 : 0 }
}

/** Gaps (door / window openings) keyed by edge, for the wall-path builder. */
function gapMap(plan: Plan) {
  const gaps = new Map<string, [number, number][]>()
  const add = (axis: Axis, line: number, pos: number, w: number) => {
    const k = `${axis}${line}.${pos}`
    const g0 = pos + (1 - w) / 2
    ;(gaps.get(k) ?? gaps.set(k, []).get(k)!).push([g0, g0 + w])
  }
  for (const d of plan.doors) add(d.axis, d.line, d.pos, DOOR_GAP)
  for (const w of plan.windows) add(w.axis, w.line, w.pos, WINDOW_GAP)
  return gaps
}

/**
 * One SVG path for all poché: a rectangle per wall edge (minus openings) plus a
 * square at each vertex so corners and T-junctions butt-join with no seams.
 */
export function wallPath(plan: Plan): string {
  const walls = plan.edges.filter(isWall)
  const gaps = gapMap(plan)
  const f = (v: number) => +v.toFixed(4)
  let d = ''
  const rect = (x0: number, y0: number, x1: number, y1: number) => {
    d += `M${f(x0)} ${f(y0)}H${f(x1)}V${f(y1)}H${f(x0)}Z`
  }
  // vertex extents: per vertex, x-range from incident vertical edges, y-range from horizontal ones
  const vx = new Map<string, { xlo: number; xhi: number; ylo: number; yhi: number; hasV: boolean; hasH: boolean }>()
  const touch = (x: number, y: number) => {
    const k = `${x},${y}`
    let v = vx.get(k)
    if (!v) { v = { xlo: x, xhi: x, ylo: y, yhi: y, hasV: false, hasH: false }; vx.set(k, v) }
    return v
  }
  for (const e of walls) {
    const h = edgeHalf(e)
    if (e.axis === 'h') {
      const y = e.line
      const gs = (gaps.get(`h${y}.${e.pos}`) ?? []).slice().sort((a, b) => a[0] - b[0])
      let a = e.pos
      for (const [g0, g1] of gs) { if (g0 > a) rect(a, y - h, g0, y + h); a = g1 }
      if (a < e.pos + 1) rect(a, y - h, e.pos + 1, y + h)
      for (const x of [e.pos, e.pos + 1]) { const v = touch(x, y); v.hasH = true; v.ylo = Math.min(v.ylo, y - h); v.yhi = Math.max(v.yhi, y + h) }
    } else {
      const x = e.line
      const gs = (gaps.get(`v${x}.${e.pos}`) ?? []).slice().sort((a, b) => a[0] - b[0])
      let a = e.pos
      for (const [g0, g1] of gs) { if (g0 > a) rect(x - h, a, x + h, g0); a = g1 }
      if (a < e.pos + 1) rect(x - h, a, x + h, e.pos + 1)
      for (const y of [e.pos, e.pos + 1]) { const v = touch(x, y); v.hasV = true; v.xlo = Math.min(v.xlo, x - h); v.xhi = Math.max(v.xhi, x + h) }
    }
  }
  for (const v of vx.values()) if (v.hasH && v.hasV) rect(v.xlo, v.ylo, v.xhi, v.yhi)
  return d
}
