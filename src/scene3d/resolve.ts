// ============================================================================
// SCENE RESOLVER — turns an authored SceneSpec into world-space geometry.
//
// Pure and deterministic: no three.js, no DOM. Everything the renderer draws
// and everything the validator checks comes from the ResolvedScene produced
// here, so a test can prove "the microwave sits on the counter" with numbers
// rather than a screenshot, and the screenshot can only confirm it.
//
// World units are Kenney units (see units.ts). Objects are axis-aligned
// boxes: furniture faces one of four directions, so a rotated model's
// footprint is still a rectangle. A loose prop's small yaw is folded into a
// conservative axis-aligned box.
//
// Walls are STRUCTURAL: one thickness per wall, from which rectangular
// openings are subtracted. A window or a door is an opening plus an inserted
// Kenney frame — never a Kenney wall slab with a hole in it, because those
// slabs are thicker (0.09) than a plain Kenney wall (0.05), sit off the wall
// line, and are white. Openings can be partial-height (sill/head), so a wall
// piece may be a lintel or a spandrel.
//
// Zones are ARCHITECTURAL: interior cells are the building (finished floor at
// y = 0, shell walls on their grid edges); exterior cells are ground outside
// the envelope (terrain TERRAIN_DROP lower, no shell, a foundation edge where
// they meet the building, a threshold step at every opening); courtyard cells
// are lowered ground inside the shell.
// ============================================================================

import {
  CELL, WALL_HEIGHT, FULL_PARTITION_HEIGHT, PARTITION_HEIGHT, ROOM_PARTITION_HEIGHT, HALF_HEIGHT, FRONT_HEIGHT, SHELL_THICKNESS, PARTITION_THICKNESS,
  TERRAIN_DROP, STOREY_HEIGHT, WINDOW_OPENING, DOOR_OPENING, FRAME_SECTION, FRAME_PROTRUSION,
  makeFrame, type SceneFrame, type Vec3,
} from './units'
import { MODEL_BOUNDS, type KenneyModel } from './catalog.generated'
import { metaOf, type ModelMeta } from './catalog'
import { resolveDoorGeometry, type DoorMember } from './doorGeometry'
import type { CirculationSpec, ExteriorSupportBaySpec, Facing, FloorMaterial, FurnitureSpec, PlanRect, SceneSpec, OpeningSpec, ShellWall, ZoneKind } from './schema'
import { resolveFootprint, resolveStairwell } from './floorGeometry'
import { railingPieces } from './railingGeometry'
import { resolveExteriorSupportBays } from './exteriorSupport'

export interface Box3 { min: Vec3; max: Vec3 }
export interface Rect { minX: number; maxX: number; minZ: number; maxZ: number }

export type OpeningKind = OpeningSpec['kind'] | 'window' | 'entry'

export interface ResolvedOpening {
  kind: OpeningKind
  /** Centre on the wall line, world units. */
  centre: [number, number]
  width: number
  /** Bottom and top of the clear opening. */
  sill: number
  head: number
  /** The clear volume (wall thickness × opening width × sill..head). */
  box: Box3
}

export interface ResolvedWall {
  id: string
  kind: 'shell-back' | 'shell-front' | 'partition' | 'foundation'
  axis: 'x' | 'z'
  /** World endpoints. */
  from: [number, number]
  to: [number, number]
  height: number
  thickness: number
  /** Solid structural pieces after openings are subtracted (may be lintels / spandrels). */
  pieces: Box3[]
  /** Optional visible members; pieces still define the collision barrier. */
  visualPieces?: Box3[]
  openings: ResolvedOpening[]
  /** Procedural window and entry finish members (wood), drawn proud of wall faces. */
  frames: Box3[]
  declaredFreeEnds: Array<'from' | 'to'>
}

export type ObjectKind = 'furniture' | 'rug' | 'door' | 'window' | 'entry' | 'stairs'

export interface ResolvedObject {
  id: string
  model: KenneyModel
  kind: ObjectKind
  logic?: string
  /** Feet position of the footprint centre. */
  position: Vec3
  rotY: number
  facing: Facing
  /** World-space axis-aligned bounds. */
  box: Box3
  footprint: Rect
  parentId?: string
  surface?: string
  /** Wall this object was anchored to, if placed with `against`. */
  againstWall?: string
  /** Render only this named child of the model (a window pane out of wallWindow). */
  part?: string
  /** Procedural architectural members rendered in place of the model, when set. */
  architecturalMembers?: DoorMember[]
  meta: ModelMeta
  /** Kenney size [w, h, d] before rotation (of the rendered part). */
  size: Vec3
}

