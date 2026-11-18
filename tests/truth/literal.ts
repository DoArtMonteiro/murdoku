// ============================================================================
// INDEPENDENT LITERAL INTERPRETER AND SOLVER
//
// Reads the sentence a player actually sees (ClueText.text), the puzzle's rooms
// and furniture, and decides what that sentence means. It deliberately imports
// NOTHING executable from src/core (no engine, generator or validator
// predicates): only TYPES. A bug that the generator, the solver and the
// validator all share cannot hide here, because none of them is consulted.
//
// The meaning of every sentence form is defined once, in `parseSentence` below,
// and written up in docs/CLUE_SEMANTICS.md. A sentence this file does not know
// THROWS (SentenceError); callers must not skip it.
//
// Conventions: row 0 is the "top" row, column 0 the "leftmost"; rows/columns
// are numbered from 1 in text ("In row 3" = index 2). floor 0 = ground.
// ============================================================================

import type { Puzzle } from '../../src/core/types'

export interface Pos { f: number; r: number; c: number }
export type Assignment = Record<string, Pos>

export class SentenceError extends Error {
  constructor(public readonly sentence: string, why: string) {
    super(`cannot interpret clue sentence "${sentence}": ${why}`)
  }
}

// ---------------------------------------------------------------- the model

interface Piece { type: string; floor: number; cells: { r: number; c: number }[] }

export interface Model {
  N: number
  F: number
  ids: string[]
  names: Record<string, string>
  pieces: Piece[]
  /** roomAt[f][r][c] = room id ('' when the cell is in no room) */
  roomAt: string[][][]
  roomIdsByName: Map<string, string[]>
  victim: string
}

/** The cell's floor: a Cell without `floor` is on the ground floor. */
const flo = (x: { floor?: number } | undefined, fallback = 0) => x?.floor ?? fallback

export function buildModel(p: Puzzle): Model {
  const N = p.size
  const F = p.floors ?? 1
  // Rooms come from the room records themselves, not from roomOf/roomOfByFloor
  // (which `checkMapsAgree` cross-checks separately).
  const roomAt = Array.from({ length: F }, () => Array.from({ length: N }, () => new Array<string>(N).fill('')))
  for (const room of p.rooms) {
    for (const cell of room.cells) {
      const f = flo(cell, flo(room))
      if (f < 0 || f >= F) throw new Error(`room ${room.id} has a cell on floor ${f}`)
      if (roomAt[f][cell.row][cell.col]) throw new Error(`rooms overlap at floor ${f} (${cell.row},${cell.col})`)
      roomAt[f][cell.row][cell.col] = room.id
    }
  }
  const pieces: Piece[] = p.furniture.map(fu => {
    const w = Math.max(1, fu.w ?? 1), h = Math.max(1, fu.h ?? 1)
    const cells: { r: number; c: number }[] = []
    for (let dr = 0; dr < h; dr++) for (let dc = 0; dc < w; dc++) cells.push({ r: fu.row + dr, c: fu.col + dc })
    return { type: fu.type, floor: flo(fu), cells }
  })
  const roomIdsByName = new Map<string, string[]>()
  for (const room of p.rooms) roomIdsByName.set(room.name, [...(roomIdsByName.get(room.name) ?? []), room.id])
  const names: Record<string, string> = {}
  for (const person of p.people) names[person.id] = person.name
  return { N, F, ids: p.people.map(x => x.id), names, pieces, roomAt, roomIdsByName, victim: p.victimId }
}

/** roomOf / roomOfByFloor must say exactly what the room records say. */
export function checkMapsAgree(p: Puzzle, m: Model): string[] {
  const problems: string[] = []
  for (let f = 0; f < m.F; f++) {
    const map = p.roomOfByFloor ? p.roomOfByFloor[f] : (f === 0 ? p.roomOf : undefined)
    if (!map) { problems.push(`no room map for floor ${f}`); continue }
    for (let r = 0; r < m.N; r++) for (let c = 0; c < m.N; c++) {
      if ((map[r]?.[c] ?? '') !== m.roomAt[f][r][c]) problems.push(`floor ${f} (${r},${c}): map says "${map[r]?.[c]}", rooms say "${m.roomAt[f][r][c]}"`)
    }
  }
  return problems
}

export function roomOfPos(m: Model, a: Pos): string {
  return m.roomAt[a.f]?.[a.r]?.[a.c] ?? ''
}

