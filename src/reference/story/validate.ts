// ============================================================================
// Story validator. A story may dress clues in voice; it may not leak anything
// the clue does not state. Everything here is pure and runs in the unit tests
// (tests/reference/story.test.ts) against the real puzzle data.
// ============================================================================

import type { Clue, FurnitureType, Puzzle } from '../../core/types'
import { findMurderer, furnitureAt } from '../../core/engine'
import type { CaseStory, ClueRef, EvidenceStory } from './schema'
import { EVIDENCE_KINDS, FURNITURE_WORDS } from './schema'

// ---- geometry model for evidence markers (cell units) --------------------
/**
 * Radius of the marker CORE the placement rules guarantee clear of every
 * centre zone, room label and eligible token box. The drawn disc is larger
 * (15 to 26 px) but is painted BELOW the tokens, so a token always wins the
 * last pixels. 0.08u is exactly the margin between the 0.84u token and the
 * cell edge, so a marker on a wall line or a furniture rim is allowed.
 */
export const MARKER_R = 0.08
/** The centre zone of a cell: central 50%. */
export const CENTRE_BOX = [0.25, 0.75] as const
/** Worst-case token box: the shell draws 0.84u squares under 60 px (0.78u above), so [0.08, 0.92] of the cell. */
export const TOKEN_BOX = [0.08, 0.92] as const
/** Victim token: 0.56u at top/right 7% of the cell. */
export const VICTIM_BOX = { x: [0.37, 0.93], y: [0.07, 0.63] } as const
/** Numeral gutter (top/left) and paper trim (bottom/right), cell units, measured from the grid. */
export const GUTTER_LO = -0.1
/** Bottom/right lot beyond the grid, in cells (the porch lives there; the phone lot is >= 0.6u). */
export const TRIM_HI = 0.6

/** Axis-aligned label box in cell units: [x0, y0, x1, y1] (the board's `labelBox`). */
export type Box = readonly [number, number, number, number]
/** Clearance between a marker core and a room label plaque, cell units. */
export const LABEL_PAD = 0.1

/**
 * Cells a person can really stand on in this case: free floor, or a piece of a
 * type some clue says a person stands on / beside-stands. A marker may sit on
 * the rim of any other furniture piece (the token, if a player ever drops one
 * there, paints over it).
 */
export function tokenEligible(puzzle: Puzzle, r: number, c: number): boolean {
  const types = furnitureAt(puzzle, r, c, 0)
  if (!types.length) return true
  return puzzle.clues.some(({ clue }) => (clue.kind === 'onFurniture' || clue.kind === 'onlyOnFurniture') && types.includes(clue.furniture))
}

const dist = (x: number, y: number, x0: number, x1: number, y0: number, y1: number) =>
  Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1))

function segDist(x: number, y: number, s: { x1: number; y1: number; x2: number; y2: number }) {
  return dist(x, y, Math.min(s.x1, s.x2), Math.max(s.x1, s.x2), Math.min(s.y1, s.y2), Math.max(s.y1, s.y2))
}

export function placementIssues(puzzle: Puzzle, story: CaseStory, e: EvidenceStory, labels: readonly Box[] = []): string[] {
  const out: string[] = []
  const { x, y } = e.placement
  const N = puzzle.size
  const R = MARKER_R
  if (!Number.isFinite(x) || !Number.isFinite(y)) return [`${e.id}: placement is not finite`]
  if (x - R < GUTTER_LO || y - R < GUTTER_LO) out.push(`${e.id}: marker enters the numeral gutter`)
  if (x + R > N + TRIM_HI || y + R > N + TRIM_HI) out.push(`${e.id}: marker leaves the sheet`)
  const victim = puzzle.solution[puzzle.victimId]
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (dist(x, y, c + CENTRE_BOX[0], c + CENTRE_BOX[1], r + CENTRE_BOX[0], r + CENTRE_BOX[1]) < R - 1e-9)
      out.push(`${e.id}: marker overlaps the centre zone of R${r + 1}C${c + 1}`)
    if (tokenEligible(puzzle, r, c) && dist(x, y, c + TOKEN_BOX[0], c + TOKEN_BOX[1], r + TOKEN_BOX[0], r + TOKEN_BOX[1]) < R - 1e-9)
      out.push(`${e.id}: marker overlaps a token box at R${r + 1}C${c + 1}`)
    if (victim && victim.row === r && victim.col === c
      && dist(x, y, c + VICTIM_BOX.x[0], c + VICTIM_BOX.x[1], r + VICTIM_BOX.y[0], r + VICTIM_BOX.y[1]) < R - 1e-9)
      out.push(`${e.id}: marker overlaps the victim token`)
  }
  for (const b of labels) if (dist(x, y, b[0] - LABEL_PAD, b[2] + LABEL_PAD, b[1] - LABEL_PAD, b[3] + LABEL_PAD) < R - 1e-9) out.push(`${e.id}: marker touches a room label`)
  const inside = x >= 0 && x <= N && y >= 0 && y <= N
  if (inside) for (const d of story.setting.doors) {
    if (segDist(x, y, d) < R + 0.1) out.push(`${e.id}: marker sits in a door opening`)
  }
  return out
}

