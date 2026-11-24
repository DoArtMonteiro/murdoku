// The citation tray: the statements the player has pinned (at most four), across suspects, and the one button that
// asks the engine whether they can all be true. The victim's scene facts are always part of the question, so they
// never appear here.
import { X } from 'lucide-react'
import type { LieCase } from './model'
import { chipOf, MAX_PINS } from './state'

interface Props {
  c: LieCase
  pins: readonly string[]
  onUnpin: (id: string) => void
  onCite: () => void
}

export function Tray({ c, pins, onUnpin, onCite }: Props) {
  return (
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
  )
}