// ----------------------------------------------------------------- the rules

export type Rule =
  | { t: 'room'; room: string }
  | { t: 'notRoom'; room: string }
  | { t: 'on'; pieces: number[] }
  | { t: 'onlyOn'; pieces: number[] }
  | { t: 'beside'; pieces: number[] }
  | { t: 'row'; r: number }
  | { t: 'col'; c: number }
  | { t: 'edge' }
  | { t: 'corner' }
  | { t: 'floor'; f: number }
  | { t: 'aboveRoom'; room: string }
  | { t: 'belowRoom'; room: string }
  | { t: 'abovePerson'; other: string }
  | { t: 'belowPerson'; other: string }
  | { t: 'besidePerson'; other: string }
  | { t: 'sameRoom'; other: string }
  | { t: 'notSameRoom'; other: string }
  | { t: 'offset'; axis: 'row' | 'col'; sign: 1 | -1; steps: number | null; other: string }
  | { t: 'victimMark' }

export interface ParsedClue { person: string; sentence: string; rule: Rule }

const FURNITURE_WORDS: Record<string, string> = {
  chair: 'chair', sofa: 'sofa', bed: 'bed', table: 'table', box: 'box', rug: 'rug',
  plant: 'plant', shrub: 'shrub', lamp: 'lamp', counter: 'counter', TV: 'tv',
  bathtub: 'bathtub', bookshelf: 'bookshelf', stove: 'stove', fridge: 'fridge',
  clock: 'clock', desk: 'desk', toilet: 'toilet', shower: 'shower',
}

/** "the lamp" -> that one lamp (there must be exactly one in the house); "a lamp" -> any lamp. */
function furnitureRef(m: Model, phrase: string, sentence: string): number[] {
  const mm = /^(the|a) (\S+)$/.exec(phrase.trim())
  if (!mm) throw new SentenceError(sentence, `"${phrase}" is not "a <thing>" or "the <thing>"`)
  const type = FURNITURE_WORDS[mm[2]]
  if (!type) throw new SentenceError(sentence, `unknown furniture word "${mm[2]}"`)
  const matching = m.pieces.map((pc, i) => (pc.type === type ? i : -1)).filter(i => i >= 0)
  if (matching.length === 0) throw new SentenceError(sentence, `there is no ${mm[2]} anywhere in the house`)
  if (mm[1] === 'the' && matching.length !== 1) {
    throw new SentenceError(sentence, `"the ${mm[2]}" is ambiguous: the house has ${matching.length} of them (should say "a ${mm[2]}")`)
  }
  return matching
}

function roomRef(m: Model, name: string, sentence: string): string {
  const ids = m.roomIdsByName.get(name)
  if (!ids) throw new SentenceError(sentence, `no room is called "${name}"`)
  if (ids.length !== 1) throw new SentenceError(sentence, `${ids.length} rooms are called "${name}"`)
  return ids[0]
}

function personRef(m: Model, name: string, sentence: string): string {
  const ids = m.ids.filter(id => m.names[id] === name)
  if (ids.length !== 1) throw new SentenceError(sentence, `"${name}" matches ${ids.length} people`)
  return ids[0]
}

