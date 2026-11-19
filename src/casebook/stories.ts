// Story slots: non-positional authored text only. Premise, role, one-liner and
// a motive line per person, for a fictional coastal city called Portinhal.
//
// Hard rules, enforced by tests/casebook/stories.test.ts:
//  - no room name, furniture word, direction word, row/column/floor word;
//  - no cast member's name (the UI interpolates names, the text never holds one);
//  - the victim and the murderer are written to the same shape, and the motive
//    lines are only ever returned once the case is solved.
import type { Puzzle } from '../core/types'

export interface PersonStory {
  /** Must equal the puzzle person's name: a guard against the catalogue changing under a story. */
  name: string
  role: string
  oneLiner: string
  motive: string
}

export interface CaseStory {
  /** Two sentences. */
  premise: string
  murderer: string
  cast: Record<string, PersonStory>
}

export const STORIES: Record<string, CaseStory> = {
  'hard-2': {
    premise:
      'Portinhal likes to say that nothing happens in town that the harbour bell has not already rung about. Tonight the bell stayed silent, and that is how everyone knew something was wrong.',
    murderer: 'p0',
    cast: {
      p0: { name: 'Lena', role: 'Ferry-ticket clerk', oneLiner: 'Counts every coin twice and every promise once.', motive: 'Years of small debts, and one ledger that would not stay closed.' },
      p1: { name: 'Viraj', role: 'Lighthouse apprentice', oneLiner: "Knows the tide charts by heart and the town's gossip by ear.", motive: 'A letter of recommendation that never arrived.' },
      p2: { name: 'Carol', role: 'Cannery bookkeeper', oneLiner: 'Keeps the accounts in pencil, which says plenty.', motive: 'A quiet fear of what the coming audit would find.' },
      p3: { name: 'Greta', role: 'Net-mender', oneLiner: 'Hums sea-songs that nobody else remembers.', motive: 'An old grudge over a boat sold out from under the family.' },
      p4: { name: 'Marco', role: 'Harbour notary', oneLiner: "Has stamped a good share of the town's secrets.", motive: 'Held the papers that could undo three families.' },
    },
  },
  'very-easy-3': {
    premise:
      "Portinhal's old theatre has staged the same farce every autumn since anyone can remember. This year the rehearsal ended before the final curtain, and nobody in the cast could say why.",
    murderer: 'p0',
    cast: {
      p0: { name: 'Yuki', role: 'Understudy', oneLiner: 'Knows every line in the play and has never been given one.', motive: 'Eleven seasons is a long time to wait for a name on the bill.' },
      p1: { name: 'Evangeline', role: 'Costume mistress', oneLiner: 'Can mend a hem in the dark and a rumour in daylight.', motive: "A debt to the theatre's patron that would not be forgiven." },
      p2: { name: 'Greta', role: 'Leading lady', oneLiner: 'Has never once arrived on time and never once been blamed for it.', motive: "Planned to sell the whole theatre to the highest bidder." },
      p3: { name: 'Lena', role: 'Stage manager', oneLiner: 'Runs the prompt book and, quietly, everything else.', motive: 'A resignation letter, drafted and never sent.' },
    },
  },
}

/** The story for a puzzle, or null when none exists or it no longer matches the cast. */
export function storyFor(p: Puzzle): CaseStory | null {
  const s = STORIES[p.id]
  if (!s || s.murderer !== p.murdererId) return null
  const ok = p.people.every(x => s.cast[x.id]?.name === x.name) && Object.keys(s.cast).length === p.people.length
  return ok ? s : null
}

export interface VisibleStory {
  premise: string
  roleOf: (id: string) => { role: string; oneLiner: string } | null
  /** The murderer's motive, only after the case is solved. */
  motive: string | null
}

export function visibleStory(s: CaseStory | null, solved: boolean): VisibleStory {
  return {
    premise: s?.premise ?? '',
    roleOf: id => (s?.cast[id] ? { role: s.cast[id].role, oneLiner: s.cast[id].oneLiner } : null),
    motive: s && solved ? s.cast[s.murderer].motive : null,
  }
}
