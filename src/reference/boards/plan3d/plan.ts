// ============================================================================
// plan3d PLAN — the house as data (pure; no three.js, no DOM).
//
// Everything the renderer draws is derived here from the Puzzle (rooms, room
// map, furniture) and, where one exists, its authored SceneSpec (furniture
// models and positions, rugs, floor zones, shell windows, door hints). Units
// are CELLS: x = column, z = row, y = up, so grid cell (r, c) is the unit square
// [c, c+1] x [r, r+1] and walls sit exactly on its edges.
//
// Rules this module enforces (F-spec section 4):
//   * a wall exists only on a grid line between two different rooms, or a room
//     and the outside; thickness 0.18 inside, 0.27 (1.5x) on the envelope;
//   * a door is a 0.6 gap, never a frame; every room is reachable (>= 1 door)
//     and the house has an entry; doors are placed where the physical
//     furniture leaves the swing clear;
//   * nothing stands higher than the caps (walls 0.30, furniture 0.25).
// ============================================================================

import type { Puzzle } from '../../../core/types'
import { resolveScene, type ResolvedObject } from '../../../scene3d/resolve'
import { hasAuthoredScene, sceneFor } from '../../../scene3d/scenes'
import { CELL } from '../../../scene3d/units'
import type { KenneyModel } from '../../../scene3d/catalog.generated'

export const WALL_HEIGHT_U = 0.30
export const FURNITURE_HEIGHT_U = 0.25
export const WALL_T_INNER = 0.18
export const WALL_T_OUTER = 0.27
export const DOOR_W = 0.6
export const WINDOW_W = 0.5

export type FloorTint = 'wood' | 'tile' | 'rose' | 'olive' | 'stone' | 'outside' | 'void'

export interface PlanRect { x0: number; z0: number; x1: number; z1: number }

export interface PlanObject {
  id: string
  model: KenneyModel
  kind: 'furniture' | 'rug' | 'stairs'
  logic?: string
  /** Feet position of the footprint centre in cells (y in cells). */
  x: number; y: number; z: number
  rotY: number
  /** Vertical squash so the whole stack stays under the furniture cap. */
  sy: number
  /** Footprint in cells (axis-aligned). */
  rect: PlanRect
  /** Top of the (squashed) stack in cells. */
  top: number
  rootId: string
}

export interface PlanWallPiece extends PlanRect { h: number; kind: 'wall' | 'window-lip' }

export interface PlanDoor {
  axis: 'h' | 'v'
  /** Wall line coordinate (z for 'h', x for 'v'). */
  line: number
  /** Centre along the wall. */
  t: number
  width: number
  kind: 'door' | 'open' | 'entry'
  /** +1: leaf swings toward larger z/x; -1 toward smaller. */
  swing: 1 | -1
  /** Hinge on the lower (west / north) jamb if true. */
  hingeLow: boolean
  a: string
  b: string
}

export interface PlanWindow { axis: 'h' | 'v'; line: number; t: number; width: number }

export interface PlanLabel { text: string; x: number; z: number; align: 'center' | 'right'; room: string }

export interface Plan {
  puzzleId: string
  floor: number
  n: number
  /** Floor tint per cell. */
  tint: FloorTint[][]
  /** Room (or 'OUT' / 'VOID') per cell. */
  region: string[][]
  pieces: PlanWallPiece[]
  doors: PlanDoor[]
  windows: PlanWindow[]
  objects: PlanObject[]
  labels: PlanLabel[]
  /** Lamp pool centres (cells). */
  lamps: Array<{ x: number; z: number }>
  /** Seams between cells of the same region: [x0,z0,x1,z1]. */
  seams: Array<[number, number, number, number]>
  /** True when an authored SceneSpec supplied the furniture. */
  authored: boolean
  problems: string[]
}

// ---- room classification ------------------------------------------------------
const RX = {
  outside: /garden|yard|lawn|orchard|patio|porch|terrace|courtyard|deck/i,
  hall: /hall|corridor|passage|landing|foyer|entry|vestibule|stair/i,
  tile: /kitchen|dining|bath|laundry|pantry|toilet|wc|utility/i,
  rose: /bed|nursery|guest/i,
  olive: /office|den|workshop|studio/i,
}

