// Four short beats, shown as one dismissible, non-modal line above the accounts, on a player's first case only.
// A beat is DERIVED from the real game state (nothing scripted): the game teaches by doing, and a player who
// ignores the line loses nothing. Beats only ever move forward.
import { ROW_COLUMN_RULE } from './state'
import type { GameState } from './state'

export const COACH_KEY = 'alibi_ofa_coach_v2'

export const BEATS = {
  1: 'Tap a statement: the plan shows where it can hold.',
  // the row and column rule, as fiction: said once, on the first refused tile
  2: ROW_COLUMN_RULE,
  3: "Pin the statements that can't all be true, then cite them.",
  4: "Two contradictions. A statement in both could be the lie \u2014 if it's the only one they share.",
} as const
export type Beat = keyof typeof BEATS

export function coachDone(): boolean {
  try { return localStorage.getItem(COACH_KEY) === '1' } catch { return false }
}
export function markCoachDone(): void {
  try { localStorage.setItem(COACH_KEY, '1') } catch { /* the line may come back next visit */ }
}

type Facts = Pick<GameState, 'placed' | 'pins' | 'ledger' | 'struck' | 'outcome' | 'refusalOpen' | 'touched'> & Partial<Pick<GameState, 'falseCitations' | 'doubtAttempts'>>

/**
 * Which beat fits the game right now, or null.
 * 4: two contradictions are on the ledger and no doubt has been tried yet.
 * 3: the player has pinned something and nothing is on the ledger yet (not in the hidden harness, which has no pins).
 * 2: the last move was a tap on a ruled-out tile.
 * 1: nothing has been touched yet. Once the player has pinned or cited, it is retired for good.
 */
export function beatFor(s: Facts, truthOnly: boolean): Beat | null {
  if (s.outcome || s.struck) return null
  if (!truthOnly && s.ledger.length >= 2 && !s.doubtAttempts) return 4
  if (!truthOnly && s.pins.length > 0 && s.ledger.length === 0) return 3
  if (s.refusalOpen) return 2
  if (!s.touched && s.pins.length === 0 && s.ledger.length === 0 && !s.falseCitations && Object.keys(s.placed).length === 0) return 1
  return null
}
