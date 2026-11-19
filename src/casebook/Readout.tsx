import type { ReactNode } from 'react'
import type { Person, Puzzle } from '../core/types'
import { firstName } from './cells'
import type { Hint } from './hint'
import type { Outcome } from './save'
import type { SupposeReport } from './suppose'
import type { Tier } from './verdict'
import { TIER_LABEL } from './verdict'

interface Props {
  puzzle: Puzzle
  selected: Person
  oneLiner: string | null
  premise: string
  premiseOpen: boolean
  onTogglePremise: () => void
  ghostPerson: string | null
  report: SupposeReport | null
  hint: Hint | null
  outcome: Outcome
  /** What a solved case earned, from hints and strikes spent. Null for an open or cold case. */
  tier: Tier | null
  /** True until the first suspect is placed: only then does the readout explain how to play. */
  firstMove: boolean
  onRoll: () => void
  /** The lit squares are all on the other floor: say so, and offer to go there. */
  lensCue?: { floor: string; onShow: () => void } | null
}

/** The line of prose under the statements: the lens cue first when it applies, then supposition, hint, closing line, or the case file. */
export function Readout(p: Props): ReactNode {
  return (
    <>
      {p.lensCue && (
        <p className="cb-lenscue" data-testid="lens-cue">
          <span>Lit squares are {p.lensCue.floor}.</span>
          <button type="button" className="cb-linkbtn" onClick={p.lensCue.onShow}>Show {p.lensCue.floor.toLowerCase()} <span aria-hidden="true">→</span></button>
        </p>
      )}
      {readoutBody(p)}
    </>
  )
}

function readoutBody(p: Props): ReactNode {
  const { puzzle } = p
  if (p.report && p.ghostPerson) {
    const g = firstName(puzzle, p.ghostPerson)
    return (
      <>
        <p className="cb-r-title">Supposing {g} here.</p>
        {!p.report.ghostLegal && <p className="cb-warn">That breaks {g}&apos;s own statements.</p>}
        {p.report.contradictions.map(id => <p key={id} className="cb-warn">No square left for {firstName(puzzle, id)}.</p>)}
        {!p.report.contradictions.length && p.report.ghostLegal && (
          <p>{p.report.linked.length ? 'Squares left for those tied to this one are counted on their portraits.' : 'Nobody is tied to this one. Row and column are the only effect.'}</p>
        )}
      </>
    )
  }
  if (p.hint) {
    return (
      <>
        <p className="cb-r-title">{p.hint.text}</p>
        {p.hint.level >= 2 && p.hint.lines.map((l, i) => <p key={i} className="cb-r-line">{l}</p>)}
      </>
    )
  }
  if (p.outcome) {
    return (
      <>
        <p className="cb-r-title">{p.tier ? `${TIER_LABEL[p.tier]}.${p.tier === 'calledIt' ? ' The plan is not proven.' : ''}` : 'The case has gone cold.'}</p>
        <button type="button" className="cb-linkbtn" onClick={p.onRoll}>Hear the alibis</button>
      </>
    )
  }
  // The how-to is one short line, shown only until the first suspect is placed. Until then the case file
  // is a two-line teaser; "Case file" opens all of it.
  const teaser = p.firstMove && !!p.premise
  return (
    <>
      {p.firstMove && <p className="cb-howto">Tap a square to place {firstName(puzzle, p.selected.id)}.</p>}
      {p.premiseOpen && p.premise
        ? <p className="cb-premise">{p.premise}</p>
        : teaser
          ? <p className="cb-premise" data-clamp>{p.premise}</p>
          : p.oneLiner && <p className="cb-premise">{p.oneLiner}</p>}
      {p.premise && (
        <button type="button" className="cb-linkbtn" aria-expanded={p.premiseOpen} onClick={p.onTogglePremise}>
          {p.premiseOpen ? 'Hide the case file' : 'Case file'}
        </button>
      )}
    </>
  )
}