// ---- clue references -------------------------------------------------------
export function clueMatches(ref: ClueRef, clue: Clue): boolean {
  if (ref.kind !== clue.kind) return false
  const rec = ref as unknown as Record<string, unknown>
  const cl = clue as unknown as Record<string, unknown>
  return Object.keys(rec).every(k => k === 'kind' || JSON.stringify(rec[k]) === JSON.stringify(cl[k]))
}

// ---- lexicon ---------------------------------------------------------------
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const word = (w: string) => new RegExp(`(?<![\\p{L}])${esc(w)}(?![\\p{L}])`, 'iu')

const ROOM_ALIASES: Record<string, string[]> = {
  hallway: ['hall', 'corridor', 'passage'],
  'living room': ['lounge', 'parlour', 'parlor', 'sitting room'],
  office: ['study'],
  kitchen: ['pantry', 'scullery'],
  bedroom: ['bedchamber'],
}

export interface Concepts {
  rooms: Set<string>
  furniture: Set<FurnitureType>
  row: boolean
  col: boolean
  corner: boolean
  edge: boolean
  floor: boolean
  beside: boolean
}

export function conceptsOf(clues: Clue[]): Concepts {
  const k: Concepts = { rooms: new Set(), furniture: new Set(), row: false, col: false, corner: false, edge: false, floor: false, beside: false }
  for (const c of clues) {
    switch (c.kind) {
      case 'room': case 'notRoom': k.rooms.add(c.roomId); k.beside = k.beside || false; break
      case 'onFurniture': case 'onlyOnFurniture': k.furniture.add(c.furniture); break
      case 'besideFurniture': k.furniture.add(c.furniture); k.beside = true; break
      case 'besideAny': c.furniture.forEach(f => k.furniture.add(f)); k.beside = true; break
      case 'row': k.row = true; break
      case 'col': k.col = true; break
      case 'corner': k.corner = true; break
      case 'edge': k.edge = true; break
      case 'floor': case 'above': case 'below': k.floor = true; break
      case 'besidePerson': k.beside = true; break
      case 'direction': if (c.dir === 'N' || c.dir === 'S') k.row = true; else k.col = true; break
      default: break
    }
  }
  return k
}

/** Words that pin a place, per category. Furniture and rooms depend on the puzzle. */
function leakWords(puzzle: Puzzle, allow: Concepts, scope: { rooms: boolean; furniture: boolean }): string[] {
  const bad: string[] = []
  if (scope.rooms) {
    for (const room of puzzle.rooms) {
      if (allow.rooms.has(room.id)) continue
      const base = room.name.toLowerCase()
      bad.push(base, ...(ROOM_ALIASES[base] ?? []))
    }
  }
  if (scope.furniture) {
    const present = new Set(puzzle.furniture.map(f => f.type))
    for (const type of Object.keys(FURNITURE_WORDS) as FurnitureType[]) {
      if (allow.furniture.has(type)) continue
      // every type, present or not: a word for an object the house does not hold is still an invented object
      void present
      bad.push(...FURNITURE_WORDS[type])
    }
  }
  if (!allow.row) bad.push('row', 'rows')
  if (!allow.col) bad.push('column', 'columns')
  if (!allow.corner) bad.push('corner', 'corners')
  if (!allow.edge) bad.push('edge', 'edges')
  if (!allow.floor) bad.push('floor', 'floors', 'upstairs', 'downstairs', 'storey', 'ground floor')
  if (!allow.beside) bad.push('beside', 'next to', 'near', 'nearby', 'behind', 'opposite', 'adjacent', 'alongside')
  // directions are never in the narrative unless a direction clue says so
  bad.push('north', 'south', 'east', 'west', 'northern', 'southern', 'eastern', 'western', 'leftmost', 'rightmost', 'topmost')
  return bad
}

