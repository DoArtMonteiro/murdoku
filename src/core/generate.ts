import type {
  Puzzle, GridSize, Difficulty, Room, Cell, Furniture, FurnitureType,
  Person, Clue, ClueText,
} from './types'
import { furnitureCells } from './types'
import { countSolutions, furnitureAt, roomIdAt, findMurderer, cellsAdjacent, besideFurniture, unaryClueHolds, clueHolds } from './engine'

// ============================================================================
// Procedural puzzle generator.
// Approach: lay down rooms + a random valid placement (the answer) + furniture,
// then pick a set of clues that are all TRUE for that answer and together make
// it the UNIQUE solution. Difficulty tunes how direct the clues are.
// ============================================================================

let seed = Date.now() % 2147483647
function rand() { seed = (seed * 48271) % 2147483647; return (seed - 1) / 2147483646 }
export function reseed(s: number) { seed = (s % 2147483647) || 1 }
function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)] }
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1));[a[i], a[j]] = [a[j], a[i]] }
  return a
}

/**
 * Test whether a single unary clue passes for (personId, cell) without reading
 * base.clues. Used in the arithmetic scoring loop to count candidate cells per
 * clue without mutating puzzle state.
 */
function unaryClueOkForCell(p: import('./types').Puzzle, personId: string, cell: Cell, clue: Clue): boolean {
  if (clue.person !== personId) return true // not about this person — never filters
  // The engine owns the meaning of every unary clue kind; relational kinds
  // return true here and are decided by the solver.
  return unaryClueHolds(p, clue, cell)
}

const NAMES = [
  'Alexander', 'Bella', 'Carol', 'Dalia', 'Evangeline', 'Viraj', 'Marco',
  'Priya', 'Nadia', 'Tomas', 'Greta', 'Idris', 'Lena', 'Oscar', 'Yuki',
]
// Per-suspect identity colours. Two constraints, both load-bearing:
//   1. No red/pink hues — red is reserved for the conflict/danger signal, so an
//      accent must never be confusable with it.
//   2. Muted, low-saturation only. These are the L.A. Noire cast; the previous
//      candy palette (#3CC98A, #C86AC8, #3CA0E8 …) was the loudest surviving
//      trace of the old board-game look, because it tints both the selection
//      ring and the avatar plate.
// Hues stay far apart so eight suspects remain mutually distinguishable at a
// glance — this is an identity function, not decoration.
// NOTE: changing these changes generated puzzle data. Bump the catalog cache
// key in catalog.ts or returning players keep the old palette from localStorage.
export const ACCENTS = [
  '#B08D57', // aged brass
  '#6E8CA0', // steel blue
  '#8A7CA8', // dusty violet
  '#7FA083', // sage
  '#6FA0A0', // dusty teal
  '#A89A6A', // olive sand
  '#8E9BB0', // gunmetal slate
  '#9C7F6E', // warm sepia brown
]

// ── Room name specs ──────────────────────────────────────────────────────────
// Each entry carries:
//   outdoor   – must appear on ground floor only AND on an edge-touching rect
//   floors    – allowed floors (absent = any); 0 = ground-preferred, 1 = upper-preferred
//   minCells  – smallest plausible room area for this name
//   maxCells  – largest plausible room area for this name
//   narrow    – true if the room is naturally elongated (Hallway)
//
// Assignment is a weighted best-fit: a name can only be used once per floor,
// outdoor names are hard-filtered when the rect doesn't qualify, and within
// the remaining candidates we pick the name whose size band covers the rect area.
// If no name fits perfectly we degrade to closest fit rather than throwing.
interface RoomSpec {
  outdoor?: boolean
  preferFloor?: 0 | 1   // 0 = ground-preferred, 1 = upper-preferred
  minCells: number
  maxCells: number
  narrow?: boolean       // expects aspect ratio > 2:1
}

const ROOM_SPECS: Record<string, RoomSpec> = {
  'Bedroom':     { preferFloor: 1, minCells: 8,  maxCells: 32 },
  'Kitchen':     { preferFloor: 0, minCells: 8,  maxCells: 28 },
  'Dining Room': { preferFloor: 0, minCells: 8,  maxCells: 28 },
  'Living Room': { preferFloor: 0, minCells: 10, maxCells: 36 },
  'Bathroom':    { preferFloor: 1, minCells: 4,  maxCells: 14 },
  'Porch':       { outdoor: true,  minCells: 3,  maxCells: 12 },
  'Front Yard':  { outdoor: true,  minCells: 4,  maxCells: 20 },
  'Study':       { preferFloor: 1, minCells: 6,  maxCells: 20 },
  'Hallway':     { minCells: 3,  maxCells: 14, narrow: true },
  'Pantry':      { preferFloor: 0, minCells: 3,  maxCells: 10 },
  'Garden':      { outdoor: true,  minCells: 6,  maxCells: 24 },
  'Office':      { preferFloor: 0, minCells: 6,  maxCells: 20 },
}

// Ordered pool — the assignment loop tries names in this order so common rooms
// are assigned before rare ones.
const ROOM_NAMES = Object.keys(ROOM_SPECS)

const ROOM_HUES: Record<string, number> = {
  Bedroom: 45, Kitchen: 25, 'Dining Room': 200, 'Living Room': 265,
  Bathroom: 190, Porch: 108, 'Front Yard': 112, Study: 150, Hallway: 210,
  Pantry: 15, Garden: 108, Office: 230,
}

// Furniture that tends to appear in each room — distinct sets so a Kitchen
// never looks like a Study.
const ROOM_FURNITURE: Record<string, FurnitureType[]> = {
  Bedroom: ['bed', 'lamp', 'rug', 'clock'],
  Kitchen: ['stove', 'fridge', 'counter', 'table'],
  'Dining Room': ['table', 'chair', 'rug', 'lamp'],
  'Living Room': ['sofa', 'tv', 'rug', 'clock'],
  Bathroom: ['bathtub', 'toilet', 'shower'],
  Porch: ['chair', 'plant'],
  'Front Yard': ['plant', 'shrub'],
  Study: ['desk', 'bookshelf', 'lamp', 'box'],
  Hallway: ['rug', 'clock', 'plant'],
  Pantry: ['box', 'fridge', 'counter'],
  Garden: ['shrub', 'plant'],
  Office: ['desk', 'bookshelf', 'chair', 'clock'],
}

// The noun a clue uses for each piece. The article is NOT part of it: "the
// lamp" is only a true description when the house has exactly one lamp, so
// `furnitureLabel` decides between "the" and "a" per case.
const FURNITURE_NOUN: Record<FurnitureType, string> = {
  chair: 'chair', sofa: 'sofa', bed: 'bed', table: 'table',
  box: 'box', rug: 'rug', plant: 'plant', shrub: 'shrub',
  lamp: 'lamp', counter: 'counter', tv: 'TV', bathtub: 'bathtub',
  bookshelf: 'bookshelf', stove: 'stove', fridge: 'fridge',
  clock: 'clock', desk: 'desk', toilet: 'toilet', shower: 'shower',
}

/**
 * "the lamp" when the house (all storeys) holds exactly one lamp, otherwise
 * "a lamp". Using "the" for a type that occurs several times made the sentence
 * ambiguous (up to six clocks and five lamps in a shipped case).
 */
export function furnitureLabel(p: Puzzle, type: FurnitureType): string {
  const count = p.furniture.filter(f => f.type === type).length
  return `${count === 1 ? 'the' : 'a'} ${FURNITURE_NOUN[type]}`
}

// --- furniture footprints --------------------------------------------------
// Pieces that cover more than one cell. Anything not listed is 1×1.
const FURNITURE_FOOTPRINT: Partial<Record<FurnitureType, { w: number; h: number }>> = {
  bed: { w: 2, h: 2 },
  sofa: { w: 2, h: 1 },
  table: { w: 2, h: 1 },
  rug: { w: 2, h: 2 },
  bookshelf: { w: 2, h: 1 },
  counter: { w: 2, h: 1 },
  bathtub: { w: 2, h: 1 },
}

/**
 * One furniture piece per this many cells of room floor area.
 *
 * MEASURED — this is a load-time dial, not a taste one. Furniture is not free:
 * every piece multiplies the onFurniture / besideFurniture clue candidates the
 * selector must score, and crowds the placements the solver must rule out.
 *
 * 12 seeds per tier (avg ms, pieces per case):
 *   4 cells/piece  Hard 342  Master 1085  38.5 pieces  -> 25.6s first load
 *   5 cells/piece  Hard 524  Master  669  31.7 pieces
 *   6 cells/piece  Hard 364  Master  551  27.2 pieces  <- chosen
 * A denser 4 doubled Master and pushed the first-load catalog build past the
 * ~20s it cost before any of this work, which is the single worst thing about
 * opening the app. Six fills the larger rooms without paying that.
 */
const CELLS_PER_PIECE = 6

// --- room layout -----------------------------------------------------------

interface Rect { r0: number; c0: number; r1: number; c1: number } // inclusive