export function tintForRoom(name: string): FloorTint {
  if (RX.outside.test(name)) return 'outside'
  if (RX.hall.test(name)) return 'stone'
  if (RX.tile.test(name)) return 'tile'
  if (RX.rose.test(name)) return 'rose'
  if (RX.olive.test(name)) return 'olive'
  return 'wood'
}
export const isHallName = (name: string) => RX.hall.test(name)

// ---- F-spec door/window hints for the reference case ------------------------------
interface Hint { axis: 'h' | 'v'; line: number; t: number; kind: 'door' | 'entry' }
interface WinHint { axis: 'h' | 'v'; line: number; t: number }
/** F-spec 4.2 / 4.3 for very-easy-1. A hint is honoured when the physical
 *  furniture leaves its swing clear; otherwise the nearest clear spot on the
 *  same wall is used and the deviation is reported by the tests. */
const REFERENCE_HINTS: Record<string, { doors: Hint[]; windows: WinHint[] }> = {
  'very-easy-1': {
    doors: [
      { axis: 'h', line: 2, t: 1.5, kind: 'door' },
      { axis: 'h', line: 2, t: 4.5, kind: 'door' },
      { axis: 'h', line: 3, t: 1.5, kind: 'door' },
      { axis: 'h', line: 3, t: 4.5, kind: 'door' },
      { axis: 'v', line: 6, t: 2.5, kind: 'entry' },
    ],
    windows: [
      { axis: 'h', line: 0, t: 1.5 }, { axis: 'h', line: 0, t: 4.5 },
      { axis: 'v', line: 0, t: 4.5 }, { axis: 'v', line: 6, t: 5.5 },
    ],
  },
}

// ---- geometry helpers ---------------------------------------------------------------
const overlap1 = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0))
const overlapArea = (a: PlanRect, b: PlanRect) => overlap1(a.x0, a.x1, b.x0, b.x1) * overlap1(a.z0, a.z1, b.z0, b.z1)

interface Run { axis: 'h' | 'v'; line: number; from: number; to: number; a: string; b: string; outer: boolean }

/** Rect swept by a door of centre t on a run, on one side (d = +1 / -1), `depth` deep. */
function doorZone(run: Pick<Run, 'axis' | 'line'>, t: number, w: number, d: 1 | -1, depth: number): PlanRect {
  const lo = Math.min(run.line, run.line + d * depth), hi = Math.max(run.line, run.line + d * depth)
  return run.axis === 'h'
    ? { x0: t - w / 2, x1: t + w / 2, z0: lo, z1: hi }
    : { x0: lo, x1: hi, z0: t - w / 2, z1: t + w / 2 }
}

function pieceRect(axis: 'h' | 'v', line: number, p: number, q: number, thick: number): PlanRect {
  const h = thick / 2
  return axis === 'h' ? { x0: p, x1: q, z0: line - h, z1: line + h } : { x0: line - h, x1: line + h, z0: p, z1: q }
}

/** Width of one label character in cells for a layout (11 px type from 80 px cells, else 9 px; Courier is 0.6 em plus 0.12 em tracking). */
export const labelCharU = (cellW: number) => ((cellW >= 80 ? 11 : 9) * 0.72) / cellW