function furnitureWordsAllowed(allow: Concepts): Set<string> {
  const s = new Set<string>()
  for (const t of allow.furniture) FURNITURE_WORDS[t].forEach(w => s.add(w))
  return s
}

/** Returns the forbidden words found in `text` given what the clues allow. */
export function leaks(puzzle: Puzzle, text: string, allow: Concepts, scope = { rooms: true, furniture: true }): string[] {
  const allowed = furnitureWordsAllowed(allow)
  // a row clue legitimises "bottom"/"top" only through the word "row"; "bottom row" is covered by `row`
  const found = leakWords(puzzle, allow, scope).filter(w => !allowed.has(w) && word(w).test(text))
  // a digit next to row/column ("row 3") is a printed coordinate: never narrative
  if (/\b(row|column)\s*\d/i.test(text) || /\b[rc]\d+\b/i.test(text)) found.push('coordinate')
  return [...new Set(found)]
}

// ---- presence / absence assertions ------------------------------------------
/** Verbs that claim where someone went, stayed or never went. Only a clue may place a person; the voice may not add to it. */
const MOVEMENT_WORDS = [
  'went', 'go', 'goes', 'going', 'gone', 'walk', 'walked', 'walking', 'came', 'come', 'coming', 'entered', 'enter', 'entering',
  'left', 'leave', 'leaving', 'stayed', 'stay', 'stays', 'staying', 'wandered', 'passed', 'crossed', 'followed', 'ventured',
  'inside', 'outside', 'upstairs', 'downstairs', 'indoors', 'outdoors', 'doorway', 'threshold',
  'out of the way', 'no further', 'as far as', 'kept out', 'kept to', 'set foot', 'in the house', 'around the house', 'about the house',
]
/** Area nouns the voice may not use except through a clue (rooms are named only by room clues). */
const AREA_WORDS = ['room', 'rooms', 'house', 'hall', 'hallway', 'corridor', 'landing', 'stairs', 'stair', 'garden', 'yard']
const presenceHits = (text: string, lineClue: boolean) => [
  ...MOVEMENT_WORDS.filter(w => word(w).test(text)),
  // a clue-voiced line may say "in the Bedroom" through its own clue; the generic area words stay banned in every other text
  ...(lineClue ? [] : AREA_WORDS.filter(w => word(w).test(text))),
]