export interface ResolvedScene {
  puzzleId: string
  floor: number
  n: number
  side: number
  frame: SceneFrame
  walls: ResolvedWall[]
  objects: ResolvedObject[]
  /** Floor material of every cell, [row][col]. */
  floorMaterial: FloorMaterial[][]
  /** Zone of every cell, [row][col]. */
  zoneKind: ZoneKind[][]
  /** Finished ground height of every cell: 0 indoors, −TERRAIN_DROP outdoors. */
  floorY: number[][]
  /** Whether this storey has physical floor at each logical cell. */
  floorPresent: boolean[][]
  /** Authored load-bearing frames, separate from floor occupancy and zone classification. */
  exteriorSupportBays: ExteriorSupportBaySpec[]
  exteriorSupportProblems: string[]
  /** Step boxes on the low side of openings between different ground heights. */
  thresholds: Box3[]
  /** Upper-floor cells with no slab (the stair arrives here), as [col0,row0,col1,row1]. */
  stairwell?: [number, number, number, number]
  /** Normalised continuous opening in cell units (exclusive maximum bounds). */
  stairwellBounds?: PlanRect
  stairwellSource?: 'legacy' | 'bounds'
  circulation?: CirculationSpec
  entry?: { centre: [number, number]; wall: 'north' | 'west' }
  /** Specs that could not be resolved. Each is a hard validation failure. */
  problems: string[]
}

const FACING_ROT: Record<Facing, number> = { S: 0, E: 90, N: 180, W: 270 }
const FACING_DIR: Record<Facing, [number, number]> = { S: [0, 1], E: [1, 0], N: [0, -1], W: [-1, 0] }
const OPPOSITE: Record<Facing, Facing> = { S: 'N', N: 'S', E: 'W', W: 'E' }

export const DOOR_MODEL: KenneyModel = 'doorwayOpen'
export const WINDOW_MODEL: KenneyModel = 'wallWindow'
export const WINDOW_PART = 'window'
export const ENTRY_DOOR_MODEL: KenneyModel = 'doorway'

/** Default structural opening: measured frame width plus 0.02 installation allowance. */
export const DOOR_GAP = MODEL_BOUNDS.doorwayOpen.size[0] + 0.02

export function parseLogic(logic: string): { type: string; row: number; col: number } | null {
  const m = /^([a-z]+)@(\d+),(\d+)$/.exec(logic)
  return m ? { type: m[1], row: Number(m[2]), col: Number(m[3]) } : null
}

/** Footprint dims (world x extent, z extent) of a model turned to `facing`. */
export function turnedSize(model: KenneyModel, facing: Facing): [number, number] {
  const [w, , d] = MODEL_BOUNDS[model].size
  return facing === 'E' || facing === 'W' ? [d, w] : [w, d]
}

function boxAround(cx: number, y: number, cz: number, w: number, h: number, d: number): Box3 {
  return { min: [cx - w / 2, y, cz - d / 2], max: [cx + w / 2, y + h, cz + d / 2] }
}
function rectOf(box: Box3): Rect {
  return { minX: box.min[0], maxX: box.max[0], minZ: box.min[2], maxZ: box.max[2] }
}

interface WallLine { axis: 'x' | 'z'; at: number; a: number; b: number; thickness: number; height: number }

interface Cut { from: number; to: number; sill: number; head: number; kind: OpeningKind; at: number; width: number }

/** Solid pieces of a wall line after subtracting cuts. Full-height cuts split
 *  the run; partial cuts leave a spandrel below the sill and a lintel above. */
function structuralPieces(line: WallLine, cuts: Cut[], extendEnds: boolean): Box3[] {
  const half = line.thickness / 2
  const sorted = [...cuts].sort((p, q) => p.from - q.from)
  const spans: Array<[number, number]> = []
  let cursor = line.a
  for (const c of sorted) {
    if (c.from > cursor + 1e-6) spans.push([cursor, c.from])
    cursor = Math.max(cursor, c.to)
  }
  if (line.b > cursor + 1e-6) spans.push([cursor, line.b])
  const box = (p: number, q: number, y0: number, y1: number): Box3 => line.axis === 'x'
    ? { min: [p, y0, line.at - half], max: [q, y1, line.at + half] }
    : { min: [line.at - half, y0, p], max: [line.at + half, y1, q] }
  const pieces: Box3[] = spans.map(([p, q]) => {
    // extend closed ends by half the thickness so corners meet cleanly
    const p2 = extendEnds && Math.abs(p - line.a) < 1e-6 ? p - half : p
    const q2 = extendEnds && Math.abs(q - line.b) < 1e-6 ? q + half : q
    return box(p2, q2, 0, line.height)
  })
  for (const c of sorted) {
    if (c.sill > 1e-6) pieces.push(box(c.from, c.to, 0, c.sill))
    if (c.head < line.height - 1e-6) pieces.push(box(c.from, c.to, c.head, line.height))
  }
  return pieces
}

