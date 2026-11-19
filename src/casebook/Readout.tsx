import type { ReactNode } from 'react'
import type { Person, Puzzle } from '../core/types'
import { firstName } from './cells'
import type { Hint } from './hint'
import type { Outcome } from './save'
import type { SupposeReport } from './suppose'

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
  onReplay: () => void
}

/** The line of prose under the statements: supposition, hint, closing line, or the case file. */
export function Readout(p: Props): ReactNode {
  const { puzzle } = p
  if (p.report && p.ghostPerson) {
    const g = firstName(puzzle, p.ghostPerson)
    return (
      <>
        <p className="cb-r-title">Supposing {g} here.</p>
        {!p.report.ghostLegal && <p className="cb-red">That breaks {g}&apos;s own statements.</p>}
        {p.report.contradictions.map(id => <p key={id} className="cb-red">No square left for {firstName(puzzle, id)}.</p>)}
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
        <p className="cb-r-title">{p.outcome === 'proved' ? 'Proved.' : p.outcome === 'called' ? 'Called it. The plan is not proven.' : 'The case has gone cold.'}</p>
        <button type="button" className="cb-linkbtn" onClick={p.onReplay}>Watch the night</button>
      </>
    )
  }
  return (
    <>
      {p.premiseOpen && p.premise
        ? <p className="cb-premise">{p.premise}</p>
        : (
          <>
            {p.oneLiner && <p className="cb-premise">{p.oneLiner}</p>}
            <p>Tap a square to place {p.selected.name}. Light a statement to see where it holds.</p>
          </>
        )}
      {p.premise && (
        <button type="button" className="cb-linkbtn" aria-expanded={p.premiseOpen} onClick={p.onTogglePremise}>
          {p.premiseOpen ? 'Hide the case file' : 'Case file'}
        </button>
      )}
    </>
  )
}
