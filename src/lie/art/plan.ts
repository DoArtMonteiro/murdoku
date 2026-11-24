// Pure geometry for the tile plan: walls, door gaps, room-label plaques, tile motifs.
// Everything is derived from the puzzle alone (never from tokens, never from the solution),
// so nothing moves while the player plays.
import type { Furniture, Puzzle } from '../../core/types'
import { furnitureCells } from '../../core/types'

/** One cell, in drawing units. */
export const U = 100
/** Space around the grid for the outer wall and the frieze. */
export const PAD = 14

export const keyOf = (r: number, c: number) => `${r},${c}`

/** Floor-0 furniture only: this renderer draws one floor. */
export function groundFurniture(puzzle: Puzzle): Furniture[] {
  return puzzle.furniture.filter(f => (f.floor ?? 0) === 0)
}

/** Cell key -> the pieces whose footprint covers it. */
export function furnitureByCell(puzzle: Puzzle): Map<string, Furniture[]> {
  const out = new Map<string, Furniture[]>()
  for (const f of groundFurniture(puzzle)) {
    for (const c of furnitureCells(f)) {
      const k = keyOf(c.row, c.col)
      out.set(k, [...(out.get(k) ?? []), f])
    }
  }
  return out
}

const roomAt = (p: Puzzle, r: number, c: number): string => p.roomOf[r]?.[c] ?? ''

interface Edge {
  dir: 'h' | 'v'
  /** h: the row line (0..N). v: the column line (0..N). */
  line: number
  /** h: the column. v: the row. */
  idx: number
  /** the two cells either side, as keys (a: above/left, b: below/right) */
  ka: string
  kb: string
  ra: string
  rb: string
}

function edges(p: Puzzle): Edge[] {
  const N = p.size
  const out: Edge[] = []
  for (let r = 0; r <= N; r++) {
    for (let c = 0; c < N; c++) out.push({ dir: 'h', line: r, idx: c, ka: keyOf(r - 1, c), kb: keyOf(r, c), ra: roomAt(p, r - 1, c), rb: roomAt(p, r, c) })
  }
  for (let r = 0; r < N; r++) {
    for (let c = 0; c <= N; c++) out.push({ dir: 'v', line: c, idx: r, ka: keyOf(r, c - 1), kb: keyOf(r, c), ra: roomAt(p, r, c - 1), rb: roomAt(p, r, c) })
  }
  return out
}

const stub = (e: Edge, a: number, b: number) =>
  e.dir === 'h'
    ? `M${e.idx * U + a} ${e.line * U}H${e.idx * U + b}`
    : `M${e.line * U} ${e.idx * U + a}V${e.idx * U + b}`

/** Merge unit edges into straight runs, one "M..H.." or "M..V.." per run. */
function runs(list: Edge[]): string {
  const groups = new Map<string, number[]>()
  for (const e of list) {
    const k = `${e.dir}${e.line}`
    groups.set(k, [...(groups.get(k) ?? []), e.idx])
  }
  const parts: string[] = []
  for (const [k, idxs] of groups) {
    const dir = k[0] as 'h' | 'v'
    const line = Number(k.slice(1))
    idxs.sort((x, y) => x - y)
    let start = idxs[0]
    let prev = idxs[0]
    const flush = (end: number) => {
      parts.push(dir === 'h'
        ? `M${start * U} ${line * U}H${(end + 1) * U}`
        : `M${line * U} ${start * U}V${(end + 1) * U}`)
    }
    for (const i of idxs.slice(1)) {
      if (i !== prev + 1) { flush(prev); start = i }
      prev = i
    }
    flush(prev)
  }
  return parts.join('')
}

/** Door gap: the central part of the unit edge is left open. */
const DOOR_A = 22
const DOOR_B = 78

export interface WallPaths {
  outer: string
  inner: string
  /** the two wall stubs either side of each door */
  jambs: string
  /** thin threshold line across each door gap */
  sills: string
  doors: number
}

/**
 * Walls follow room boundaries computed from `roomOf`. Where two rooms touch, exactly one
 * unit of their shared boundary becomes a door: among the unit edges between that pair, those
 * with no furniture on either side are preferred, and the middle one (in row-major scan
 * order) is taken. Deterministic, and independent of anything the player does.
 */
export function wallPaths(p: Puzzle, furnKeys: ReadonlySet<string>): WallPaths {
  const all = edges(p)
  const pairs = new Map<string, Edge[]>()
  const outer: Edge[] = []
  const inner: Edge[] = []
  for (const e of all) {
    if (e.ra === e.rb) continue
    if (!e.ra || !e.rb) { outer.push(e); continue }
    const key = e.ra < e.rb ? `${e.ra}|${e.rb}` : `${e.rb}|${e.ra}`
    pairs.set(key, [...(pairs.get(key) ?? []), e])
  }
  const doorEdges = new Set<Edge>()
  for (const list of pairs.values()) {
    const free = list.filter(e => !furnKeys.has(e.ka) && !furnKeys.has(e.kb))
    const pool = free.length ? free : list
    doorEdges.add(pool[Math.floor((pool.length - 1) / 2)])
    for (const e of list) if (!doorEdges.has(e)) inner.push(e)
  }
  const doors = [...doorEdges]
  return {
    outer: runs(outer),
    inner: runs(inner),
    jambs: doors.map(e => stub(e, 0, DOOR_A) + stub(e, DOOR_B, U)).join(''),
    sills: doors.map(e => stub(e, DOOR_A, DOOR_B)).join(''),
    doors: doors.length,
  }
}

