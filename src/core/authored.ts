import type {
  Puzzle, Room, Furniture, Person, Cell, Clue, GridSize, Difficulty,
} from './types'
import { furnitureCells, furnitureFootprint } from './types'
import { clueHolds, countSolutions, findMurderer, roomIdAt } from './engine'
import { candidateClues, clueDirectness, pruneClues, clueToText, selectClueTexts, ACCENTS } from './generate'

// ============================================================================
// Hand-authored cases.
//
// Unlike the procedural generator (generate.ts), an authored case's rooms,
// furniture, suspects, and solution are all designed by a human (or an agent
// acting as one) and written to a spec file under src/data/cases/. This
// module turns that spec into a full Puzzle by reusing the SAME
// solver-verified clue-selection machinery the generator uses
// (candidateClues / pruneClues / countSolutions), so an authored case gets
// the same uniqueness guarantee without hand-verifying NP-hard uniqueness.
//
// buildAuthoredPuzzle() throws with a specific, actionable message on any
// invalid layout (furniture overlap, room too small, no unique solution,
// etc.) — the author fixes the spec and reruns, never ships a broken case.
// ============================================================================

export interface AuthoredRoomSpec {
  name: string
  hue: number
  /** Inclusive rect. floor defaults to 0. */
  r0: number; c0: number; r1: number; c1: number
  floor?: number
}

export interface AuthoredPersonSpec {
  name: string
  accentIndex: number // index into generate.ts's ACCENTS palette, for visual consistency
  isVictim?: boolean
  /** Solution cell — where this person actually was. */
  row: number; col: number; floor?: number
}

export interface AuthoredCaseSpec {
  slug: string           // e.g. 'very-easy-2' — must match the catalog plan slot
  difficulty: Difficulty
  size: GridSize
  floors?: number         // 2 for Hard/Expert/Master
  rooms: AuthoredRoomSpec[]
  furniture: Furniture[]  // author places these directly — validated below
  people: AuthoredPersonSpec[]
  /** Directness band clues are drawn from — copy from generate.ts's DIFFICULTY_CONFIG for this tier. */
  maxDirectness: number
  minDirectness: number
  /** Clues that carry authored intent and must survive solver-driven pruning.
   *  Person and room ids use the deterministic p0 / room0 ids assigned above. */
  requiredClues?: Clue[]
  /**
   * Freeze the layout but let the generator's selector choose the clues, from
   * this fixed seed. For cases that began life as procedural layouts and whose
   * hand-built 3D scene pins the exact furniture (see data/cases/frozen-layouts.ts).
   * When set, requiredClues and the directness band are ignored in favour of the
   * tier's own configuration.
   */
  generatorSeed?: number
  /** Author-written intro blurb — this is the one place a "generated" case can't compete. */
  flavor: string
}

const clueKey = (clue: Clue): string => JSON.stringify(
  Object.entries(clue).sort(([a], [b]) => a.localeCompare(b)),
)

function buildRoomOf(rooms: Room[], size: number): string[][] {
  const grid: string[][] = Array.from({ length: size }, () => new Array(size).fill(''))
  for (const room of rooms) for (const c of room.cells) grid[c.row][c.col] = room.id
  return grid
}