/** What a sentence means. THE definition of the language (see docs/CLUE_SEMANTICS.md). */
export function parseSentence(m: Model, person: string, sentence: string): ParsedClue {
  const s = sentence.trim()
  const out = (rule: Rule): ParsedClue => ({ person, sentence, rule })
  let g: RegExpExecArray | null

  // --- the victim's file line carries no positional claim
  if (s === 'The victim — found alone with the murderer.') return out({ t: 'victimMark' })

  // --- rows and columns
  if (s === 'In the top row.') return out({ t: 'row', r: 0 })
  if (s === 'In the bottom row.') return out({ t: 'row', r: m.N - 1 })
  if ((g = /^In row (\d+)\.$/.exec(s))) {
    const k = Number(g[1])
    if (k < 1 || k > m.N) throw new SentenceError(s, `row ${k} is off a ${m.N}x${m.N} board`)
    return out({ t: 'row', r: k - 1 })
  }
  if (s === 'In the leftmost column.') return out({ t: 'col', c: 0 })
  if (s === 'In the rightmost column.') return out({ t: 'col', c: m.N - 1 })
  if ((g = /^In column (\d+)\.$/.exec(s))) {
    const k = Number(g[1])
    if (k < 1 || k > m.N) throw new SentenceError(s, `column ${k} is off a ${m.N}x${m.N} board`)
    return out({ t: 'col', c: k - 1 })
  }

  // --- the board's outline
  if (s === 'On the outer edge of the board.') return out({ t: 'edge' })
  if (s === 'In a corner of the board.') return out({ t: 'corner' })

  // --- storeys
  if (s === 'On the ground floor.') return out({ t: 'floor', f: 0 })
  if (s === 'Upstairs.') return out({ t: 'floor', f: 1 })
  if ((g = /^Directly (above|below) (.+)\.$/.exec(s))) {
    const dir = g[1], target = g[2]
    if (target.startsWith('the ')) {
      const room = roomRef(m, target.slice(4), s)
      return out({ t: dir === 'above' ? 'aboveRoom' : 'belowRoom', room })
    }
    const other = personRef(m, target, s)
    return out({ t: dir === 'above' ? 'abovePerson' : 'belowPerson', other })
  }

  // --- furniture
  if ((g = /^The only person on (.+)\.$/.exec(s))) return out({ t: 'onlyOn', pieces: furnitureRef(m, g[1], s) })
  if ((g = /^On (a|the) (\S+)\.$/.exec(s))) return out({ t: 'on', pieces: furnitureRef(m, `${g[1]} ${g[2]}`, s) })
  if ((g = /^Beside (.+)\.$/.exec(s))) {
    const pieces = new Set<number>()
    for (const alt of g[1].split(' or ')) {
      // "a plant or shrub" is read as "a plant or a shrub"
      const phrase = /^(a|the) /.test(alt) ? alt : `a ${alt}`
      furnitureRef(m, phrase, s).forEach(i => pieces.add(i))
    }
    return out({ t: 'beside', pieces: [...pieces] })
  }

  // --- rooms
  if ((g = /^Never set foot in the (.+)\.$/.exec(s))) return out({ t: 'notRoom', room: roomRef(m, g[1], s) })
  if ((g = /^In the same room as (.+)\.$/.exec(s))) return out({ t: 'sameRoom', other: personRef(m, g[1], s) })
  if ((g = /^Was not in the same room as (.+)\.$/.exec(s))) return out({ t: 'notSameRoom', other: personRef(m, g[1], s) })
  if ((g = /^In the (.+)\.$/.exec(s))) return out({ t: 'room', room: roomRef(m, g[1], s) })

  // --- people
  if ((g = /^Right beside (.+)\.$/.exec(s))) return out({ t: 'besidePerson', other: personRef(m, g[1], s) })
  if ((g = /^Exactly (one|\d+) (row|rows|column|columns) (north|south|east|west) of (.+)\.$/.exec(s))) {
    const steps = g[1] === 'one' ? 1 : Number(g[1])
    const axis = g[2].startsWith('row') ? 'row' : 'col'
    const dir = g[3]
    if ((axis === 'row') !== (dir === 'north' || dir === 'south')) throw new SentenceError(s, `"${g[2]}" does not go with "${dir}"`)
    // north = smaller row index (towards the top), west = smaller column index.
    return out({ t: 'offset', axis, sign: dir === 'north' || dir === 'west' ? -1 : 1, steps, other: personRef(m, g[4], s) })
  }
  if ((g = /^Somewhere (north|south|east|west) of (.+)\.$/.exec(s))) {
    const axis = g[1] === 'north' || g[1] === 'south' ? 'row' : 'col'
    return out({ t: 'offset', axis, sign: g[1] === 'north' || g[1] === 'west' ? -1 : 1, steps: null, other: personRef(m, g[2], s) })
  }

  throw new SentenceError(s, 'unknown sentence form')
}

// ------------------------------------------------------------ evaluating

const onPiece = (pc: Piece, a: Pos) => pc.floor === a.f && pc.cells.some(x => x.r === a.r && x.c === a.c)

function onAny(m: Model, pieces: number[], a: Pos): boolean {
  return pieces.some(i => onPiece(m.pieces[i], a))
}

/** Beside: a named piece the person is not on, touching them orthogonally, in their room. */
function besideAny(m: Model, pieces: number[], a: Pos): boolean {
  const here = roomOfPos(m, a)
  if (!here) return false
  return pieces.some(i => {
    const pc = m.pieces[i]
    if (pc.floor !== a.f || onPiece(pc, a)) return false
    return pc.cells.some(x => Math.abs(x.r - a.r) + Math.abs(x.c - a.c) === 1
      && m.roomAt[a.f][x.r]?.[x.c] === here)
  })
}