export interface RoomLabel {
  roomId: string
  name: string
  x: number
  y: number
  w: number
  h: number
  fs: number
}

/** Where a token starts inside its tile (drawing units). Plaques stay above this line. */
export const TOKEN_TOP = 36
/** Plaque offset from the top of its tile: just inside the wall stroke. */
export const LABEL_TOP = 5
const PLAQUE_H = 1.28

/**
 * Label type size in drawing units. About 0.0385 of the plan width keeps the type near 14px at a
 * 390px viewport for 4x4 to 6x6; above that it is capped so the plaque (LABEL_TOP + 1.28 fs)
 * ends above TOKEN_TOP and never touches a token.
 */
export function labelSize(size: number): number {
  const cap = (TOKEN_TOP - 0.5 - LABEL_TOP) / PLAQUE_H
  return Math.min(cap, Math.max(14, 0.0385 * (size * U + PAD * 2)))
}

const CHAR_W = 0.64
const PAD_W = 0.8
const STEPS = [1, 0.9, 0.8, 0.7]
const plaqueW = (name: string, fs: number) => name.length * fs * CHAR_W + fs * PAD_W

interface Spot { c: { row: number; col: number }; fs: number; w: number; cost: number }

/**
 * One plaque per room, laid along the top edge of a tile in the room. The plaque starts on a
 * furniture-free tile and takes the run (consecutive tiles of the room in a row) where it covers
 * the least furniture, shrinking in steps only when that buys a cleaner spot. Tokens start at
 * TOKEN_TOP, below the plaque, so a token in the same tile never covers it. Placement uses the
 * plan only.
 */
export function roomLabels(p: Puzzle, furnKeys: ReadonlySet<string>, furn?: ReadonlyMap<string, Furniture[]>): RoomLabel[] {
  const N = p.size
  const byRoom = new Map<string, { row: number; col: number }[]>()
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const id = roomAt(p, r, c)
      if (id) byRoom.set(id, [...(byRoom.get(id) ?? []), { row: r, col: c }])
    }
  }
  const fs0 = labelSize(N)
  const margin = 8
  const out: RoomLabel[] = []
  for (const room of p.rooms) {
    const cells = byRoom.get(room.id)
    if (!cells?.length) continue
    const inRoom = (r: number, c: number) => roomAt(p, r, c) === room.id
    const free = cells.filter(c => !furnKeys.has(keyOf(c.row, c.col)))
    const starts = free.length ? free : cells
    const runOf = (c: { row: number; col: number }) => {
      let n = 0
      while (inRoom(c.row, c.col + n)) n++
      return n
    }
    // what a plaque of width w starting at c would sit on: a rug is floor, anything else is furniture
    const cover = (c: { row: number; col: number }, w: number) => {
      let cost = 0
      for (let i = 1; i < Math.ceil((w + margin) / U); i++) {
        const k = keyOf(c.row, c.col + i)
        if (!furnKeys.has(k)) continue
        cost += furn?.get(k)?.every(f => f.type === 'rug') ? 0.2 : 1
      }
      return cost
    }
    const spots: Spot[] = []
    for (const c of starts) {
      const avail = runOf(c) * U - margin * 2
      STEPS.forEach((step, i) => {
        const fs = fs0 * step
        const w = plaqueW(room.name, fs)
        if (w <= avail) spots.push({ c, fs, w, cost: cover(c, w) * 3 + i + (c.row * N + c.col) * 0.001 })
      })
    }
    let best = spots.reduce<Spot | null>((a, b) => (!a || b.cost < a.cost ? b : a), null)
    if (!best) {
      // nothing fits even at 70%: squeeze into the longest run
      const c = starts.reduce((a, b) => (runOf(b) > runOf(a) ? b : a), starts[0])
      const avail = runOf(c) * U - margin * 2
      const fs = Math.max(fs0 * 0.55, Math.min(fs0, (fs0 * avail) / plaqueW(room.name, fs0)))
      best = { c, fs, w: Math.min(avail, plaqueW(room.name, fs)), cost: 0 }
    }
    out.push({ roomId: room.id, name: room.name, x: best.c.col * U + margin, y: best.c.row * U + LABEL_TOP, w: best.w, h: best.fs * PLAQUE_H, fs: best.fs })
  }
  return out
}

export type MotifKind = 0 | 1 | 2 | 3
export const MOTIF_COUNT = 4

/** One motif per room; touching rooms get different ones where there are enough to go round. */
export function roomMotifs(p: Puzzle): Map<string, MotifKind> {
  const touch = new Map<string, Set<string>>()
  for (const e of edges(p)) {
    if (e.ra && e.rb && e.ra !== e.rb) {
      touch.set(e.ra, new Set([...(touch.get(e.ra) ?? []), e.rb]))
      touch.set(e.rb, new Set([...(touch.get(e.rb) ?? []), e.ra]))
    }
  }
  const out = new Map<string, MotifKind>()
  p.rooms.forEach((room, i) => {
    const taken = new Set([...(touch.get(room.id) ?? [])].map(id => out.get(id)))
    let pick = (i % MOTIF_COUNT) as MotifKind
    for (let k = 0; k < MOTIF_COUNT; k++) {
      const cand = ((i + k) % MOTIF_COUNT) as MotifKind
      if (!taken.has(cand)) { pick = cand; break }
    }
    out.set(room.id, pick)
  })
  return out
}

/** Small stable hash for per-tile variation (limewash tone, crack shape). */
export function hash(r: number, c: number): number {
  let h = (r * 73856093) ^ (c * 19349663)
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995)
  return (h ^ (h >>> 15)) >>> 0
}