/** Every validation a hand-placed layout must pass before it's trusted. */
function validateLayout(rooms: Room[], roomOfByFloor: string[][][], furniture: Furniture[], size: number, floors: number): void {
  // rooms: min 2x2 (except any room literally named 'Hallway'), inside bounds, non-overlapping
  const claimed = new Set<string>()
  for (const room of rooms) {
    const fl = room.floor ?? 0
    if (fl < 0 || fl >= floors) throw new Error(`room ${room.name}: floor ${fl} out of range`)
    for (const c of room.cells) {
      if (c.row < 0 || c.col < 0 || c.row >= size || c.col >= size) {
        throw new Error(`room ${room.name}: cell (${c.row},${c.col}) out of bounds`)
      }
      const key = `${fl}:${c.row},${c.col}`
      if (claimed.has(key)) throw new Error(`room ${room.name}: cell (${c.row},${c.col}) fl${fl} claimed by another room`)
      claimed.add(key)
    }
    const rows = room.cells.map(c => c.row), cols = room.cells.map(c => c.col)
    const h = Math.max(...rows) - Math.min(...rows) + 1, w = Math.max(...cols) - Math.min(...cols) + 1
    if (room.name !== 'Hallway' && Math.min(h, w) < 2) {
      throw new Error(`room ${room.name}: only ${Math.min(h, w)} cell(s) wide — must be >=2 (Hallway exempt)`)
    }
  }

  // furniture: bounds, single room, no overlap with other furniture, room keeps >=1 free cell,
  // and non-square footprints rotated 90/270 must have their box swapped to match (the exact
  // bug this pipeline exists to prevent — see the sofa/TV regression this fixes in generate.ts).
  const occupied = new Set<string>()
  const freeCount: Record<string, number> = {}
  for (const room of rooms) freeCount[room.id] = room.cells.length
  for (const f of furniture) {
    const fl = f.floor ?? 0
    const roomOf = roomOfByFloor[fl]
    if (!roomOf) throw new Error(`furniture ${f.type} at (${f.row},${f.col}): floor ${fl} out of range`)
    const cells = furnitureCells(f)
    let roomId: string | null = null
    for (const c of cells) {
      if (c.row < 0 || c.col < 0 || c.row >= size || c.col >= size) {
        throw new Error(`furniture ${f.type} at (${f.row},${f.col}): footprint cell (${c.row},${c.col}) out of bounds`)
      }
      const rid = roomOf[c.row]?.[c.col]
      if (!rid) throw new Error(`furniture ${f.type} at (${f.row},${f.col}): cell (${c.row},${c.col}) is not in any room`)
      if (roomId === null) roomId = rid
      else if (roomId !== rid) throw new Error(`furniture ${f.type} at (${f.row},${f.col}): footprint spans two rooms`)
      const key = `${fl}:${c.row},${c.col}`
      if (occupied.has(key)) throw new Error(`furniture ${f.type} at (${f.row},${f.col}): cell (${c.row},${c.col}) fl${fl} already occupied by another piece`)
      occupied.add(key)
    }
    freeCount[roomId!] -= cells.length

    const { w, h } = furnitureFootprint(f)
    if (w !== h) {
      const rot = f.rotation ?? 0
      const portrait = rot === 90 || rot === 270
      if (portrait !== (h > w)) {
        throw new Error(
          `furniture ${f.type} at (${f.row},${f.col}): w=${w} h=${h} rotation=${rot} — bounding box ` +
          `doesn't match its own rotation (portrait rotations need h>w). This is the sofa/TV overlap bug class.`,
        )
      }
    }
  }
  for (const [roomId, free] of Object.entries(freeCount)) {
    if (free < 1) {
      const name = rooms.find(r => r.id === roomId)?.name ?? roomId
      throw new Error(`room ${name}: furniture leaves no free cell for its label`)
    }
  }
}

