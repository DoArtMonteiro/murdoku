// ============================================================================
// PUZZLE VALIDATION — the authoring contract for a Murdoku case.
//
// Three layers, each pure and deterministic:
//   validatePuzzle            — structure and mathematics (must be zero errors)
//   validatePuzzleQuality     — clue hygiene and difficulty signals
//   validatePuzzleSceneCompatibility — can a dollhouse be built for it
//
// A puzzle that merely loads is not a puzzle. Every rule here is one an
// authored or generated case has been observed to break, or one the engine
// depends on silently (e.g. findMurderer assumes exactly one suspect shares
// the victim's room).
// ============================================================================

import type { Puzzle, Clue, Cell, FurnitureType, Difficulty } from './types'
import { furnitureCells, furnitureFootprint, cellFloor } from './types'
import { countSolutions, isSolution, findMurderer, roomIdAt, unaryLegalFor } from './engine'
import { clueDirectness, DIFFICULTY_CONFIG } from './generate'
import { DEFAULT_MODEL, MODEL_META } from '../scene3d/catalog'

export type PuzzleIssueCode =
  // structure
  | 'size-invalid' | 'rooms-empty' | 'room-id-duplicate' | 'room-cell-out-of-bounds' | 'room-cell-shared' | 'room-map-mismatch'
  | 'floors-invalid' | 'people-count' | 'person-id-duplicate' | 'victim-count' | 'murderer-missing'
  | 'furniture-out-of-bounds' | 'furniture-outside-room' | 'furniture-spans-rooms' | 'furniture-overlap' | 'furniture-rotation'
  | 'clue-person-unknown' | 'clue-room-unknown' | 'clue-furniture-absent' | 'clue-floor-invalid' | 'clue-text-missing' | 'clue-victim-mismatch' | 'person-without-clue'
  | 'solution-missing' | 'solution-out-of-bounds' | 'solution-rows' | 'solution-cols' | 'solution-outside-room'
  // mathematics
  | 'clue-contradiction' | 'no-solution' | 'multiple-solutions' | 'murderer-mismatch'
  // quality
  | 'clue-duplicate' | 'clue-redundant' | 'clue-directness-out-of-band' | 'clue-reveals-murderer' | 'difficulty-signal'
  // scene compatibility
  | 'furniture-no-visual' | 'room-name-empty' | 'room-name-duplicate' | 'room-name-unusual' | 'no-stair-space'

export interface PuzzleIssue {
  code: PuzzleIssueCode
  severity: 'error' | 'warning'
  subject: string
  message: string
}

export interface DifficultyMetrics {
  people: number
  clues: number
  /** People with exactly one unary-legal cell before any placement. */
  forcedAtStart: number
  /** People placed by repeated single-candidate propagation (unary clues + row/col exclusion). */
  forcedBySingles: number
  /** People left after propagation — they need relational reasoning or search. */
  needsSearch: number
  /** Mean number of unary-legal cells per person at the start. */
  meanCandidates: number
  /** Mean log2 candidate count after unary clues; a spread signal, not a score. */
  startingCandidateEntropy: number
  /** Deterministic singles-propagation passes before the board stalls. */
  propagationRounds: number
  /** Clues that relate one person to another person. */
  relationalClues: number
  /** Floor, above or below clues. */
  crossFloorClues: number
  /** Clues removable without losing uniqueness while their person keeps a clue. */
  redundantClues: number
  /** Mean directness of the clue set (lower = more direct). */
  meanDirectness: number
}

/**
 * Observed bands per tier, measured over the shipped 60-case catalog with
 * scripts/measure-puzzles.mjs (see docs/OPUS_PRODUCTION_MANUAL.md §27).
 * A puzzle outside its band is not wrong; it is a difficulty-signal warning
 * for the author to look at.
 */
