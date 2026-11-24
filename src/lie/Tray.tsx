// The stable band under the people strip. It is one fixed-height row, so nothing around it moves when a pin or a
// contradiction appears: the citation tray (the statements the player has pinned, at most four, across suspects,
// and the one button that asks the engine whether they can all be true) on the left, and the ledger pill beside
// it. The victim's scene facts are always part of the question, so they never appear as chips.
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import type { LieCase } from './model'
import { chipOf, MAX_PINS } from './state'

interface Props {
  c: LieCase
  pins: readonly string[]
  /** Pinning is on offer (Act 1): an empty band then says what to do. */
  hunting: boolean
  onUnpin: (id: string) => void
  onCite: () => void
  /** The ledger pill. */
  children?: ReactNode
}

export function Tray({ c, pins, hunting, onUnpin, onCite, children }: Props) {
  return (
    <div className="ofa-band">
      {pins.length > 0 && (
        <section className="ofa-tray" aria-label="Pinned statements">
          <ul className="ofa-tray-chips">
            {pins.map(id => {
              const st = c.statements.find(s => s.id === id)
              if (!st) return null
              return (
                <li key={id}>
                  <button type="button" className="ofa-chip" data-pinned aria-label={`Unpin ${chipOf(c, st)}`} onClick={() => onUnpin(id)}>
                    <span>{chipOf(c, st)}</span>
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
          <button type="button" className="ofa-primary ofa-cite" disabled={pins.length < 2} onClick={onCite}>
            {"These can't all be true"}
          </button>
          <p className="ofa-sr">{`${pins.length} of ${MAX_PINS} pinned.`}</p>
        </section>
      )}
      {pins.length === 0 && hunting && !children && <p className="ofa-band-empty">Pin statements to compare them.</p>}
      {children}
    </div>
  )
}