function openingOf(line: WallLine, c: Cut): ResolvedOpening {
  const half = line.thickness / 2
  return {
    kind: c.kind,
    centre: line.axis === 'x' ? [c.at, line.at] : [line.at, c.at],
    width: c.width,
    sill: c.sill,
    head: c.head,
    box: line.axis === 'x'
      ? { min: [c.from, c.sill, line.at - half], max: [c.to, c.head, line.at + half] }
      : { min: [line.at - half, c.sill, c.from], max: [line.at + half, c.head, c.to] },
  }
}

/** Four wood members around a window opening, proud of both wall faces. */
function frameMembers(line: WallLine, c: Cut): Box3[] {
  const depth = line.thickness + 2 * FRAME_PROTRUSION
  const half = depth / 2
  const s = FRAME_SECTION
  const mk = (p: number, q: number, y0: number, y1: number): Box3 => line.axis === 'x'
    ? { min: [p, y0, line.at - half], max: [q, y1, line.at + half] }
    : { min: [line.at - half, y0, p], max: [line.at + half, y1, q] }
  return [
    mk(c.from - s, c.to + s, c.sill - s, c.sill),      // sill
    mk(c.from - s, c.to + s, c.head, c.head + s),      // head
    mk(c.from - s, c.from, c.sill, c.head),            // jamb
    mk(c.to, c.to + s, c.sill, c.head),                // jamb
  ]
}

