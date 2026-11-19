// The lens: a suspect's statements as toggles. Lit statements light the cells
// where ALL of them hold. It only evaluates what the statements say. It never
// applies anyone else's lane and never reads the solution.
import type { Clue, Puzzle } from '../core/types'
import { clueHolds } from '../core/engine'
import { allCells, cellKey, firstName } from './cells'
import type { Metrics } from './measure'
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

/** Type and box metrics of a statement chip, px: [serif advance per character, sans advance, line, horizontal padding, vertical padding]. */
const CHIP = {
  // measured over every pt case: the widest single-line statement runs 7.5 px per character at 16 px, 7.0 at 15 px
  roomy: { serif: 7.6, sans: 6.2, line: 19.4, sub: 14.6, padX: 31, padY: 15, min: 44 },
  compact: { serif: 7.1, sans: 6.2, line: 18, sub: 14.4, padX: 27, padY: 9, min: 40 },
} as const

/**
 * Height the chips of the busiest suspect need, from a greedy wrap of their statements. Each chip's text wraps
 * inside the row, so a long statement counts every line it needs; a chip waiting for someone to be placed adds
 * its second line. It errs on the generous side, so a case never clips (the panel reserves exactly this, and
 * hides overflow); it is per CASE, not per suspect, so selecting another suspect never moves the board.
 */
export function reserveHeightFor(p: Puzzle, width = 340, compact = false, metrics?: Metrics): number {
  const m = compact ? CHIP.compact : CHIP.roomy
  const gap = compact ? 6 : 8
  let worst = 0
  for (const x of p.people) {
    let used = 0, rowH = 0, total = 0
    for (const s of statementsOf(p, x.id)) {
      const sub = s.needs ? `Place ${firstName(p, s.needs)} first` : ''
      // measured with the page's fonts when it can be, else the generous estimate; 2 px of slack per chip either way
      const textW = (metrics ? metrics.serif(s.text, compact ? 15 : 16) : s.text.length * m.serif) + 2
      const subW = sub ? (metrics ? metrics.sans(sub, 12) : sub.length * m.sans) + 2 : 0
      const inner = Math.max(40, width - m.padX)
      const lines = Math.max(1, Math.ceil(textW / inner))
      const w = Math.min(width, Math.max(textW, subW) + m.padX)
      const h = Math.max(m.min, lines * m.line + (s.needs ? m.sub : 0) + m.padY)
      if (used && used + gap + w > width) { total += rowH + gap; used = 0; rowH = 0 }
      used += (used ? gap : 0) + w
      rowH = Math.max(rowH, h)
    }
    worst = Math.max(worst, total + rowH)
  }
  return Math.ceil(Math.max(46, worst))
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
