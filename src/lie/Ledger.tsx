// The Contradictions ledger: each recorded contradiction is a row of statement chips. In Act 1 a chip can be
// tapped to doubt that statement; once the lie is proved the rows read as solved and the lie is struck through.
import type { LedgerRow } from './collide'
import type { LieCase } from './model'
import { chipOf } from './state'

interface Props {
  c: LieCase
  rows: readonly LedgerRow[]
  /** The proved lie, once there is one: its chip is struck and every row is solved. */
  struck: string | null
  /** Chips can be doubted (Act 1 and not over). */
  canDoubt: boolean
  onChip: (id: string) => void
}

export function Ledger({ c, rows, struck, canDoubt, onChip }: Props) {
  return (
    <section className="ofa-ledger" aria-label="Contradictions" data-solved={struck ? '' : undefined}>
      <h2 className="ofa-ledger-h">Contradictions{struck ? ' · solved' : ''}</h2>
      <ol className="ofa-ledger-rows">
        {rows.map(row => (
          <li key={row.join('|')} className="ofa-ledger-row" data-solved={struck ? '' : undefined}>
            {row.map(id => {
              const st = c.statements.find(s => s.id === id)
              if (!st) return null
              const text = chipOf(c, st)
              return canDoubt
                ? <button key={id} type="button" className="ofa-chip" onClick={() => onChip(id)}>{text}</button>
                : (
                  <span key={id} className="ofa-chip" data-struck={struck === id || undefined}>
                    {text}
                    {struck === id && <span className="ofa-sr"> (the false account)</span>}
                  </span>
                )
            })}
          </li>
        ))}
      </ol>
    </section>
  )
}
