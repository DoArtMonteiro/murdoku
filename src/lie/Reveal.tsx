// The reveal: the roll-call after the plan closes. Each innocent suspect is cleared by their own account, the liar's
// statement is read back with the accounts that refute it, then the motive. Everything is in the DOM at once;
// the stagger is CSS only, and reduced motion removes it.
import { roomIdAt } from '../core/engine'
import type { Cell } from '../core/types'
import type { LieCase } from './model'
import { liar, nameOf } from './state'

export type Tier = 'Proved' | 'Proved, after a false start' | 'Closed'

export const tierFor = (truthOnly: boolean, strikes: number): Tier =>
  truthOnly ? 'Closed' : strikes === 0 ? 'Proved' : 'Proved, after a false start'

const roomName = (c: LieCase, cell: Cell): string =>
  c.puzzle.rooms.find(r => r.id === roomIdAt(c.puzzle, cell))?.name ?? 'house'

/** "A", "A and B", "A, B and C" */
export function joinNames(names: string[]): string {
  if (names.length < 2) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

/** Who refutes the lie: the authors of the other statements in the two collisions, never the liar. */
export function refuters(c: LieCase): string[] {
  const who = liar(c)
  const out: string[] = []
  for (const set of c.collisions) {
    for (const id of set) {
      const a = c.statements.find(s => s.id === id)?.author
      if (a && a !== who && !out.includes(a)) out.push(a)
    }
  }
  return out
}

const fill = (text: string, c: LieCase): string =>
  text.replaceAll('{M}', nameOf(c, c.puzzle.murdererId)).replaceAll('{V}', nameOf(c, c.puzzle.victimId))

interface Props {
  c: LieCase
  placed: Record<string, Cell>
  strikes: number
  truthOnly: boolean
  onRestart: () => void
}

export function Reveal({ c, placed, strikes, truthOnly, onRestart }: Props) {
  const murderer = c.puzzle.murdererId
  const victim = c.puzzle.victimId
  const innocents = c.puzzle.people.filter(x => x.id !== murderer && x.id !== victim)
  const lie = c.statements.find(s => s.id === c.lieId)
  const who = refuters(c).map(id => nameOf(c, id))
  const motive = c.story.cast[murderer]?.motive
  const tier = tierFor(truthOnly, strikes)
  const delay = (n: number) => ({ animationDelay: `${n * 260}ms` })
  let n = 0
  return (
    <section className="ofa-reveal" aria-label="The case, closed">
      <p className="ofa-tier" data-tier={tier === 'Proved' ? 'clean' : 'false-start'}>{tier}</p>
      <ol className="ofa-roll">
        {innocents.map(x => (
          <li key={x.id} className="ofa-roll-li" style={delay(n++)}>
            <strong>{nameOf(c, x.id)}</strong> was in the {roomName(c, placed[x.id])}: cleared by their own account.
          </li>
        ))}
        <li className="ofa-roll-li" data-liar style={delay(n++)}>
          {truthOnly || !lie
            ? <><strong>{nameOf(c, murderer)}</strong> was in the {roomName(c, placed[murderer])}, alone with {nameOf(c, victim)}.</>
            : (
              <>
                <strong>{nameOf(c, lie.author)}</strong> said &ldquo;{lie.text}&rdquo;.{' '}
                {who.length > 0 && <>{who.length === 1 ? `${who[0]}'s account says` : `${joinNames(who.map(w => `${w}'s`))} accounts say`} otherwise.</>}
              </>
            )}
        </li>
        {(motive || c.story.closing) && (
          <li className="ofa-roll-li ofa-roll-motive" style={delay(n++)}>
            {motive && <span>{motive} </span>}
            <span>{fill(c.story.closing, c)}</span>
          </li>
        )}
      </ol>
      <div className="ofa-reveal-actions">
        <a className="ofa-ghost" href="?casebook=">Back to the casebook</a>
        <button type="button" className="ofa-ghost" onClick={onRestart}>Play again</button>
      </div>
    </section>
  )
}