/**
 * Minimum dimension a room side must have. A room that is only 1 cell wide
 * is a corridor — only a Hallway should ever be that narrow, and we handle
 * that through naming, not by generating arbitrarily thin slivers everywhere.
 * Set to 2: ensures every non-hallway room is at least 2×2 = 4 cells.
 */
const MIN_ROOM_DIM = 2

/**
 * Split the board into `targetRooms` rectangles.
 *
 * Improvements over the old code:
 * 1. After choosing a split axis we bias the cut AWAY from the edges so both
 *    halves are at least MIN_ROOM_DIM wide on that axis. Old code used
 *    `c0 + 1 + rand*(w-2)` which could produce 1-cell slivers.
 * 2. We allow a split only when BOTH resulting halves would be >= MIN_ROOM_DIM
 *    on the cut axis. If no such split is possible in either direction we stop.
 * 3. The cut point is biased toward the centre (golden-ratio jitter) rather
 *    than uniformly random, which reduces wildly unequal siblings without
 *    removing variety.
 */
function splitRects(size: number, targetRooms: number): Rect[] {
  let rects: Rect[] = [{ r0: 0, c0: 0, r1: size - 1, c1: size - 1 }]
  let guard = 0
  while (rects.length < targetRooms && guard++ < 60) {
    rects.sort((a, b) => area(b) - area(a))
    const rect = rects.shift()!
    const h = rect.r1 - rect.r0 + 1, w = rect.c1 - rect.c0 + 1
    // A valid vertical split needs at least 2*MIN on the width axis
    const canV = w >= MIN_ROOM_DIM * 2
    // A valid horizontal split needs at least 2*MIN on the height axis
    const canH = h >= MIN_ROOM_DIM * 2
    if (!canV && !canH) { rects.push(rect); break }
    const vertical = canV && (!canH || rand() < 0.5)
    if (vertical) {
      // Cut range: [c0+MIN_ROOM_DIM-1 .. c1-MIN_ROOM_DIM]
      // so the smaller half is at least MIN_ROOM_DIM cells wide.
      // Single rand() call mapped to a centred range (25%–75% of span)
      // avoids the extra rand() the golden-ratio variant required.
      const lo = rect.c0 + MIN_ROOM_DIM - 1
      const hi = rect.c1 - MIN_ROOM_DIM
      const span = hi - lo + 1
      // Map rand() [0,1) to the middle 50% of the valid range
      const cut = lo + Math.floor((0.25 + rand() * 0.5) * span)
      rects.push({ ...rect, c1: cut }, { ...rect, c0: cut + 1 })
    } else {
      const lo = rect.r0 + MIN_ROOM_DIM - 1
      const hi = rect.r1 - MIN_ROOM_DIM
      const span = hi - lo + 1
      const cut = lo + Math.floor((0.25 + rand() * 0.5) * span)
      rects.push({ ...rect, r1: cut }, { ...rect, r0: cut + 1 })
    }
  }
  return rects
}
function area(r: Rect) { return (r.r1 - r.r0 + 1) * (r.c1 - r.c0 + 1) }

/**
 * True when a rect touches any board edge. Outdoor rooms (Front Yard, Garden,
 * Porch) should only appear at the perimeter — a garden on a floating interior
 * rect is nonsensical.
 */
function rectIsEdge(rect: Rect, size: number): boolean {
  return rect.r0 === 0 || rect.c0 === 0 || rect.r1 === size - 1 || rect.c1 === size - 1
}

/**
 * Assign a plausible room name to each rect.
 *
 * Rules (hard):
 *   1. Outdoor names (Front Yard, Garden, Porch) are only assignable on floor 0
 *      AND to a rect touching a board edge. Never upstairs.
 *   2. Names are unique across the whole case. Room names appear verbatim in
 *      clues, so repeating “Bedroom” on two storeys makes the clue ambiguous.
 *
 * Rules (soft, scored):
 *   3. Names carry a preferred floor (0 = ground, 1 = upper). A name used on
 *      the wrong floor loses score but is not banned.
 *   4. Names carry a size band [minCells..maxCells]. The closer the rect area
 *      to the band, the higher the score. Outside the band the score degrades
 *      gracefully — we never throw or leave a room unnamed.
 *   5. Narrow names (Hallway) prefer rects with aspect ratio > 2:1.
 *
 * Degrades gracefully: if the greedy assignment gets stuck (all remaining names
 * are hard-banned for remaining rects), it falls back to whichever name has the
 * best soft score among the full remaining pool (ignoring hard bans), then as
 * a last resort picks any remaining name at random.
 */
function assignRoomNames(
  rects: Rect[],
  size: number,
  floorNum: number,
  excludedNames: ReadonlySet<string> = new Set(),
): string[] {
  const available = shuffle(ROOM_NAMES.filter(name => !excludedNames.has(name)))
  const result: string[] = new Array(rects.length).fill('')

  // Sort rects largest-first so big rooms get first pick of well-fitting names.
  const order = [...rects.keys()].sort((a, b) => area(rects[b]) - area(rects[a]))

  for (const ri of order) {
    const rect = rects[ri]
    const a = area(rect)
    const h = rect.r1 - rect.r0 + 1, w = rect.c1 - rect.c0 + 1
    const aspectRatio = Math.max(h, w) / Math.min(h, w)
    const isEdge = rectIsEdge(rect, size)

    // Score a candidate name for this rect (higher = better fit).
    const score = (name: string): number => {
      const spec = ROOM_SPECS[name]
      if (!spec) return 0
      // Hard ban: outdoor on wrong floor or non-edge rect
      if (spec.outdoor && (floorNum !== 0 || !isEdge)) return -Infinity
      let s = 100
      // Floor preference penalty
      if (spec.preferFloor !== undefined && spec.preferFloor !== floorNum) s -= 20
      // Size band: zero penalty inside band, scaled penalty outside
      if (a < spec.minCells) s -= (spec.minCells - a) * 8
      else if (a > spec.maxCells) s -= (a - spec.maxCells) * 4
      // Narrow preference bonus
      if (spec.narrow && aspectRatio > 2) s += 15
      else if (spec.narrow && aspectRatio <= 2) s -= 10
      return s
    }

    // Best available name by score (hard bans have score -Infinity → skipped)
    let best: string | null = null, bestScore = -Infinity
    for (const name of available) {
      const sc = score(name)
      if (sc > -Infinity && sc > bestScore) { bestScore = sc; best = name }
    }

    if (best === null) {
      // All remaining names are hard-banned — degrade: ignore hard bans
      let fallbackBest: string | null = null, fbScore = -Infinity
      for (const name of available) {
        // Score ignoring the hard ban (outdoor check)
        const spec = ROOM_SPECS[name]
        let s = 100
        if (spec?.preferFloor !== undefined && spec.preferFloor !== floorNum) s -= 20
        if (a < (spec?.minCells ?? 4)) s -= ((spec?.minCells ?? 4) - a) * 8
        else if (a > (spec?.maxCells ?? 30)) s -= (a - (spec?.maxCells ?? 30)) * 4
        if (s > fbScore) { fbScore = s; fallbackBest = name }
      }
      best = fallbackBest ?? available[0]
    }

    result[ri] = best!
    available.splice(available.indexOf(best!), 1)
  }

  return result
}

function buildRooms(
  size: number,
  targetRooms?: number,
  floorNum = 0,
  excludedNames: ReadonlySet<string> = new Set(),
): { rooms: Room[]; roomOf: string[][] } {
  // Room count tracks area: an 8x8 split into 4 rooms gives 16-cell rooms, which
  // makes "In the Kitchen" nearly free information.
  // Target room counts tuned to keep typical room size at 6–12 cells.
  // 6×6=36 cells → 4–5 rooms (7–9 cells each)
  // 7×7=49 cells → 5–6 rooms (8–10 cells each)
  // 8×8=64 cells → 6–7 rooms (9–11 cells each)
  // 9×9=81 cells → 7–8 rooms (10–12 cells each)
  // 10×10=100 cells → 8–9 rooms (11–13 cells each)
  // An explicit per-tier target overrides the ladder. Room size is a genuine
  // design dial pulling two ways: bigger rooms read more like a real floor plan
  // seen from above, but they weaken every room clue, because "In the Kitchen"
  // narrows the board far less when the kitchen is 16 cells than when it is 10.
  const target = targetRooms ?? (
    size <= 6 ? 4 + Math.floor(rand() * 2)
      : size <= 7 ? 5 + Math.floor(rand() * 2)
      : size <= 8 ? 6 + Math.floor(rand() * 2)
      : size <= 9 ? 7 + Math.floor(rand() * 2)
      : 8 + Math.floor(rand() * 2)
  )
  const rects = splitRects(size, target)
  // Assign names by fit: size band + floor preference + outdoor-edge rule
  const names = assignRoomNames(rects, size, floorNum, excludedNames)
  const roomOf: string[][] = Array.from({ length: size }, () => new Array(size).fill(''))
  const rooms: Room[] = rects.map((rect, i) => {
    const id = `room${i}`
    const cells: Cell[] = []
    for (let r = rect.r0; r <= rect.r1; r++)
      for (let c = rect.c0; c <= rect.c1; c++) { cells.push({ row: r, col: c }); roomOf[r][c] = id }
    return { id, name: names[i], hue: ROOM_HUES[names[i]] ?? Math.floor(rand() * 360), cells }
  })
  return { rooms, roomOf }
}