export function buildAuthoredPuzzle(spec: AuthoredCaseSpec, caseNumber: string): Puzzle {
  const floors = spec.floors ?? 1
  const twoFloor = floors > 1

  const rooms: Room[] = spec.rooms.map((r, i) => {
    const cells: Cell[] = []
    for (let row = r.r0; row <= r.r1; row++)
      for (let col = r.c0; col <= r.c1; col++) cells.push({ row, col, floor: r.floor ?? 0 })
    return { id: `room${i}`, name: r.name, hue: r.hue, cells, floor: r.floor ?? 0 }
  })
  const roomOfByFloor: string[][][] = []
  for (let fl = 0; fl < floors; fl++) roomOfByFloor.push(buildRoomOf(rooms.filter(r => (r.floor ?? 0) === fl), spec.size))
  validateLayout(rooms, roomOfByFloor, spec.furniture, spec.size, floors)

  const people: Person[] = spec.people.map((p, i) => ({
    id: `p${i}`, name: p.name, avatarSeed: `${p.name}-${spec.slug}-${i}`,
    accent: ACCENTS[p.accentIndex % ACCENTS.length], isVictim: p.isVictim,
  }))
  const victimIdx = spec.people.findIndex(p => p.isVictim)
  if (victimIdx < 0) throw new Error(`${spec.slug}: no person marked isVictim`)
  const victimId = `p${victimIdx}`
  const solution: Record<string, Cell> = {}
  spec.people.forEach((p, i) => { solution[`p${i}`] = { row: p.row, col: p.col, floor: p.floor ?? 0 } })

  // row/col exclusivity (the puzzle's core constraint): no two people share a row or a column.
  const rowsUsed = new Set<number>(), colsUsed = new Set<number>()
  for (const c of Object.values(solution)) {
    if (rowsUsed.has(c.row)) throw new Error(`${spec.slug}: two people share row ${c.row}`)
    if (colsUsed.has(c.col)) throw new Error(`${spec.slug}: two people share col ${c.col}`)
    rowsUsed.add(c.row); colsUsed.add(c.col)
  }
  if (twoFloor) {
    const storeys = new Set(Object.values(solution).map(c => c.floor ?? 0))
    if (storeys.size < 2) throw new Error(`${spec.slug}: two-floor case but everyone is on one storey`)
  }

  const base: Puzzle = {
    id: spec.slug, title: '', caseNumber, difficulty: spec.difficulty, size: spec.size,
    rooms, roomOf: roomOfByFloor[0],
    ...(twoFloor ? { roomOfByFloor, floors } : {}),
    furniture: spec.furniture, people, clues: [], solution,
    victimId, murdererId: '', flavor: spec.flavor, source: 'builtin',
  }
  const murderer = findMurderer(base, solution)
  if (!murderer) throw new Error(`${spec.slug}: victim's room does not have exactly one other suspect in it`)
  base.murdererId = murderer

  if (spec.generatorSeed !== undefined) {
    base.clues = selectClueTexts(base, spec.difficulty, spec.generatorSeed)
    const real = base.clues.filter(c => c.clue.kind !== 'victim')
    for (const { clue } of real) {
      if (!clueHolds(base, clue, solution)) throw new Error(`${spec.slug}: clue ${JSON.stringify(clue)} is not true for the authored solution`)
    }
    if (countSolutions(base, 2) !== 1) throw new Error(`${spec.slug}: frozen layout does not have a unique solution`)
    return base
  }

  // Solver-driven greedy clue selection (Phase-B style: no arithmetic pre-scoring,
  // since this runs once at author time, not on a hot path).
  const candidates = candidateClues(base)
  const required = spec.requiredClues ?? []
  for (const clue of required) {
    if (!candidates.some(candidate => clueKey(candidate) === clueKey(clue))) {
      throw new Error(`${spec.slug}: required clue ${JSON.stringify(clue)} is not true for the authored solution`)
    }
  }
  const ceiling = candidates.filter(c => clueDirectness(c) <= spec.maxDirectness)
  const pool = ceiling.filter(c => clueDirectness(c) >= spec.minDirectness)
  const byPerson: Record<string, Clue[]> = {}
  for (const p of people) {
    const indirect = pool.filter(c => c.person === p.id)
    byPerson[p.id] = indirect.length ? indirect : ceiling.filter(c => c.person === p.id)
  }
  if (people.some(p => (byPerson[p.id] ?? []).length === 0)) {
    throw new Error(`${spec.slug}: a person has no available clue in the [${spec.minDirectness},${spec.maxDirectness}] directness band`)
  }
  const floorSeed: Clue[] = twoFloor
    ? people.map(p => ({ kind: 'floor' as const, person: p.id, floorNum: solution[p.id].floor ?? 0 }))
    : []
  const acc: Clue[] = [...floorSeed]
  for (const clue of required) {
    if (!acc.some(candidate => clueKey(candidate) === clueKey(clue))) acc.push(clue)
  }
  base.clues = acc.map(c => ({ clue: c, text: '' }))
  let guard = 0
  const maxGuard = 200
  while (countSolutions(base, 2) > 1 && guard++ < maxGuard) {
    const selected = new Set(acc.map(clueKey))
    const remaining = (pool.length ? pool : ceiling).filter(clue => !selected.has(clueKey(clue)))
    if (!remaining.length) break
    let bestClue: Clue | null = null, bestCount = Infinity
    for (const cand of remaining) {
      base.clues = [...acc, cand].map(c => ({ clue: c, text: '' }))
      const n = countSolutions(base, 2)
      if (n < bestCount) { bestCount = n; bestClue = cand; if (n === 1) break }
    }
    base.clues = acc.map(c => ({ clue: c, text: '' }))
    if (!bestClue) break
    acc.push(bestClue)
    base.clues = acc.map(c => ({ clue: c, text: '' }))
  }
  if (countSolutions(base, 2) !== 1) {
    throw new Error(`${spec.slug}: could not reach a unique solution with the given rooms/furniture/clue band — redesign the layout`)
  }
  const chosen = pruneClues(base, acc, required, 'stable')
  for (const clue of chosen) {
    if (!clueHolds(base, clue, solution)) throw new Error(`${spec.slug}: clue ${JSON.stringify(clue)} is not true for the authored solution`)
  }
  base.clues = chosen.map(c => ({ clue: c, text: clueToText(base, c) }))
  base.clues.push({ clue: { kind: 'victim', person: victimId }, text: clueToText(base, { kind: 'victim', person: victimId }) })

  if (countSolutions(base, 2) !== 1) {
    throw new Error(`${spec.slug}: pruning broke uniqueness — this should be impossible, report it`)
  }
  return base
}

/** True when a room id resolves (sanity helper for authoring scripts). */
export function roomNameAt(p: Puzzle, cell: Cell): string {
  return p.rooms.find(r => r.id === roomIdAt(p, cell))?.name ?? ''
}