/** Phrases that single one suspect out by tone: banned everywhere before the solve. */
export const BANNED_ASYMMETRY = [
  'never laid a hand', 'laid a hand on him', 'did not see what happened', 'never left it', 'i never left', 'the two sets had not agreed',
  'kept the books', 'kept the ledgers', 'had not agreed', 'never touched', 'i was never', 'wasn\'t me', 'not me',
]
const DENIAL = /\b(never|did not|didn't|do not|don't|nothing to do|not the one|wasn't|was not|had no)\b/gi

export interface SuspectMetrics { person: string; chars: number; evidence: number; denials: number }

/** Pre-solve prose of one suspect, joined (cards, interrogation sheet). */
export function suspectProse(story: CaseStory, personId: string): string {
  const s = story.suspects.find(x => x.personId === personId)
  if (!s) return ''
  return [s.role, s.oneLiner, s.motive.label, s.motive.text, s.alibi, ...s.lines.map(l => l.text)].join(' ')
}

export function suspectMetrics(puzzle: Puzzle, story: CaseStory): SuspectMetrics[] {
  return puzzle.people.filter(p => p.id !== puzzle.victimId).map(p => {
    const text = suspectProse(story, p.id)
    const evidence = story.evidence.filter(e => e.showDuringPlay && e.refs.some(r => word(r).test(text))).length
    return { person: p.id, chars: text.length, evidence, denials: (text.match(DENIAL) ?? []).length }
  })
}

const ACCUSE = /\b(murder(?:er|ers|ed|ess)?|killer|killed|kills?|guilty|culprit|did it|strangled|poisoned|stabbed|shot him)\b/i

const sentences = (t: string) => t.split(/(?<=[.!?])\s+/)

// ---- main --------------------------------------------------------------------
export function validateStory(puzzle: Puzzle, story: CaseStory): string[] {
  const issues: string[] = []
  const add = (s: string) => issues.push(s)
  if (story.caseId !== puzzle.id) add(`story is for ${story.caseId}, puzzle is ${puzzle.id}`)

  const murdererId = findMurderer(puzzle, puzzle.solution) ?? puzzle.murdererId
  const murderer = puzzle.people.find(p => p.id === murdererId)
  const nonVictims = puzzle.people.filter(p => p.id !== puzzle.victimId)
  const allClues = puzzle.clues.map(c => c.clue)
  const publicAllow = conceptsOf(allClues)

  // cast
  const ids = story.suspects.map(s => s.personId)
  if (new Set(ids).size !== ids.length) add('duplicate suspect entries')
  for (const p of puzzle.people) if (!ids.includes(p.id)) add(`${p.name} has no story entry`)
  const portraits = story.suspects.map(s => s.portrait).filter((x): x is number => x !== undefined)
  if (new Set(portraits).size !== portraits.length) add('two people share a portrait')
  for (const x of portraits) if (!Number.isInteger(x) || x < 0 || x > 7) add(`portrait ${x} out of range`)

  // pre-solve prose checks
  const preSolve: Array<{ where: string; text: string; scope: 'public' | { personId: string; clue?: ClueRef } }> = []
  preSolve.push({ where: 'premise', text: story.premise, scope: 'public' })

  for (const s of story.suspects) {
    const person = puzzle.people.find(p => p.id === s.personId)
    if (!person) { add(`story entry for unknown person ${s.personId}`); continue }
    if (!s.fullName.startsWith(person.name)) add(`${person.name}: fullName "${s.fullName}" must start with the first name`)
    const own = puzzle.clues.filter(c => c.clue.person === person.id)
    const real = own.filter(c => c.clue.kind !== 'victim')
    // semantic equality of the clue sets
    for (const [i, line] of s.lines.entries()) {
      if (!own.some(c => clueMatches(line.clue, c.clue))) add(`${person.name} line ${i + 1}: no such clue for this person`)
      if (!line.text.trim()) add(`${person.name} line ${i + 1}: empty`)
    }
    for (const c of real) {
      if (!s.lines.some(l => clueMatches(l.clue, c.clue))) add(`${person.name}: clue "${c.text}" has no voiced line`)
    }
    for (const [i, line] of s.lines.entries()) {
      const hit = own.find(c => clueMatches(line.clue, c.clue))
      if (hit) preSolve.push({ where: `${person.name} line ${i + 1}`, text: line.text, scope: { personId: person.id, clue: line.clue } })
    }
    preSolve.push({ where: `${person.name} alibi`, text: s.alibi, scope: { personId: person.id } })
    preSolve.push({ where: `${person.name} oneLiner`, text: s.oneLiner, scope: { personId: person.id } })
    preSolve.push({ where: `${person.name} motive`, text: `${s.motive.label}. ${s.motive.text}`, scope: { personId: person.id } })
    preSolve.push({ where: `${person.name} role`, text: s.role, scope: { personId: person.id } })
  }

  for (const item of preSolve) {
    let allow: Concepts
    if (item.scope === 'public') allow = publicAllow
    else {
      const own = puzzle.clues.filter(c => c.clue.person === (item.scope as { personId: string }).personId).map(c => c.clue)
      const ref = (item.scope as { clue?: ClueRef }).clue
      // a voiced line may only touch the concepts of ITS clue; other text, the person's whole set
      allow = conceptsOf(ref ? own.filter(c => clueMatches(ref, c)) : own)
    }
    const bad = leaks(puzzle, item.text, allow)
    if (bad.length) add(`${item.where}: mentions "${bad.join('", "')}" which its clue does not state`)

    // names: a suspect's prose never names another non-victim suspect
    const ownerId = item.scope === 'public' ? null : item.scope.personId
    for (const p of nonVictims) {
      if (p.id === ownerId) continue
      if (word(p.name).test(item.text)) add(`${item.where}: names ${p.name}`)
    }
    // accusations
    for (const sen of sentences(item.text)) {
      if (!ACCUSE.test(sen)) continue
      if (item.scope !== 'public') add(`${item.where}: accusation word before the case is solved`)
      else if (murderer && word(murderer.name).test(sen)) add(`${item.where}: names the murderer`)
    }
    if (murderer && item.scope === 'public' && word(murderer.name).test(item.text)) add(`${item.where}: names the murderer`)
  }

  // presence / absence: the voice never claims where anyone was or was not beyond the clue
  for (const s of story.suspects) {
    const name = puzzle.people.find(p => p.id === s.personId)?.name ?? s.personId
    const bits: Array<[string, string, boolean]> = [
      [`${name} alibi`, s.alibi, false], [`${name} oneLiner`, s.oneLiner, false], [`${name} motive`, s.motive.text, false], [`${name} role`, s.role, false],
      ...s.lines.map((l, i) => [`${name} line ${i + 1}`, l.text, true] as [string, string, boolean]),
    ]
    for (const [where, text, lineClue] of bits) {
      const hit = presenceHits(text, lineClue)
      if (hit.length) add(`${where}: asserts presence or absence ("${hit.join('", "')}")`)
    }
  }
  // symmetry: the murderer's card must not read differently from an innocent's
  const prose = [story.premise, ...story.suspects.flatMap(s => [s.oneLiner, s.motive.text, s.alibi, ...s.lines.map(l => l.text)])].join('\n').toLowerCase()
  for (const b of BANNED_ASYMMETRY) if (prose.includes(b)) add(`pre-solve text contains the asymmetry phrase "${b}"`)
  const m = suspectMetrics(puzzle, story)
  for (const key of ['chars', 'evidence', 'denials'] as const) {
    const vals = m.map(x => x[key])
    const mean = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length)
    for (const x of m) if (mean > 0 && Math.abs(x[key] - mean) > 0.2 * mean + 1e-9) add(`${key} of ${x.person} (${x[key]}) is not within 20% of the cast mean (${mean.toFixed(1)})`)
  }
  // evidence
  const ns = story.evidence.map(e => e.n).sort((a, b) => a - b)
  if (ns.some((n, i) => n !== i + 1)) add('evidence numbers must be 1..k without gaps')
  if (new Set(story.evidence.map(e => e.id)).size !== story.evidence.length) add('duplicate evidence ids')
  const furnitureTypes = Object.keys(FURNITURE_WORDS)
  const evidenceAllow = { ...publicAllow, rooms: new Set(puzzle.rooms.map(r => r.id)), furniture: new Set(furnitureTypes as FurnitureType[]) }
  for (const e of story.evidence) {
    if (!EVIDENCE_KINDS.includes(e.kind)) add(`${e.id}: unknown kind ${e.kind}`)
    if (furnitureTypes.includes(e.kind)) add(`${e.id}: kind ${e.kind} is a clue-relevant furniture type`)
    issues.push(...placementIssues(puzzle, story, e))
    for (const [what, text] of [['label', e.label], ['description', e.description]] as const) {
      const bad = leaks(puzzle, text, evidenceAllow, { rooms: false, furniture: false })
      if (bad.length) add(`${e.id} ${what}: mentions "${bad.join('", "')}"`)
      for (const p of nonVictims) if (word(p.name).test(text)) add(`${e.id} ${what}: names ${p.name} before the case is solved`)
      if (ACCUSE.test(text)) add(`${e.id} ${what}: accusation word before the case is solved`)
    }
  }

  // setting + reveal
  if (!puzzle.rooms.some(r => r.id === story.setting.hubRoomId)) add('hubRoomId is not a room')
  const ec = story.setting.entranceCell
  if (ec.row < 0 || ec.col < 0 || ec.row >= puzzle.size || ec.col >= puzzle.size) add('entranceCell outside the grid')
  const cp = story.reveal.crucial
  const owner = puzzle.clues.filter(c => c.clue.person === cp.person)
  if (!owner.some(c => clueMatches(cp.clue, c.clue))) add('reveal.crucial does not reference a real clue of that person')
  for (const k of ['motive', 'movements', 'crucial', 'conclusion', 'dossier'] as const) {
    if (!story.reveal[k].title.trim() || !story.reveal[k].body.trim()) add(`reveal.${k} is empty`)
  }
  return issues
}
