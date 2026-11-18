// ============================================================================
// Reconstruction script (R2): turns the authored beats + the REAL deduction
// chain + footstep routes into an ordered list of frames the shell animates.
// Pure data, no React.
// ============================================================================

import type { Cell, Puzzle } from '../../core/types'
import { clueHolds } from '../../core/engine'
import type { CaseStory } from './schema'
import type { DeductionChain, DeductionStep } from './deduce'
import { deduceChain } from './deduce'
import { clueMatches } from './validate'

export type Pt = { x: number; y: number }

export interface ReconFrame {
  id: string
  /** Which of the 4 timeline steps this frame belongs to: 0 motive, 1 movements, 2 crucial, 3 conclusion (and dossier). */
  step: 0 | 1 | 2 | 3
  /** Filmstrip slot: the four steps plus the closing Dossier card. */
  slot: 0 | 1 | 2 | 3 | 4
  kind: 'motive' | 'movements' | 'crucial' | 'deduce' | 'conclusion' | 'dossier'
  title: string
  body: string
  /** People whose token is shown at full strength; the rest are dimmed. */
  pinned: string[]
  /** People whose footstep route is drawn. */
  routes: string[]
  /** Evidence ids whose numbered marker is spotlighted (all markers stay visible). */
  spotlight: string[]
  /** Deduction detail for 'deduce' frames. */
  deduction?: DeductionStep
  /** Person whose clues are washed onto the plan in this frame. */
  washFor?: string
  /** Show the evidence that is held back during play (the key). */
  reveal: boolean
  /** Chalk outline on the victim. */
  chalk: boolean
  /** Room glow + gold ring on the culprit. */
  accuse: boolean
}

export interface Reconstruction {
  frames: ReconFrame[]
  routes: Record<string, Pt[]>
  chain: DeductionChain
  murderer: string
}

// ---- routes ---------------------------------------------------------------
// Footsteps are routed on a 0.25u lattice: a node is blocked inside a furniture
// footprint (inset 0.25u, so the gaps between pieces and the walls stay walkable)
// and on any wall line outside a door opening. Dijkstra with a small turn
// penalty gives tidy L-shaped walks.
type Door = { x1: number; y1: number; x2: number; y2: number }
const STEP = 0.25
const EPS = 1e-6
const isInt = (v: number) => Math.abs(v - Math.round(v)) < EPS

function inDoor(doors: Door[], x: number, y: number): boolean {
  return doors.some(d => x >= Math.min(d.x1, d.x2) - EPS && x <= Math.max(d.x1, d.x2) + EPS && y >= Math.min(d.y1, d.y2) - EPS && y <= Math.max(d.y1, d.y2) + EPS)
}
/** Strictly inside the opening: the jambs themselves are not walkable, so footsteps pass THROUGH the door, never along its frame. */
function inDoorway(doors: Door[], x: number, y: number): boolean {
  return doors.some(d => {
    const vertical = Math.abs(d.x1 - d.x2) < EPS
    return vertical
      ? Math.abs(x - d.x1) < EPS && y > Math.min(d.y1, d.y2) + EPS && y < Math.max(d.y1, d.y2) - EPS
      : Math.abs(y - d.y1) < EPS && x > Math.min(d.x1, d.x2) + EPS && x < Math.max(d.x1, d.x2) - EPS
  })
}

/** Lattice node usable for walking? Furniture and wall lines (outside doors) are not. */
function walkable(puzzle: Puzzle, doors: Door[], x: number, y: number): boolean {
  const n = puzzle.size
  if (x < -EPS || y < -EPS || x > n + EPS || y > n + EPS) return false
  for (const f of puzzle.furniture) {
    if ((f.floor ?? 0) !== 0) continue
    const w = f.w ?? 1, h = f.h ?? 1
    if (x > f.col + 0.25 + EPS && x < f.col + w - 0.25 - EPS && y > f.row + 0.25 + EPS && y < f.row + h - 0.25 - EPS) return false
  }
  const room = (r: number, c: number) => (r < 0 || c < 0 || r >= n || c >= n ? '' : (puzzle.roomOf[r]?.[c] ?? ''))
  const xi = isInt(x), yi = isInt(y)
  if (!xi && !yi) return true
  const cx = Math.round(x), cy = Math.round(y)
  const cells: string[] = []
  if (xi && yi) cells.push(room(cy - 1, cx - 1), room(cy - 1, cx), room(cy, cx - 1), room(cy, cx))
  else if (xi) { const r = Math.floor(y); cells.push(room(r, cx - 1), room(r, cx)) }
  else { const c = Math.floor(x); cells.push(room(cy - 1, c), room(cy, c)) }
  if (cells.every(k => k === cells[0] && k !== '')) return true
  return inDoorway(doors, x, y)
}

