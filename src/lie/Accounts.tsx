// The accounts: the strip of suspect emblems, the selected suspect's account card, and the Contradictions ledger.
import { useRef } from 'react'
import { Check } from 'lucide-react'
import type { LieCase, Statement } from './model'
import { Emblem } from './art/emblems'
import { nameOf } from './state'
import type { JournalEntry } from './collide'
import { waitingOn } from './lens'
import type { Placed } from './lens'

const emblemOf = (c: LieCase, id: string) => c.story.cast[id].emblem

interface StripProps {
  c: LieCase
  order: string[]
  selected: string
  placed: Placed
  /** People common to every recorded collision: they glow. */
  common: ReadonlySet<string>
  onSelect: (id: string) => void
}

/** A horizontal row of emblem tiles, one per person. The victim is last and drawn apart. */
export function Strip({ c, order, selected, placed, common, onSelect }: StripProps) {
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
              aria-label={`${name}${victim ? ', the victim' : ''}${placed[id] ? ', placed' : ''}${common.has(id) ? ', in every contradiction' : ''}`}
              data-selected={id === selected || undefined}
              data-common={common.has(id) || undefined}
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

interface LedgerProps { c: LieCase; rows: JournalEntry[]; common: ReadonlySet<string> }

/** The detective's notes: one row per collision found, subject first. Appears once there is one. */
export function Ledger({ c, rows, common }: LedgerProps) {
  return (
    <section className="ofa-ledger" aria-label="Contradictions">
      <h2 className="ofa-ledger-h">Contradictions</h2>
      <ol className="ofa-ledger-rows">
        {rows.map(r => (
          <li key={r.people.join('|')} className="ofa-ledger-row"
            aria-label={r.people.map(id => nameOf(c, id)).join(' and ')}>
            {r.people.map((id, i) => (
              <span key={id} className="ofa-ledger-person" data-common={common.has(id) || undefined}>
                {i > 0 && <span className="ofa-ledger-x" aria-hidden="true">&times;</span>}
                <Emblem id={emblemOf(c, id)} size={26} />
              </span>
            ))}
          </li>
        ))}
      </ol>
    </section>
  )
}

interface RowProps {
  c: LieCase
  st: Statement
  lit: boolean
  struck: boolean
  stands: boolean
  placed: Placed
  canDoubt: boolean
  onLit: (id: string) => void
  onDoubt: (id: string) => void
}

const HOLD_MS = 550

function StatementRow({ c, st, lit, struck, stands, placed, canDoubt, onLit, onDoubt }: RowProps) {
  const timer = useRef<number | null>(null)
  const held = useRef(false)
  const waits = waitingOn(st, placed)
  const clear = () => { if (timer.current !== null) { window.clearTimeout(timer.current); timer.current = null } }
  const down = () => {
    held.current = false
    if (!canDoubt) return
    clear()
    timer.current = window.setTimeout(() => { held.current = true; onDoubt(st.id) }, HOLD_MS)
  }
  return (
    <li className="ofa-st" data-lit={lit || undefined} data-struck={struck || undefined} data-stands={stands || undefined} data-scene={st.scene || undefined}>
      <button
        type="button"
        className="ofa-st-main"
        aria-pressed={struck ? undefined : lit}
        disabled={struck}
        onPointerDown={down}
        onPointerUp={clear}
        onPointerLeave={clear}
        onPointerCancel={clear}
        onContextMenu={e => { if (canDoubt) e.preventDefault() }}
        onClick={() => { if (held.current) { held.current = false; return } onLit(st.id) }}
      >
        {st.voice && <em className="ofa-st-voice">{st.voice}</em>}
        <span className="ofa-st-text">{st.text}</span>
        <span className="ofa-st-tags">
          {st.scene && <span className="ofa-tag">Scene evidence</span>}
          {waits && <span className="ofa-tag" data-kind="wait">Waits for {nameOf(c, waits)}</span>}
          {stands && <span className="ofa-tag" data-kind="stands">Stands</span>}
          {struck && <span className="ofa-tag" data-kind="cracked">Cracked</span>}
          {lit && !waits && !struck && <span className="ofa-tag" data-kind="lit">Lit on the plan</span>}
        </span>
      </button>
      {canDoubt && (
        <button type="button" className="ofa-doubt" aria-label={`Doubt ${nameOf(c, st.author)}'s statement: ${st.text}`} onClick={() => onDoubt(st.id)}>
          Doubt
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
  struck: string | null
  stands: readonly string[]
  placed: Placed
  roomName: string | null
  /** Act 1 and no result yet: statements that are not scene facts can be doubted. */
  doubting: boolean
  onLit: (id: string) => void
  onDoubt: (id: string) => void
}

/** The selected person: name, role, and each statement as a tappable row. */
export function AccountCard({ c, person, statements, lit, struck, stands, placed, roomName, doubting, onLit, onDoubt }: CardProps) {
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
                lit={lit.includes(st.id)} struck={struck === st.id} stands={stands.includes(st.id)}
                canDoubt={doubting && !st.scene && !stands.includes(st.id) && struck !== st.id}
                onLit={onLit} onDoubt={onDoubt}
              />
            ))}
          </ul>
        )}
    </section>
  )
}