/**
 * Build rooms for a two-floor house. Both floors share the same NxN footprint.
 * Room ids are globally unique: floor-0 uses room0..roomK-1; floor-1 continues
 * from roomK so that roomIdAt never collides across floors and findMurderer
 * works without modification.
 */
function buildTwoFloorRooms(size: number, targetRooms?: number): {
  rooms: Room[]
  roomOf: string[][]          // floor 0 (also roomOfByFloor[0])
  roomOfByFloor: string[][][] // [floor][row][col]
} {
  const { rooms: rooms0, roomOf: roomOf0 } = buildRooms(size, targetRooms, 0)
  const offset = rooms0.length
  const usedNames = new Set(rooms0.map(room => room.name))
  const { rooms: rooms1, roomOf: roomOf1 } = buildRooms(size, targetRooms, 1, usedNames)

  // Re-id floor-1 rooms to avoid collisions with floor-0 room ids
  const roomOf1remapped: string[][] = Array.from({ length: size }, () => new Array(size).fill(''))
  const rooms1final: Room[] = rooms1.map((r, i) => {
    const newId = `room${offset + i}`
    for (let row = 0; row < size; row++)
      for (let col = 0; col < size; col++)
        if (roomOf1[row][col] === r.id) roomOf1remapped[row][col] = newId
    return { ...r, id: newId, cells: r.cells.map(c => ({ ...c, floor: 1 })), floor: 1 }
  })

  // Floor-0 rooms carry floor:0 on their cells
  const rooms0final: Room[] = rooms0.map(r => ({
    ...r,
    cells: r.cells.map(c => ({ ...c, floor: 0 })),
    floor: 0,
  }))

  return {
    rooms: [...rooms0final, ...rooms1final],
    roomOf: roomOf0,
    roomOfByFloor: [roomOf0, roomOf1remapped],
  }
}

// --- random valid placement ------------------------------------------------

function randomPlacement(size: number, people: Person[]): Record<string, Cell> {
  const rows = shuffle([...Array(size).keys()])
  const cols = shuffle([...Array(size).keys()])
  const place: Record<string, Cell> = {}
  people.forEach((p, i) => { place[p.id] = { row: rows[i], col: cols[i] } })
  return place
}

/**
 * Two-floor placement: unique rows+cols globally, suspects split across both
 * floors so EVERY floor has at least one person.
 */
function randomTwoFloorPlacement(size: number, people: Person[]): Record<string, Cell> {
  const rows = shuffle([...Array(size).keys()])
  const cols = shuffle([...Array(size).keys()])
  const place: Record<string, Cell> = {}

  // Assign floor deliberately: first person goes to floor 1, last goes to floor 0,
  // rest are randomly assigned — guaranteeing both floors occupied.
  const n = people.length
  const floors: number[] = people.map(() => Math.round(rand()))
  // Force at least one on each floor
  floors[0] = 0
  floors[n - 1] = 1

  people.forEach((p, i) => {
    place[p.id] = { row: rows[i], col: cols[i], floor: floors[i] }
  })
  return place
}

// --- furniture -------------------------------------------------------------

/**
 * Pieces that should NOT be rotated — rotation is either meaningless for them
 * (a rug looks the same rotated) or would look broken (an asymmetric plant icon
 * that reads fine at 0° looks odd rotated). Keep this list short and principled.
 */
const NO_ROTATE: Set<FurnitureType> = new Set([
  'rug', 'plant', 'shrub', 'lamp', 'clock', 'box',
])

/**
 * Wall-huggers: pieces that belong against a room wall and face into the room.
 * These get rotation computed from their wall position. The 2×1 ones may also
 * be stored as 1×2 when placed on a vertical wall — see tryPlaceWallHugger.
 *
 * Pieces NOT in this set (chair, sofa — freestanding seating) get their
 * rotation from the open-space heuristic instead.
 */
const WALL_HUGGERS: Set<FurnitureType> = new Set([
  'bed', 'bookshelf', 'counter', 'fridge', 'stove', 'desk', 'toilet', 'shower', 'bathtub',
])

/**
 * Seating types — these face INTO the room rather than against a wall.
 */
const SEATING: Set<FurnitureType> = new Set(['chair', 'sofa'])

/**
 * For a wall-hugger anchored at (row, col) inside `roomId`, figure out which
 * board edges the cell touches (all four walls of the room boundary, not just
 * the outer board edge). Returns the best rotation so the piece faces the room
 * interior.
 *
 * Rotation semantics (matches MapGrid renderer):
 *   0   = faces toward the viewer (bottom / south) — default SVG orientation
 *   90  = faces left (west)
 *   180 = faces away from viewer (north)
 *   270 = faces right (east)
 *
 * Wall-hugger convention:
 *   top wall  → rotation 0   (piece faces down / into room)
 *   right wall → rotation 270 (piece faces left / into room)
 *   bottom wall → rotation 180 (piece faces up / into room)
 *   left wall  → rotation 90  (piece faces right / into room)
 */
function wallRotation(
  row: number, col: number, roomId: string,
  roomOf: string[][], boardSize: number,
): 0 | 90 | 180 | 270 {
  const rid = (r: number, c: number) => roomOf[r]?.[c] ?? ''
  const atTop    = row === 0 || rid(row - 1, col) !== roomId
  const atBottom = row === boardSize - 1 || rid(row + 1, col) !== roomId
  const atLeft   = col === 0 || rid(row, col - 1) !== roomId
  const atRight  = col === boardSize - 1 || rid(row, col + 1) !== roomId

  // Prefer the wall that would place the piece most visibly (top/bottom > sides)
  if (atTop)    return 0    // top wall  → face south (into room)
  if (atBottom) return 180  // bottom wall → face north (into room)
  if (atLeft)   return 90   // left wall → face east (into room)
  if (atRight)  return 270  // right wall → face west (into room)
  return 0 // interior cell: default
}

