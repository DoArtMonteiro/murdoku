// The Contradictions ledger: each recorded contradiction is a row of statement chips. It sits in the column as one
// line ("Contradictions · 2") so the account card keeps its room; tapping it opens the rows over the card, and
// closing returns the room. In Act 1 a chip can be tapped to doubt that statement; once the lie is proved the
// line reads "solved" and the lie is struck through in every row.
import { useEffect, useState } from 'react'
import { ChevronUp, X } from 'lucide-react'
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
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [open])
  const label = struck ? 'Contradictions · solved' : `Contradictions · ${rows.length}`
  return (
    <section className="ofa-ledger" aria-label="Contradictions" data-solved={struck ? '' : undefined}>
      <button type="button" className="ofa-ledger-sum" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <span>{label}</span>
        <ChevronUp size={16} aria-hidden="true" data-open={open || undefined} />
      </button>
      {open && (
        <div className="ofa-ledger-pop">
          <div className="ofa-ledger-head">
            <h2 className="ofa-ledger-h">{label}</h2>
            <button type="button" className="ofa-ledger-x" aria-label="Close contradictions" onClick={() => setOpen(false)}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <ol className="ofa-ledger-rows">
            {rows.map(row => (
              <li key={row.join('|')} className="ofa-ledger-row" data-solved={struck ? '' : undefined}>
                {row.map(id => {
                  const st = c.statements.find(s => s.id === id)
                  if (!st) return null
                  const text = chipOf(c, st)
                  return canDoubt
                    ? <button key={id} type="button" className="ofa-chip" onClick={() => { setOpen(false); onChip(id) }}>{text}</button>
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
        </div>
      )}
    </section>
  )
}