/** Rules that look only at the person's own cell. */
export function ownCellOk(m: Model, rule: Rule, a: Pos): boolean {
  switch (rule.t) {
    case 'room': return roomOfPos(m, a) === rule.room
    case 'notRoom': return roomOfPos(m, a) !== rule.room
    case 'on': case 'onlyOn': return onAny(m, rule.pieces, a)
    case 'beside': return besideAny(m, rule.pieces, a)
    case 'row': return a.r === rule.r
    case 'col': return a.c === rule.c
    case 'edge': return a.r === 0 || a.c === 0 || a.r === m.N - 1 || a.c === m.N - 1
    case 'corner': return (a.r === 0 || a.r === m.N - 1) && (a.c === 0 || a.c === m.N - 1)
    case 'floor': return a.f === rule.f
    case 'aboveRoom': return a.f >= 1 && m.roomAt[a.f - 1][a.r][a.c] === rule.room
    case 'belowRoom': return a.f + 1 < m.F && m.roomAt[a.f + 1][a.r][a.c] === rule.room
    default: return true
  }
}

/** Rules that relate the person (a) to another person (b). `all` is only used by onlyOn. */
export function relationOk(m: Model, rule: Rule, a: Pos, b: Pos): boolean {
  switch (rule.t) {
    case 'abovePerson': return a.r === b.r && a.c === b.c && a.f === b.f + 1
    case 'belowPerson': return a.r === b.r && a.c === b.c && a.f === b.f - 1
    case 'besidePerson': return a.f === b.f && Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1
    case 'sameRoom': return roomOfPos(m, a) !== '' && roomOfPos(m, a) === roomOfPos(m, b)
    case 'notSameRoom': return roomOfPos(m, a) !== roomOfPos(m, b)
    case 'offset': {
      const mine = rule.axis === 'row' ? a.r : a.c
      const theirs = rule.axis === 'row' ? b.r : b.c
      return rule.steps === null ? (mine - theirs) * rule.sign > 0 : mine === theirs + rule.sign * rule.steps
    }
    // "the only person on a rug": nobody ELSE stands on any rug
    case 'onlyOn': return !onAny(m, rule.pieces, b)
    default: return true
  }
}

export function otherOf(rule: Rule): string | null {
  switch (rule.t) {
    case 'abovePerson': case 'belowPerson': case 'besidePerson':
    case 'sameRoom': case 'notSameRoom': case 'offset':
      return rule.other
    default: return null
  }
}

/** Does a complete assignment satisfy a parsed clue? */
export function holdsIn(m: Model, pc: ParsedClue, asg: Assignment): boolean {
  const a = asg[pc.person]
  if (!a) return false
  if (!ownCellOk(m, pc.rule, a)) return false
  const other = otherOf(pc.rule)
  if (other) {
    const b = asg[other]
    return !!b && relationOk(m, pc.rule, a, b)
  }
  if (pc.rule.t === 'onlyOn') {
    return m.ids.every(id => id === pc.person || (asg[id] ? relationOk(m, pc.rule, a, asg[id]) : false))
  }
  return true
}

// ------------------------------------------------------------- the solver

export interface SentenceClue { person: string; text: string }

export function parseAll(m: Model, clues: readonly SentenceClue[]): ParsedClue[] {
  return clues.map(c => parseSentence(m, c.person, c.text))
}

export interface SolveResult { count: number; solutions: Assignment[]; capped: boolean }

/**
 * Every assignment of every person to a cell such that all rows are distinct,
 * all columns are distinct (across BOTH storeys) and every clue sentence holds.
 * Plain depth-first search over per-person domains; no clue-specific shortcuts.
 */
