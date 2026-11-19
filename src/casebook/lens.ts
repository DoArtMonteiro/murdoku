// The lens: a suspect's statements as toggles. Lit statements light the cells
// where ALL of them hold. It only evaluates what the statements say. It never
// applies anyone else's lane and never reads the solution.
import type { Clue, Puzzle } from '../core/types'
import { clueHolds } from '../core/engine'
import { allCells, cellKey } from './cells'
import { chipText } from './phrase'
import type { Placement } from './cells'

export interface Statement {
  /** Index into puzzle.clues: the stable id of the statement. */
  index: number
  clue: Clue
  text: string
  /** The other person a relational statement is about. */
  needs?: string
}

/** The other person a clue is about, if it is relational. */
export function otherPerson(clue: Clue): string | undefined {
  if ('other' in clue) return clue.other
  if ((clue.kind === 'above' || clue.kind === 'below') && clue.targetKind === 'person') return clue.target
  return undefined
}

export function statementsOf(p: Puzzle, personId: string): Statement[] {
  const out: Statement[] = []
  const scene = p.victimId === personId
  p.clues.forEach((ct, index) => {
    if (ct.clue.person !== personId || ct.clue.kind === 'victim') return
    out.push({ index, clue: ct.clue, text: chipText(p, ct.clue, scene), needs: otherPerson(ct.clue) })
  })
  return out
}

/** A relational statement can be lit only once the other person stands somewhere. */
export const statementReady = (st: Statement, place: Placement): boolean => !st.needs || !!place[st.needs]

/**
 * Cells (any floor) where every READY lit statement holds, or null when nothing
 * ready is lit. Relational statements are evaluated against the other person's
 * current placement with clueHolds, so besidePerson, sameRoomAs, direction and
 * the above/below-person kinds keep their engine semantics.
 */
export function lensCells(p: Puzzle, personId: string, lit: readonly number[], place: Placement): Set<string> | null {
  const sts = statementsOf(p, personId).filter(s => lit.includes(s.index) && statementReady(s, place))
  if (!sts.length) return null
  const out = new Set<string>()
  for (const cell of allCells(p)) {
    const trial: Placement = { ...place, [personId]: cell }
    if (sts.every(s => clueHolds(p, s.clue, trial))) out.add(cellKey(cell))
  }
  return out
}

/**
 * Height the chips of the busiest suspect need, from a greedy wrap of their statements
 * (about 8 px per serif character at 16 px, 32 px of padding, 8 px gaps). It errs on the
 * generous side, so a case never clips; it is per CASE, not per suspect, so selecting
 * another suspect never moves the board.
 */
export function reserveHeightFor(p: Puzzle, width = 340): number {
  let worst = 0
  for (const x of p.people) {
    let used = 0, rowH = 0, total = 0
    for (const s of statementsOf(p, x.id)) {
      const w = Math.min(width, Math.ceil(s.text.length * 8) + 32)
      const h = s.needs ? 58 : 46
      if (used && used + 8 + w > width) { total += rowH + 8; used = 0; rowH = 0 }
      used += (used ? 8 : 0) + w
      rowH = Math.max(rowH, h)
    }
    worst = Math.max(worst, total + rowH)
  }
  return Math.max(46, worst)
}

/**
 * People whose statements ALL hold at the square they stand on. A person with no
 * statements, an unplaced person, or one with a statement about someone not yet
 * placed is never listed. It says only what the player could check by lighting
 * the statements: it does not say the square is right.
 */
export function satisfiedIds(p: Puzzle, place: Placement): Set<string> {
  const out = new Set<string>()
  for (const x of p.people) {
    const sts = statementsOf(p, x.id)
    if (!place[x.id] || !sts.length) continue
    if (sts.every(s => statementReady(s, place) && clueHolds(p, s.clue, place))) out.add(x.id)
  }
  return out
}
