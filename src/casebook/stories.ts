// Story slots: non-positional authored text only. Premise, role, one-liner and
// a motive line per person, for a fictional coastal city called Portinhal.
//
// Hard rules, enforced by tests/casebook/stories.test.ts:
//  - no room name, furniture word, direction word, row/column/floor word;
//  - no cast member's name, generator or shown (the UI interpolates names, the text never holds one: a closing
//    line writes {M} (the murderer) or {V} (the victim), and fillNames() puts the shown name there);
//  - the victim and the murderer are written to the same shape, and the motive
//    lines are only ever returned once the case is solved.
import type { Puzzle } from '../core/types'

export interface PersonStory {
  /** Must equal the puzzle person's name: a guard against the catalogue changing under a story. */
  name: string
  /**
   * The name the player sees, when it differs from the generator's. Presentation only: the puzzle's own
   * names stay as they are, and every name on screen goes through firstName() (cells.ts).
   */
  shown?: string
  role: string
  oneLiner: string
  motive: string
  /** One line in the person's own voice, shown under their name. Never positional, and never a tell. */
  alibi?: string
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
      p0: { name: 'Yuki', role: 'Harbour pilot', oneLiner: 'Reads a squall coming a full hour before the barometer does.', motive: 'A grudge against the council over a mooring that was never renewed.', alibi: "I read the weather, not the guest list." },
      p1: { name: 'Alexander', role: 'Hotel concierge', oneLiner: "Remembers every guest's name and, more usefully, their habits.", motive: 'Months of tips that ended when the new owners arrived.', alibi: "I see everything and say very little." },
      p2: { name: 'Bella', role: 'Society columnist', oneLiner: 'Trades in rumours and always pays in full.', motive: 'A story she could not print without a name to hang it on.', alibi: "I write what I hear, and I hear plenty." },
      p3: { name: 'Dalia', role: 'Council treasurer', oneLiner: "Signs the town's cheques and reads every line first.", motive: "The only person who knew where the council's money had gone.", alibi: "I read every line before I sign it." },
      p4: { name: 'Marco', role: 'Ferry captain', oneLiner: 'Tells the same three stories and changes the endings.', motive: 'A debt to the ferry company that was about to fall due.', alibi: "My tales improve with every crossing." },
      p5: { name: 'Oscar', role: 'Shipping agent', oneLiner: 'Smiles first and negotiates second.', motive: 'A contract he could only keep if one set of accounts stayed buried.', alibi: "I was making friends and making terms." },
    },
  },
  'depth-b-95': {
    premise:
      "Portinhal's old lighthouse keeps a reputation for swallowing the unwary, and every family has a story about the fog. On the night the fog rolled in thickest, nobody could say who had gone where.",
    murderer: 'p4',
    cast: {
      p0: { name: 'Marco', role: 'Salt merchant', oneLiner: 'Prices everything, including favours.', motive: 'Knew whose accounts did not balance.', alibi: "I put a price on most things, fairly." },
      p1: { name: 'Yuki', role: 'Lighthouse keeper', oneLiner: 'Keeps the log in tidy handwriting and tells nobody what is in it.', motive: 'A promotion promised twice and never given.', alibi: "I keep the log and I keep it quiet." },
      p2: { name: 'Bella', role: 'Fishmonger', oneLiner: 'Loud before sunrise and silent after it.', motive: 'A stall rent that rose every spring without a reason given.', alibi: "I am loudest before sunrise, as usual." },
      p3: { name: 'Evangeline', role: 'Schoolteacher', oneLiner: "Corrects the town's grammar, and its memory.", motive: 'A scandal she had promised never to teach.', alibi: "I corrected a few things, as I do." },
      p4: { name: 'Lena', role: 'Harbour clerk', oneLiner: 'Stamps every form twice and trusts no one once.', motive: 'A forged signature that only one person had noticed.', alibi: "I stamped what was put before me." },
      p5: { name: 'Carol', role: 'Boat-builder', oneLiner: 'Measures twice, speaks once, and is usually correct.', motive: 'An order cancelled just as the hull was finished.', alibi: "I measured twice and I spoke once." },
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
    closing: "Every account I wrote was true, and so were the scales. {M}'s neat figures were the only ones that put anyone alone with {V}. The bell, for the record, was still silent.",
    murderer: 'p2',
    cast: {
      p0: { name: 'Tomas', shown: 'Afonso', role: 'Salt-pan foreman', oneLiner: 'Reads the weather in the crust on the pans.', motive: 'Meant to report a pattern of short weights before the season closed.', alibi: "Pans never mind who watches, and nor do I." },
      p1: { name: 'Greta', shown: 'Celia', role: 'Cart driver', oneLiner: 'Hauls forty sacks a day and never asks what is in them.', motive: 'Resented a route that was cut without notice.', alibi: "I haul what I am given, no questions." },
      p2: { name: 'Marco', shown: 'Henrik', role: 'Weighing clerk', oneLiner: 'Writes every figure in a hand too neat to argue with.', motive: 'Short weights in his own hand, and a foreman who had learned to read them.', alibi: "Ask me a number and I will have it ready." },
      p3: { name: 'Bella', shown: 'Katya', role: 'Tide-chart printer', oneLiner: 'Sets the type by feel and misses nothing.', motive: 'A printing order she lost to a rival and has not forgiven.', alibi: "My hands were inked to the wrists, as ever." },
      p4: { name: 'Priya', shown: 'Ngozi', role: 'Cooper', oneLiner: 'Can tell a leak from the sound of a tap.', motive: "Wanted her apprentice kept on, against the foreman's wishes.", alibi: "I was listening for leaks, as I always do." },
      p5: { name: 'Oscar', shown: 'Tarek', role: 'Night watchman', oneLiner: 'Walks the same round every hour and is never where you look.', motive: 'Had been warned for a shift he swears he never slept through.', alibi: "I kept my round, the same round every hour." },
    },
  },
  'pt-02': {
    title: 'The Auction of Small Hours',
    premise:
      'The fish auction at Portinhal opens at four in the morning, and I arrived in time to hear that a lot had gone unsold for the first time in all the years anyone could recall. Somebody had also taken the rope off the harbour bell, which the town treated as a rumour and I treated as a clue.',
    closing: 'A lot goes unsold when somebody needs the market looking elsewhere. I put that in the notebook, and went on listening for the bell.',
    murderer: 'p1',
    cast: {
      p0: { name: 'Priya', shown: 'Naomi', role: 'Auctioneer', oneLiner: 'Talks faster than the gulls and says less.', motive: 'Knew which lots were being quietly held from the sale.', alibi: "I talk fast so nobody has to wait." },
      p1: { name: 'Alexander', shown: 'Hugo', role: 'Wholesale buyer', oneLiner: 'Never bids first and never bids last.', motive: 'Three seasons of being called last, and a long memory for it.', alibi: "I buy last and I buy well." },
      p2: { name: 'Carol', shown: 'Olga', role: 'Ice merchant', oneLiner: 'Sells cold by the block and warmth by the word.', motive: 'An old quarrel over who owed whom an apology.', alibi: "I sold cold all night, and nothing else." },
      p3: { name: 'Nadia', shown: 'Beatriz', role: 'Dock inspector', oneLiner: 'Carries a clipboard like a shield.', motive: 'Meant to file a report nobody wanted filed.', alibi: "I read my clipboard and trusted it." },
      p4: { name: 'Oscar', shown: 'Dinis', role: 'Fish-gutter', oneLiner: 'Whistles one tune, and always flat.', motive: 'Passed over for foreman for the second year running.', alibi: "My hands were busy and my head was empty." },
      p5: { name: 'Lena', shown: 'Ingrid', role: 'Lorry driver', oneLiner: 'Has seen every sunrise from the same road.', motive: 'A fine she insisted was a mistake.', alibi: "I watched the sunrise from my cab." },
    },
  },
  'pt-03': {
    title: 'Matins for the Absent',
    premise:
      "The seamen's chapel keeps a book of names for those the sea has not returned, and I was asked to read it for a clerical error. By the end of the first evening the harbour bell, which should have marked the hour, had been silent so long that its ringer had resigned in writing.",
    closing: 'Every name in the book was accounted for but one, and somebody had wanted it gone. Nobody rang the bell for it, and nobody had since the autumn.',
    murderer: 'p2',
    cast: {
      p0: { name: 'Oscar', shown: 'Nuno', role: 'Choirmaster', oneLiner: 'Hums the hymn before the congregation knows its number.', motive: 'Wanted the choir kept exactly as it was.', alibi: "I count the choir in, and I count them out." },
      p1: { name: 'Bella', shown: 'Hana', role: 'Organ tuner', oneLiner: 'Hears a flat note from the far end of the street.', motive: 'Annoyed that her repairs were credited to another.', alibi: "I was listening to the pipes breathe." },
      p2: { name: 'Priya', shown: 'Lucia', role: 'Parish archivist', oneLiner: 'Files every page and forgives none that go astray.', motive: 'A name erased from the book years ago, and a verger who had found it.', alibi: "Everything I keep is kept in order." },
      p3: { name: 'Idris', shown: 'Amilcar', role: 'Chapel verger', oneLiner: 'Knows who sits where, and who stopped coming.', motive: 'Had noticed a page that did not match its neighbours.', alibi: "I know who comes and who stops coming." },
      p4: { name: 'Carol', shown: 'Marta', role: 'Candle chandler', oneLiner: 'Pours a taper as straight as a plumb line.', motive: 'Nursed a grudge over a gift that was never acknowledged.', alibi: "Candles do not wait, and neither do I." },
      p5: { name: 'Nadia', shown: 'Joana', role: 'Visiting widow', oneLiner: 'Comes every winter and knows the book by heart.', motive: 'Hoped to find a name in it, and feared to.', alibi: "I come each winter, and I stay for the quiet." },
    },
  },
  'pt-04': {
    title: 'Rivets and Rumours',
    premise:
      'The boatyard at Portinhal was a week from launching its first hull in a decade, and I was hired to learn why the keel kept arriving damaged. Meanwhile the brass tongue of the harbour bell was found wrapped in oilcloth, which the shipwrights swore had nothing to do with them.',
    closing: 'A hull carries only the names on its papers. I added one more to mine, and the oilcloth to my list of loose ends.',
    murderer: 'p5',
    cast: {
      p0: { name: 'Carol', shown: 'Sunita', role: 'Chief foreman', oneLiner: 'Has launched forty hulls and named none of them.', motive: 'Meant to tell the owners whose drawings the new hull really followed.', alibi: "I will launch it when it is ready." },
      p1: { name: 'Alexander', shown: 'Rui', role: 'Shipwright', oneLiner: 'Taps a plank once and knows the tree it came from.', motive: 'Wanted the old methods kept against the owners.', alibi: "I was tapping planks, listening to the grain." },
      p2: { name: 'Bella', shown: 'Zita', role: 'Rigger', oneLiner: 'Climbs like she is late for an appointment at the masthead.', motive: 'A fall last spring that nobody would call an accident.', alibi: "I rope everything twice. Twice is safe." },
      p3: { name: 'Yuki', shown: 'Carla', role: 'Painter', oneLiner: 'Lays one coat so even it looks like glass.', motive: 'Refused to paint a name she thought was wrong.', alibi: "One coat, laid slow, and I never rush." },
      p4: { name: 'Idris', shown: 'Anton', role: 'Plank steamer', oneLiner: 'Bends oak with heat and patience and complains about both.', motive: 'Tired of being the last to hear what was planned.', alibi: "Steam waits for no one, and neither do I." },
      p5: { name: 'Dalia', shown: 'Mei', role: 'Draughtswoman', oneLiner: 'Draws a curve once and never lets anyone erase it.', motive: 'Her name was omitted from the drawings for the one hull that mattered.', alibi: "My lines stay where I draw them." },
    },
  },
  'pt-05': {
    title: 'The Falling Glass',
    premise:
      "The pilots' guild reads its barometer twice a day and has never once been wrong in public. A guild pilot swore to me that he had heard the harbour bell once, at slack water, on a night when it was certainly not rung.",
    closing: 'Slack water keeps its own counsel, and so had {M}. I noted the hour of the bell that nobody rang, and went on listening.',
    murderer: 'p1',
    cast: {
      p0: { name: 'Priya', shown: 'Amara', role: 'Guild secretary', oneLiner: 'Writes the minutes and remembers what was not minuted.', motive: 'Was about to enter a reprimand that would end a long career.', alibi: "If it was said, I wrote it in the minutes." },
      p1: { name: 'Marco', shown: 'Matteo', role: 'Senior pilot', oneLiner: 'Has brought in every ship but the one he talks about.', motive: 'A reprimand about to enter a record he had kept spotless for thirty years.', alibi: "I have steered worse nights than this." },
      p2: { name: 'Evangeline', shown: 'Noor', role: 'Barometer keeper', oneLiner: 'Taps the glass each dawn and says only "steady".', motive: 'Her readings had been set aside without a word.', alibi: "The glass said steady, and I said so." },
      p3: { name: 'Idris', shown: 'Bruno', role: 'Signal-flag maker', oneLiner: 'Stitches a flag so it flies even in a flat calm.', motive: 'Resented the new signals that made his flags pointless.', alibi: "I was stitching, same as any other night." },
      p4: { name: 'Alexander', shown: 'Wei', role: 'Tug skipper', oneLiner: 'Pushes ships about like furniture and sleeps like a child.', motive: 'A narrow escape in the channel that was blamed on him.', alibi: "My tug keeps no calendar, only the tide." },
      p5: { name: 'Dalia', shown: 'Luisa', role: 'Relief lighthouse keeper', oneLiner: 'Has spent whole winters in the company of one great flame, and won every argument.', motive: 'Was asked to stay on one more winter and refused to say why not.', alibi: "I know what a long night looks like." },
    },
  },
  'pt-06': {
    title: 'Lace in the Dark',
    premise:
      'The lace-makers of Portinhal sell to three continents and gossip to none, which made it odd that a whole season\'s pattern had been copied before it was finished. The council, I learned, had also voted not to discuss the harbour bell, so it seemed to be a season for silences.',
    closing: 'A pattern copied before it was finished has to be copied by someone who watched it grow. I tied off the thread and set the bell aside for later.',
    murderer: 'p4',
    cast: {
      p0: { name: 'Alexander', shown: 'Nelson', role: 'Export agent', oneLiner: 'Speaks four languages and bargains in all of them.', motive: 'Had promised a buyer a pattern that no longer existed.', alibi: "I had three languages and no time." },
      p1: { name: 'Bella', shown: 'Mariam', role: 'Dyer', oneLiner: 'Her hands are the colour of whatever she finished last.', motive: 'A rival dye that would have made hers worthless.', alibi: "My hands were blue by the second hour." },
      p2: { name: 'Greta', shown: 'Djamila', role: 'Pattern designer', oneLiner: 'Draws a leaf once and sees it in the thread for a week.', motive: 'Knew whose hand had copied her pattern.', alibi: "Give me a leaf and an evening." },
      p3: { name: 'Carol', shown: 'Esther', role: 'Thread spinner', oneLiner: 'Spins so fine the thread is a rumour.', motive: 'A long feud over whose spinning went into the finest piece.', alibi: "I spin fine, and I spin quiet." },
      p4: { name: 'Nadia', shown: 'Freya', role: 'Bobbin-winder', oneLiner: 'Quiet, quick, and always counting something.', motive: 'A loan taken against a pattern that she could no longer sell.', alibi: "Forty bobbins wound, and I kept the count." },
      p5: { name: 'Evangeline', shown: 'Sofia', role: 'Apprentice', oneLiner: 'Watches everything and has been taught to say nothing.', motive: 'Saw what she should not have, and was told to forget it.', alibi: "I was told to watch and learn." },
    },
  },
  'pt-07': {
    title: 'Second Feature',
    premise:
      "Portinhal's picture palace shows one film a week and the same newsreel every night, so when the projector stopped mid-reel the whole town took it as an insult. The bell tower's visitors' book, which I read on the way in, shows that nobody has signed it since the first silent night.",
    closing: "It was never about the film, only about who chose the programme. I noted that no visitor had signed the tower's book since, and that I could not yet say why.",
    murderer: 'p3',
    cast: {
      p0: { name: 'Marco', shown: 'Pavel', role: 'Poster painter', oneLiner: 'Paints every star a little taller than life.', motive: 'Was told his posters were to be replaced by printed ones.', alibi: "Everyone is taller on my posters." },
      p1: { name: 'Viraj', shown: 'Jonas', role: 'Newsreel courier', oneLiner: 'Brings the world in a tin, a week late.', motive: 'Carried a reel he had been told not to show.', alibi: "I deliver the news; I do not make it." },
      p2: { name: 'Lena', shown: 'Matilde', role: 'Projectionist', oneLiner: 'Has watched the same film four hundred times and still flinches.', motive: 'Knew whose hand had stopped the reel.', alibi: "I have seen this film four hundred times." },
      p3: { name: 'Carol', shown: 'Aisha', role: 'Ticket-seller', oneLiner: 'Knows every regular by the sound of their coat.', motive: 'Years of being promised the programme would be hers to choose.', alibi: "I know every face that comes through." },
      p4: { name: 'Oscar', shown: 'Karim', role: 'Organist', oneLiner: 'Plays the same sad tune for comedies and tragedies alike.', motive: 'Feared the talkies would retire him.', alibi: "Comedy or tragedy, I play the same tune." },
      p5: { name: 'Tomas', shown: 'Enzo', role: 'Theatre manager', oneLiner: 'Counts the audience twice and trusts neither number.', motive: 'Meant to close the palace at the end of the season.', alibi: "I counted the audience, then I counted again." },
    },
  },
  'pt-08': {
    title: 'The Mill Stops Grinding',
    premise:
      "The tide-mill at Portinhal has milled the town's flour for three hundred years and, by the miller's own records, has never once been late. When a child wrote to the harbourmaster asking where the sound of the bell had gone, the harbourmaster handed the letter to me.",
    closing: 'Some grudges are older than the mill. I wrote the child a short note, and promised only that someone was listening.',
    murderer: 'p5',
    cast: {
      p0: { name: 'Tomas', shown: 'Paulo', role: 'Tide-mill miller', oneLiner: 'Judges flour by rubbing it with two fingers and a long silence.', motive: 'Had decided at last to name the baker who deserved the recipe.', alibi: "The tide keeps better time than I do." },
      p1: { name: 'Nadia', shown: 'Thais', role: 'Baker', oneLiner: 'Rises before the gulls, and is proud that nobody has beaten her to it.', motive: 'Wanted the mill kept out of the hands of the council.', alibi: "I was kneading well before the gulls woke." },
      p2: { name: 'Viraj', shown: 'Vasco', role: 'Millwright', oneLiner: 'Talks to the gears, and the gears seem to answer.', motive: 'Had warned of a fault that nobody wished to hear about.', alibi: "The gears and I had a long talk." },
      p3: { name: 'Lena', shown: 'Ines', role: 'Grain inspector', oneLiner: 'Rubs a husk with her thumbs and rejects half the harbour.', motive: 'Suspected a delivery that did not match its papers.', alibi: "I rub a husk and I know." },
      p4: { name: 'Oscar', shown: 'Rohan', role: 'Tide-gate keeper', oneLiner: 'Lives by the moon and resents the calendar.', motive: 'Feared the mill would one day need no keeper.', alibi: "I go by the moon, not the calendar." },
      p5: { name: 'Marco', shown: 'Felix', role: 'Bread seller', oneLiner: 'Sells a loaf as though it were a sermon.', motive: 'A recipe the miller had once promised him in writing, then given away.', alibi: "I let the bread sell itself." },
    },
  },
  'pt-09': {
    title: 'Meridian Lines',
    premise:
      "The chart-maker's shop on the quay has sold the same harbour survey since before the bell was cast, and keeps a drawer of whatever people forget to collect. In that drawer I found a sailmaker's off-cut of oilcloth, tagged with the date the bell went quiet.",
    closing: 'A coastline is only as honest as the one who measures it, and {M} had measured it twice. I pinned the sailmaker\'s scrap to the notebook.',
    murderer: 'p0',
    cast: {
      p0: { name: 'Carol', shown: 'Lin', role: 'Coast surveyor', oneLiner: 'Walks a shoreline with a chain and counts every step aloud.', motive: 'A coastline she had measured twice, and been told someone else drew.', alibi: "I count my steps aloud so they stay true." },
      p1: { name: 'Bella', shown: 'Ilda', role: 'Engraver', oneLiner: 'Cuts a copper plate so fine it reads like handwriting.', motive: 'A plate she had engraved, published under another name.', alibi: "I had copper, a steady hand and an evening." },
      p2: { name: 'Nadia', shown: 'Filipa', role: 'Compass adjuster', oneLiner: 'Trusts a compass needle more than most people trust each other.', motive: 'Refused to certify a compass she had seen tampered with.', alibi: "I trust a needle, which never lies." },
      p3: { name: 'Tomas', shown: 'Kofi', role: 'Chart-maker', oneLiner: 'Draws the sea as he wishes it behaved.', motive: 'Had decided to credit the survey to whoever had walked it.', alibi: "I draw the sea as I find it. Mostly." },
      p4: { name: 'Evangeline', shown: 'Amina', role: 'Ink-maker', oneLiner: 'Boils oak galls and gossip in the same pot.', motive: 'Was offered a better recipe and a worse bargain.', alibi: "I was boiling galls and minding my business." },
      p5: { name: 'Oscar', shown: 'Elias', role: 'Quay porter', oneLiner: 'Carries a map roll the way other men carry a baby.', motive: 'Had seen who departed in a hurry, and been told to say nothing.', alibi: "I carry it, I do not read it." },
    },
  },
  'pt-10': {
    title: 'The Brass Section',
    premise:
      "Portinhal's brass band has played at every launch, funeral and election for a century, and it was in the middle of rehearsing for a launch when I arrived. Someone, I was told, pays to have the harbour bell polished every week even though it has not rung in months.",
    closing: 'A solo is a small thing to carry for years, and carried long enough, a heavy one. The polish on the bell, I noted, is still being paid for.',
    murderer: 'p1',
    cast: {
      p0: { name: 'Oscar', shown: 'Ibrahim', role: 'Bandmaster', oneLiner: 'Conducts with a baton and a long list of grievances.', motive: 'Had chosen the solo for the launch, and not for the player who expected it.', alibi: "We rehearse until it is perfect, then again." },
      p1: { name: 'Lena', shown: 'Zahra', role: 'Cornet soloist', oneLiner: 'Plays the high note like a dare.', motive: 'Passed over for the launch solo by a bandmaster she had trained.', alibi: "I play the high note and let it fly." },
      p2: { name: 'Evangeline', shown: 'Clara', role: 'Tuba player', oneLiner: 'Carries the low notes of the band, and the gossip.', motive: 'Wanted the band to stay out of the election.', alibi: "Somebody has to hold the low notes, so I do." },
      p3: { name: 'Idris', shown: 'Yusuf', role: 'Drummer', oneLiner: 'Keeps time better than the town hall does.', motive: 'Tired of marching for a leader who never looked round.', alibi: "I keep time, whether or not anyone follows." },
      p4: { name: 'Carol', shown: 'Rita', role: 'Music copyist', oneLiner: 'Writes out every part by hand, and every part is perfect.', motive: 'Her copying had been called sloppy within earshot of the others.', alibi: "Every part I wrote out was clean." },
      p5: { name: 'Nadia', shown: 'Vera', role: 'Trombonist', oneLiner: 'Slides into every note with a small apology.', motive: 'Knew the real reason for the changed programme.', alibi: "Slow slides and small apologies, that is me." },
    },
  },
  'pt-11': {
    title: 'The Short Manifest',
    premise:
      'Portinhal\'s customs shed stamps every parcel that leaves the harbour and has never lost a form, which is why a missing page was treated as an act of war. An unsigned enquiry about casting a replacement for the harbour bell had arrived from the foundry the same week, and nobody in town would admit to sending it.',
    closing: "The manifest was short by exactly what {M} had taken. I filed the missing page where I could find it, and the foundry's letter where I could not forget it.",
    murderer: 'p1',
    cast: {
      p0: { name: 'Tomas', shown: 'Mateus', role: 'Dock foreman', oneLiner: 'Can load a hold blind and swears at it kindly.', motive: 'Was told to look elsewhere when a hold came in light.', alibi: "A light hold keeps me awake." },
      p1: { name: 'Alexander', shown: 'Fabio', role: 'Shipping broker', oneLiner: 'Has a smile for every form and a loophole for every smile.', motive: 'Duties skimmed from three seasons of cargo, and an inspector who had counted.', alibi: "I have a form for everything." },
      p2: { name: 'Viraj', shown: 'Samuel', role: 'Stamp engraver', oneLiner: 'Cuts the seal that makes a paper true.', motive: 'Had been asked to cut a second seal he knew was wrong.', alibi: "I cut one seal at a time, and cut it true." },
      p3: { name: 'Priya', shown: 'Yara', role: 'Customs inspector', oneLiner: 'Counts what is declared and, patiently, what is not.', motive: 'Had found the page that was meant to go missing.', alibi: "Every parcel gets a second look from me." },
      p4: { name: 'Marco', shown: 'Arjun', role: 'Warehouse keeper', oneLiner: 'Knows where everything is, and what it is worth.', motive: 'Worried he would be blamed for a shortfall.', alibi: "I know where everything is, mostly." },
      p5: { name: 'Greta', shown: 'Gisela', role: 'Cargo clerk', oneLiner: 'Writes a hundred lines a day and remembers every one.', motive: 'Had copied a list she was told to forget.', alibi: "I wrote a hundred lines and read none twice." },
    },
  },
  'pt-12': {
    title: 'The Last Peal',
    premise:
      'I came to the last case of the season expecting one more stranger\'s grudge, and found the keeper of the harbour bell waiting with a confession of his own. He would not say a word of it until the case was closed.',
    closing: 'The keeper had taken the rope off and bound the tongue in oilcloth, afraid one more peal would split a hairline crack, and had kept the bell polished while writing to the foundry in secret. The new bell is on its way, and the old one will ring once more at the turn of the season.',
    murderer: 'p5',
    cast: {
      p0: { name: 'Yuki', shown: 'Samira', role: "Keeper's apprentice", oneLiner: 'Climbs the stair twice a day and keeps count of every step.', motive: 'Had learned why the bell had stopped, and had meant to tell.', alibi: "Two trips a day, and I count them all." },
      p1: { name: 'Tomas', shown: 'Wilson', role: 'Harbourmaster', oneLiner: 'Signs for every ship and for most of the town\'s peace.', motive: 'Wanted the silence kept until the new bell was paid for.', alibi: "I sign for the ships and I sign for the peace." },
      p2: { name: 'Lena', shown: 'Maya', role: 'Foundry agent', oneLiner: 'Speaks of bronze the way others speak of family.', motive: 'Had come to the town with a quote and a secret.', alibi: "Bronze is patient, and so am I." },
      p3: { name: 'Oscar', shown: 'Pieter', role: 'Sexton', oneLiner: 'Has buried half the town and remembers all of them kindly.', motive: 'Feared the old bell would be melted for the new one.', alibi: "I remember them kindly, every one." },
      p4: { name: 'Bella', shown: 'Zainab', role: 'Town clerk', oneLiner: 'Stamps a minute in blue ink and a rumour in red.', motive: 'Had kept the foundry\'s letter from the council.', alibi: "I stamp the minutes and I keep the ink dry." },
      p5: { name: 'Greta', shown: 'Leonor', role: 'Stonemason', oneLiner: 'Carves in a silence so complete the chisel seems to apologise.', motive: "A promise to restore the tower's carving, handed to a stranger instead.", alibi: "I let the chisel do the talking." },
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
  /** What a person says for themselves, in their own voice. Not positional, so it is visible from the start. */
  alibiOf: (id: string) => string | null
  /** The murderer's motive, only after the case is solved. */
  motive: string | null
  /** The investigator's closing line, only after the case is solved. */
  closing: string | null
}

export function visibleStory(s: CaseStory | null, solved: boolean): VisibleStory {
  return {
    premise: s?.premise ?? '',
    roleOf: id => (s?.cast[id] ? { role: s.cast[id].role, oneLiner: s.cast[id].oneLiner } : null),
    alibiOf: id => s?.cast[id]?.alibi ?? null,
    motive: s && solved ? s.cast[s.murderer].motive : null,
    closing: s && solved ? s.closing ?? null : null,
  }
}

const shownCache = new WeakMap<Puzzle, Readonly<Record<string, string>>>()

/** Person id to the name the player sees, for a case that overrides its generator names. Empty otherwise. */
function shownNames(p: Puzzle): Readonly<Record<string, string>> {
  let m = shownCache.get(p)
  if (!m) {
    const s = storyFor(p)
    m = Object.fromEntries(s ? Object.entries(s.cast).flatMap(([id, c]) => (c.shown ? [[id, c.shown]] : [])) : [])
    shownCache.set(p, m)
  }
  return m
}

/** The one name function: what a person is called on screen, in aria and in every generated sentence. */
export const displayName = (p: Puzzle, id: string): string => shownNames(p)[id] ?? p.people.find(x => x.id === id)?.name ?? id

/** Puts the shown names into an authored line: {M} is the murderer, {V} the victim. (Letters, not words: the story validator bans the words.) */
export const fillNames = (p: Puzzle, text: string): string =>
  text.replace(/{M}/g, displayName(p, p.murdererId)).replace(/{V}/g, displayName(p, p.victimId))