export function solveAll(m: Model, parsed: readonly ParsedClue[], cap = 5000): SolveResult {
  const all: Pos[] = []
  for (let f = 0; f < m.F; f++) for (let r = 0; r < m.N; r++) for (let c = 0; c < m.N; c++) all.push({ f, r, c })
  const domains: Record<string, Pos[]> = {}
  for (const id of m.ids) {
    const mine = parsed.filter(pc => pc.person === id)
    domains[id] = all.filter(cell => mine.every(pc => ownCellOk(m, pc.rule, cell)))
  }
  // pairwise relations, indexed by ordered pair
  const rel = new Map<string, ParsedClue[]>()
  const add = (a: string, b: string, pc: ParsedClue) => {
    const key = `${a}|${b}`
    rel.set(key, [...(rel.get(key) ?? []), pc])
  }
  for (const pc of parsed) {
    const other = otherOf(pc.rule)
    if (other) add(pc.person, other, pc)
    else if (pc.rule.t === 'onlyOn') for (const id of m.ids) if (id !== pc.person) add(pc.person, id, pc)
  }
  const pairOk = (x: string, a: Pos, y: string, b: Pos): boolean => {
    for (const pc of rel.get(`${x}|${y}`) ?? []) if (!relationOk(m, pc.rule, a, b)) return false
    for (const pc of rel.get(`${y}|${x}`) ?? []) if (!relationOk(m, pc.rule, b, a)) return false
    return true
  }
  const order = [...m.ids].sort((p, q) => domains[p].length - domains[q].length)
  const solutions: Assignment[] = []
  let count = 0
  const cur: Assignment = {}
  const rec = (d: number): void => {
    if (count >= cap) return
    if (d === order.length) { count++; if (solutions.length < 50) solutions.push({ ...cur }); return }
    const id = order[d]
    for (const cell of domains[id]) {
      let ok = true
      for (let e = 0; e < d; e++) {
        const other = order[e]
        const o = cur[other]
        if (o.r === cell.r || o.c === cell.c || !pairOk(id, cell, other, o)) { ok = false; break }
      }
      if (!ok) continue
      cur[id] = cell
      rec(d + 1)
      delete cur[id]
    }
  }
  if (order.every(id => domains[id].length > 0)) rec(0)
  return { count, solutions, capped: count >= cap }
}

// ------------------------------------------------------- puzzle-level API

export function storedSolution(p: Puzzle): Assignment {
  const asg: Assignment = {}
  for (const person of p.people) {
    const c = p.solution[person.id]
    asg[person.id] = { f: c.floor ?? 0, r: c.row, c: c.col }
  }
  return asg
}

/** The suspect who shares the victim's room with nobody else around; null unless exactly one. */
export function murdererIn(m: Model, asg: Assignment): string | null {
  const v = asg[m.victim]
  if (!v) return null
  const room = roomOfPos(m, v)
  if (!room) return null
  const inRoom = m.ids.filter(id => id !== m.victim && asg[id] && roomOfPos(m, asg[id]) === room)
  return inRoom.length === 1 ? inRoom[0] : null
}

export interface Verdict {
  id: string
  model: Model
  parsed: ParsedClue[]
  sentenceErrors: string[]
  count: number
  capped: boolean
  solutions: Assignment[]
  storedIsSolution: boolean
  /** Sentences the stored solution makes false. */
  falseClues: string[]
  murderers: (string | null)[]
}

export function judge(p: Puzzle, textOverride?: readonly SentenceClue[]): Verdict {
  const m = buildModel(p)
  const clues = textOverride ?? p.clues.map(ct => ({ person: ct.clue.person, text: ct.text }))
  const parsed: ParsedClue[] = []
  const sentenceErrors: string[] = []
  for (const c of clues) {
    try { parsed.push(parseSentence(m, c.person, c.text)) } catch (e) {
      if (e instanceof SentenceError) sentenceErrors.push(e.message); else throw e
    }
  }
  const stored = storedSolution(p)
  const falseClues = parsed.filter(pc => !holdsIn(m, pc, stored)).map(pc => `${pc.person}: ${pc.sentence}`)
  const res = solveAll(m, parsed)
  return {
    id: p.id, model: m, parsed, sentenceErrors,
    count: res.count, capped: res.capped, solutions: res.solutions,
    storedIsSolution: falseClues.length === 0 && sameAssignment(stored, res.solutions[0]) && res.count === 1,
    falseClues,
    murderers: res.solutions.map(s => murdererIn(m, s)),
  }
}

export function sameAssignment(a: Assignment | undefined, b: Assignment | undefined): boolean {
  if (!a || !b) return false
  const ka = Object.keys(a)
  if (ka.length !== Object.keys(b).length) return false
  return ka.every(k => b[k] && a[k].f === b[k].f && a[k].r === b[k].r && a[k].c === b[k].c)
}
