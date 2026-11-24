// One False Alibi: the data contract for a case.
//
// Every suspect gives an account (one or more statements). Exactly one statement in the
// whole case is false, and its author is the murderer: the only person who needed to put
// themself somewhere else. The player catches the lie by finding two collisions between
// accounts that share only that statement, doubts it, then reconstructs the real plan.
//
// `puzzle.clues` holds ONLY the true statements (plus the victim's scene facts), so the
// puzzle stays a valid, uniquely solvable Murdoku case and every existing validator applies
// unchanged. The false statement lives beside it in `lie`, and the UI merges the two into
// the accounts the player reads. Nothing here, and nothing that reads it for the lens or
// the collision display, may consult `puzzle.solution`.
import type { Clue, Puzzle } from '../core/types'

/** A statement as the player reads it. `text` is the exact sentence the literal interpreter parses. */
export interface Statement {
  /** Stable id within the case, e.g. "s3". Used for saves, doubts and collision sets. */
  id: string
  author: string
  clue: Clue
  /** Positional sentence, byte-identical to the string tests/truth/literal.ts parses. */
  text: string
  /** Optional non-positional flavour in the speaker's voice, shown before `text`. */
  voice?: string
  /** Scene facts are physical evidence about the victim. They cannot be doubted. */
  scene?: boolean
}

export interface LieCase {
  id: string
  /** The puzzle with true statements only. `murdererId` equals the false statement's author. */
  puzzle: Puzzle
  /** Every statement in reading order, the false one included. */
  statements: Statement[]
  /** Id of the single false statement in `statements`. */
  lieId: string
  /**
   * Two collisions the player can find, each a set of statement ids that cannot all hold.
   * They overlap only in `lieId`. Used by the roll-call ("refuted by X and Y") and by tests.
   */
  collisions: [string[], string[]]
  story: LieStory
}

export interface LieStory {
  title: string
  /** Two or three sentences in the investigator's voice. */
  premise: string
  /** Shown after the case is solved. {M} is the murderer, {V} the victim. */
  closing: string
  cast: Record<string, { name: string; role: string; emblem: EmblemId; motive: string }>
}

/** Trade emblems drawn as SVG line art in src/lie/art/emblems.tsx. */
export type EmblemId =
  | 'scales' | 'lantern' | 'anchor' | 'bell' | 'net' | 'key'
  | 'needle' | 'bread' | 'quill' | 'bottle' | 'salt' | 'compass'
