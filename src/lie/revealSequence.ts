// The reveal as a sequence of beats. Pure data (buildSteps) plus one hook (useRevealSequence) that
// walks it on a timer and hands the board a partial TilePlan prop set and a caption for each beat.
//
//   1. the liar's ghost stands where the false statement put them          (when it names a tile)
//   2. each account that refutes it pulses, with its own words             (up to three)
//   3. "Then where was X?": the ghost travels to X's real tile; ring and murder-room tint appear
//   4. "Alone with V." and the harbour bell; the sequence is done
//
// Everything is read from `placed` and the case; nothing here consults puzzle.solution.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { roomIdAt, unaryClueHolds } from '../core/engine'
import type { Cell } from '../core/types'
import type { TilePlanProps } from './art/TilePlan'
import type { LieCase, Statement } from './model'
import { loadSoundPref, playCue } from './sound'

export type Tier = 'Proved' | 'Proved, after a false start' | 'Closed'

export const tierFor = (truthOnly: boolean, strikes: number): Tier =>
  truthOnly ? 'Closed' : strikes === 0 ? 'Proved' : 'Proved, after a false start'

const key = (c: { row: number; col: number }) => `${c.row},${c.col}`

export const nameOf = (c: LieCase, id: string): string =>
  c.story.cast[id]?.name ?? c.puzzle.people.find(x => x.id === id)?.name ?? id

export const lieOf = (c: LieCase): Statement | undefined => c.statements.find(s => s.id === c.lieId)
export const liarOf = (c: LieCase): string => lieOf(c)?.author ?? c.puzzle.murdererId