function placeFurniture(
  rooms: Room[], roomOf: string[][], place: Record<string, Cell>,
  floorNum = 0,
  occupiedCells?: Set<string>,
): Furniture[] {
  const furniture: Furniture[] = []
  const roomName = (id: string) => rooms.find(r => r.id === id)!.name
  const usedCount: Partial<Record<FurnitureType, number>> = {}
  const pickVaried = (pool: FurnitureType[], avoid?: Set<FurnitureType>): FurnitureType => {
    const options = (avoid ? pool.filter(t => !avoid.has(t)) : pool)
    const src = options.length ? options : pool
    const min = Math.min(...src.map(t => usedCount[t] ?? 0))
    const leastUsed = src.filter(t => (usedCount[t] ?? 0) === min)
    const t = pick(leastUsed)
    usedCount[t] = (usedCount[t] ?? 0) + 1
    return t
  }

  // Track which cells are occupied by furniture (keyed "floor:row,col").
  // A shared set may be passed in for two-floor calls so keys stay globally unique.
  const cellKey = (r: number, c: number) => `${floorNum}:${r},${c}`
  const ownedOccupied = occupiedCells ?? new Set<string>()
  // Track furniture-free cells per room — every room must keep ≥1 for its label.
  const freeCells: Record<string, Set<string>> = {}
  for (const room of rooms) freeCells[room.id] = new Set(room.cells.map(c => cellKey(c.row, c.col)))

  const boardSize = roomOf.length
  const roomIdAtRC = (row: number, col: number) => roomOf[row]?.[col] ?? ''

  /**
   * Try to place a piece of type `t` anchored at (row, col) with given w/h.
   * Returns true and mutates state on success; returns false on failure.
   * Rules: every cell of the footprint must be (a) in-bounds, (b) inside the
   * SAME room as the anchor, (c) not already occupied by another piece, and
   * (d) after placement the room still has ≥1 free cell.
   *
   * The rotation field is purely visual and does NOT affect the footprint used
   * here — w and h are the authoritative physical footprint. When a 2×1 piece
   * is placed on a vertical wall we call this with w=1, h=2 so the footprint
   * cells are correct and furnitureCells() produces the right answer.
   */
  const tryPlaceWithDims = (
    t: FurnitureType, row: number, col: number, roomId: string,
    w: number, h: number, rotation: 0 | 90 | 180 | 270,
  ): boolean => {
    const piece: Furniture = { type: t, row, col, w, h, floor: floorNum, rotation }
    const cells = furnitureCells(piece)
    for (const { row: r, col: c } of cells) {
      if (r < 0 || c < 0 || r >= boardSize || c >= (roomOf[0]?.length ?? 0)) return false
      if (roomIdAtRC(r, c) !== roomId) return false
      if (ownedOccupied.has(cellKey(r, c))) return false
    }
    if (freeCells[roomId].size - cells.length < 1) return false
    for (const { row: r, col: c } of cells) {
      ownedOccupied.add(cellKey(r, c))
      freeCells[roomId].delete(cellKey(r, c))
    }
    furniture.push(piece)
    return true
  }

  /**
   * Choose rotation and possibly swap w/h for wall-huggers.
   *
   * For a 2×1 wall-hugger (sofa, counter, bathtub, bookshelf):
   *   - On a TOP or BOTTOM wall: keep w=2, h=1, rotation=0/180 (horizontal run).
   *   - On a LEFT or RIGHT wall: swap to w=1, h=2, rotation=90/270 (vertical run).
   *     The footprint swap is correct: furnitureCells will produce a vertical 2-cell
   *     strip that the solver and the renderer both see consistently.
   *
   * For 1×1 wall-huggers and the 2×2 bed: rotation from wallRotation(), no swap needed.
   */
  const tryPlaceWallHugger = (
    t: FurnitureType, row: number, col: number, roomId: string,
  ): boolean => {
    const rot = wallRotation(row, col, roomId, roomOf, boardSize)
    const baseFP = FURNITURE_FOOTPRINT[t] ?? { w: 1, h: 1 }
    // 2×1 pieces on a vertical wall: swap footprint to 1×2
    if (baseFP.h === 1 && baseFP.w === 2 && (rot === 90 || rot === 270)) {
      return tryPlaceWithDims(t, row, col, roomId, 1, 2, rot)
    }
    return tryPlaceWithDims(t, row, col, roomId, baseFP.w, baseFP.h, rot)
  }

  /**
   * For non-wall-huggers (seating, etc.): try the default footprint with the
   * given rotation. For seating we just use rotation 0 initially; the anti-stack
   * logic below may override it.
   */
  const tryPlace = (t: FurnitureType, row: number, col: number, roomId: string): boolean => {
    const fp = FURNITURE_FOOTPRINT[t] ?? { w: 1, h: 1 }
    const rot: 0 | 90 | 180 | 270 = NO_ROTATE.has(t) ? 0 : 0
    return tryPlaceWithDims(t, row, col, roomId, fp.w, fp.h, rot)
  }

  /**
   * Seating placement with anti-adjacency guard.
   *
   * Problem on the live board: two porch chairs placed at adjacent cells both
   * with rotation 0 looked stacked, facing the same direction side by side.
   *
   * Solution: when placing seating, check if an identical piece already sits
   * at an orthogonally adjacent cell. If so, rotate the new piece 180° (face
   * the other way) or pick a non-adjacent cell instead. Also pick rotation
   * toward the room's centroid so seating faces inward.
   */
  const placeSeating = (
    t: FurnitureType, row: number, col: number, roomId: string,
  ): boolean => {
    const fp = FURNITURE_FOOTPRINT[t] ?? { w: 1, h: 1 }
    // Compute rotation toward centroid of room
    const roomCells = rooms.find(r => r.id === roomId)?.cells ?? []
    const centRow = roomCells.reduce((s, c) => s + c.row, 0) / (roomCells.length || 1)
    const centCol = roomCells.reduce((s, c) => s + c.col, 0) / (roomCells.length || 1)
    const dr = centRow - row, dc = centCol - col
    // MapGrid rotation: 0=faces south (down), 90=faces west (left), 180=faces north (up), 270=faces east (right)
    // To face toward centroid: if centroid is below (dr>0) face south (0); above (dr<0) face north (180)
    //                          if centroid is right (dc>0) face east (270); left (dc<0) face west (90)
    let rot: 0 | 90 | 180 | 270
    if (Math.abs(dr) >= Math.abs(dc)) {
      rot = dr > 0 ? 0 : 180
    } else {
      rot = dc > 0 ? 270 : 90
    }

    // Check adjacent cells for an identical piece facing the same direction
    const ORTHO4 = [[-1,0],[1,0],[0,-1],[0,1]] as const
    const adjacentSame = ORTHO4.some(([dr2, dc2]) => {
      const ar = row + dr2, ac = col + dc2
      return furniture.some(f =>
        f.type === t && f.row === ar && f.col === ac &&
        (f.rotation ?? 0) === rot && (f.floor ?? 0) === floorNum
      )
    })
    if (adjacentSame) rot = ((rot + 180) % 360) as 0 | 90 | 180 | 270

    // A non-square footprint (sofa) rotated to face east/west visually turns
    // 90° in place, but its grid bounding box stayed w×h (landscape) — the
    // rotated icon then spilled out of its own row into the row above/below,
    // overlapping whatever furniture sat there. Wall-huggers already swap w/h
    // for this case (see tryPlaceWallHugger); seating needs the same swap.
    if ((rot === 90 || rot === 270) && fp.w !== fp.h) {
      return tryPlaceWithDims(t, row, col, roomId, fp.h, fp.w, rot)
    }
    return tryPlaceWithDims(t, row, col, roomId, fp.w, fp.h, rot)
  }

  // 1) Furnish each room in proportion to its FLOOR AREA.
  //
  // This used to be a flat 1–4 pieces per room, capped by the number of distinct
  // types in the room's pool. That was invisible while rooms averaged ~10 cells,
  // but rooms are now 16–24 cells and the same handful of pieces left them
  // looking abandoned — a 20-cell pantry holding one box, an 18-cell yard with
  // two plants. Furniture has to scale with the space it decorates.
  //
  // Roughly one piece per six cells, so a 16-cell room gets ~3 and a 24-cell
  // room ~4, with a little jitter so houses do not feel stamped out. Repeats are
  // allowed once a room's distinct types run out: a real kitchen has two chairs,
  // and refusing to repeat is what pinned the old count to the pool size.
  //
  // WALL-HUGGER STRATEGY: sort the room's cells so perimeter cells come first.
  // This means wall-hugging pieces (bed, bookshelf, desk, …) get a chance to
  // land on the wall before interior pieces fill up the edges. The cells are
  // shuffled WITHIN the perimeter group (and within the interior group) so the
  // distribution stays varied across seeds.
  for (const room of rooms) {
    const pool = ROOM_FURNITURE[room.name] ?? ['box', 'chair', 'plant']
    const byArea = Math.round(room.cells.length / CELLS_PER_PIECE)
    const maxN = Math.max(1, Math.min(room.cells.length - 1, byArea + 1))
    const n = Math.max(1, Math.min(maxN, byArea + (rand() < 0.5 ? 0 : 1)))

    // Shuffle cells once (same rand() count as old code), then stable-sort so
    // perimeter cells float to the front. Wall-huggers get a chance to land on
    // the edge before interior cells fill those spots.
    const isPerimeter = (c: { row: number; col: number }) => {
      const ORTHO4 = [[-1,0],[1,0],[0,-1],[0,1]] as const
      return ORTHO4.some(([dr, dc]) => roomIdAtRC(c.row + dr, c.col + dc) !== room.id)
    }
    const candidates = shuffle(room.cells).sort((a, b) =>
      (isPerimeter(b) ? 1 : 0) - (isPerimeter(a) ? 1 : 0)
    )

    const inRoom = new Set<FurnitureType>()
    let placed = 0
    for (const cell of candidates) {
      if (placed >= n) break
      if (ownedOccupied.has(cellKey(cell.row, cell.col))) continue
      const t = pickVaried(pool, inRoom.size < pool.length ? inRoom : undefined)
      let ok: boolean
      if (NO_ROTATE.has(t)) {
        ok = tryPlace(t, cell.row, cell.col, room.id)
      } else if (WALL_HUGGERS.has(t)) {
        ok = tryPlaceWallHugger(t, cell.row, cell.col, room.id)
        if (!ok) {
          // Retry: maybe the multi-cell footprint didn't fit with wall orientation;
          // try default footprint with any available rotation
          ok = tryPlace(t, cell.row, cell.col, room.id)
        }
      } else if (SEATING.has(t)) {
        ok = placeSeating(t, cell.row, cell.col, room.id)
      } else {
        ok = tryPlace(t, cell.row, cell.col, room.id)
      }

      if (ok) {
        inRoom.add(t)
        placed++
      } else {
        // Fall back to 1×1 if the multi-cell version didn't fit.
        // Respect the seating anti-adjacency guard for seating fallbacks.
        const small = pool.filter(p => !(FURNITURE_FOOTPRINT[p]))
        if (!small.length) continue
        const t1x1 = pickVaried(small, inRoom.size < small.length ? inRoom : undefined)
        const placed1x1 = SEATING.has(t1x1)
          ? placeSeating(t1x1, cell.row, cell.col, room.id)
          : tryPlace(t1x1, cell.row, cell.col, room.id)
        if (placed1x1) {
          inRoom.add(t1x1)
          placed++
        }
      }
    }
  }

  // 2) Give most people a piece to sit on/beside — but never remove the last
  //    free cell from a room.
  for (const key of Object.keys(place)) {
    const cell = place[key]
    // Only place furniture for people on this floor
    if ((cell.floor ?? 0) !== floorNum) continue
    if (ownedOccupied.has(cellKey(cell.row, cell.col))) continue
    if (rand() < 0.7) {
      const rId = roomIdAtRC(cell.row, cell.col)
      const pool = ROOM_FURNITURE[roomName(rId)] ?? ['chair']
      const t = pickVaried(pool)
      let ok: boolean
      if (WALL_HUGGERS.has(t)) {
        ok = tryPlaceWallHugger(t, cell.row, cell.col, rId)
        if (!ok) ok = tryPlace(t, cell.row, cell.col, rId)
      } else if (SEATING.has(t)) {
        ok = placeSeating(t, cell.row, cell.col, rId)
      } else {
        ok = tryPlace(t, cell.row, cell.col, rId)
      }
      if (!ok) {
        const small = pool.filter(p => !FURNITURE_FOOTPRINT[p])
        if (small.length) tryPlace(pickVaried(small), cell.row, cell.col, rId)
      }
    }
  }
  return furniture
}

