import Avatar from '../components/Avatar'
import type { Person } from '../core/types'

// Portraits sit on a flat paper tone, so the plan stays the only richly coloured object.
const PAPER_TONE = '#D9CFB6'

/** The bundled DiceBear portrait (drawn in the browser, no network), round, on paper. */
export function Portrait({ person, name, size }: { person: Person; /** What the player calls them: firstName(puzzle, person.id). */ name: string; size: number }) {
  return (
    <span className="cb-portrait" style={{ width: size, height: size }} aria-hidden="true">
      <Avatar seed={person.avatarSeed} accent={PAPER_TONE} size={size} name={name} dead={person.isVictim} />
    </span>
  )
}