export const DIFFICULTY_BANDS: Record<Difficulty, { clues: [number, number]; forcedBySingles: [number, number]; needsSearch: [number, number]; meanDirectness: [number, number] }> = {
  // measured 2026-09-02 over the 60 shipped cases (min..max, with one unit of slack on clue count)
  'Very Easy': { clues: [4, 8], forcedBySingles: [2, 4], needsSearch: [0, 2], meanDirectness: [1.0, 2.5] },
  'Easy':      { clues: [4, 9], forcedBySingles: [0, 4], needsSearch: [0, 4], meanDirectness: [0.8, 2.8] },
  'Medium':    { clues: [5, 11], forcedBySingles: [2, 5], needsSearch: [0, 3], meanDirectness: [1.2, 3.0] },
  'Hard':      { clues: [6, 13], forcedBySingles: [0, 5], needsSearch: [0, 5], meanDirectness: [1.2, 3.4] },
  'Expert':    { clues: [7, 15], forcedBySingles: [0, 6], needsSearch: [0, 6], meanDirectness: [1.5, 3.4] },
  'Master':    { clues: [7, 15], forcedBySingles: [0, 6], needsSearch: [0, 6], meanDirectness: [1.5, 3.4] },
}

const KNOWN_ROOM_NAMES = new Set([
  'Bedroom', 'Office', 'Study', 'Hallway', 'Hall', 'Living Room', 'Lounge', 'Kitchen', 'Dining Room', 'Pantry',
  'Bathroom', 'Garden', 'Front Yard', 'Back Yard', 'Courtyard', 'Patio', 'Library', 'Garage', 'Attic', 'Cellar',
  'Conservatory', 'Nursery', 'Guest Room', 'Laundry', 'Workshop', 'Porch', 'Balcony', 'Terrace', 'Landing',
  'Entrance Hall',
])

function sameClue(a: Clue, b: Clue): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

const unaryLegal = unaryLegalFor

// ---------------------------------------------------------------------------