// --- candidate clues -------------------------------------------------------

export function candidateClues(p: Puzzle): Clue[] {
  const out: Clue[] = []
  const size = p.size
  const twoFloor = (p.floors ?? 1) > 1
  for (const person of p.people) {
    // Include the victim in the clue pool so the solver can pin their position.
    // (When people < size the victim is otherwise a free variable after the
    //  suspects are placed, making unique solutions impossible to achieve.)
    // The separate kind:'victim' flavour line is appended in generatePuzzle.
    const cell = p.solution[person.id]
    const fl = cell.floor ?? 0
    // room
    out.push({ kind: 'room', person: person.id, roomId: roomIdAt(p, cell) })
    // row / col
    out.push({ kind: 'row', person: person.id, row: cell.row })
    out.push({ kind: 'col', person: person.id, col: cell.col })
    // edge / corner
    const isEdge = cell.row === 0 || cell.col === 0 || cell.row === size - 1 || cell.col === size - 1
    const isCorner = (cell.row === 0 || cell.row === size - 1) && (cell.col === 0 || cell.col === size - 1)
    if (isCorner) out.push({ kind: 'corner', person: person.id })
    else if (isEdge) out.push({ kind: 'edge', person: person.id })
    // on furniture (floor-aware)
    for (const t of furnitureAt(p, cell.row, cell.col, fl)) {
      out.push({ kind: 'onFurniture', person: person.id, furniture: t })
      // only-on if unique
      const others = p.people.some(o => {
        if (o.id === person.id) return false
        const oc = p.solution[o.id]
        return furnitureAt(p, oc.row, oc.col, oc.floor ?? 0).includes(t)
      })
      if (!others) out.push({ kind: 'onlyOnFurniture', person: person.id, furniture: t })
    }
    // beside furniture: see besideFurniture() in engine.ts for the exact meaning
    // (a piece the person is not standing on, touching them, in their room).
    const besideTypes = new Set<FurnitureType>()
    for (const piece of p.furniture) {
      if ((piece.floor ?? 0) === fl && besideFurniture(p, cell, [piece.type])) besideTypes.add(piece.type)
    }
    besideTypes.forEach(t => out.push({ kind: 'besideFurniture', person: person.id, furniture: t }))
    // two-floor-specific clues
    if (twoFloor) {
      // floor membership
      out.push({ kind: 'floor', person: person.id, floorNum: fl })
      // above/below a room
      if (fl > 0) {
        const lowerCell = { row: cell.row, col: cell.col, floor: fl - 1 }
        const roomBelow = roomIdAt(p, lowerCell)
        if (roomBelow) out.push({ kind: 'above', person: person.id, target: roomBelow, targetKind: 'room' })
      }
      const upperCell = { row: cell.row, col: cell.col, floor: fl + 1 }
      const roomAbove = roomIdAt(p, upperCell)
      if (roomAbove) out.push({ kind: 'below', person: person.id, target: roomAbove, targetKind: 'room' })
    }
    // negation: rooms the person was NOT in (one per foreign room)
    for (const room of p.rooms) {
      if (room.id !== roomIdAt(p, cell)) {
        out.push({ kind: 'notRoom', person: person.id, roomId: room.id })
      }
    }
    // relations to others
    for (const other of p.people) {
      if (other.id === person.id) continue
      const oc = p.solution[other.id]
      if (cellsAdjacent(cell, oc)) out.push({ kind: 'besidePerson', person: person.id, other: other.id })
      // never pair anyone with the victim's room in either direction: "the victim
      // was in the same room as X" names the murderer outright
      if (roomIdAt(p, cell) === roomIdAt(p, oc) && other.id !== p.victimId && person.id !== p.victimId)
        out.push({ kind: 'sameRoomAs', person: person.id, other: other.id })
      // negation: not in the same room — skip when other is the victim (would leak murderer identity)
      if (roomIdAt(p, cell) !== roomIdAt(p, oc) && other.id !== p.victimId && person.id !== p.victimId)
        out.push({ kind: 'notSameRoomAs', person: person.id, other: other.id })
      // exact-step directions (more informative) — same floor only
      if ((cell.floor ?? 0) === (oc.floor ?? 0)) {
        if (cell.col === oc.col && cell.row === oc.row - 1) out.push({ kind: 'direction', person: person.id, other: other.id, dir: 'N', steps: 1 })
        if (cell.col === oc.col && cell.row === oc.row + 1) out.push({ kind: 'direction', person: person.id, other: other.id, dir: 'S', steps: 1 })
        if (cell.row === oc.row && cell.col === oc.col - 1) out.push({ kind: 'direction', person: person.id, other: other.id, dir: 'W', steps: 1 })
        if (cell.row === oc.row && cell.col === oc.col + 1) out.push({ kind: 'direction', person: person.id, other: other.id, dir: 'E', steps: 1 })
      }
      // above/below a person (two-floor only)
      if (twoFloor && cell.row === oc.row && cell.col === oc.col && fl !== (oc.floor ?? 0)) {
        if (fl > (oc.floor ?? 0)) out.push({ kind: 'above', person: person.id, target: other.id, targetKind: 'person' })
        else out.push({ kind: 'below', person: person.id, target: other.id, targetKind: 'person' })
      }
    }
  }
  return out
}

// how "direct"/easy a clue is — lower = easier/more concrete
export function clueDirectness(c: Clue): number {
  switch (c.kind) {
    case 'room': return 0
    case 'onFurniture': return 1
    case 'onlyOnFurniture': return 1
    case 'corner': return 2
    case 'row': case 'col': return 2
    case 'floor': return 2          // "Upstairs." — as direct as a row/col clue
    case 'besideFurniture': return 3
    case 'besideAny': return 3
    case 'edge': return 4
    case 'besidePerson': return 4
    case 'sameRoomAs': return 4
    case 'above': case 'below': return 4  // relational, like besidePerson
    case 'direction': return 5
    case 'notRoom': return 5        // weak: excludes 1 of many rooms
    case 'notSameRoomAs': return 5  // weak: relational exclusion
    default: return 6
  }
}

// --- clue text -------------------------------------------------------------

function rowText(row: number, size: number): string {
  if (row === 0) return 'in the top row'
  if (row === size - 1) return 'in the bottom row'
  return `in row ${row + 1}`
}
function colText(col: number, size: number): string {
  if (col === 0) return 'in the leftmost column'
  if (col === size - 1) return 'in the rightmost column'
  return `in column ${col + 1}`
}
function dirWord(dir: string) { return { N: 'north', S: 'south', E: 'east', W: 'west' }[dir]! }

function clueToText(p: Puzzle, c: Clue): string {
  const nameOf = (id: string) => p.people.find(x => x.id === id)?.name ?? '?'
  switch (c.kind) {
    case 'room': return `In the ${p.rooms.find(r => r.id === c.roomId)?.name}.`
    case 'onFurniture': return `On ${furnitureLabel(p, c.furniture)}.`
    case 'onlyOnFurniture': return `The only person on ${furnitureLabel(p, c.furniture)}.`
    case 'besideFurniture': return `Beside ${furnitureLabel(p, c.furniture)}.`
    case 'besideAny': return `Beside ${c.furniture.map(f => furnitureLabel(p, f)).join(' or ')}.`
    case 'row': return `${cap(rowText(c.row, p.size))}.`
    case 'col': return `${cap(colText(c.col, p.size))}.`
    case 'edge': return `On the outer edge of the board.`
    case 'corner': return `In a corner of the board.`
    case 'besidePerson': return `Right beside ${nameOf(c.other)}.`
    case 'sameRoomAs': return `In the same room as ${nameOf(c.other)}.`
    case 'direction': {
      const s = c.steps ? (c.steps === 1 ? 'one' : `${c.steps}`) : ''
      const unit = c.dir === 'N' || c.dir === 'S' ? 'row' : 'column'
      return c.steps
        ? `Exactly ${s} ${unit}${c.steps > 1 ? 's' : ''} ${dirWord(c.dir)} of ${nameOf(c.other)}.`
        : `Somewhere ${dirWord(c.dir)} of ${nameOf(c.other)}.`
    }
    case 'victim': return `The victim — found alone with the murderer.`
    case 'floor': return c.floorNum === 0 ? `On the ground floor.` : `Upstairs.`
    case 'above': {
      if (c.targetKind === 'room') {
        const room = p.rooms.find(r => r.id === c.target)
        return `Directly above the ${room?.name ?? c.target}.`
      }
      return `Directly above ${nameOf(c.target)}.`
    }
    case 'below': {
      if (c.targetKind === 'room') {
        const room = p.rooms.find(r => r.id === c.target)
        return `Directly below the ${room?.name ?? c.target}.`
      }
      return `Directly below ${nameOf(c.target)}.`
    }
    case 'notRoom': {
      const room = p.rooms.find(r => r.id === c.roomId)
      return `Never set foot in the ${room?.name ?? c.roomId}.`
    }
    case 'notSameRoomAs':
      return `Was not in the same room as ${nameOf(c.other)}.`
  }
}
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1) }

