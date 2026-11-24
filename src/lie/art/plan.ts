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

/** Label type size in drawing units: stays near 8 to 11 screen px from 4x4 up to 10x10. */
export function labelSize(size: number): number {
  return Math.min(22, Math.max(13, size * 2.5))
}

const CHAR_W = 0.64

/**
 * One plaque per room, laid along the top edge of a furniture-free cell, the first (reading
 * order) where the whole name fits inside the room. Tokens sit lower in their tile than the
 * plaque, so a token in the same cell never covers it. Placement uses the plan only.
 */
export function roomLabels(p: Puzzle, furnKeys: ReadonlySet<string>): RoomLabel[] {
  const N = p.size
  const byRoom = new Map<string, { row: number; col: number }[]>()
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const id = roomAt(p, r, c)
      if (id) byRoom.set(id, [...(byRoom.get(id) ?? []), { row: r, col: c }])
    }
  }
  const fs0 = labelSize(N)
  const out: RoomLabel[] = []
  for (const room of p.rooms) {
    const cells = byRoom.get(room.id)
    if (!cells?.length) continue
    const inRoom = (r: number, c: number) => roomAt(p, r, c) === room.id
    const free = cells.filter(c => !furnKeys.has(keyOf(c.row, c.col)))
    const pool = free.length ? free : cells
    const runOf = (c: { row: number; col: number }) => {
      let n = 0
      while (inRoom(c.row, c.col + n) && (free.length === 0 || !furnKeys.has(keyOf(c.row, c.col + n)))) n++
      return n
    }
    const need = room.name.length * fs0 * CHAR_W + fs0
    const margin = 8
    const fits = pool.find(c => runOf(c) * U - margin * 2 >= need)
    const best = fits ?? pool.reduce((a, b) => (runOf(b) > runOf(a) ? b : a), pool[0])
    const avail = runOf(best) * U - margin * 2
    const fs = fits ? fs0 : Math.max(fs0 * 0.6, Math.min(fs0, (fs0 * avail) / need))
    const w = Math.min(avail, room.name.length * fs * CHAR_W + fs)
    out.push({ roomId: room.id, name: room.name, x: best.col * U + margin, y: best.row * U + margin, w, h: fs * 1.45, fs })
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
