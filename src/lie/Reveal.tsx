// The reveal panel: what the plan proved, once the theatrical sequence (reveal.ts) has played. Short, in
// this order: the tier as a stamp, the liar's line as the headline, the motive and the closing line, one
// line for the innocents (open it for where each of them was), then the buttons. Classes live in
// reveal.css; nothing here uses a style attribute.
import { Check } from 'lucide-react'
import { roomIdAt } from '../core/engine'
import type { Cell } from '../core/types'
import type { LieCase } from './model'
import { fillStory, joinNames, liarOf, nameOf } from './revealSequence'
import './reveal.css'

// kept here for callers that already import them from this module
export { joinNames, refuters } from './revealSequence'

const roomName = (c: LieCase, cell: Cell | undefined): string | null =>
  cell ? c.puzzle.rooms.find(r => r.id === roomIdAt(c.puzzle, cell))?.name ?? null : null

interface Props {
  c: LieCase
  placed: Record<string, Cell>
  /** The tier, from state.ts (tierFor): 'Proved', 'Proved, after some false starts', 'Proved the long way' or 'Closed' */
  tier: string
  /** the panel shows once the sequence is done */
  done: boolean
  /** "Next case"; the primary button is left out when absent */
  onNext?: () => void
  onReplay: () => void
}

export function Reveal({ c, placed, tier, done, onNext, onReplay }: Props) {
  if (!done) return null
  const murderer = c.puzzle.murdererId
  const victim = c.puzzle.victimId
  const liar = nameOf(c, liarOf(c))
  // Closed is the direction with no lie to catch: everyone told the truth, so the line is about the room
  const noLie = tier === 'Closed'
  const innocents = c.puzzle.people.filter(x => x.id !== murderer && x.id !== victim)
  const motive = c.story.cast[murderer]?.motive
  const closing = fillStory(c.story.closing, c)

  return (
    <section className="rv" aria-label="The case, closed">
      <p className="rv-stamp" data-tier={tier === 'Proved' ? 'clean' : tier === 'Closed' ? 'closed' : 'false-start'}>{tier}</p>
      <h2 className="rv-head">{noLie ? `${nameOf(c, murderer)} was alone with ${nameOf(c, victim)}.` : `${liar} lied about one thing.`}</h2>
      {(motive || closing) && (
        <p className="rv-story">
          {motive && <span>{motive} </span>}
          <span>{closing}</span>
        </p>
      )}
      {innocents.length > 0 && (
        <details className="rv-clear">
          <summary>
            <span className="rv-ok" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>
            <span>{joinNames(innocents.map(x => nameOf(c, x.id)))} {noLie ? 'were cleared.' : 'told the truth.'}</span>
          </summary>
          <ul className="rv-where">
            {innocents.map(x => {
              const room = roomName(c, placed[x.id])
              return room ? <li key={x.id}><strong>{nameOf(c, x.id)}</strong> in the {room}</li> : null
            })}
          </ul>
        </details>
      )}
      <div className="rv-actions">
        {onNext && <button type="button" className="rv-btn" data-kind="primary" onClick={onNext}>Next case</button>}
        <button type="button" className="rv-btn" data-kind="ghost" onClick={onReplay}>Replay the reveal</button>
      </div>
    </section>
  )
}

/** The line under the board while the sequence plays. A polite live region, with a Skip button until it is done. */
export function RevealCaption({ text, done, onSkip }: { text: string | null; done: boolean; onSkip: () => void }) {
  return (
    <div className="rv-caption">
      <p className="rv-caption-text" role="status" aria-live="polite" aria-atomic="true">{text}</p>
      {!done && <button type="button" className="rv-skip" onClick={onSkip}>Skip</button>}
    </div>
  )
}
