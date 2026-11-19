import type { Puzzle } from '../core/types'
import { firstName } from './cells'
import type { Placement } from './cells'
import { statementReady, statementsOf } from './lens'

interface Props {
  puzzle: Puzzle
  person: string
  placement: Placement
  lit: readonly number[]
  onToggle: (index: number) => void
  /** Height to reserve so selecting another suspect never moves the board. */
  reserveHeight: number
}

/** The selected suspect's statements. Each chip is a lens toggle. */
export function Chips({ puzzle, person, placement, lit, onToggle, reserveHeight }: Props) {
  const sts = statementsOf(puzzle, person)
  return (
    <ul className="cb-chips" aria-label={`${firstName(puzzle, person)}'s statements`} style={{ minHeight: reserveHeight }}>
      {sts.map(st => {
        const ready = statementReady(st, placement)
        const on = lit.includes(st.index) && ready
        return (
          <li key={st.index}>
            <button
              type="button"
              className="cb-chip"
              data-on={on || undefined}
              data-wait={!ready || undefined}
              aria-pressed={on}
              aria-disabled={!ready || undefined}
              onClick={() => onToggle(st.index)}
            >
              <span className="cb-chip-text">{st.text}</span>
              {!ready && st.needs && <span className="cb-chip-sub">Place {firstName(puzzle, st.needs)} first</span>}
            </button>
          </li>
        )
      })}
      {sts.length === 0 && <li className="cb-none">No statements of their own.</li>}
    </ul>
  )
}