/** "A", "A and B", "A, B and C" */
export function joinNames(names: string[]): string {
  if (names.length < 2) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** "{M}" and "{V}" in the story's closing line */
export const fillStory = (text: string, c: LieCase): string =>
  text.replaceAll('{M}', nameOf(c, c.puzzle.murdererId)).replaceAll('{V}', nameOf(c, c.puzzle.victimId))

/** The words a statement is read in: the speaker's sentence where there is one, else the positional text. */
const said = (s: Statement): string => s.display ?? s.text

/** The refuting statements: the other authors' statements in the two collisions, one per author, never the liar's. */
export function refutingStatements(c: LieCase, max = 3): Statement[] {
  const who = liarOf(c)
  const out: Statement[] = []
  for (const set of c.collisions) {
    for (const id of set) {
      const s = c.statements.find(x => x.id === id)
      if (s && s.author !== who && !out.some(o => o.author === s.author)) out.push(s)
    }
  }
  return out.slice(0, max)
}

/** Who refutes the lie: the authors of the other statements in the collisions, never the liar. */
export const refuters = (c: LieCase): string[] => refutingStatements(c, Infinity).map(s => s.author)

/** Statement kinds that pin their author to a set of tiles on their own. The rest (relational, negative, floor) do not. */
const LOCATABLE = new Set(['room', 'onFurniture', 'besideFurniture', 'besideAny', 'onlyOnFurniture', 'row', 'col', 'edge', 'corner'])

/**
 * The tile the false statement claimed. Null when the lie names no tile (relational or negative).
 * Otherwise, of the tiles the statement allows, the one that clashes least with everyone else's real
 * row and column, then the one nearest the liar's real tile, then row-major. A tile a person already
 * stands on is the last resort. Deterministic.
 */
export function claimedTile(c: LieCase, placed: Record<string, Cell>): Cell | null {
  const st = lieOf(c)
  if (!st || !LOCATABLE.has(st.clue.kind)) return null
  const others = Object.entries(placed).filter(([id]) => id !== st.author).map(([, cell]) => cell)
  const rows = new Set(others.map(o => o.row)), cols = new Set(others.map(o => o.col))
  const occupied = new Set(others.map(key))
  const home = placed[st.author] ?? null
  let best: { cell: Cell; score: number } | null = null
  for (let row = 0; row < c.puzzle.size; row++) {
    for (let col = 0; col < c.puzzle.size; col++) {
      const cell: Cell = { row, col }
      if (home && home.row === row && home.col === col) continue
      if (!unaryClueHolds(c.puzzle, st.clue, cell)) continue
      const score = (rows.has(row) ? 100 : 0) + (cols.has(col) ? 100 : 0) + (occupied.has(key(cell)) ? 1000 : 0)
        + (home ? Math.abs(home.row - row) + Math.abs(home.col - col) : 0)
      if (!best || score < best.score) best = { cell, score }
    }
  }
  return best?.cell ?? null
}

/** Every tile of the room the victim lies in. */
function murderRoom(c: LieCase, placed: Record<string, Cell>): Set<string> {
  const out = new Set<string>()
  const at = placed[c.puzzle.victimId]
  if (!at) return out
  const room = roomIdAt(c.puzzle, at)
  if (!room) return out
  for (let row = 0; row < c.puzzle.size; row++) {
    for (let col = 0; col < c.puzzle.size; col++) if (roomIdAt(c.puzzle, { row, col }) === room) out.add(key({ row, col }))
  }
  return out
}

export interface RevealStep {
  caption: string
  plan: Partial<TilePlanProps>
  /** how long the beat holds before the next one, ms */
  ms: number
}

export function buildSteps(c: LieCase, placed: Record<string, Cell>): RevealStep[] {
  const liar = liarOf(c)
  const liarName = nameOf(c, liar)
  const lie = lieOf(c)
  const claimed = claimedTile(c, placed)
  const home = placed[liar] ?? null
  // while the ghost is out, the liar's real token waits off the plan
  const without = (): Record<string, Cell> => {
    const t = { ...placed }
    delete t[liar]
    return t
  }
  // murderer is null (not absent) until beat 3, so a host that also passes its own `murderer` prop is overridden by the spread
  const away: Partial<TilePlanProps> = claimed && lie ? { tokens: without(), ghost: { person: liar, cell: claimed }, murderer: null } : { murderer: null }
  const steps: RevealStep[] = []

  if (claimed && lie) steps.push({ caption: `“${said(lie)}” — ${liarName}`, plan: away, ms: 1600 })

  for (const s of refutingStatements(c)) {
    steps.push({ caption: `${nameOf(c, s.author)}: “${said(s)}”`, plan: { ...away, pulse: s.author }, ms: 1300 })
  }

  const tint = murderRoom(c, placed)
  steps.push({
    caption: `Then where was ${liarName}?`,
    plan: claimed && lie && home
      ? { tokens: without(), ghost: { person: liar, cell: home }, murderer: liar, tint }
      : { murderer: liar, tint },
    ms: 1700,
  })
  steps.push({ caption: `Alone with ${nameOf(c, c.puzzle.victimId)}.`, plan: { murderer: liar, tint }, ms: 1200 })
  return steps
}

export interface RevealSequence {
  /** spread over the board's props, last: it owns tokens, ghost, pulse, murderer and tint while the reveal runs */
  plan: Partial<TilePlanProps>
  caption: string | null
  done: boolean
  /** jump to the final frame (tap anywhere) */
  skip: () => void
  /** play it again from the first beat */
  restart: () => void
}

export function useRevealSequence(c: LieCase, placed: Record<string, Cell>, active: boolean, reducedMotion: boolean): RevealSequence {
  const steps = useMemo(() => buildSteps(c, placed), [c, placed])
  const last = steps.length - 1
  const [beat, setBeat] = useState(0)
  const [run, setRun] = useState(0)
  const idx = !active ? -1 : reducedMotion ? last : Math.min(beat, last)

  useEffect(() => {
    if (!active) { setBeat(0); return }
    if (reducedMotion || idx >= last) return
    const t = setTimeout(() => setBeat(b => Math.min(b + 1, last)), steps[idx].ms)
    return () => clearTimeout(t)
  }, [active, reducedMotion, idx, last, run, steps])

  const done = idx === last
  const rang = useRef(false)
  useEffect(() => {
    if (!done) { rang.current = false; return }
    if (rang.current) return
    rang.current = true
    if (loadSoundPref()) playCue('bell')
  }, [done])

  const skip = useCallback(() => setBeat(last), [last])
  const restart = useCallback(() => { setBeat(0); setRun(r => r + 1) }, [])

  const step = idx >= 0 ? steps[idx] : null
  return { plan: step?.plan ?? EMPTY_PLAN, caption: step?.caption ?? null, done, skip, restart }
}

const EMPTY_PLAN: Partial<TilePlanProps> = {}