export function buildPlan(puzzle: Puzzle, floor: number, charU = 0.07): Plan {
  const n = puzzle.size
  const problems: string[] = []
  const spec = sceneFor(puzzle, floor)
  const authored = hasAuthoredScene(puzzle.id, floor)
  const resolved = resolveScene(spec, n)
  problems.push(...resolved.problems)

  const roomMap = (floor > 0 && puzzle.roomOfByFloor?.[floor]) || puzzle.roomOf
  const roomName = new Map(puzzle.rooms.map(r => [r.id, r.name] as const))

  // ---- regions & floor tint --------------------------------------------------------
  const region: string[][] = []
  const tint: FloorTint[][] = []
  for (let r = 0; r < n; r++) {
    region.push([]); tint.push([])
    for (let c = 0; c < n; c++) {
      const id = roomMap[r]?.[c] ?? ''
      const name = roomName.get(id) ?? ''
      if (!resolved.floorPresent[r][c]) { region[r].push('VOID'); tint[r].push('void'); continue }
      const mat = resolved.floorMaterial[r][c]
      const outside = resolved.zoneKind[r][c] === 'exterior' || RX.outside.test(name) || mat === 'grass' || mat === 'dirt'
      region[r].push(outside ? 'OUT' : id)
      if (outside) tint[r].push('outside')
      else if (mat === 'tile') tint[r].push('tile')
      else if (mat === 'stone') tint[r].push('stone')
      else tint[r].push(tintForRoom(name) === 'outside' ? 'wood' : tintForRoom(name))
    }
  }
  const reg = (r: number, c: number) => (r < 0 || c < 0 || r >= n || c >= n ? 'OUT' : region[r][c])
  const solid = (id: string) => id !== 'OUT' && id !== 'VOID'

  // ---- objects (footprint, stack squash) ----------------------------------------------
  const resObjs = resolved.objects.filter(o => o.kind === 'furniture' || o.kind === 'rug' || o.kind === 'stairs')
  const byId = new Map(resObjs.map(o => [o.id, o] as const))
  const rootOf = (o: ResolvedObject): ResolvedObject => {
    let cur = o
    for (let i = 0; i < 6 && cur.parentId && byId.has(cur.parentId); i++) cur = byId.get(cur.parentId)!
    return cur
  }
  const stackTop = new Map<string, number>()
  for (const o of resObjs) {
    if (o.kind === 'rug') continue
    const root = rootOf(o).id
    stackTop.set(root, Math.max(stackTop.get(root) ?? 0, o.box.max[1] / CELL))
  }
  const objects: PlanObject[] = resObjs.map(o => {
    const root = rootOf(o).id
    const top = stackTop.get(root) ?? 0
    const sy = o.kind === 'rug' ? 1 : top > FURNITURE_HEIGHT_U ? FURNITURE_HEIGHT_U / top : 1
    const rect: PlanRect = { x0: o.box.min[0] / CELL, x1: o.box.max[0] / CELL, z0: o.box.min[2] / CELL, z1: o.box.max[2] / CELL }
    return {
      id: o.id, model: o.model, kind: o.kind as PlanObject['kind'], logic: o.logic,
      x: o.position[0] / CELL, y: o.kind === 'rug' ? 0.003 : (o.position[1] / CELL) * sy, z: o.position[2] / CELL,
      rotY: o.rotY, sy, rect, top: o.kind === 'rug' ? 0.01 : Math.min(top, FURNITURE_HEIGHT_U) , rootId: root,
    }
  })
  const obstacles = objects.filter(o => o.kind !== 'rug').map(o => o.rect)

  // ---- wall runs on grid lines ---------------------------------------------------------
  const runs: Run[] = []
  const pushEdges = (axis: 'h' | 'v') => {
    for (let line = 0; line <= n; line++) {
      let cur: Run | null = null
      for (let i = 0; i < n; i++) {
        const a = axis === 'h' ? reg(line - 1, i) : reg(i, line - 1)
        const b = axis === 'h' ? reg(line, i) : reg(i, line)
        const need = a !== b && (solid(a) || solid(b)) && a !== 'VOID' && b !== 'VOID'
        if (need && cur && cur.a === a && cur.b === b && Math.abs(cur.to - i) < 1e-9) { cur.to = i + 1; continue }
        if (cur) runs.push(cur)
        cur = need ? { axis, line, from: i, to: i + 1, a, b, outer: a === 'OUT' || b === 'OUT' } : null
      }
      if (cur) runs.push(cur)
    }
  }
  pushEdges('h'); pushEdges('v')
  const thickOf = (run: Run) => (run.outer ? WALL_T_OUTER : WALL_T_INNER)

  // ---- door placement ---------------------------------------------------------------------
  const nameOf = (id: string) => (id === 'OUT' ? 'outside' : roomName.get(id) ?? id)
  const hallLike = (id: string) => id !== 'OUT' && isHallName(nameOf(id))
  const doors: PlanDoor[] = []
  const clash = (run: Run, t: number, w: number) => doors.some(d => d.axis === run.axis && Math.abs(d.line - run.line) < 1e-6 && Math.abs(d.t - t) < (d.width + w) / 2 + 0.25)

  /** Which way the leaf swings: into the room entered from the hall; outward for the entry. */
  const swingFor = (run: Run, kind: PlanDoor['kind']): 1 | -1 => {
    // a is on the smaller side (above / left), b on the larger
    if (kind === 'entry') return run.a === 'OUT' ? -1 : 1
    if (hallLike(run.a) && !hallLike(run.b)) return 1
    if (hallLike(run.b) && !hallLike(run.a)) return -1
    return 1
  }
  /** Score a door at (run, t): higher is better; -Infinity when it cannot be placed. */
  const scoreAt = (run: Run, t: number, w: number, kind: PlanDoor['kind']): number => {
    const half = w / 2 + thickOf(run) / 2 + 0.04
    if (t - half < run.from - 1e-9 || t + half > run.to + 1e-9) {
      // allow the door to touch the run end only when the neighbouring wall continues
      return -Infinity
    }
    if (clash(run, t, w)) return -Infinity
    const sw = swingFor(run, kind)
    let pen = 0
    for (const o of obstacles) {
      pen += 10 * overlapArea(doorZone(run, t, w, sw, w), o)
      pen += 4 * overlapArea(doorZone(run, t, w, sw === 1 ? -1 : 1, 0.4), o)
    }
    return -pen
  }
  const CLEAR = -0.012
  const bestOnRuns = (cands: Run[], w: number, kind: PlanDoor['kind'], want?: number): { run: Run; t: number; score: number } | null => {
    let best: { run: Run; t: number; score: number } | null = null
    for (const run of cands) {
      const mid = (run.from + run.to) / 2
      for (let t = run.from; t <= run.to + 1e-9; t += 0.05) {
        let s = scoreAt(run, t, w, kind)
        if (s === -Infinity) continue
        s -= 0.05 * Math.abs(t - (want ?? mid))
        if (!best || s > best.score + 1e-9) best = { run, t, score: s }
      }
    }
    return best
  }
  const place = (run: Run, t: number, w: number, kind: PlanDoor['kind']) => {
    doors.push({ axis: run.axis, line: run.line, t, width: w, kind, swing: swingFor(run, kind), hingeLow: kind !== 'entry' || run.axis === 'v', a: run.a, b: run.b })
  }
  const runAt = (axis: 'h' | 'v', line: number, t: number): Run | undefined =>
    runs.find(r => r.axis === axis && Math.abs(r.line - line) < 0.06 && t >= r.from - 1e-6 && t <= r.to + 1e-6)

  // hints: F-spec for the reference case, otherwise the authored SceneSpec's own openings
  let hints: Array<{ axis: 'h' | 'v'; line: number; t: number; kind: PlanDoor['kind']; w: number }> = []
  const ref = REFERENCE_HINTS[puzzle.id]
  if (ref && floor === 0) hints = ref.doors.map(d => ({ ...d, w: DOOR_W }))
  else {
    for (const w of spec.walls) {
      const vertical = Math.abs(w.from[0] - w.to[0]) < 1e-9
      for (const op of w.openings ?? []) {
        hints.push({
          axis: vertical ? 'v' : 'h', line: vertical ? w.from[0] : w.from[1], t: op.at,
          kind: op.kind === 'open' ? 'open' : 'door', w: op.kind === 'open' ? Math.min(1.3, op.width ?? 1.3) : DOOR_W,
        })
      }
    }
    if (spec.entry) {
      hints.push(spec.entry.wall === 'north'
        ? { axis: 'h', line: 0, t: spec.entry.at, kind: 'entry', w: DOOR_W }
        : { axis: 'v', line: 0, t: spec.entry.at, kind: 'entry', w: DOOR_W })
    }
  }
  for (const h of hints) {
    const run = runAt(h.axis, h.line, h.t)
    if (!run) continue
    const kind: PlanDoor['kind'] = h.kind === 'entry' && !run.outer ? 'door' : h.kind
    const same = runs.filter(r => r.a === run.a && r.b === run.b)
    const exact = scoreAt(run, h.t, h.w, kind)
    if (exact > CLEAR) { place(run, h.t, h.w, kind); continue }
    const alt = bestOnRuns(same, h.w, kind, h.t)
    if (alt) place(alt.run, alt.t, h.w, kind)
  }

  // connectivity: every room (and the outside) joins one component
  const parent = new Map<string, string>()
  const find = (x: string): string => { if (!parent.has(x)) parent.set(x, x); const p = parent.get(x)!; if (p === x) return x; const r = find(p); parent.set(x, r); return r }
  const union = (x: string, y: string) => { parent.set(find(x), find(y)) }
  const nodes = new Set<string>()
  for (const run of runs) { nodes.add(run.a); nodes.add(run.b) }
  nodes.forEach(find)
  for (const d of doors) union(d.a, d.b)
  for (let guard = 0; guard < 40; guard++) {
    const comps = new Set([...nodes].map(find))
    if (comps.size <= 1) break
    let pick: { run: Run; t: number; score: number } | null = null
    const pairs = new Map<string, Run[]>()
    for (const run of runs) {
      if (find(run.a) === find(run.b)) continue
      const key = `${run.a}|${run.b}`
      pairs.set(key, [...(pairs.get(key) ?? []), run])
    }
    for (const list of pairs.values()) {
      const kind: PlanDoor['kind'] = list[0].outer ? 'entry' : 'door'
      const cand = bestOnRuns(list, DOOR_W, kind)
      if (!cand) continue
      const hallBonus = (hallLike(list[0].a) || hallLike(list[0].b) ? 0.6 : 0) + (list[0].outer && !doors.some(d => d.kind === 'entry') ? 0.3 : 0)
      const s = cand.score + hallBonus + 0.02 * (cand.run.to - cand.run.from)
      if (!pick || s > pick.score) pick = { run: cand.run, t: cand.t, score: s }
    }
    if (!pick) break
    place(pick.run, pick.t, DOOR_W, pick.run.outer ? 'entry' : 'door')
    union(pick.run.a, pick.run.b)
  }
  // a house with no way in gets one on the best envelope wall
  if (!doors.some(d => d.kind === 'entry') && runs.some(r => r.outer)) {
    const cand = bestOnRuns(runs.filter(r => r.outer), DOOR_W, 'entry')
    if (cand) place(cand.run, cand.t, DOOR_W, 'entry')
  }

  // ---- windows -------------------------------------------------------------------------------
  const windows: PlanWindow[] = []
  const winHints: WinHint[] = ref && floor === 0
    ? ref.windows
    : (spec.shell?.features ?? []).filter(f => f.kind === 'window').map(f => f.wall === 'north'
      ? { axis: 'h' as const, line: 0, t: f.at } : { axis: 'v' as const, line: 0, t: f.at })
  for (const w of winHints) {
    const run = runAt(w.axis, w.line, w.t)
    if (!run || !run.outer) continue
    const half = WINDOW_W / 2 + thickOf(run) / 2 + 0.04
    if (w.t - half < run.from || w.t + half > run.to) continue
    if (doors.some(d => d.axis === run.axis && Math.abs(d.line - run.line) < 1e-6 && Math.abs(d.t - w.t) < (d.width + WINDOW_W) / 2 + 0.1)) continue
    windows.push({ axis: run.axis, line: run.line, t: w.t, width: WINDOW_W })
  }

  // ---- wall pieces ---------------------------------------------------------------------------------
  const pieces: PlanWallPiece[] = []
  for (const run of runs) {
    const T = thickOf(run)
    const cuts: Array<{ from: number; to: number; window: boolean }> = []
    for (const d of doors) if (d.axis === run.axis && Math.abs(d.line - run.line) < 1e-6 && d.t >= run.from && d.t <= run.to) cuts.push({ from: d.t - d.width / 2, to: d.t + d.width / 2, window: false })
    for (const w of windows) if (w.axis === run.axis && Math.abs(w.line - run.line) < 1e-6 && w.t >= run.from && w.t <= run.to) cuts.push({ from: w.t - w.width / 2, to: w.t + w.width / 2, window: true })
    cuts.sort((p, q) => p.from - q.from)
    let cursor = run.from
    const solidPiece = (p: number, q: number) => {
      if (q - p < 1e-6) return
      // join corners: extend closed ends by half a thickness
      const p2 = Math.abs(p - run.from) < 1e-9 ? p - T / 2 : p
      const q2 = Math.abs(q - run.to) < 1e-9 ? q + T / 2 : q
      pieces.push({ ...pieceRect(run.axis, run.line, p2, q2, T), h: WALL_HEIGHT_U + (run.outer ? 0.0005 : 0), kind: 'wall' })
    }
    for (const c of cuts) {
      solidPiece(cursor, c.from)
      if (c.window) {
        // two thin faces at the wall's surfaces, as the plan symbol
        const lip = 0.035
        pieces.push({ ...pieceRect(run.axis, run.line - T / 2 + lip / 2, c.from, c.to, lip), h: WALL_HEIGHT_U, kind: 'window-lip' })
        pieces.push({ ...pieceRect(run.axis, run.line + T / 2 - lip / 2, c.from, c.to, lip), h: WALL_HEIGHT_U, kind: 'window-lip' })
      }
      cursor = c.to
    }
    solidPiece(cursor, run.to)
  }

  // ---- seams, labels, lamps ----------------------------------------------------------------------------
  const seams: Plan['seams'] = []
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (region[r][c] === 'VOID') continue
    if (c + 1 < n && region[r][c + 1] === region[r][c]) seams.push([c + 1, r, c + 1, r + 1])
    if (r + 1 < n && region[r + 1][c] === region[r][c]) seams.push([c, r + 1, c + 1, r + 1])
  }
  const labels: PlanLabel[] = []
  const entryDoor = doors.find(d => d.kind === 'entry')
  for (const room of puzzle.rooms) {
    if ((room.floor ?? 0) !== floor) continue
    const cells: Array<[number, number]> = []
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (roomMap[r][c] === room.id && region[r][c] !== 'VOID') cells.push([r, c])
    if (!cells.length) continue
    const rows = cells.map(p => p[0]), cols = cells.map(p => p[1])
    const top = Math.min(...rows), left = Math.min(...cols), right = Math.max(...cols) + 1
    // the label sits in the room's top row band, below the top wall's inner face
    const topWall = runs.find(r => r.axis === 'h' && Math.abs(r.line - top) < 1e-6 && r.to > left && r.from < right)
    const face = topWall ? thickOf(topWall) / 2 : 0
    let align: PlanLabel['align'] = 'center', x = (left + right) / 2
    if (entryDoor && entryDoor.axis === 'v' && entryDoor.line >= right - 1e-6 && Math.abs(entryDoor.line - right) < 1e-6 && entryDoor.t >= top && entryDoor.t <= top + 1.5 && isHallName(room.name)) {
      align = 'right'; x = right - 1 - 0.05
    }
    // F-spec 4.4 gives the default spot; when furniture or a door swing would sit on the
    // text, slide it along the room's top band, then down the room, to the first free spot.
    const textW = room.name.length * charU + 0.1
    const boxOf = (cx: number, cz: number, al: PlanLabel['align']): PlanRect => ({
      x0: al === 'right' ? cx - textW : cx - textW / 2, x1: al === 'right' ? cx : cx + textW / 2, z0: cz - 0.15, z1: cz + 0.04,
    })
    const inRoom = (b: PlanRect) => {
      for (let cc = Math.floor(b.x0 + 0.02); cc <= Math.floor(b.x1 - 0.02); cc++) {
        for (let rr = Math.floor(b.z0 + 0.02); rr <= Math.floor(b.z1 - 0.02); rr++) if (roomMap[rr]?.[cc] !== room.id) return false
      }
      return true
    }
    const blocked = (b: PlanRect) => !inRoom(b)
      // a piece's raised top is drawn up to 0.09 cells north of its footprint
      || obstacles.some(o => overlapArea(b, { ...o, z0: o.z0 - 0.09 }) > 1e-4)
      || doors.some(d => overlapArea(b, doorZone({ axis: d.axis, line: d.line }, d.t, d.width + 0.1, d.swing, d.width + 0.05)) > 1e-4)
    const z0 = top + face + 0.22
    let chosen: { x: number; z: number; align: PlanLabel['align'] } | null = null
    const tryAt = (cx: number, cz: number, al: PlanLabel['align']) => { if (!chosen && !blocked(boxOf(cx, cz, al))) chosen = { x: cx, z: cz, align: al } }
    tryAt(x, z0, align)
    const bottom = Math.max(...rows) + 1
    for (let dz = 0; !chosen && z0 + dz < bottom - 0.1; dz += 0.25) {
      for (let dx = 0; !chosen && dx <= (right - left) / 2; dx += 0.25) {
        tryAt((left + right) / 2 + dx, z0 + dz, 'center')
        tryAt((left + right) / 2 - dx, z0 + dz, 'center')
      }
    }
    const pick = chosen as { x: number; z: number; align: PlanLabel['align'] } | null
    labels.push({ text: room.name.toUpperCase(), x: pick?.x ?? x, z: pick?.z ?? z0, align: pick?.align ?? align, room: room.id })
  }
  const lamps = objects.filter(o => /^lamp(Round|Square)(Floor|Table)$/.test(o.model)).map(o => ({ x: o.x, z: o.z }))

  return { puzzleId: puzzle.id, floor, n, tint, region, pieces, doors, windows, objects, labels, lamps, seams, authored, problems }
}
