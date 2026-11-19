// Named accusation. Pure: no UI, no storage. The right name over the exact plan
// is "Proved", or "Proved with help" when a hint or a strike was spent on the
// way. The right name over an unfinished or wrong plan is only "Called it", and
// so is any right name once the answer has been revealed. A
// wrong name is a strike and nothing more.
import type { Puzzle } from '../core/types'
import { samePlacement } from './cells'
import type { Placement } from './cells'
import type { Outcome } from './save'

export const MAX_STRIKES = 3

export type Verdict =
  | { kind: 'invalid' }
  | { kind: 'proved' }
  | { kind: 'provedHelp' }
  | { kind: 'calledIt' }
  | { kind: 'notThem'; strikes: number; cold: boolean }

export type Tier = 'proved' | 'provedHelp' | 'calledIt'

export const TIER_LABEL: Record<Tier, string> = { proved: 'Proved', provedHelp: 'Proved with help', calledIt: 'Called it' }

/** "Proved" is clean; any hint or strike makes it "Proved with help". Derived, never saved. */
export const provedTier = (hintsUsed: number, strikes: number): Tier => (hintsUsed > 0 || strikes > 0 ? 'provedHelp' : 'proved')

/** The tier a saved outcome stands for, or null for an open or cold case. */
export function tierOf(outcome: Outcome, hintsUsed: number, strikes: number, revealed = false): Tier | null {
  if (outcome === 'proved' || outcome === 'called') {
    if (revealed) return 'calledIt'
  }
  if (outcome === 'proved') return provedTier(hintsUsed, strikes)
  return outcome === 'called' ? 'calledIt' : null
}

export function judgeAccusation(p: Puzzle, accused: string, place: Placement, strikesBefore: number, hintsUsed = 0, revealed = false): Verdict {
  const suspect = p.people.some(x => x.id === accused) && accused !== p.victimId
  if (!suspect) return { kind: 'invalid' }
  if (accused === p.murdererId) {
    // Seeing the alibis or the true squares is the end of proving anything: no finished plan earns a proof now.
    if (revealed || !samePlacement(p, place)) return { kind: 'calledIt' }
    return { kind: provedTier(hintsUsed, strikesBefore) === 'proved' ? 'proved' : 'provedHelp' }
  }
  const strikes = Math.min(MAX_STRIKES, strikesBefore + 1)
  return { kind: 'notThem', strikes, cold: strikes >= MAX_STRIKES }
}
