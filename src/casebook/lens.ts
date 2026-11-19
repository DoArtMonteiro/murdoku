// The lens: a suspect's statements as toggles. Lit statements light the cells
// where ALL of them hold. It only evaluates what the statements say. It never
// applies anyone else's lane and never reads the solution.
import type { Clue, Puzzle } from '../core/types'
import { clueHolds } from '../core/engine'
import { allCells, cellKey } from './cells'
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
  p.clues.forEach((ct, index) => {
    if (ct.clue.person !== personId || ct.clue.kind === 'victim') return
    out.push({ index, clue: ct.clue, text: ct.text, needs: otherPerson(ct.clue) })
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

/** Height to reserve for the chips: the busiest suspect of the case, so selecting never moves the board. */
export function reserveHeightFor(p: Puzzle): number {
  const all = p.people.map(x => statementsOf(p, x.id))
  const most = Math.max(1, ...all.map(s => s.length))
  const waits = all.some(s => s.some(st => st.needs))
  return Math.max(2, Math.ceil(most / 2)) * 48 + (waits ? 16 : 0)
}