/** Shortest tidy walk (lattice points) from the street door to the middle of the destination cell. */
export function walk(puzzle: Puzzle, story: CaseStory, to: Cell): Pt[] {
  const n = puzzle.size
  const doors = story.setting.doors
  const L = Math.round(n / STEP) + 1
  const at = (i: number) => i * STEP
  const ok = new Map<number, boolean>()
  const free = (i: number, j: number) => {
    if (i < 0 || j < 0 || i >= L || j >= L) return false
    const k = j * L + i
    let v = ok.get(k)
    if (v === undefined) { v = walkable(puzzle, doors, at(i), at(j)); ok.set(k, v) }
    return v
  }
  // start: the door node nearest the porch point
  const e = story.setting.entrance
  let start: [number, number] | null = null, best = Infinity
  for (let j = 0; j < L; j++) for (let i = 0; i < L; i++) {
    if (!inDoor(doors, at(i), at(j)) || !free(i, j)) continue
    const d = Math.hypot(at(i) - e.x, at(j) - e.y)
    if (d < best) { best = d; start = [i, j] }
  }
  const goal: [number, number] = [Math.round((to.col + 0.5) / STEP), Math.round((to.row + 0.5) / STEP)]
  if (!start) return [{ ...e }, { x: to.col + 0.5, y: to.row + 0.5 }]
  const dirs: Array<[number, number]> = [[1, 0], [0, 1], [-1, 0], [0, -1]]
  const key = (i: number, j: number, d: number) => (j * L + i) * 4 + d
  const dist = new Map<number, number>(), prev = new Map<number, number>()
  const open: Array<{ i: number; j: number; d: number; c: number }> = []
  for (let d = 0; d < 4; d++) { dist.set(key(start[0], start[1], d), 0); open.push({ i: start[0], j: start[1], d, c: 0 }) }
  let found: number | null = null
  while (open.length) {
    let bi = 0
    for (let k = 1; k < open.length; k++) if (open[k].c < open[bi].c) bi = k
    const cur = open.splice(bi, 1)[0]
    if (cur.c > (dist.get(key(cur.i, cur.j, cur.d)) ?? Infinity)) continue
    if (cur.i === goal[0] && cur.j === goal[1]) { found = key(cur.i, cur.j, cur.d); break }
    for (let d = 0; d < 4; d++) {
      const ni = cur.i + dirs[d][0], nj = cur.j + dirs[d][1]
      if (!free(ni, nj)) continue
      const c = cur.c + 1 + (d === cur.d ? 0 : 0.3)
      const kk = key(ni, nj, d)
      if (c < (dist.get(kk) ?? Infinity) - 1e-9) { dist.set(kk, c); prev.set(kk, key(cur.i, cur.j, cur.d)); open.push({ i: ni, j: nj, d, c }) }
    }
  }
  if (found === null) return [{ ...e }, { x: to.col + 0.5, y: to.row + 0.5 }]
  const out: Pt[] = []
  for (let k: number | undefined = found; k !== undefined; k = prev.get(k)) {
    const node = Math.floor(k / 4)
    out.unshift({ x: at(node % L), y: at(Math.floor(node / L)) })
  }
  return out
}

/** Polyline in cell units from the street door to just short of the person's token. */
export function routeTo(puzzle: Puzzle, story: CaseStory, to: Cell): Pt[] {
  const pts: Pt[] = [{ ...story.setting.entrance }, ...walk(puzzle, story, to)]
  const clean = pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > EPS)
  // stop at least 0.46u (straight line) short of the destination centre so the token stays clear
  const cx = to.col + 0.5, cy = to.row + 0.5
  while (clean.length >= 2) {
    const b = clean[clean.length - 1], a = clean[clean.length - 2]
    if (Math.hypot(b.x - cx, b.y - cy) >= 0.46) break
    const d = Math.hypot(b.x - a.x, b.y - a.y)
    if (d <= 0.02) clean.pop()
    else clean[clean.length - 1] = { x: b.x + ((a.x - b.x) / d) * 0.02, y: b.y + ((a.y - b.y) / d) * 0.02 }
  }
  // drop collinear middle points
  return clean.filter((p, i) => {
    if (i === 0 || i === clean.length - 1) return true
    const a = clean[i - 1], b = clean[i + 1]
    return !((Math.abs(a.x - p.x) < EPS && Math.abs(p.x - b.x) < EPS) || (Math.abs(a.y - p.y) < EPS && Math.abs(p.y - b.y) < EPS))
  })
}