export function resolveScene(spec: SceneSpec, n: number): ResolvedScene {
  const side = n * CELL
  const frame = makeFrame(n)
  const problems: string[] = []
  const walls: ResolvedWall[] = []
  const objects: ResolvedObject[] = []
  const thresholds: Box3[] = []
  const footprint = resolveFootprint(spec, n)
  const stairwell = resolveStairwell(spec, n)
  const exteriorSupport = resolveExteriorSupportBays(spec.exteriorSupportBays, n, spec.floor ?? 0)
  problems.push(...footprint.problems, ...stairwell.problems)
  const floorPresent = footprint.present

  // ---- zones ------------------------------------------------------------------
  const floorMaterial: FloorMaterial[][] = Array.from({ length: n }, () => Array<FloorMaterial>(n).fill('wood'))
  const zoneKind: ZoneKind[][] = Array.from({ length: n }, () => Array<ZoneKind>(n).fill('interior'))
  for (const zone of spec.floors ?? []) {
    const [c0, r0, c1, r1] = zone.cells
    if (c0 < 0 || r0 < 0 || c1 >= n || r1 >= n || c0 > c1 || r0 > r1) { problems.push(`floor zone ${zone.id} is outside the grid`); continue }
    const kind: ZoneKind = zone.kind ?? (zone.material === 'grass' || zone.material === 'dirt' ? 'exterior' : 'interior')
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { floorMaterial[r][c] = zone.material; zoneKind[r][c] = kind }
  }
  const floorY = zoneKind.map(row => row.map(k => (k === 'interior' ? 0 : -TERRAIN_DROP)))
  const inEnvelope = (r: number, c: number) => r >= 0 && c >= 0 && r < n && c < n
    && floorPresent[r][c] && zoneKind[r][c] !== 'exterior'
  const yAt = (x: number, z: number) => {
    const r = Math.min(n - 1, Math.max(0, Math.floor(z / CELL)))
    const c = Math.min(n - 1, Math.max(0, Math.floor(x / CELL)))
    return floorY[r][c]
  }

  // ---- shell -----------------------------------------------------------------
  const features = spec.shell?.features ?? []
  const entry = spec.entry
  const shellLine = (wall: ShellWall, a = 0, b = side): WallLine => {
    const back = wall === 'north' || wall === 'west'
    const height = back ? WALL_HEIGHT : FRONT_HEIGHT
    const at = wall === 'north' || wall === 'west' ? 0 : side
    return { axis: wall === 'north' || wall === 'south' ? 'x' : 'z', at, a, b, thickness: SHELL_THICKNESS, height }
  }
  // Shell exists only along envelope cells: an exterior cell on the grid edge is open ground.
  const shellRuns = (wall: ShellWall): Array<[number, number]> => {
    const runs: Array<[number, number]> = []
    let start: number | null = null
    for (let i = 0; i <= n; i++) {
      const present = i < n && (
        wall === 'north' ? inEnvelope(0, i) : wall === 'south' ? inEnvelope(n - 1, i)
        : wall === 'west' ? inEnvelope(i, 0) : inEnvelope(i, n - 1))
      if (present && start === null) start = i
      if (!present && start !== null) { runs.push([start * CELL, i * CELL]); start = null }
    }
    return runs
  }
  for (const wall of ['north', 'west', 'south', 'east'] as ShellWall[]) {
    const runs = shellRuns(wall)
    const back = wall === 'north' || wall === 'west'
    const wanted: Array<{ at: number; kind: 'window' | 'entry' }> = []
    if (back) {
      for (const f of features.filter(f => f.wall === wall)) wanted.push({ at: f.at * CELL, kind: f.kind === 'window' ? 'window' : 'entry' })
      if (entry && entry.wall === wall) wanted.push({ at: entry.at * CELL, kind: 'entry' })
    }
    runs.forEach(([a, b], runIndex) => {
      const line = shellLine(wall, a, b)
      const cuts: Cut[] = []
      for (const w of wanted) {
        if (w.at < a || w.at > b) continue
        const width = w.kind === 'window' ? WINDOW_OPENING.width : DOOR_OPENING.width
        const sill = w.kind === 'window' ? WINDOW_OPENING.sill : 0
        const head = w.kind === 'window' ? WINDOW_OPENING.head : DOOR_OPENING.head
        if (w.at - width / 2 < a - 1e-6 || w.at + width / 2 > b + 1e-6) { problems.push(`shell ${w.kind} on ${wall} at ${(w.at / CELL).toFixed(2)} runs past the wall`); continue }
        cuts.push({ from: w.at - width / 2, to: w.at + width / 2, sill, head, kind: w.kind, at: w.at, width })
      }
      for (let i = 0; i < cuts.length; i++) for (let j = i + 1; j < cuts.length; j++) {
        if (cuts[i].from < cuts[j].to && cuts[j].from < cuts[i].to) problems.push(`shell features overlap on ${wall}`)
      }
      walls.push({
        id: runs.length > 1 ? `shell-${wall}-${runIndex + 1}` : `shell-${wall}`,
        kind: back ? 'shell-back' : 'shell-front',
        axis: line.axis,
        from: line.axis === 'x' ? [a, line.at] : [line.at, a],
        to: line.axis === 'x' ? [b, line.at] : [line.at, b],
        height: line.height,
        thickness: line.thickness,
        pieces: structuralPieces(line, cuts, true),
        openings: cuts.map(c => openingOf(line, c)),
        frames: cuts.filter(c => c.kind === 'window').flatMap(c => frameMembers(line, c)).concat(
          cuts.filter(c => c.kind === 'entry')
            .flatMap(c => resolveDoorGeometry({
              axis: line.axis,
              centre: c.at,
              wallAt: line.at,
              roughWidth: c.width,
              wallThickness: line.thickness,
              structuralHead: c.head,
            }).members.filter(member => member.role === 'casing').map(member => member.box)),
        ),
        declaredFreeEnds: [],
      })
      // inserts stand on the wall line
      for (const c of cuts) {
        const rotY = line.axis === 'x' ? 0 : 90
        const pos: Vec3 = line.axis === 'x' ? [c.at, c.sill, line.at] : [line.at, c.sill, c.at]
        if (c.kind === 'window') objects.push(makeInsert(`${wall}-window-${c.at.toFixed(2)}`, WINDOW_MODEL, 'window', pos, rotY, WINDOW_PART))
        else objects.push(makeInsert(`${wall}-door-${c.at.toFixed(2)}`, ENTRY_DOOR_MODEL, 'entry', pos, rotY))
      }
    })
    for (const w of wanted) {
      if (!runs.some(([a, b]) => w.at >= a && w.at <= b)) problems.push(`shell ${w.kind} on ${wall} at ${(w.at / CELL).toFixed(2)} has no wall there (exterior zone)`)
    }
  }

  // ---- partitions ----------------------------------------------------------------
  const wallLines = new Map<string, WallLine>()
  for (const w of spec.walls) {
    const [x0, z0] = w.from, [x1, z1] = w.to
    const alongX = Math.abs(z0 - z1) < 1e-9
    const alongZ = Math.abs(x0 - x1) < 1e-9
    if (!alongX && !alongZ) { problems.push(`wall ${w.id} is not axis-aligned`); continue }
    if (alongX && alongZ) { problems.push(`wall ${w.id} has zero length`); continue }
    const axis: 'x' | 'z' = alongX ? 'x' : 'z'
    const at = (alongX ? z0 : x0) * CELL
    const a = Math.min(alongX ? x0 : z0, alongX ? x1 : z1) * CELL
    const b = Math.max(alongX ? x0 : z0, alongX ? x1 : z1) * CELL
    const height = w.height === 'full' ? FULL_PARTITION_HEIGHT
      : w.height === 'room-cutaway' ? ROOM_PARTITION_HEIGHT
      : w.height === 'half' ? HALF_HEIGHT
      : PARTITION_HEIGHT
    const line: WallLine = { axis, at, a, b, thickness: PARTITION_THICKNESS, height }
    wallLines.set(w.id, line)
    const cuts: Cut[] = []
    for (const o of w.openings ?? []) {
      const width = o.width !== undefined ? o.width * CELL : o.kind === 'door' ? DOOR_GAP : CELL
      const c = o.at * CELL
      if (c - width / 2 < a - 1e-6 || c + width / 2 > b + 1e-6) problems.push(`opening at ${o.at} on wall ${w.id} lies outside the wall`)
      const head = o.kind === 'door' ? Math.min(height, DOOR_OPENING.head) : height
      cuts.push({ from: c - width / 2, to: c + width / 2, sill: 0, head, kind: o.kind, at: c, width })
    }
    for (let i = 0; i < cuts.length; i++) for (let j = i + 1; j < cuts.length; j++) {
      if (cuts[i].from < cuts[j].to && cuts[j].from < cuts[i].to) problems.push(`openings overlap on wall ${w.id}`)
    }
    walls.push({
      id: w.id,
      kind: 'partition',
      axis,
      from: axis === 'x' ? [a, at] : [at, a],
      to: axis === 'x' ? [b, at] : [at, b],
      height,
      thickness: line.thickness,
      pieces: structuralPieces(line, cuts, true),
      visualPieces: w.treatment === 'railing'
        ? structuralPieces(line, cuts, true).flatMap(piece => railingPieces(piece, axis)) : undefined,
      openings: cuts.map(c => openingOf(line, c)),
      frames: [],
      // freeEnds are authored against the author's from/to; the resolved run is
      // normalised to ascending coordinates, so swap the labels when needed
      declaredFreeEnds: (w.freeEnds ?? []).map(e => ((alongX ? x0 : z0) > (alongX ? x1 : z1) ? (e === 'from' ? 'to' : 'from') : e)),
    })
    for (const cut of cuts) {
      if (cut.kind !== 'door') continue
      objects.push(makeDoorInsert(`${w.id}-door-${cut.at.toFixed(2)}`, axis, cut.at, at, cut.width, cut.head))
    }
  }

  // ---- foundations and thresholds ------------------------------------------------
  // A foundation edge runs wherever two neighbouring cells sit at different heights.
  const foundationPieces: Box3[] = []
  const half = SHELL_THICKNESS / 2
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const y = floorY[r][c]
    if (floorPresent[r][c] && c + 1 < n && floorPresent[r][c + 1] && floorY[r][c + 1] !== y) {
      const x = (c + 1) * CELL, lo = Math.min(y, floorY[r][c + 1]), hi = Math.max(y, floorY[r][c + 1])
      foundationPieces.push({ min: [x - half, lo, r * CELL - half], max: [x + half, hi, (r + 1) * CELL + half] })
    }
    if (floorPresent[r][c] && r + 1 < n && floorPresent[r + 1][c] && floorY[r + 1][c] !== y) {
      const z = (r + 1) * CELL, lo = Math.min(y, floorY[r + 1][c]), hi = Math.max(y, floorY[r + 1][c])
      foundationPieces.push({ min: [c * CELL - half, lo, z - half], max: [(c + 1) * CELL + half, hi, z + half] })
    }
  }
  // A shell run stands on the finished floor (y = 0). Where the ground behind it is lowered
  // (a courtyard on the grid edge) the wall would hover above a see-through gap, so a skirt
  // closes the gap from the ground up to the wall base.
  for (let i = 0; i < n; i++) {
    const skirts: Array<{ r: number; c: number; box: (y: number) => Box3 }> = [
      { r: 0, c: i, box: y => ({ min: [i * CELL - half, y, -half], max: [(i + 1) * CELL + half, 0, half] }) },
      { r: n - 1, c: i, box: y => ({ min: [i * CELL - half, y, side - half], max: [(i + 1) * CELL + half, 0, side + half] }) },
      { r: i, c: 0, box: y => ({ min: [-half, y, i * CELL - half], max: [half, 0, (i + 1) * CELL + half] }) },
      { r: i, c: n - 1, box: y => ({ min: [side - half, y, i * CELL - half], max: [side + half, 0, (i + 1) * CELL + half] }) },
    ]
    for (const sk of skirts) if (inEnvelope(sk.r, sk.c) && floorY[sk.r][sk.c] < 0) foundationPieces.push(sk.box(floorY[sk.r][sk.c]))
  }
  if (foundationPieces.length) {
    walls.push({
      id: 'foundation', kind: 'foundation', axis: 'x', from: [0, 0], to: [0, 0],
      height: TERRAIN_DROP, thickness: SHELL_THICKNESS, pieces: foundationPieces, openings: [], frames: [], declaredFreeEnds: [],
    })
  }
  for (const w of walls) {
    if (w.kind === 'foundation') continue
    for (const op of w.openings) {
      if (op.kind === 'window') continue
      const [cx, cz] = op.centre
      const eps = 0.02
      const sideA = w.axis === 'x' ? yAt(cx, cz - eps) : yAt(cx - eps, cz)
      const sideB = w.axis === 'x' ? yAt(cx, cz + eps) : yAt(cx + eps, cz)
      const onEdge = w.kind !== 'partition' && (w.axis === 'x' ? (cz <= 0 || cz >= side - 1e-6) : (cx <= 0 || cx >= side - 1e-6))
      if (onEdge || sideA === sideB) continue
      const low = Math.min(sideA, sideB), high = Math.max(sideA, sideB)
      const dir = sideA < sideB ? -1 : 1 // toward the low side
      const depth = 0.3, hgt = (high - low) / 2
      const halfW = op.width / 2
      const t = w.thickness / 2
      thresholds.push(w.axis === 'x'
        ? { min: [cx - halfW, low, dir < 0 ? cz - t - depth : cz + t], max: [cx + halfW, low + hgt, dir < 0 ? cz - t : cz + t + depth] }
        : { min: [dir < 0 ? cx - t - depth : cx + t, low, cz - halfW], max: [dir < 0 ? cx - t : cx + t + depth, low + hgt, cz + halfW] })
    }
  }

  // ---- furniture ------------------------------------------------------------------
  const specById = new Map(spec.furniture.map(f => [f.id, f]))
  const resolved = new Map<string, ResolvedObject>()
  const resolving = new Set<string>()

  const placeFurniture = (f: FurnitureSpec): ResolvedObject | null => {
    if (resolved.has(f.id)) return resolved.get(f.id)!
    if (resolving.has(f.id)) { problems.push(`parent cycle at ${f.id}`); return null }
    resolving.add(f.id)
    const modes = [f.at, f.against, f.on].filter(Boolean).length
    if (modes !== 1) { problems.push(`${f.id}: needs exactly one of at / against / on (has ${modes})`); resolving.delete(f.id); return null }
    if (!(f.model in MODEL_BOUNDS)) { problems.push(`${f.id}: unknown model ${f.model}`); resolving.delete(f.id); return null }
    const meta = metaOf(f.model)
    const size = MODEL_BOUNDS[f.model].size as unknown as Vec3

    let facing: Facing = f.facing ?? 'S'
    let x = 0, y = 0, z = 0
    let parentId: string | undefined, surface: string | undefined, againstWall: string | undefined

    if (f.at) {
      x = f.at[0] * CELL; z = f.at[1] * CELL
      y = yAt(x, z)
    } else if (f.against) {
      const ag = f.against
      let line: WallLine | undefined
      let inward: Facing
      if (ag.wall === 'north' || ag.wall === 'west' || ag.wall === 'south' || ag.wall === 'east') {
        line = shellLine(ag.wall)
        inward = ({ north: 'S', west: 'E', south: 'N', east: 'W' } as const)[ag.wall]
      } else {
        line = wallLines.get(ag.wall)
        if (!line) { problems.push(`${f.id}: against unknown wall ${ag.wall}`); resolving.delete(f.id); return null }
        if (!ag.side) { problems.push(`${f.id}: against an interior wall needs a side`); resolving.delete(f.id); return null }
        const validSides: Facing[] = line.axis === 'x' ? ['N', 'S'] : ['E', 'W']
        if (!validSides.includes(ag.side)) { problems.push(`${f.id}: side ${ag.side} is not a side of wall ${ag.wall}`); resolving.delete(f.id); return null }
        inward = ag.side
      }
      facing = inward
      againstWall = ag.wall
      const [fw, fd] = turnedSize(f.model, facing)
      const along = ag.at * CELL
      const alongExtent = line.axis === 'x' ? fw : fd
      if (along - alongExtent / 2 < line.a - 1e-6 || along + alongExtent / 2 > line.b + 1e-6) {
        problems.push(`${f.id}: at ${ag.at} runs past the end of wall ${ag.wall}`)
      }
      const dir = FACING_DIR[inward]
      const offset = line.thickness / 2 + (ag.gap ?? 0) + (meta.rearGap ?? 0) + (line.axis === 'x' ? fd : fw) / 2
      if (line.axis === 'x') { x = along; z = line.at + dir[1] * offset } else { z = along; x = line.at + dir[0] * offset }
      y = yAt(x, z)
    } else if (f.on) {
      const parentSpec = specById.get(f.on.parent)
      if (!parentSpec) { problems.push(`${f.id}: on unknown parent ${f.on.parent}`); resolving.delete(f.id); return null }
      const parent = placeFurniture(parentSpec)
      if (!parent) { resolving.delete(f.id); return null }
      const surfName = f.on.surface ?? 'top'
      const surf = parent.meta.surfaces?.[surfName]
      if (!surf) { problems.push(`${f.id}: parent ${parent.id} has no surface "${surfName}"`); resolving.delete(f.id); return null }
      if (meta.support !== 'surface') problems.push(`${f.id}: ${f.model} is not a surface prop but is placed on ${parent.id}`)
      else if (meta.requires && !meta.requires.includes(surf.role)) problems.push(`${f.id}: ${f.model} needs a ${meta.requires.join('/')} but ${parent.id} offers a ${surf.role}`)
      facing = f.facing ?? parent.facing
      const [ox, oz] = f.on.offset ?? [0, 0]
      const r = (parent.rotY * Math.PI) / 180
      x = parent.position[0] + ox * Math.cos(r) + oz * Math.sin(r)
      z = parent.position[2] - ox * Math.sin(r) + oz * Math.cos(r)
      y = parent.position[1] + surf.y
      parentId = parent.id
      surface = surfName
    }
    if (meta.support === 'surface' && !f.on) problems.push(`${f.id}: ${f.model} must be placed on a surface (needs \`on\`)`)
    if (meta.support === 'flat' && (f.against || f.on)) problems.push(`${f.id}: a rug goes in \`rugs\`, not furniture`)

    let rotY = FACING_ROT[facing]
    const yaw = meta.loose ? (f.yaw ?? 0) : 0
    rotY += yaw
    let [fw, fd] = turnedSize(f.model, facing)
    if (yaw) {
      const t = Math.abs((yaw * Math.PI) / 180)
      const w2 = fw * Math.cos(t) + fd * Math.sin(t), d2 = fw * Math.sin(t) + fd * Math.cos(t)
      fw = w2; fd = d2
    }
    const box = boxAround(x, y, z, fw, size[1], fd)
    const obj: ResolvedObject = {
      id: f.id, model: f.model, kind: 'furniture', logic: f.logic,
      position: [x, y, z], rotY, facing, box, footprint: rectOf(box),
      parentId, surface, againstWall, meta, size,
    }
    resolved.set(f.id, obj)
    resolving.delete(f.id)
    return obj
  }

  const seen = new Set<string>()
  for (const f of spec.furniture) {
    if (seen.has(f.id)) { problems.push(`duplicate furniture id ${f.id}`); continue }
    seen.add(f.id)
    const obj = placeFurniture(f)
    if (obj) objects.push(obj)
  }
  for (const rug of spec.rugs ?? []) {
    if (!(rug.model in MODEL_BOUNDS)) { problems.push(`${rug.id}: unknown model ${rug.model}`); continue }
    const facing = rug.facing ?? 'S'
    const [fw, fd] = turnedSize(rug.model, facing)
    const size = MODEL_BOUNDS[rug.model].size as unknown as Vec3
    const x = rug.at[0] * CELL, z = rug.at[1] * CELL
    const y = yAt(x, z) + 0.002
    const box = boxAround(x, y, z, fw, size[1], fd)
    objects.push({
      id: rug.id, model: rug.model, kind: 'rug', position: [x, y, z], rotY: FACING_ROT[facing], facing,
      box, footprint: rectOf(box), meta: metaOf(rug.model), size,
    })
  }

  // ---- stairs -----------------------------------------------------------------------
  if (spec.stairs) {
    const s = spec.stairs
    const x = s.at[0] * CELL, z = s.at[1] * CELL
    const y = yAt(x, z)
    const size = MODEL_BOUNDS[s.model].size as unknown as Vec3
    // Kenney flights climb toward +x at rot 0 (the top step is at max x);
    // `facing` names the climb direction, so E is rot 0.
    // Three's positive Y rotation sends +x toward -z (north).
    const climbRot: Record<Facing, number> = { E: 0, S: 270, W: 180, N: 90 }
    const [tw, td] = s.facing === 'E' || s.facing === 'W' ? [size[0], size[2]] : [size[2], size[0]]
    const box = boxAround(x, y, z, tw, size[1], td)
    objects.push({
      id: 'stairs', model: s.model, kind: 'stairs', position: [x, y, z], rotY: climbRot[s.facing], facing: s.facing,
      box, footprint: rectOf(box), meta: { ...metaOf(s.model), tall: true }, size,
    })
    if (Math.abs(size[1] - STOREY_HEIGHT) > 0.08) problems.push(`stairs: ${s.model} rises ${size[1]} but a storey is ${STOREY_HEIGHT}`)
  }

  return {
    puzzleId: spec.puzzleId,
    floor: spec.floor ?? 0,
    n, side, frame, walls, objects, floorMaterial, zoneKind, floorY, floorPresent, thresholds,
    exteriorSupportBays: exteriorSupport.bays,
    exteriorSupportProblems: exteriorSupport.problems,
    stairwell: spec.stairwell,
    stairwellBounds: stairwell.bounds,
    stairwellSource: stairwell.source,
    circulation: spec.circulation,
    entry: entry ? { wall: entry.wall, centre: entry.wall === 'north' ? [entry.at * CELL, 0] : [0, entry.at * CELL] } : undefined,
    problems,
  }
}

