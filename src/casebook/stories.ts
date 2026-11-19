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
  'depth-d-189': {
    premise:
      "Portinhal's grand hotel holds a reception for the harbour council every winter, and everyone agrees the welcome is the coldest part. This year the guests slipped away before the toasts, and the whole town has opinions about why.",
    murderer: 'p5',
    cast: {
      p0: { name: 'Yuki', role: 'Harbour pilot', oneLiner: 'Reads a squall coming a full hour before the barometer does.', motive: 'A grudge against the council over a mooring that was never renewed.' },
      p1: { name: 'Alexander', role: 'Hotel concierge', oneLiner: "Remembers every guest's name and, more usefully, their habits.", motive: 'Months of tips that ended when the new owners arrived.' },
      p2: { name: 'Bella', role: 'Society columnist', oneLiner: 'Trades in rumours and always pays in full.', motive: 'A story she could not print without a name to hang it on.' },
      p3: { name: 'Dalia', role: 'Council treasurer', oneLiner: "Signs the town's cheques and reads every line first.", motive: "The only person who knew where the council's money had gone." },
      p4: { name: 'Marco', role: 'Ferry captain', oneLiner: 'Tells the same three stories and changes the endings.', motive: 'A debt to the ferry company that was about to fall due.' },
      p5: { name: 'Oscar', role: 'Shipping agent', oneLiner: 'Smiles first and negotiates second.', motive: 'A contract he could only keep if one set of accounts stayed buried.' },
    },
  },
  'depth-b-95': {
    premise:
      "Portinhal's old lighthouse keeps a reputation for swallowing the unwary, and every family has a story about the fog. On the night the fog rolled in thickest, nobody could say who had gone where.",
    murderer: 'p4',
    cast: {
      p0: { name: 'Marco', role: 'Salt merchant', oneLiner: 'Prices everything, including favours.', motive: 'Knew whose accounts did not balance.' },
      p1: { name: 'Yuki', role: 'Lighthouse keeper', oneLiner: 'Keeps the log in tidy handwriting and tells nobody what is in it.', motive: 'A promotion promised twice and never given.' },
      p2: { name: 'Bella', role: 'Fishmonger', oneLiner: 'Loud before sunrise and silent after it.', motive: 'A stall rent that rose every spring without a reason given.' },
      p3: { name: 'Evangeline', role: 'Schoolteacher', oneLiner: "Corrects the town's grammar, and its memory.", motive: 'A scandal she had promised never to teach.' },
      p4: { name: 'Lena', role: 'Harbour clerk', oneLiner: 'Stamps every form twice and trusts no one once.', motive: 'A forged signature that only one person had noticed.' },
      p5: { name: 'Carol', role: 'Boat-builder', oneLiner: 'Measures twice, speaks once, and is usually correct.', motive: 'An order cancelled just as the hull was finished.' },
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