export function validatePuzzle(p: Puzzle): PuzzleIssue[] {
  const out: PuzzleIssue[] = []
  const err = (code: PuzzleIssueCode, subject: string, message: string) => out.push({ code, severity: 'error', subject, message })
  const N = p.size
  const floors = p.floors ?? 1

  if (![4, 5, 6, 7, 8, 9, 10].includes(N)) err('size-invalid', 'size', `size ${N} is not a supported grid`)
  if (floors < 1 || floors > 2) err('floors-invalid', 'floors', `floors ${floors}; the engine supports 1 or 2`)
  if (floors > 1 && (!p.roomOfByFloor || p.roomOfByFloor.length !== floors)) err('floors-invalid', 'roomOfByFloor', 'two-floor puzzle without a per-floor room map')

  // rooms
  if (!p.rooms.length) err('rooms-empty', 'rooms', 'no rooms')
  const roomIds = new Set<string>()
  const claimed = new Map<string, string>()
  for (const room of p.rooms) {
    if (roomIds.has(room.id)) err('room-id-duplicate', room.id, `room id ${room.id} appears twice`)
    roomIds.add(room.id)
    for (const c of room.cells) {
      if (c.row < 0 || c.col < 0 || c.row >= N || c.col >= N) err('room-cell-out-of-bounds', room.id, `${room.name} has cell (${c.row},${c.col}) outside the grid`)
      const key = `${room.floor ?? 0}:${c.row},${c.col}`
      if (claimed.has(key)) err('room-cell-shared', room.id, `cell ${key} belongs to ${claimed.get(key)} and ${room.id}`)
      claimed.set(key, room.id)
    }
  }
  for (let fl = 0; fl < floors; fl++) {
    const map = fl === 0 ? p.roomOf : p.roomOfByFloor?.[fl]
    if (!map) continue
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const id = map[r]?.[c]
      const expected = claimed.get(`${fl}:${r},${c}`) ?? ''
      if ((id ?? '') !== expected) err('room-map-mismatch', `${fl}:${r},${c}`, `roomOf says "${id}" but rooms say "${expected}" at floor ${fl} (${r},${c})`)
    }
  }

  // people
  if (p.people.length < 2) err('people-count', 'people', 'a case needs a victim and at least one suspect')
  if (p.people.length > N) err('people-count', 'people', `${p.people.length} people cannot each own a row of a ${N}×${N} grid`)
  const personIds = new Set<string>()
  for (const person of p.people) {
    if (personIds.has(person.id)) err('person-id-duplicate', person.id, `person id ${person.id} appears twice`)
    personIds.add(person.id)
  }
  const victims = p.people.filter(x => x.isVictim)
  if (victims.length !== 1 || victims[0].id !== p.victimId) err('victim-count', 'victim', `exactly one victim expected and it must be victimId (${p.victimId}); flagged: ${victims.map(v => v.id).join(',') || 'none'}`)
  if (!personIds.has(p.murdererId)) err('murderer-missing', 'murderer', `murdererId ${p.murdererId} is not a person`)

  // furniture
  const occupied = new Set<string>()
  p.furniture.forEach((f, i) => {
    const fl = f.floor ?? 0
    const map = fl === 0 ? p.roomOf : p.roomOfByFloor?.[fl]
    let roomId: string | null = null
    for (const c of furnitureCells(f)) {
      if (c.row < 0 || c.col < 0 || c.row >= N || c.col >= N) { err('furniture-out-of-bounds', `${f.type}#${i}`, `${f.type} at (${f.row},${f.col}) leaves the grid`); continue }
      const rid = map?.[c.row]?.[c.col]
      if (!rid) err('furniture-outside-room', `${f.type}#${i}`, `${f.type} covers (${c.row},${c.col}) which is in no room`)
      else if (roomId === null) roomId = rid
      else if (roomId !== rid) err('furniture-spans-rooms', `${f.type}#${i}`, `${f.type} at (${f.row},${f.col}) spans two rooms`)
      const key = `${fl}:${c.row},${c.col}`
      if (occupied.has(key)) err('furniture-overlap', `${f.type}#${i}`, `${f.type} at (${f.row},${f.col}) overlaps another piece at ${key}`)
      occupied.add(key)
    }
    const { w, h } = furnitureFootprint(f)
    if (w !== h) {
      const portrait = f.rotation === 90 || f.rotation === 270
      if (portrait !== h > w) err('furniture-rotation', `${f.type}#${i}`, `${f.type} w=${w} h=${h} rotation=${f.rotation ?? 0}: box does not match rotation`)
    }
  })

  // clues
  const typesOnBoard = new Set(p.furniture.map(f => f.type))
  const cluesPerPerson = new Map<string, number>()
  p.clues.forEach((ct, i) => {
    const c = ct.clue
    const subject = `clue#${i}`
    if (!ct.text?.trim()) err('clue-text-missing', subject, `clue ${i} has no text`)
    if (!personIds.has(c.person)) err('clue-person-unknown', subject, `clue ${i} names unknown person ${c.person}`)
    if (c.kind === 'victim') {
      if (c.person !== p.victimId) err('clue-victim-mismatch', subject, `victim clue on ${c.person}, victim is ${p.victimId}`)
    } else {
      cluesPerPerson.set(c.person, (cluesPerPerson.get(c.person) ?? 0) + 1)
    }
    if ((c.kind === 'room' || c.kind === 'notRoom') && !roomIds.has(c.roomId)) err('clue-room-unknown', subject, `clue ${i} names unknown room ${c.roomId}`)
    if ((c.kind === 'onFurniture' || c.kind === 'besideFurniture' || c.kind === 'onlyOnFurniture') && !typesOnBoard.has(c.furniture)) err('clue-furniture-absent', subject, `clue ${i} refers to a ${c.furniture} and there is none on the board`)
    if (c.kind === 'besideAny' && !c.furniture.some(t => typesOnBoard.has(t))) err('clue-furniture-absent', subject, `clue ${i} refers to ${c.furniture.join('/')} and none is on the board`)
    if (c.kind === 'floor' && (c.floorNum < 0 || c.floorNum >= floors)) err('clue-floor-invalid', subject, `clue ${i} names floor ${c.floorNum}`)
    if ((c.kind === 'above' || c.kind === 'below') && floors < 2) err('clue-floor-invalid', subject, `clue ${i} is a two-floor clue on a single-floor case`)
    if ((c.kind === 'above' || c.kind === 'below') && c.targetKind === 'room' && !roomIds.has(c.target)) err('clue-room-unknown', subject, `clue ${i} names unknown room ${c.target}`)
    if ((c.kind === 'besidePerson' || c.kind === 'sameRoomAs' || c.kind === 'direction' || c.kind === 'notSameRoomAs') && !personIds.has(c.other)) err('clue-person-unknown', subject, `clue ${i} names unknown person ${c.other}`)
    if ((c.kind === 'above' || c.kind === 'below') && c.targetKind === 'person' && !personIds.has(c.target)) err('clue-person-unknown', subject, `clue ${i} names unknown person ${c.target}`)
  })
  for (const person of p.people) {
    if (!cluesPerPerson.get(person.id)) err('person-without-clue', person.id, `${person.name} has no clue (the victim needs at least one positional clue too)`)
  }

  // solution
  const rows = new Set<number>(), cols = new Set<number>()
  for (const person of p.people) {
    const cell = p.solution[person.id]
    if (!cell) { err('solution-missing', person.id, `${person.name} has no solution cell`); continue }
    if (cell.row < 0 || cell.col < 0 || cell.row >= N || cell.col >= N || cellFloor(cell) >= floors) err('solution-out-of-bounds', person.id, `${person.name} solved to (${cell.row},${cell.col}) floor ${cellFloor(cell)}`)
    if (rows.has(cell.row)) err('solution-rows', person.id, `two people in row ${cell.row}`)
    if (cols.has(cell.col)) err('solution-cols', person.id, `two people in column ${cell.col}`)
    rows.add(cell.row); cols.add(cell.col)
    if (!roomIdAt(p, cell)) err('solution-outside-room', person.id, `${person.name} solved to a cell in no room`)
  }

  if (out.length) return out // mathematics on a malformed puzzle is noise

  // mathematics
  if (!isSolution(p, p.solution)) err('clue-contradiction', 'clues', 'the stated solution does not satisfy every clue')
  const count = countSolutions(p, 2)
  if (count === 0) err('no-solution', 'clues', 'no placement satisfies the clues')
  else if (count > 1) err('multiple-solutions', 'clues', 'more than one placement satisfies the clues')
  const murderer = findMurderer(p, p.solution)
  if (murderer !== p.murdererId) err('murderer-mismatch', 'murderer', `exactly one suspect must share the victim's room; engine finds ${murderer ?? 'none'}, puzzle says ${p.murdererId}`)
  return out
}

