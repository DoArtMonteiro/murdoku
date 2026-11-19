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
  /** The case's own title, shown in place of the generator's. Non-positional, like every slot. */
  title?: string
  /** Two sentences, in the investigator's voice. */
  premise: string
  /** One line in the same voice, handed over with the motive once the case is solved. */
  closing?: string
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
  // ---- The season: twelve cases and one silence ----------------------------------------------------
  // One investigator writes every premise and every closing line, unnamed, in the first person. Off the
  // plan, a season mystery runs through all twelve: the harbour bell of Portinhal has stopped ringing.
  // Each case adds one non-positional fact about it; pt-12 resolves it. The generator reuses cast names
  // from case to case, so a name here is never the same person as in another case: roles are written
  // fresh for each.
  'pt-01': {
    title: 'A Pinch of Salt',
    premise:
      "I came to Portinhal's saltworks in the week the autumn tides turned, to settle a dispute that everyone swore was only about barrels. The harbour bell, I was told by three people who disagreed on the date, had stopped ringing that same week.",
    closing: 'The scales were honest; the clerk reading them was not. The bell, for the record, was still silent.',
    murderer: 'p2',
    cast: {
      p0: { name: 'Tomas', role: 'Salt-pan foreman', oneLiner: 'Reads the weather in the crust on the pans.', motive: 'Meant to report a pattern of short weights before the season closed.' },
      p1: { name: 'Greta', role: 'Cart driver', oneLiner: 'Hauls forty sacks a day and never asks what is in them.', motive: 'Resented a route that was cut without notice.' },
      p2: { name: 'Marco', role: 'Weighing clerk', oneLiner: 'Writes every figure in a hand too neat to argue with.', motive: 'Short weights in his own hand, and a foreman who had learned to read them.' },
      p3: { name: 'Bella', role: 'Tide-chart printer', oneLiner: 'Sets the type by feel and misses nothing.', motive: 'A printing order she lost to a rival and has not forgiven.' },
      p4: { name: 'Priya', role: 'Cooper', oneLiner: 'Can tell a leak from the sound of a tap.', motive: "Wanted her apprentice kept on, against the foreman's wishes." },
      p5: { name: 'Oscar', role: 'Night watchman', oneLiner: 'Walks the same round every hour and is never where you look.', motive: 'Had been warned for a shift he swears he never slept through.' },
    },
  },
  'pt-02': {
    title: 'The Auction of Small Hours',
    premise:
      'The fish auction at Portinhal opens at four in the morning, and I arrived in time to hear that a lot had gone unsold for the first time in all the years anyone could recall. Somebody had also taken the rope off the harbour bell, which the town treated as a rumour and I treated as a clue.',
    closing: 'A lot goes unsold when somebody needs the market looking elsewhere. I put that in the notebook, and went on listening for the bell.',
    murderer: 'p1',
    cast: {
      p0: { name: 'Priya', role: 'Auctioneer', oneLiner: 'Talks faster than the gulls and says less.', motive: 'Knew which lots were being quietly held from the sale.' },
      p1: { name: 'Alexander', role: 'Wholesale buyer', oneLiner: 'Never bids first and never bids last.', motive: 'Three seasons of being called last, and a long memory for it.' },
      p2: { name: 'Carol', role: 'Ice merchant', oneLiner: 'Sells cold by the block and warmth by the word.', motive: 'An old quarrel over who owed whom an apology.' },
      p3: { name: 'Nadia', role: 'Dock inspector', oneLiner: 'Carries a clipboard like a shield.', motive: 'Meant to file a report nobody wanted filed.' },
      p4: { name: 'Oscar', role: 'Fish-gutter', oneLiner: 'Whistles one tune, and always flat.', motive: 'Passed over for foreman for the second year running.' },
      p5: { name: 'Lena', role: 'Lorry driver', oneLiner: 'Has seen every sunrise from the same road.', motive: 'A fine she insisted was a mistake.' },
    },
  },
  'pt-03': {
    title: 'Matins for the Absent',
    premise:
      "The seamen's chapel keeps a book of names for those the sea has not returned, and I was asked to read it for a clerical error. By the end of the first evening the harbour bell, which should have marked the hour, had been silent so long that its ringer had resigned in writing.",
    closing: 'Every name in the book was accounted for but one, and somebody had wanted it gone. Nobody rang the bell for it, and nobody had since the autumn.',
    murderer: 'p2',
    cast: {
      p0: { name: 'Oscar', role: 'Choirmaster', oneLiner: 'Hums the hymn before the congregation knows its number.', motive: 'Wanted the choir kept exactly as it was.' },
      p1: { name: 'Bella', role: 'Organ tuner', oneLiner: 'Hears a flat note from the far end of the street.', motive: 'Annoyed that her repairs were credited to another.' },
      p2: { name: 'Priya', role: 'Parish archivist', oneLiner: 'Files every page and forgives none that go astray.', motive: 'A name erased from the book years ago, and a verger who had found it.' },
      p3: { name: 'Idris', role: 'Chapel verger', oneLiner: 'Knows who sits where, and who stopped coming.', motive: 'Had noticed a page that did not match its neighbours.' },
      p4: { name: 'Carol', role: 'Candle chandler', oneLiner: 'Pours a taper as straight as a plumb line.', motive: 'Nursed a grudge over a gift that was never acknowledged.' },
      p5: { name: 'Nadia', role: 'Visiting widow', oneLiner: 'Comes every winter and knows the book by heart.', motive: 'Hoped to find a name in it, and feared to.' },
    },
  },
  'pt-04': {
    title: 'Rivets and Rumours',
    premise:
      'The boatyard at Portinhal was a week from launching its first hull in a decade, and I was hired to learn why the keel kept arriving damaged. Meanwhile the brass tongue of the harbour bell was found wrapped in oilcloth, which the shipwrights swore had nothing to do with them.',
    closing: 'A hull carries only the names on its papers. I added one more to mine, and the oilcloth to my list of loose ends.',
    murderer: 'p5',
    cast: {
      p0: { name: 'Carol', role: 'Chief foreman', oneLiner: 'Has launched forty hulls and named none of them.', motive: 'Meant to tell the owners whose drawings the new hull really followed.' },
      p1: { name: 'Alexander', role: 'Shipwright', oneLiner: 'Taps a plank once and knows the tree it came from.', motive: 'Wanted the old methods kept against the owners.' },
      p2: { name: 'Bella', role: 'Rigger', oneLiner: 'Climbs like she is late for an appointment at the masthead.', motive: 'A fall last spring that nobody would call an accident.' },
      p3: { name: 'Yuki', role: 'Painter', oneLiner: 'Lays one coat so even it looks like glass.', motive: 'Refused to paint a name she thought was wrong.' },
      p4: { name: 'Idris', role: 'Plank steamer', oneLiner: 'Bends oak with heat and patience and complains about both.', motive: 'Tired of being the last to hear what was planned.' },
      p5: { name: 'Dalia', role: 'Draughtswoman', oneLiner: 'Draws a curve once and never lets anyone erase it.', motive: 'Her name was omitted from the drawings for the one hull that mattered.' },
    },
  },
  'pt-05': {
    title: 'The Falling Glass',
    premise:
      "The pilots' guild reads its barometer twice a day and has never once been wrong in public. A guild pilot swore to me that he had heard the harbour bell once, at slack water, on a night when it was certainly not rung.",
    closing: 'Slack water keeps its own counsel, and so had he. I noted the hour of the bell that nobody rang, and went on listening.',
    murderer: 'p1',
    cast: {
      p0: { name: 'Priya', role: 'Guild secretary', oneLiner: 'Writes the minutes and remembers what was not minuted.', motive: 'Was about to enter a reprimand that would end a long career.' },
      p1: { name: 'Marco', role: 'Senior pilot', oneLiner: 'Has brought in every ship but the one he talks about.', motive: 'A reprimand about to enter a record he had kept spotless for thirty years.' },
      p2: { name: 'Evangeline', role: 'Barometer keeper', oneLiner: 'Taps the glass each dawn and says only "steady".', motive: 'Her readings had been set aside without a word.' },
      p3: { name: 'Idris', role: 'Signal-flag maker', oneLiner: 'Stitches a flag so it flies even in a flat calm.', motive: 'Resented the new signals that made his flags pointless.' },
      p4: { name: 'Alexander', role: 'Tug skipper', oneLiner: 'Pushes ships about like furniture and sleeps like a child.', motive: 'A narrow escape in the channel that was blamed on him.' },
      p5: { name: 'Dalia', role: 'Relief lighthouse keeper', oneLiner: 'Has spent whole winters in the company of one great flame, and won every argument.', motive: 'Was asked to stay on one more winter and refused to say why not.' },
    },
  },
  'pt-06': {
    title: 'Lace in the Dark',
    premise:
      'The lace-makers of Portinhal sell to three continents and gossip to none, which made it odd that a whole season\'s pattern had been copied before it was finished. The council, I learned, had also voted not to discuss the harbour bell, so it seemed to be a season for silences.',
    closing: 'A pattern copied before it was finished has to be copied by someone who watched it grow. I tied off the thread and set the bell aside for later.',
    murderer: 'p4',
    cast: {
      p0: { name: 'Alexander', role: 'Export agent', oneLiner: 'Speaks four languages and bargains in all of them.', motive: 'Had promised a buyer a pattern that no longer existed.' },
      p1: { name: 'Bella', role: 'Dyer', oneLiner: 'Her hands are the colour of whatever she finished last.', motive: 'A rival dye that would have made hers worthless.' },
      p2: { name: 'Greta', role: 'Pattern designer', oneLiner: 'Draws a leaf once and sees it in the thread for a week.', motive: 'Knew whose hand had copied her pattern.' },
      p3: { name: 'Carol', role: 'Thread spinner', oneLiner: 'Spins so fine the thread is a rumour.', motive: 'A long feud over whose spinning went into the finest piece.' },
      p4: { name: 'Nadia', role: 'Bobbin-winder', oneLiner: 'Quiet, quick, and always counting something.', motive: 'A loan taken against a pattern that she could no longer sell.' },
      p5: { name: 'Evangeline', role: 'Apprentice', oneLiner: 'Watches everything and has been taught to say nothing.', motive: 'Saw what she should not have, and was told to forget it.' },
    },
  },
  'pt-07': {
    title: 'Second Feature',
    premise:
      "Portinhal's picture palace shows one film a week and the same newsreel every night, so when the projector stopped mid-reel the whole town took it as an insult. The bell tower's visitors' book, which I read on the way in, shows that nobody has climbed it since the first silent night.",
    closing: 'It was never about the film, only about who chose the programme. I noted that nobody had climbed the tower since, and that I could not yet say why.',
    murderer: 'p3',
    cast: {
      p0: { name: 'Marco', role: 'Poster painter', oneLiner: 'Paints every star a little taller than life.', motive: 'Was told his posters were to be replaced by printed ones.' },
      p1: { name: 'Viraj', role: 'Newsreel courier', oneLiner: 'Brings the world in a tin, a week late.', motive: 'Carried a reel he had been told not to show.' },
      p2: { name: 'Lena', role: 'Projectionist', oneLiner: 'Has watched the same film four hundred times and still flinches.', motive: 'Knew whose hand had stopped the reel.' },
      p3: { name: 'Carol', role: 'Ticket-seller', oneLiner: 'Knows every regular by the sound of their coat.', motive: 'Years of being promised the programme would be hers to choose.' },
      p4: { name: 'Oscar', role: 'Organist', oneLiner: 'Plays the same sad tune for comedies and tragedies alike.', motive: 'Feared the talkies would retire him.' },
      p5: { name: 'Tomas', role: 'Theatre manager', oneLiner: 'Counts the audience twice and trusts neither number.', motive: 'Meant to close the palace at the end of the season.' },
    },
  },
  'pt-08': {
    title: 'The Mill Stops Grinding',
    premise:
      "The tide-mill at Portinhal has milled the town's flour for three hundred years and, by the miller's own records, has never once been late. When a child wrote to the harbourmaster asking where the sound of the bell had gone, the harbourmaster handed the letter to me.",
    closing: 'Some grudges are older than the mill. I wrote the child a short note, and promised only that someone was listening.',
    murderer: 'p5',
    cast: {
      p0: { name: 'Tomas', role: 'Tide-mill miller', oneLiner: 'Judges flour by rubbing it with two fingers and a long silence.', motive: 'Had decided at last to name the baker who deserved the recipe.' },
      p1: { name: 'Nadia', role: 'Baker', oneLiner: 'Rises before the gulls, and is proud that nobody has beaten her to it.', motive: 'Wanted the mill kept out of the hands of the council.' },
      p2: { name: 'Viraj', role: 'Millwright', oneLiner: 'Talks to the gears, and the gears seem to answer.', motive: 'Had warned of a fault that nobody wished to hear about.' },
      p3: { name: 'Lena', role: 'Grain inspector', oneLiner: 'Rubs a husk with her thumbs and rejects half the harbour.', motive: 'Suspected a delivery that did not match its papers.' },
      p4: { name: 'Oscar', role: 'Tide-gate keeper', oneLiner: 'Lives by the moon and resents the calendar.', motive: 'Feared the mill would one day need no keeper.' },
      p5: { name: 'Marco', role: 'Bread seller', oneLiner: 'Sells a loaf as though it were a sermon.', motive: 'A recipe the miller had once promised him in writing, then given away.' },
    },
  },
  'pt-09': {
    title: 'Meridian Lines',
    premise:
      "The chart-maker's shop on the quay has sold the same harbour survey since before the bell was cast, and keeps a drawer of whatever people forget to collect. In that drawer I found a sailmaker's off-cut of oilcloth, tagged with the date the bell went quiet.",
    closing: 'A coastline is only as honest as the one who measures it, and she had measured it twice. I pinned the sailmaker\'s scrap to the notebook.',
    murderer: 'p0',
    cast: {
      p0: { name: 'Carol', role: 'Coast surveyor', oneLiner: 'Walks a shoreline with a chain and counts every step aloud.', motive: 'A coastline she had measured twice, and been told someone else drew.' },
      p1: { name: 'Bella', role: 'Engraver', oneLiner: 'Cuts a copper plate so fine it reads like handwriting.', motive: 'A plate she had engraved, published under another name.' },
      p2: { name: 'Nadia', role: 'Compass adjuster', oneLiner: 'Trusts a compass needle more than most people trust each other.', motive: 'Refused to certify a compass she had seen tampered with.' },
      p3: { name: 'Tomas', role: 'Chart-maker', oneLiner: 'Draws the sea as he wishes it behaved.', motive: 'Had decided to credit the survey to whoever had walked it.' },
      p4: { name: 'Evangeline', role: 'Ink-maker', oneLiner: 'Boils oak galls and gossip in the same pot.', motive: 'Was offered a better recipe and a worse bargain.' },
      p5: { name: 'Oscar', role: 'Quay porter', oneLiner: 'Carries a map roll the way other men carry a baby.', motive: 'Had seen who departed in a hurry, and been told to say nothing.' },
    },
  },
  'pt-10': {
    title: 'The Brass Section',
    premise:
      "Portinhal's brass band has played at every launch, funeral and election for a century, and it was in the middle of rehearsing for a launch when I arrived. Someone, I was told, pays to have the harbour bell polished every week even though it has not rung in months.",
    closing: 'A solo is a small thing to carry for years, and carried long enough, a heavy one. The polish on the bell, I noted, is still being paid for.',
    murderer: 'p1',
    cast: {
      p0: { name: 'Oscar', role: 'Bandmaster', oneLiner: 'Conducts with a baton and a long list of grievances.', motive: 'Had chosen the solo for the launch, and not for the player who expected it.' },
      p1: { name: 'Lena', role: 'Cornet soloist', oneLiner: 'Plays the high note like a dare.', motive: 'Passed over for the launch solo by a bandmaster she had trained.' },
      p2: { name: 'Evangeline', role: 'Tuba player', oneLiner: 'Carries the low notes of the band, and the gossip.', motive: 'Wanted the band to stay out of the election.' },
      p3: { name: 'Idris', role: 'Drummer', oneLiner: 'Keeps time better than the town hall does.', motive: 'Tired of marching for a leader who never looked round.' },
      p4: { name: 'Carol', role: 'Music copyist', oneLiner: 'Writes out every part by hand, and every part is perfect.', motive: 'Her copying had been called sloppy within earshot of the others.' },
      p5: { name: 'Nadia', role: 'Trombonist', oneLiner: 'Slides into every note with a small apology.', motive: 'Knew the real reason for the changed programme.' },
    },
  },
  'pt-11': {
    title: 'The Short Manifest',
    premise:
      'Portinhal\'s customs shed stamps every parcel that leaves the harbour and has never lost a form, which is why a missing page was treated as an act of war. An unsigned enquiry about casting a replacement for the harbour bell had arrived from the foundry the same week, and nobody in town would admit to sending it.',
    closing: "The manifest was short by exactly what he had taken. I filed the missing page where I could find it, and the foundry's letter where I could not forget it.",
    murderer: 'p1',
    cast: {
      p0: { name: 'Tomas', role: 'Dock foreman', oneLiner: 'Can load a hold blind and swears at it kindly.', motive: 'Was told to look elsewhere when a hold came in light.' },
      p1: { name: 'Alexander', role: 'Shipping broker', oneLiner: 'Has a smile for every form and a loophole for every smile.', motive: 'Duties skimmed from three seasons of cargo, and an inspector who had counted.' },
      p2: { name: 'Viraj', role: 'Stamp engraver', oneLiner: 'Cuts the seal that makes a paper true.', motive: 'Had been asked to cut a second seal he knew was wrong.' },
      p3: { name: 'Priya', role: 'Customs inspector', oneLiner: 'Counts what is declared and, patiently, what is not.', motive: 'Had found the page that was meant to go missing.' },
      p4: { name: 'Marco', role: 'Warehouse keeper', oneLiner: 'Knows where everything is, and what it is worth.', motive: 'Worried he would be blamed for a shortfall.' },
      p5: { name: 'Greta', role: 'Cargo clerk', oneLiner: 'Writes a hundred lines a day and remembers every one.', motive: 'Had copied a list she was told to forget.' },
    },
  },
  'pt-12': {
    title: 'The Last Peal',
    premise:
      'I came to the last case of the season expecting one more stranger\'s grudge, and found the keeper of the harbour bell waiting with a confession of his own. He had bound its tongue himself in the week of the autumn tides, because a hairline crack meant one more peal would split it, and he had polished it every week since and written to the foundry in secret.',
    closing: 'The town has been told, and the new bell is on its way from the foundry. The old one will ring once more at the turn of the season, cracked or not.',
    murderer: 'p5',
    cast: {
      p0: { name: 'Yuki', role: "Keeper's apprentice", oneLiner: 'Climbs the stair twice a day and keeps count of every step.', motive: 'Had learned why the bell had stopped, and had meant to tell.' },
      p1: { name: 'Tomas', role: 'Harbourmaster', oneLiner: 'Signs for every ship and for most of the town\'s peace.', motive: 'Wanted the silence kept until the new bell was paid for.' },
      p2: { name: 'Lena', role: 'Foundry agent', oneLiner: 'Speaks of bronze the way others speak of family.', motive: 'Had come to the town with a quote and a secret.' },
      p3: { name: 'Oscar', role: 'Sexton', oneLiner: 'Has buried half the town and remembers all of them kindly.', motive: 'Feared the old bell would be melted for the new one.' },
      p4: { name: 'Bella', role: 'Town clerk', oneLiner: 'Stamps a minute in blue ink and a rumour in red.', motive: 'Had kept the foundry\'s letter from the council.' },
      p5: { name: 'Greta', role: 'Stonemason', oneLiner: 'Carves in a silence so complete the chisel seems to apologise.', motive: "A promise to restore the tower's carving, handed to a stranger instead." },
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

/** The title to show: the authored one, else the puzzle's own. */
export const titleFor = (p: Puzzle): string => storyFor(p)?.title ?? p.title

export interface VisibleStory {
  premise: string
  roleOf: (id: string) => { role: string; oneLiner: string } | null
  /** The murderer's motive, only after the case is solved. */
  motive: string | null
  /** The investigator's closing line, only after the case is solved. */
  closing: string | null
}

export function visibleStory(s: CaseStory | null, solved: boolean): VisibleStory {
  return {
    premise: s?.premise ?? '',
    roleOf: id => (s?.cast[id] ? { role: s.cast[id].role, oneLiner: s.cast[id].oneLiner } : null),
    motive: s && solved ? s.cast[s.murderer].motive : null,
    closing: s && solved ? s.closing ?? null : null,
  }
}