// --- selection -------------------------------------------------------------

/**
 * `maxDirectness` admits progressively vaguer clues as difficulty rises.
 * `minDirectness` is the other half of the dial, and it is what actually makes
 * the top tiers hard: it BANS the most direct clue kinds, so a suspect can no
 * longer be handed "In the Study" (directness 0) and must instead be
 * triangulated from relational statements. Raising the grid size alone only
 * makes a puzzle longer; raising the floor makes it harder.
 */
const DIFF_CONFIG: Record<Difficulty, { size: GridSize; people: number; maxDirectness: number; minDirectness: number; floors?: number; rooms?: number }> = {
  // `rooms` is a MEASURED choice, not a taste one. A house should read as a
  // floor plan seen from above, which means rooms made of many squares — the
  // old size-derived ladder produced ~9.8-cell rooms that looked like cubicles.
  // Fewer, larger rooms cost nothing and on the two-floor tiers are FASTER:
  // the generator needs the victim's room to have a spare cell for the
  // murderer, and cramped rooms fail that test, wasting whole attempts.
  //
  // Measured, 12 seeds/tier, quiet machine (ms avg, cells per room):
  //   Hard   6.5 rooms 249ms  9.8 cells  ->  4 rooms 270ms 16.0 cells
  //   Master 6.5 rooms 645ms  9.8 cells  ->  4 rooms 488ms 16.0 cells  (faster)
  // The alternative, a 9x9 grid at 5 rooms, buys the same 16-cell rooms for
  // 435ms Hard / 1182ms Master — 2.4x the Master cost for the same result.
  // The grid never needed to grow; the rooms did.
  //
  // The cost is paid in clue count: a 16-cell room narrows the board less than
  // a 10-cell one, so "In the Kitchen" is weaker information and cases need
  // about one more clue (Hard 9.2 -> 10.3). That is the honest trade.
  'Very Easy': { size: 6, people: 4, maxDirectness: 3, minDirectness: 0, rooms: 3 },
  'Easy':      { size: 7, people: 4, maxDirectness: 4, minDirectness: 0, rooms: 4 },
  'Medium':    { size: 8, people: 5, maxDirectness: 5, minDirectness: 0, rooms: 4 },
  // Two-floor enabled. Hard uses 8×8/5-person, Expert 8×8/6-person (slightly
  // tighter than 9×9 but well within budget), Master is capped at 8×8/6-person
  // with minDirectness=1 — a 10×10 two-floor board would still exceed 400ms
  // even with the optimised selector. The information-driven greedy (Phase A
  // arithmetic + Phase B cap-2 solver) brings Hard to ~5ms/puzzle and keeps
  // Expert and Master within the budget.
  'Hard':      { size: 8, people: 5, maxDirectness: 6, minDirectness: 0, floors: 2, rooms: 4 },
  'Expert':    { size: 8, people: 6, maxDirectness: 6, minDirectness: 1, floors: 2, rooms: 4 },
  'Master':    { size: 8, people: 6, maxDirectness: 6, minDirectness: 1, floors: 2, rooms: 4 },
}

/**
 * Exposed so a board size can be swept and MEASURED before it is chosen.
 * Generation cost grows faster than the cell count — more cells with the same
 * number of suspects means more candidate placements to rule out — and the app
 * builds the whole catalog on first load, so board size is a load-time decision
 * as much as an aesthetic one. Measure, then set it.
 */
export const DIFFICULTY_CONFIG = DIFF_CONFIG

/**
 * Choose the clues for a finished layout (rooms, furniture, cast and solution
 * already in `base`). Returns the chosen clues once the engine confirms the
 * solution is unique, or null when this layout cannot be pinned within the
 * tier's directness band.
 *
 * Split out of generatePuzzle so a layout can be re-derived without rebuilding
 * it: see buildAuthoredPuzzle's `generatorSelection` option. The random draws
 * made here are exactly the ones generatePuzzle made inline before the split.
 */
