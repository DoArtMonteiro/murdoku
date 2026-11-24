// The Contradictions ledger: each recorded contradiction is a row of statement chips. It sits in the stable band as
// one pill so the account card keeps its room; tapping it opens the rows over the card, and closing returns the
// room. A statement that appears in more than one row is drawn linked (the same marker, aligned first in every row):
// that is evidence the player can read, not an answer. In Act 1 a chip can be tapped to doubt that statement; once the
// lie is proved the pill reads "solved" and the lie is struck through in every row.
import { useEffect, useState } from 'react'
import { ChevronUp, X } from 'lucide-react'
import type { LedgerRow } from './collide'
import type { LieCase } from './model'
import { ACCUSE_PROMPT, chipOf } from './state'

interface Props {
  c: LieCase
  rows: readonly LedgerRow[]
  /** The proved lie, once there is one: its chip is struck and every row is solved. */
  struck: string | null
  /** Chips can be doubted (Act 1 and not over). */
  canDoubt: boolean
  /** The ledger already holds enough to accuse. The pill says so and pulses; it never says which statement. */
  ready: boolean
  /** The tray is showing beside the pill, so the pill is short. */
  compact: boolean
  onChip: (id: string) => void
}

export function Ledger({ c, rows, struck, canDoubt, ready, compact, onChip }: Props) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [open])
  const n = rows.length
  const accuse = ready && !struck
  const label = struck
    ? 'Contradictions · solved'
    : accuse ? (compact ? 'Enough to accuse' : ACCUSE_PROMPT)
      : n >= 2 && !compact ? `Contradictions · ${n} — compare them` : `Contradictions · ${n}`
  // the same statements first in every row, so the overlaps line up
  // Rows keep reading order and carry no overlap count: spotting the statement two contradictions share
  // is the player's deduction, so the ledger must not sort it first or badge it.
  const ordered = (row: LedgerRow): string[] => [...row]
  return (
    <section className="ofa-ledger" aria-label="Contradictions" data-solved={struck ? '' : undefined} data-compact={compact || undefined}>
      <button
        type="button" className="ofa-ledger-sum" aria-expanded={open} data-ready={accuse || undefined}
        aria-label={accuse ? ACCUSE_PROMPT : undefined} onClick={() => setOpen(o => !o)}
      >
        <span>{label}</span>
        <ChevronUp size={16} aria-hidden="true" data-open={open || undefined} />
      </button>
      {open && (
        <div className="ofa-ledger-pop">
          <div className="ofa-ledger-head">
            <h2 className="ofa-ledger-h">{struck ? 'Contradictions · solved' : `Contradictions · ${n}`}</h2>
            <button type="button" className="ofa-ledger-x" aria-label="Close contradictions" onClick={() => setOpen(false)}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          {canDoubt && <p className="ofa-ledger-tip">Tap the statement you want to doubt.</p>}
          <ol className="ofa-ledger-rows">
            {rows.map(row => (
              <li key={row.join('|')} className="ofa-ledger-row" data-solved={struck ? '' : undefined}>
                {ordered(row).map(id => {
                  const st = c.statements.find(s => s.id === id)
                  if (!st) return null
                  const text = chipOf(c, st)
                  const shared = undefined
                  const mark = null
                  return canDoubt
                    ? (
                      <button
                        key={id} type="button" className="ofa-chip" data-shared={shared}
                        aria-label={`Doubt: ${text}`}
                        onClick={() => { setOpen(false); onChip(id) }}
                      >
                        <span>{text}</span>{mark}
                      </button>
                    )
                    : (
                      <span key={id} className="ofa-chip" data-struck={struck === id || undefined} data-shared={shared}>
                        <span>{text}</span>{mark}
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