/** A Kenney frame standing in an opening: door leaf/frame or the window pane. */
function makeInsert(id: string, model: KenneyModel, kind: ObjectKind, position: Vec3, rotY: number, part?: string): ResolvedObject {
  const full = MODEL_BOUNDS[model].size as unknown as Vec3
  // The window pane part of wallWindow, measured: x 0.313–0.687, y 0.393–1.057, z −0.037..−0.013
  const size: Vec3 = part === WINDOW_PART ? [0.374, 0.664, 0.024] : full
  const facing: Facing = rotY === 90 ? 'E' : 'S'
  const [fw, fd] = facing === 'E' ? [size[2], size[0]] : [size[0], size[2]]
  const box = boxAround(position[0], position[1], position[2], fw, size[1], fd)
  return { id, model, kind, position, rotY, facing, box, footprint: rectOf(box), meta: metaOf(model), size, part }
}

function makeDoorInsert(id: string, axis: 'x' | 'z', centre: number, wallAt: number, roughWidth: number, structuralHead: number): ResolvedObject {
  const position: Vec3 = axis === 'x' ? [centre, 0, wallAt] : [wallAt, 0, centre]
  const rotY = axis === 'x' ? 0 : 90
  const facing: Facing = axis === 'x' ? 'S' : 'E'
  const geometry = resolveDoorGeometry({
    axis,
    centre,
    wallAt,
    roughWidth,
    wallThickness: PARTITION_THICKNESS,
    structuralHead,
  })
  const width = geometry.bounds.max[0] - geometry.bounds.min[0]
  const height = geometry.bounds.max[1] - geometry.bounds.min[1]
  const depth = geometry.bounds.max[2] - geometry.bounds.min[2]
  const size: Vec3 = axis === 'x' ? [width, height, depth] : [depth, height, width]
  return {
    id,
    model: DOOR_MODEL,
    kind: 'door',
    position,
    rotY,
    facing,
    box: geometry.bounds,
    footprint: rectOf(geometry.bounds),
    architecturalMembers: geometry.members,
    meta: metaOf(DOOR_MODEL),
    size,
  }
}

export function opposite(f: Facing): Facing { return OPPOSITE[f] }
export function facingDir(f: Facing): [number, number] { return FACING_DIR[f] }