// ---------------------------------------------------------------------------

function redundantClueIndexes(p: Puzzle): number[] {
  const real = p.clues.filter(c => c.clue.kind !== 'victim')
  return real.flatMap((candidate, index) => {
    const trial: Puzzle = { ...p, clues: p.clues.filter(clue => clue !== candidate) }
    const stillHasClue = trial.clues.some(clue => clue.clue.kind !== 'victim' && clue.clue.person === candidate.clue.person)
    return stillHasClue && countSolutions(trial, 2) === 1 ? [index] : []
  })
}

function computeDifficultyMetrics(p: Puzzle, redundantClues: number): DifficultyMetrics {
  const N = p.size
  const floors = p.floors ?? 1
  const candidates = new Map<string, Cell[]>()
  for (const person of p.people) {
    const cells: Cell[] = []
    for (let fl = 0; fl < floors; fl++) for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const cell: Cell = floors > 1 ? { row: r, col: c, floor: fl } : { row: r, col: c }
      if (unaryLegal(p, person.id, cell)) cells.push(cell)
    }
    candidates.set(person.id, cells)
  }
  const forcedAtStart = [...candidates.values()].filter(c => c.length === 1).length
  // singles propagation: place anyone with one candidate, remove their row/col from the others
  const placed = new Map<string, Cell>()
  let progress = true
  let propagationRounds = 0
  while (progress) {
    progress = false
    for (const person of p.people) {
      if (placed.has(person.id)) continue
      const usable = candidates.get(person.id)!.filter(c => ![...placed.values()].some(q => q.row === c.row || q.col === c.col))
      if (usable.length === 1) { placed.set(person.id, usable[0]); progress = true }
    }
    if (progress) propagationRounds++
  }
  const real = p.clues.filter(c => c.clue.kind !== 'victim')
  const relationalKinds = new Set<Clue['kind']>(['direction', 'besidePerson', 'sameRoomAs', 'notSameRoomAs'])
  const relationalClues = real.filter(({ clue }) => relationalKinds.has(clue.kind)
    || ((clue.kind === 'above' || clue.kind === 'below') && clue.targetKind === 'person')).length
  const crossFloorClues = real.filter(({ clue }) => clue.kind === 'floor' || clue.kind === 'above' || clue.kind === 'below').length
  const startingCandidateEntropy = [...candidates.values()]
    .reduce((sum, cells) => sum + Math.log2(Math.max(1, cells.length)), 0) / Math.max(1, candidates.size)
  return {
    people: p.people.length,
    clues: real.length,
    forcedAtStart,
    forcedBySingles: placed.size,
    needsSearch: p.people.length - placed.size,
    meanCandidates: [...candidates.values()].reduce((s, c) => s + c.length, 0) / Math.max(1, candidates.size),
    startingCandidateEntropy,
    propagationRounds,
    relationalClues,
    crossFloorClues,
    redundantClues,
    meanDirectness: real.reduce((s, c) => s + clueDirectness(c.clue), 0) / Math.max(1, real.length),
  }
}

