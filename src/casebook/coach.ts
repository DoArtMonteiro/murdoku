// A coach: someone else's script played on the casebook's own desk. Case 0, the first-run walk-through, is the
// one user. The coach owns the game state (its beat engine decides what a tap does and what to say next); the
// casebook draws it, and adds the instruction in the readout slot, a soft halo on the control the beat wants,
// and a card over the desk before and after.
import type { ReactNode, RefObject } from 'react'
import type { Action, GameState } from './game'
import type { CaseStory } from './stories'

/** What the accusation sheet needs from the screen that hosts it. */
export interface CoachSheet {
  /** The name of the suspect a wrong accusation just named, if any. */
  wrongName: string | null
  onAccuse: (id: string) => void
  onClose: () => void
}

export interface Coach {
  /** The game state, owned by the coach. The casebook never keeps or saves one of its own while a coach is on. */
  state: GameState
  dispatch: (action: Action) => void
  /** The step on show, for the counter in place of the accusation marks and for the live region. */
  beat: { n: number; of: number }
  /** The instruction, in the readout slot. */
  instruction: string
  /** Scoped CSS for the halo on whatever the beat wants touched. Applied only while the desk is live. */
  haloCss: string
  /** A card is over the desk: nothing behind it can be touched or reached, and no halo shows. */
  hold: boolean
  /** The plan is finished: Accuse opens and Why? has nothing left to say. */
  ready: boolean
  /** The instruction line, so the coach can move focus onto it. */
  lineRef: RefObject<HTMLParagraphElement | null>
  /** The case's own words, in place of the casebook's registered story. */
  story: CaseStory
  /** The heading in the header. */
  title: string
  /** More in the header: a way out. */
  header?: ReactNode
  /** The card laid over the desk while `hold` is on. */
  card?: ReactNode
  /** The accusation sheet. */
  sheet: (p: CoachSheet) => ReactNode
  /** The alibis have been read to the last line. */
  onEnd: () => void
  /** "Close the case" was pressed. */
  onClose: () => void
}