function selectCluesForLayout(
  base: Puzzle,
  difficulty: Difficulty,
  cfg: { maxDirectness: number; minDirectness: number },
  relaxed: boolean,
): Clue[] | null {
  const people = base.people
  const twoFloor = (base.floors ?? 1) > 1
  const victim = people.find(x => x.id === base.victimId)!
  // candidate clues, biased toward the difficulty's directness
  const ceiling = candidateClues(base).filter(c => clueDirectness(c) <= cfg.maxDirectness)
  // The floor is a preference, not a hard gate: a suspect whose only available
  // clues are direct ones still gets a clue rather than failing the whole
  // attempt. Otherwise a Master board with one tiny room could never generate.
  const floorLevel = relaxed ? 0 : cfg.minDirectness
  const pool = ceiling.filter(c => clueDirectness(c) >= floorLevel)
  // Build clue pools for ALL people including the victim, so the victim's
  // position can be pinned when people < size (otherwise the victim is a free
  // variable after the suspects are placed → no unique solution is achievable).
  const byPerson: Record<string, Clue[]> = {}
  for (const person of people) {
    const indirect = pool.filter(c => c.person === person.id)
    const any = ceiling.filter(c => c.person === person.id)
    byPerson[person.id] = (indirect.length ? indirect : any)
      .sort((a, b) => clueDirectness(a) - clueDirectness(b))
  }
  // Every person (including victim) must have at least one available clue.
  if (people.some(p => (byPerson[p.id] ?? []).length === 0)) return null

  // ---- For two-floor puzzles, seed with a floor clue per person (halves
  // each person's unary candidate space immediately).
  const floorSeed: Clue[] = twoFloor
    ? people.map(person => {
        const fl = (base.solution[person.id].floor ?? 0)
        return { kind: 'floor' as const, person: person.id, floorNum: fl }
      })
    : []

  // ---- Information-driven greedy clue selection. ----
  //
  // PHASE A: Arithmetic scoring (no solver calls).
  //   Maintain cands[personId] = set of cells still compatible with all chosen
  //   unary clues for that person. Score a candidate clue by the log2 reduction
  //   it would produce in that person's candidate set (lower total = better).
  //   Loop: always pick the best-scoring unary clue not yet in the set.
  //   Terminate when countSolutions(base, 2) === 1.
  //
  // PHASE B: Solver-tested tail (cap-2, for relational clues).
  //   If Phase A stalls (no candidate improves the score OR we ran out of
  //   unary candidates), switch to per-candidate solver calls at cap 2 until
  //   unique. This is the old greedy but cheap: countSolutions is ~3ms.
  //
  // Fast path: during the search we assign base.clues without calling
  // toClueText (empty text string). The real text is generated once at the end.

  /** Assign clues to base without building text strings — for the hot loop. */
  const setCluesFast = (clues: Clue[]) => {
    base.clues = clues.map(c => ({ clue: c, text: '' }))
  }

  /** Unary kinds that shrink one person's cell set. */
  const isUnaryKind = (c: Clue): boolean => {
    switch (c.kind) {
      case 'room': case 'row': case 'col': case 'edge': case 'corner':
      case 'onFurniture': case 'onlyOnFurniture': case 'besideFurniture':
      case 'besideAny': case 'floor': case 'above': case 'below':
      case 'notRoom':
        // above/below with targetKind==='person' are relational; keep only room-targeted ones
        if (c.kind === 'above' || c.kind === 'below') return c.targetKind === 'room'
        return true
      default:
        return false
    }
  }

  /** Count cells passing a single unary clue for personId — pure, no mutation. */
  const countCellsForClue = (clue: Clue, personId: string): number => {
    const floorCount = twoFloor ? 2 : 1
    const N = base.size
    let count = 0
    for (let fl = 0; fl < floorCount; fl++) {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const cell: Cell = twoFloor ? { row: r, col: c, floor: fl } : { row: r, col: c }
          if (unaryClueOkForCell(base, personId, cell, clue)) count++
        }
      }
    }
    return count
  }

  // Build initial candidate sets from the floor-seed clues (they're unary).
  // cands[id] = number of cells still compatible with current unary clues.
  // We track counts (not actual sets) since we only need log2 for scoring.
  const candidateCounts: Record<string, number> = {}
  const totalCells = (twoFloor ? 2 : 1) * base.size * base.size
  for (const p of people) {
    if (twoFloor) {
      // Floor seed already halves the space — each person is on one floor
      candidateCounts[p.id] = base.size * base.size
    } else {
      candidateCounts[p.id] = totalCells
    }
  }

  const acc: Clue[] = [...floorSeed]
  // Update counts for floor seeds
  for (const clue of floorSeed) {
    candidateCounts[clue.person] = base.size * base.size // floor halves 2N²→N²
  }

  // Start with the best initial unary clue per person (smallest candidate count)
  for (const p of people) {
    const unary = byPerson[p.id].filter(isUnaryKind)
    if (unary.length === 0) continue
    let bestClue: Clue | null = null
    let bestCount = Infinity
    for (const c of unary) {
      const cnt = countCellsForClue(c, p.id)
      if (cnt < bestCount) { bestCount = cnt; bestClue = c }
    }
    if (bestClue) {
      acc.push(bestClue)
      candidateCounts[bestClue.person] = bestCount
    }
  }

  setCluesFast(acc)

  // Phase A: arithmetic greedy — add unary clues by best log2-shrinkage
  let phaseAGuard = 0
  while (countSolutions(base, 2) > 1 && phaseAGuard++ < 80) {
    const remaining = (pool.length ? pool : ceiling).filter(c => !acc.includes(c) && isUnaryKind(c))
    if (remaining.length === 0) break

    let bestClue: Clue | null = null
    let bestScore = Infinity // lower = better (more shrinkage)
    for (const cand of remaining) {
      const cnt = countCellsForClue(cand, cand.person)
      // Score = log2 of new count (lower means more constrained)
      const score = Math.log2(Math.max(cnt, 1))
      // Only add if it actually shrinks this person's candidates
      if (cnt < (candidateCounts[cand.person] ?? totalCells) && score < bestScore) {
        bestScore = score
        bestClue = cand
      }
    }

    if (!bestClue) break // Phase A stalled — no unary clue helps further
    acc.push(bestClue)
    candidateCounts[bestClue.person] = Math.pow(2, bestScore)
    setCluesFast(acc)
  }

  // Phase B: solver-tested tail — cap-2 per candidate, for relational clues
  // and any remaining ambiguity Phase A couldn't resolve.
  let phaseBGuard = 0
  const maxPhaseBGuard = twoFloor ? 50 : 40
  while (countSolutions(base, 2) > 1 && phaseBGuard++ < maxPhaseBGuard) {
    const preferred = (pool.length ? pool : ceiling).filter(c => !acc.includes(c))
    const remaining = preferred.length ? preferred : ceiling.filter(c => !acc.includes(c))
    if (!remaining.length) break
    // Sample 30 randomly; if none reduce the count, try the full set once.
    const sample = shuffle(remaining).slice(0, 30)
    let bestClue: Clue | null = null, bestCount = Infinity
    for (const cand of sample) {
      setCluesFast([...acc, cand])
      const n = countSolutions(base, 2)
      if (n < bestCount) { bestCount = n; bestClue = cand; if (n === 1) break }
    }
    // If the 30-sample didn't find any improvement, try remaining candidates we missed.
    if (!bestClue && remaining.length > 30) {
      const missed = remaining.filter(c => !sample.includes(c))
      for (const cand of missed) {
        setCluesFast([...acc, cand])
        const n = countSolutions(base, 2)
        if (n < bestCount) { bestCount = n; bestClue = cand; if (n === 1) break }
      }
    }
    setCluesFast(acc) // restore
    if (!bestClue) break
    acc.push(bestClue)
    setCluesFast(acc)
  }

  let chosen: Clue[] | null = acc

  // ---- Prune: drop any clue the solution doesn't need, but keep at least
  // one clue per suspect so every card carries information.
  chosen = pruneClues(base, chosen)

  // Reserve a slot for a NEGATION clue at the top tiers.
  //
  // notRoom and notSameRoomAs were implemented, tested, and then chosen zero
  // times out of 142 generated clues: the selector ranks candidates by how
  // much they shrink a person's candidate set, and a negation clue is weak by
  // construction (it excludes one room out of many), so it always lost. A
  // clue kind that never fires is worse than one that does not exist.
  //
  // Adding a clue that is TRUE of the solution can only remove rival
  // solutions, never add one, so uniqueness is preserved by construction and
  // this cannot make a case unsolvable. Capped at one per case: negation is
  // interesting once and tedious in bulk.
  if (difficulty === 'Expert' || difficulty === 'Master') {
    const alreadyNegated = (chosen ?? []).some(c => c.kind === 'notRoom' || c.kind === 'notSameRoomAs')
    if (!alreadyNegated) {
      const negations = ceiling.filter(c => c.kind === 'notRoom' || c.kind === 'notSameRoomAs')
      // Prefer a suspect who is not already carrying several clues, so one
      // card does not become a wall of text.
      const load = (id: string) => (chosen ?? []).filter(c => c.person === id).length
      const best = negations
        .filter(c => c.person !== victim.id)
        .sort((a, b) => load(a.person) - load(b.person))[0]
      if (best) chosen = [...(chosen ?? []), best]
    }
  }

  // Defence in depth: a clue the engine itself cannot confirm against the
  // stored solution must never ship. The candidates are built from the
  // solution so this cannot fire today; it exists so that a future change to
  // a predicate fails loudly here instead of printing a false sentence.
  if (!chosen.every(c => clueHolds(base, c, base.solution))) return null
  base.clues = toClueText(base, chosen)
  // A two-floor case where everybody ends up on one storey is a single-floor
  // case with a decorative upstairs: the floor clues carry no information and
  // "directly above" can never fire. randomPlacement tries to force somebody
  // onto each floor, but measured over real seeds that guarantee did not always
  // survive into the final solution, so reject it here where it is provable
  // and let the attempt loop try again.
  // Quality bar, not a hard gate: rejecting outright starved generation and
  // made some seeds throw. Enforced for the first 80% of attempts, then
  // dropped so a puzzle always gets produced.
  if (twoFloor && !relaxed) {
    const storeys = new Set(Object.values(base.solution).map(c => c.floor ?? 0))
    if (storeys.size < 2) return null
  }

  return countSolutions(base, 2) === 1 ? chosen : null
}