export function difficultyMetrics(p: Puzzle): DifficultyMetrics {
  return computeDifficultyMetrics(p, redundantClueIndexes(p).length)
}

export function validatePuzzleQuality(p: Puzzle): { issues: PuzzleIssue[]; metrics: DifficultyMetrics } {
  const issues: PuzzleIssue[] = []
  const err = (code: PuzzleIssueCode, subject: string, message: string) => issues.push({ code, severity: 'error', subject, message })
  const warn = (code: PuzzleIssueCode, subject: string, message: string) => issues.push({ code, severity: 'warning', subject, message })
  const real = p.clues.filter(c => c.clue.kind !== 'victim')

  for (let i = 0; i < real.length; i++) for (let j = i + 1; j < real.length; j++) {
    if (sameClue(real[i].clue, real[j].clue)) err('clue-duplicate', `clue#${i}`, `"${real[i].text}" appears twice`)
  }
  // redundancy: a clue whose removal keeps the solution unique (and leaves its person with a clue)
  const redundant = redundantClueIndexes(p)
  for (const i of redundant) {
    warn('clue-redundant', `clue#${i}`, `"${real[i].text}" can be removed without losing uniqueness`)
  }
  // directness band for the tier
  const cfg = DIFFICULTY_CONFIG[p.difficulty]
  if (cfg) {
    real.forEach((c, i) => {
      const d = clueDirectness(c.clue)
      if (d > cfg.maxDirectness || d < cfg.minDirectness) warn('clue-directness-out-of-band', `clue#${i}`, `"${c.text}" has directness ${d}; ${p.difficulty} admits ${cfg.minDirectness}..${cfg.maxDirectness}`)
    })
  }
  // a clue that names the victim's room-mate gives the murderer away
  const victimRoom = roomIdAt(p, p.solution[p.victimId])
  real.forEach((c, i) => {
    const k = c.clue
    if ((k.kind === 'sameRoomAs' && (k.other === p.victimId || k.person === p.victimId))) err('clue-reveals-murderer', `clue#${i}`, `"${c.text}" pairs a suspect with the victim's room`)
    if (k.kind === 'room' && k.person !== p.victimId && k.roomId === victimRoom) warn('clue-reveals-murderer', `clue#${i}`, `"${c.text}" places a suspect in the victim's room directly`)
  })
  const metrics = computeDifficultyMetrics(p, redundant.length)
  const band = DIFFICULTY_BANDS[p.difficulty]
  if (band) {
    const check = (name: keyof typeof band, value: number) => {
      const [lo, hi] = band[name]
      if (value < lo || value > hi) warn('difficulty-signal', name, `${name} = ${value.toFixed(2)}; ${p.difficulty} cases measure ${lo}..${hi}`)
    }
    check('clues', metrics.clues)
    check('forcedBySingles', metrics.forcedBySingles)
    check('needsSearch', metrics.needsSearch)
    check('meanDirectness', metrics.meanDirectness)
  }
  return { issues, metrics }
}

