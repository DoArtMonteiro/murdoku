import type { Puzzle } from '../../core/types'
import type { SuspectStory } from '../story/schema'
import { clueMatches } from '../story/validate'
import { FramedPortrait } from './Portrait'

/**
 * Interrogation sheet. Each in-voice line sits above the LITERAL clue sentence,
 * which is the rule the player deduces from; the voice only dresses it.
 */
export function InterrogationBody({ puzzle, tale, onShow }: { puzzle: Puzzle; tale: SuspectStory; onShow: () => void }) {
  const person = puzzle.people.find(p => p.id === tale.personId)!
  const own = puzzle.clues.filter(c => c.clue.person === person.id)
  const heading = own.find(c => c.clue.kind === 'victim')
  return (
    <div className="rs-ask-sheet" data-testid="interrogation">
      <div className="rs-ask-head">
        <FramedPortrait personId={person.id} size={88} label={`${person.name} portrait`} victim={person.isVictim} />
        <div className="rs-ask-id">
          <p className="rs-ask-name">{tale.fullName}</p>
          <p className="rs-role">{tale.role}</p>
          <p className="rs-ask-line">{tale.oneLiner}</p>
        </div>
      </div>
      {!person.isVictim && (
        <p className="rs-motive-card" data-testid="motive-card"><span className="rs-eyebrow">Motive · {tale.motive.label}</span><span>{tale.motive.text}</span></p>
      )}
      <blockquote className="rs-alibi"><span className="rs-eyebrow">{person.isVictim ? 'The scene' : 'Their account'}</span>{tale.alibi}</blockquote>
      <ol className="rs-lines">
        {tale.lines.map((l, i) => {
          const real = own.find(c => clueMatches(l.clue, c.clue))
          return (
            <li key={i} className="rs-line" data-testid="interrogation-line">
              <p className="rs-line-voice">&ldquo;{l.text}&rdquo;</p>
              <p className="rs-line-rule"><span className="rs-line-tag">Rule</span><span className="rs-line-clue" data-testid="literal-clue">{real?.text ?? ''}</span></p>
            </li>
          )
        })}
      </ol>
      {heading && <p className="rs-ask-foot">{heading.text}</p>}
      <button type="button" className="rs-btn rs-btn-primary" onClick={onShow} data-testid="show-on-plan">Show on the plan</button>
    </div>
  )
}
