// Named accusation. Pure: no UI, no storage. "Proved" needs the right name AND
// the plan equal to the solution; the right name over an unfinished or wrong
// plan is only "Called it". A wrong name is a strike and nothing more.
import type { Puzzle } from '../core/types'
import { samePlacement } from './cells'
import type { Placement } from './cells'

export const MAX_STRIKES = 3

export type Verdict =
  | { kind: 'invalid' }
  | { kind: 'proved' }
  | { kind: 'calledIt' }
  | { kind: 'notThem'; strikes: number; cold: boolean }

export function judgeAccusation(p: Puzzle, accused: string, place: Placement, strikesBefore: number): Verdict {
  const suspect = p.people.some(x => x.id === accused) && accused !== p.victimId
  if (!suspect) return { kind: 'invalid' }
  if (accused === p.murdererId) return samePlacement(p, place) ? { kind: 'proved' } : { kind: 'calledIt' }
  const strikes = Math.min(MAX_STRIKES, strikesBefore + 1)
  return { kind: 'notThem', strikes, cold: strikes >= MAX_STRIKES }
}