/** Build one full puzzle. Retries internally until a unique one is produced. */
export function generatePuzzle(
  difficulty: Difficulty,
  id: string,
  caseNumber: string,
  /** Internal: forces a single storey after the two-floor attempts are spent. */
  forceSingleFloor = false,
): Puzzle {
  const cfg = DIFF_CONFIG[difficulty]
  const size = cfg.size
  const floors = forceSingleFloor ? 1 : (cfg.floors ?? 1)
  const twoFloor = floors > 1

  // Attempt budget for the two-floor path.
  //
  // MEASURED, do not "optimise" this downward without re-measuring: lowering it
  // to 90 made things WORSE — average rose to 593ms and two-floor retention fell
  // from 6/6 to 5/6 — because a seed that fails the two-floor path then pays for
  // a full single-floor regeneration on top. Fewer attempts simply pushes more
  // seeds into that second, more expensive path.
  //
  // TRIED AND REJECTED — do not re-attempt without reading this.
  //
  // The obvious next idea is to detect up front that a board cannot be pinned.
  // It rests on a true property: uniqueness is MONOTONE in clue addition (every
  // candidate clue is true of the solution, so adding one can only remove rival
  // solutions), therefore if the full clue ceiling leaves >1 solution, no subset
  // can ever pin that board. Implemented, measured, reverted. Two placements,
  // 12 seeds per tier, same machine, strays killed (avg/worst ms):
  //
  //                        Hard        Expert       Master      fallbacks
  //   no check          240 / 465    703 / 1485   688 / 1461     0/1/1
  //   before phase A    ~+7%         792 / ~1900  787 / ~1840    0/1/1
  //   between A and B   334 / 834    792 / 1902   787 / 1841     0/1/1
  //
  // Both placements are SLOWER and neither changes two-floor retention or the
  // fallback count. The population it insures against barely exists: Phase A
  // rarely pins a board alone, so nearly every attempt reaches the check and
  // pays a full-ceiling solve (~500 clues over 128 cells just to build the MRV
  // candidate lists), while Phase B — the expensive half the check exists to
  // skip — almost always SUCCEEDS. Insurance nobody claims.
  //
  // Note also that each attempt builds a FRESH board, so a doomed board never
  // costs more than one attempt. An earlier version of this comment implied 250
  // attempts were spent on one bad seed; they are not, and that misreading is
  // what made the idea look valuable. The real worst case (~1.5s) is attempts
  // that legitimately churn, not seeds that cannot be pinned.
  const maxAttempts = twoFloor ? 250 : 60
  // The last fifth of the attempts drop the directness FLOOR. That floor is a
  // difficulty dial — it bans the most direct clue kinds so suspects must be
  // triangulated — but it is also the main reason a seed can run out of
  // attempts, because two-floor boards are already hard to pin uniquely.
  // A slightly easier case beats throwing: `makeRandomPuzzle` has no retry,
  // and in the catalog a throw silently drops a case from the list.
  const relaxFrom = Math.floor(maxAttempts * 0.8)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const relaxed = attempt >= relaxFrom
    const names = shuffle(NAMES).slice(0, cfg.people)
    const accents = shuffle(ACCENTS)
    const people: Person[] = names.map((name, i) => ({
      id: `p${i}`, name, avatarSeed: `${name}-${seed}-${i}`, accent: accents[i % accents.length],
    }))
    const victim = people[Math.floor(rand() * people.length)]
    victim.isVictim = true

    // Build rooms and placement — two-floor for Hard/Expert/Master
    let rooms, roomOf, roomOfByFloor: string[][][] | undefined, place: Record<string, Cell>
    if (twoFloor) {
      const built = buildTwoFloorRooms(size, cfg.rooms)
      rooms = built.rooms; roomOf = built.roomOf; roomOfByFloor = built.roomOfByFloor
      place = randomTwoFloorPlacement(size, people)

      // For two-floor puzzles the murderer condition (victim alone with exactly
      // one suspect in the same room) is very unlikely to arise organically
      // because people are sparse across two floors. Force it explicitly:
      //
      // 1. Pick one non-victim suspect to be the murderer.
      // 2. Move them into the victim's room (same floor).
      // 3. Move every OTHER suspect OUT of the victim's room if they happen to be
      //    in it, so the victim is alone with exactly the murderer.
      const victimCell = place[victim.id]
      const victimFloor = victimCell.floor ?? 0
      const victimRoomId = (roomOfByFloor![victimFloor])[victimCell.row][victimCell.col]

      // Cells in the victim's room (same floor)
      const victimRoom = rooms.find(r => r.id === victimRoomId)
      if (!victimRoom || victimRoom.cells.length < 2) continue

      // Choose the murderer before computing takenRows so we can exclude them
      const suspects = people.filter(p => !p.isVictim)
      const forcedMurderer = pick(suspects)

      // Rows/cols taken by everyone EXCEPT the forced murderer
      // (the murderer will be moved, so their old slot is freed)
      const othersPlace = Object.entries(place).filter(([id]) => id !== forcedMurderer.id)
      const takenRows = new Set(othersPlace.map(([, c]) => c.row))
      const takenCols = new Set(othersPlace.map(([, c]) => c.col))

      // Candidates: victim's room cells with row AND col not taken by others
      const freeCells = victimRoom.cells.filter(c =>
        !(c.row === victimCell.row && c.col === victimCell.col) &&
        !takenRows.has(c.row) &&
        !takenCols.has(c.col)
      )
      if (freeCells.length === 0) continue
      const murderCell = pick(freeCells)
      place[forcedMurderer.id] = { ...murderCell, floor: victimFloor }

      // Move any other suspects OUT of the victim's room.
      // After moving the murderer, recheck who's in the victim's room.
      const otherSuspectsInRoom = suspects
        .filter(s => s.id !== forcedMurderer.id)
        .filter(s => {
          const sc = place[s.id]
          const sFloor = sc.floor ?? 0
          if (sFloor !== victimFloor) return false
          return (roomOfByFloor![sFloor])[sc.row]?.[sc.col] === victimRoomId
        })

      // For each interloper, find a cell outside the victim's room to move them to
      let placementOk = true
      for (const interloper of otherSuspectsInRoom) {
        const allTakenRows = new Set(Object.entries(place).filter(([id]) => id !== interloper.id).map(([,c]) => c.row))
        const allTakenCols = new Set(Object.entries(place).filter(([id]) => id !== interloper.id).map(([,c]) => c.col))
        // Find a cell on any floor NOT in the victim's room with free row+col
        const candidates: Cell[] = []
        for (const fl of [0, 1]) {
          const floorRoomOf = roomOfByFloor![fl]
          for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
              const rid = floorRoomOf[r]?.[c]
              if (!rid || rid === victimRoomId) continue
              if (allTakenRows.has(r) || allTakenCols.has(c)) continue
              candidates.push({ row: r, col: c, floor: fl })
            }
          }
        }
        if (candidates.length === 0) { placementOk = false; break }
        place[interloper.id] = pick(candidates)
      }
      if (!placementOk) continue
    } else {
      const built = buildRooms(size, cfg.rooms, 0)
      rooms = built.rooms; roomOf = built.roomOf
      place = randomPlacement(size, people)
    }

    // victim must share their room with exactly one suspect (the murderer)
    const base: Puzzle = {
      id, title: '', caseNumber, difficulty, size, rooms, roomOf,
      ...(roomOfByFloor ? { roomOfByFloor, floors } : {}),
      furniture: [], people, clues: [], solution: place,
      victimId: victim.id, murdererId: '', flavor: '',
    }
    const murderer = findMurderer(base, place)
    if (!murderer) continue
    base.murdererId = murderer

    // Place furniture on each floor separately
    if (twoFloor && roomOfByFloor) {
      const sharedOccupied = new Set<string>()
      const rooms0 = rooms.filter(r => (r.floor ?? 0) === 0)
      const rooms1 = rooms.filter(r => (r.floor ?? 0) === 1)
      const furn0 = placeFurniture(rooms0, roomOfByFloor[0], place, 0, sharedOccupied)
      const furn1 = placeFurniture(rooms1, roomOfByFloor[1], place, 1, sharedOccupied)
      base.furniture = [...furn0, ...furn1]
    } else {
      base.furniture = placeFurniture(rooms, roomOf, place)
    }

    const chosen = selectCluesForLayout(base, difficulty, cfg, relaxed)
    if (!chosen) continue
    // add the victim's flavour clue and finalise
    base.clues = toClueText(base, chosen)
    base.clues.push({
      clue: { kind: 'victim', person: victim.id },
      text: clueToText(base, { kind: 'victim', person: victim.id }),
    })
    base.title = pickTitle(rooms)
    base.flavor = makeFlavor(base)
    base.source = 'generated'
    return base
  }
  // Two floors roughly double the candidate cells while the row/column rule
  // still admits only N placements, so a minority of seeds cannot be pinned to
  // a unique solution however the clues are chosen. Degrade to a single-storey
  // house for that seed rather than throwing: a throw silently drops a case
  // from the catalog (buildOne swallows it) and has no retry at all behind
  // `makeRandomPuzzle`, so the player would simply get no puzzle.
  if (twoFloor) return generatePuzzle(difficulty, id, caseNumber, true)
  throw new Error('Failed to generate a unique puzzle')
}

/**
 * Re-derive the clues of a layout that must not move (rooms, furniture, cast and
 * solution already in `base`) with the generator's own selector, from a fixed
 * seed so the result is the same on every machine and every call.
 *
 * Used for cases whose hand-built 3D scene pins their exact furniture: the
 * procedural generator cannot be asked for "this layout again" once a change to
 * the clue semantics shifts which seeds succeed, but the layout can be frozen
 * and only the clue choice redone. The last fifth of the attempts relax the
 * directness floor exactly as generatePuzzle does.
 */
export function selectClueTexts(base: Puzzle, difficulty: Difficulty, seed: number): ClueText[] {
  const cfg = DIFF_CONFIG[difficulty]
  reseed(seed)
  const attempts = 100
  for (let attempt = 0; attempt < attempts; attempt++) {
    const chosen = selectCluesForLayout(base, difficulty, cfg, attempt >= attempts * 0.8)
    if (chosen) {
      const texts = toClueText(base, chosen)
      const victim: Clue = { kind: 'victim', person: base.victimId }
      return [...texts, { clue: victim, text: clueToText(base, victim) }]
    }
  }
  throw new Error(`${base.id}: no unique clue set found for the frozen layout (seed ${seed})`)
}

function toClueText(p: Puzzle, clues: Clue[]): ClueText[] {
  return clues.map(clue => ({ clue, text: clueToText(p, clue) }))
}

/** Remove redundant clues while keeping a unique solution and ≥1 clue/person.
 * Authored required clues carry deliberate narrative/spatial information and
 * are never candidates for removal. */
export function pruneClues(
  p: Puzzle,
  clues: Clue[],
  required: readonly Clue[] = [],
  order: 'seeded' | 'stable' = 'seeded',
): Clue[] {
  let cur = [...clues]
  const keyOf = (clue: Clue) => JSON.stringify(Object.entries(clue).sort(([a], [b]) => a.localeCompare(b)))
  const requiredKeys = new Set(required.map(keyOf))
  const candidates = order === 'stable' ? [...cur].sort((a, b) => keyOf(a).localeCompare(keyOf(b))) : shuffle([...cur])
  for (const c of candidates) {
    if (requiredKeys.has(keyOf(c))) continue
    const trial = cur.filter(x => x !== c)
    if (!trial.some(x => x.person === c.person)) continue // keep ≥1 per suspect
    p.clues = toClueText(p, trial)
    if (countSolutions(p, 2) === 1) cur = trial
  }
  return cur
}

const TITLES = [
  'The Silent Guest', 'A Cold Reception', 'Death Before Dinner', 'The Locked Study',
  'Midnight Delivery', 'The Last Nightcap', 'No Way Out', 'The Uninvited',
  'A Fatal Rehearsal', 'The Empty Chair', 'Checkmate', 'The Broken Vase',
]
function pickTitle(rooms: Room[]): string {
  void rooms
  return pick(TITLES)
}

function makeFlavor(p: Puzzle): string {
  const victim = p.people.find(x => x.id === p.victimId)!
  const room = p.rooms.find(r => r.id === roomIdAt(p, p.solution[p.victimId]))!
  return `${victim.name} was found dead in the ${room.name}. Everyone has an alibi — but the clues never lie. Place each person, and the one left alone with ${victim.name} is your killer.`
}

export { clueToText }
