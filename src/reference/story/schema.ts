// ============================================================================
// Story layer (R2): premise, suspects, evidence and the reconstruction script
// of ONE case. It is presentation only. It never adds, removes or changes a
// clue: every in-voice line is tied to a real clue of that person, and
// `validate.ts` proves the wording cannot leak anything the clue does not say.
// ============================================================================

import type { Clue, FurnitureType } from '../../core/types'

/** Structural subset of a real Clue (all given fields must equal). `person` is implied by the owner. */
export type ClueRef = { [K in Clue['kind']]: { kind: K } & Partial<Omit<Extract<Clue, { kind: K }>, 'kind' | 'person'>> }[Clue['kind']]

export interface InterrogationLine {
  /** What the person says, in voice. May only touch what `clue` states. */
  text: string
  /** The real clue this line voices. The literal sentence is always shown beside the line. */
  clue: ClueRef
}

export interface SuspectStory {
  /** Puzzle person id (p0...). The victim has an entry too (scene notes instead of an interrogation). */
  personId: string
  /** Full name for the card ("Priya Nandakumar"). The puzzle's first name stays the one printed on the plan. */
  fullName: string
  /** "The Courier", "The Landlady": short role shown on the portrait card. */
  role: string
  /** One sentence under the name. Atmosphere only; no places, no clue words. */
  oneLiner: string
  /** Motive card: a one-word label (Debt, Jealousy...) plus the sentence behind it. */
  motive: { label: string; text: string }
  /** First-person summary of the account, shown as the pull-quote of the interrogation. */
  alibi: string
  /** One or more voiced lines per real clue. */
  lines: InterrogationLine[]
  /** Contact-sheet portrait index 0..7 (0-3 top row, 4-7 bottom row). Defaults to the shell's hash. */
  portrait?: number
}

/** Evidence objects are never a clue-relevant FurnitureType. */
export type EvidenceKind =
  | 'parcel' | 'letter' | 'key' | 'brooch' | 'journal' | 'shears' | 'glass' | 'photo'
  | 'receipt' | 'ring' | 'matchbook' | 'glove' | 'button' | 'ticket' | 'footprint' | 'coin'

export interface EvidencePlacement {
  /**
   * Board coordinates in CELL UNITS: x runs along columns, y along rows, so
   * the centre of cell (r, c) is (c + 0.5, r + 0.5) and the grid spans
   * [0, N] on both axes. A marker must clear the central 50% of every cell,
   * every room label and the token boxes of cells a person can stand on: put
   * it on a furniture rim, a wall line, a wall junction (a cell corner), or in
   * the bottom/right garden margin (the porch). The top/left margins carry the
   * numerals and are off limits.
   */
  x: number
  y: number
  /** Where the object lies, for the screen-reader label ("on the porch step"). */
  where: string
}

export interface EvidenceStory {
  id: string
  /** Marker number on the plan (1-based, unique). */
  n: number
  kind: EvidenceKind
  /** Words by which prose refers to this item (the symmetry test counts them per suspect). */
  refs: string[]
  label: string
  /** Shown as soon as the item is found. Neutral: names no suspect and accuses nobody. */
  description: string
  /** Shown only in the reconstruction, after the case is solved or revealed. */
  revealNote: string
  placement: EvidencePlacement
  /**
   * false = the marker and the drawer tile only exist in the reconstruction,
   * because the object would point at the culprit if it were found mid-play.
   */
  showDuringPlay: boolean
}

export interface RevealBeat { title: string; body: string }

export interface RevealStory {
  motive: RevealBeat
  movements: RevealBeat
  /** The pivotal clue (by owner + ref) the "Crucial clue" step spotlights. */
  crucial: RevealBeat & { person: string; clue: ClueRef }
  conclusion: RevealBeat
  /** Last frame of the filmstrip: the closed case file. */
  dossier: RevealBeat
}

export interface HouseSetting {
  /** "Hollis Villa": the place's name in the story. */
  estate: string
  /** Internal name of the architectural pack. Never shown to the player. */
  house: string
  /** Player-facing description of the building ("Victorian Villa"). */
  styleLabel: string
  /** "Victorian" */
  style: string
  /** Time stamp for the intro ("23:40"). */
  hour: string
  /** The street door's porch: where the footsteps come in from. Board coordinates in cell units (outside the grid). */
  entrance: { x: number; y: number }
  /** The grid cell just inside the street door; footsteps start here. */
  entranceCell: { row: number; col: number }
  /** The passage that connects the other rooms (rooms only open onto this one). */
  hubRoomId: string
  /**
   * Door openings the board draws (wall segments in cell units). Evidence
   * keeps clear of them. Mirrors the style bible; the board owns the real ones.
   */
  doors: Array<{ x1: number; y1: number; x2: number; y2: number }>
}

export interface CaseStory {
  caseId: string
  /** Play-facing language of the strings below (the shell chrome follows it). */
  lang: 'en' | 'pt'
  /** One paragraph. Sets the scene; never accuses. */
  premise: string
  setting: HouseSetting
  suspects: SuspectStory[]
  evidence: EvidenceStory[]
  reveal: RevealStory
}

/** Words the validator treats as "furniture" per type, for leak detection. */
export const FURNITURE_WORDS: Record<FurnitureType, string[]> = {
  chair: ['chair', 'armchair', 'stool', 'seat'],
  sofa: ['sofa', 'couch', 'settee', 'chesterfield'],
  bed: ['bed', 'mattress', 'pillow', 'quilt'],
  table: ['table'],
  box: ['box', 'crate', 'trunk', 'chest'],
  rug: ['rug', 'carpet'],
  plant: ['plant', 'palm', 'fern'],
  shrub: ['shrub', 'bush', 'hedge'],
  lamp: ['lamp', 'lantern', 'lamplight'],
  counter: ['counter', 'worktop', 'countertop'],
  tv: ['tv', 'television', 'telly', 'wireless', 'screen'],
  bathtub: ['bathtub', 'bath', 'tub'],
  bookshelf: ['bookshelf', 'bookcase', 'shelf', 'shelves'],
  stove: ['stove', 'range', 'cooker', 'oven', 'hob'],
  fridge: ['fridge', 'icebox', 'ice-box', 'refrigerator'],
  clock: ['clock'],
  desk: ['desk'],
  toilet: ['toilet', 'lavatory'],
  shower: ['shower'],
}

/** Evidence kinds that are NOT furniture types (checked in the tests). */
export const EVIDENCE_KINDS: readonly EvidenceKind[] = [
  'parcel', 'letter', 'key', 'brooch', 'journal', 'shears', 'glass', 'photo',
  'receipt', 'ring', 'matchbook', 'glove', 'button', 'ticket', 'footprint', 'coin',
]