// ---- deduction wording ------------------------------------------------------
const spot = (c: Cell) => `row ${c.row + 1}, column ${c.col + 1}`
const list = (xs: string[]) => xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`

export function deductionText(puzzle: Puzzle, s: DeductionStep): string {
  const name = (id: string) => puzzle.people.find(p => p.id === id)?.name ?? 'Someone'
  const who = name(s.person)
  const said = s.clues.length ? list(s.clues.map(c => `“${c.text.replace(/\.$/, '')}”`)) : 'their clues'
  const n0 = s.ownCandidates.length
  const first = n0 === 1
    ? `${said} allow exactly one square.`
    : `${said} allow ${n0} squares.`
  const lane = [...new Set(s.removed.filter(r => r.reason === 'lane').map(r => r.by))]
  const pair = [...new Set(s.removed.filter(r => r.reason === 'pair').map(r => r.by))]
  const bits: string[] = []
  if (lane.length) bits.push(`${list(lane.map(name))} already ${lane.length === 1 ? 'holds' : 'hold'} a row and column of their own, so those squares are gone`)
  if (pair.length) bits.push(`standing anywhere else would leave ${list(pair.map(name))} nowhere to stand`)
  const joined = bits.join('; ')
  const mid = bits.length ? ` ${joined[0].toUpperCase()}${joined.slice(1)}.` : ''
  const end = s.via === 'trial' ? ` Testing each square, only ${spot(s.cell)} lets everyone fit.` : ` That leaves ${spot(s.cell)}.`
  return `${who}: ${first}${mid}${end}`
}

// ---- frames -----------------------------------------------------------------
export function buildReconstruction(puzzle: Puzzle, story: CaseStory, chain: DeductionChain = deduceChain(puzzle)): Reconstruction {
  const everyone = puzzle.people.map(p => p.id)
  const murderer = puzzle.murdererId
  const routes: Record<string, Pt[]> = {}
  for (const p of puzzle.people) {
    const cell = puzzle.solution[p.id]
    if (cell) routes[p.id] = routeTo(puzzle, story, cell)
  }
  const evId = (play: boolean) => story.evidence.filter(e => e.showDuringPlay || !play).map(e => e.id)
  const innocentsAndVictim = everyone.filter(id => id !== murderer)
  const crucialOwner = story.reveal.crucial.person
  const frames: ReconFrame[] = []
  frames.push({
    id: 'motive', step: 0, slot: 0, reveal: false, kind: 'motive', title: story.reveal.motive.title, body: story.reveal.motive.body,
    pinned: [], routes: [], spotlight: evId(true).slice(0, 1), chalk: false, accuse: false,
  })
  frames.push({
    id: 'movements', step: 1, slot: 1, reveal: false, kind: 'movements', title: story.reveal.movements.title, body: story.reveal.movements.body,
    pinned: [], routes: innocentsAndVictim, spotlight: evId(true).slice(-1), chalk: false, accuse: false,
  })
  frames.push({
    id: 'crucial', step: 2, slot: 2, reveal: false, kind: 'crucial', title: story.reveal.crucial.title, body: story.reveal.crucial.body,
    pinned: [], routes: [], spotlight: [], washFor: crucialOwner, chalk: false, accuse: false,
  })
  chain.steps.forEach((s, i) => {
    frames.push({
      id: `deduce-${s.n}`, step: 2, slot: 2, reveal: false, kind: 'deduce', title: `${story.reveal.crucial.title} · ${s.n} / ${chain.steps.length}`, body: deductionText(puzzle, s),
      pinned: chain.steps.slice(0, i + 1).map(x => x.person), routes: [], spotlight: [], deduction: s, washFor: s.person, chalk: false, accuse: false,
    })
  })
  frames.push({
    id: 'conclusion', step: 3, slot: 3, reveal: true, kind: 'conclusion', title: story.reveal.conclusion.title, body: story.reveal.conclusion.body,
    pinned: everyone, routes: [murderer], spotlight: story.evidence.filter(e => !e.showDuringPlay).map(e => e.id), chalk: true, accuse: true,
  })
  frames.push({
    id: 'dossier', step: 3, slot: 4, reveal: true, kind: 'dossier', title: story.reveal.dossier.title, body: story.reveal.dossier.body,
    pinned: everyone, routes: [], spotlight: [], chalk: true, accuse: true,
  })
  return { frames, routes, chain, murderer }
}

/** True when the authored "crucial" beat names a clue that really belongs to the first-pinned suspect. */
export function crucialIsFirstPin(puzzle: Puzzle, story: CaseStory, chain: DeductionChain): boolean {
  const first = chain.steps[0]
  if (!first || first.person !== story.reveal.crucial.person) return false
  return puzzle.clues.some(c => c.clue.person === first.person && clueMatches(story.reveal.crucial.clue, c.clue))
}

/** Self-check used by tests: the chain's placement satisfies every clue. */
export function chainSatisfiesClues(puzzle: Puzzle, chain: DeductionChain): boolean {
  return puzzle.clues.every(c => clueHolds(puzzle, c.clue, chain.placement))
}
