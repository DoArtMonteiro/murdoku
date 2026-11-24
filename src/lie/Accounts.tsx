// The accounts: the strip of suspect emblems and the selected suspect's account card. Each statement is a row:
// tapping it lights it on the plan, the pin beside it sends it to the citation tray.
import { Check, Pin } from 'lucide-react'
import type { LieCase, Statement } from './model'
import { Emblem } from './art/emblems'
import { nameOf, readOf } from './state'
import { waitingOn } from './lens'
import type { Placed } from './lens'

const emblemOf = (c: LieCase, id: string) => c.story.cast[id].emblem

interface StripProps {
  c: LieCase
  order: string[]
  selected: string
  placed: Placed
  onSelect: (id: string) => void
}

/** A horizontal row of emblem tiles, one per person. The victim is last and drawn apart. */
export function Strip({ c, order, selected, placed, onSelect }: StripProps) {
  return (
    <ul className="ofa-strip" aria-label="People">
      {order.map(id => {
        const victim = id === c.puzzle.victimId
        const name = nameOf(c, id)
        return (
          <li key={id} className="ofa-strip-li" data-victim={victim || undefined}>
            <button
              type="button"
              className="ofa-pick"
              aria-pressed={id === selected}
              aria-label={`${name}${victim ? ', the victim' : ''}${placed[id] ? ', placed' : ''}`}
              data-selected={id === selected || undefined}
              data-placed={!!placed[id] || undefined}
              onClick={() => onSelect(id)}
            >
              <span className="ofa-pick-art">
                <Emblem id={emblemOf(c, id)} size={40} />
                {placed[id] && <span className="ofa-pick-check" aria-hidden="true"><Check size={11} strokeWidth={3.5} /></span>}
              </span>
              <span className="ofa-pick-name" aria-hidden="true">{name}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

interface RowProps {
  c: LieCase
  st: Statement
  lit: boolean
  struck: boolean
  pinned: boolean
  placed: Placed
  /** Statements can be pinned in Act 1 only, and never the victim's scene facts. */
  canPin: boolean
  onLit: (id: string) => void
  onPin: (id: string) => void
}

function StatementRow({ c, st, lit, struck, pinned, placed, canPin, onLit, onPin }: RowProps) {
  const waits = waitingOn(st, placed)
  return (
    <li className="ofa-st" data-lit={lit || undefined} data-struck={struck || undefined} data-pinned={pinned || undefined} data-scene={st.scene || undefined}>
      <button
        type="button"
        className="ofa-st-main"
        aria-pressed={struck ? undefined : lit}
        disabled={struck}
        onClick={() => onLit(st.id)}
      >
        <span className="ofa-st-text">{readOf(st)}</span>
        <span className="ofa-st-tags">
          {st.scene && <span className="ofa-tag">Scene evidence</span>}
          {waits && <span className="ofa-tag" data-kind="wait">Waits for {nameOf(c, waits)}</span>}
          {struck && <span className="ofa-tag" data-kind="cracked">Cracked</span>}
          {lit && !waits && !struck && <span className="ofa-tag" data-kind="lit">Lit on the plan</span>}
        </span>
      </button>
      {canPin && !st.scene && (
        <button
          type="button"
          className="ofa-pin"
          aria-pressed={pinned}
          aria-label={`Pin ${nameOf(c, st.author)}'s statement: ${readOf(st)}`}
          onClick={() => onPin(st.id)}
        >
          <Pin size={20} aria-hidden="true" />
        </button>
      )}
    </li>
  )
}

interface CardProps {
  c: LieCase
  person: string
  statements: Statement[]
  lit: readonly string[]
  pins: readonly string[]
  struck: string | null
  placed: Placed
  roomName: string | null
  canPin: boolean
  onLit: (id: string) => void
  onPin: (id: string) => void
}

/** The selected person: name, role, and each statement as a tappable row. */
export function AccountCard({ c, person, statements, lit, pins, struck, placed, roomName, canPin, onLit, onPin }: CardProps) {
  const cast = c.story.cast[person]
  const mine = statements.filter(s => s.author === person)
  return (
    <section className="ofa-card" aria-label={`${nameOf(c, person)}'s account`}>
      <header className="ofa-card-head">
        <h2 className="ofa-card-name">{nameOf(c, person)}</h2>
        <p className="ofa-card-role">
          {cast.role}
          <span className="ofa-card-where">{placed[person] ? (roomName ? ` · placed in the ${roomName}` : ' · placed') : ' · not placed'}</span>
        </p>
      </header>
      {mine.length === 0
        ? <p className="ofa-card-none">Nothing on the record.</p>
        : (
          <ul className="ofa-sts">
            {mine.map(st => (
              <StatementRow
                key={st.id} c={c} st={st} placed={placed}
                lit={lit.includes(st.id)} struck={struck === st.id} pinned={pins.includes(st.id)}
                canPin={canPin} onLit={onLit} onPin={onPin}
              />
            ))}
          </ul>
        )}
    </section>
  )
}