// ---------------------------------------------------------------------------

export function validatePuzzleSceneCompatibility(p: Puzzle): PuzzleIssue[] {
  const out: PuzzleIssue[] = []
  const err = (code: PuzzleIssueCode, subject: string, message: string) => out.push({ code, severity: 'error', subject, message })
  const warn = (code: PuzzleIssueCode, subject: string, message: string) => out.push({ code, severity: 'warning', subject, message })
  const represented = new Set<FurnitureType>()
  for (const meta of Object.values(MODEL_META)) for (const t of meta?.represents ?? []) represented.add(t)
  for (const t of new Set(p.furniture.map(f => f.type))) {
    if (!DEFAULT_MODEL[t] || !represented.has(t)) err('furniture-no-visual', t, `no Kenney model represents "${t}" — add one to scene3d/catalog.ts before authoring`)
  }
  const names = new Set<string>()
  for (const room of p.rooms) {
    if (!room.name?.trim()) err('room-name-empty', room.id, `room ${room.id} has no name`)
    if (names.has(room.name)) err('room-name-duplicate', room.id, `two rooms are called ${room.name}`)
    names.add(room.name)
    if (!KNOWN_ROOM_NAMES.has(room.name)) warn('room-name-unusual', room.id, `"${room.name}" is not in the room vocabulary the scene recipe covers`)
  }
  if ((p.floors ?? 1) > 1) {
    // a straight Kenney flight needs ~2.3 × 1 cells of free floor on the ground storey
    const N = p.size
    const blocked = new Set(p.furniture.filter(f => (f.floor ?? 0) === 0).flatMap(f => furnitureCells(f).map(c => `${c.row},${c.col}`)))
    let space = false
    for (let r = 0; r < N && !space; r++) for (let c = 0; c + 2 < N; c++) {
      if (![0, 1, 2].some(d => blocked.has(`${r},${c + d}`))) { space = true; break }
    }
    for (let c = 0; c < N && !space; c++) for (let r = 0; r + 2 < N; r++) {
      if (![0, 1, 2].some(d => blocked.has(`${r + d},${c}`))) { space = true; break }
    }
    if (!space) warn('no-stair-space', 'stairs', 'no 3-cell free run on the ground floor for a staircase')
  }
  return out
}

export function validatePuzzleForProduction(p: Puzzle): { issues: PuzzleIssue[]; metrics?: DifficultyMetrics } {
  const structure = validatePuzzle(p)
  if (structure.some(i => i.severity === 'error')) return { issues: structure }
  const quality = validatePuzzleQuality(p)
  const scene = validatePuzzleSceneCompatibility(p)
  return { issues: [...structure, ...quality.issues, ...scene], metrics: quality.metrics }
}

export function formatPuzzleIssues(issues: PuzzleIssue[]): string {
  return issues.map(i => `${i.severity === 'error' ? 'ERROR' : 'warn '} [${i.code}] ${i.message}`).join('\n')
}
