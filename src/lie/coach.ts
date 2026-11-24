// Three short beats, shown as one dismissible line above the accounts, on a player's first case only.
// The beat is DERIVED from the real game state (nothing scripted), so a player who ignores it loses nothing.
import type { GameState } from './state'

export const COACH_KEY = 'alibi_ofa_coach_v1'

export const BEATS = {
  1: 'Tap a suspect, then a statement: the plan shows where it can be true.',
  2: 'One person per row and column.',
  3: 'Two accounts collide. One of them holds the lie: find a second collision.',
} as const
export type Beat = keyof typeof BEATS

export function coachDone(): boolean {
  try { return localStorage.getItem(COACH_KEY) === '1' } catch { return false }
}
export function markCoachDone(): void {
  try { localStorage.setItem(COACH_KEY, '1') } catch { /* the line may come back next visit */ }
}

/**
 * Which beat fits the game right now, or null. Beat 3 only ever shows in the lie-hunting direction,
 * and only until a second collision has been found or the lie has been struck.
 */
export function beatFor(s: Pick<GameState, 'placed' | 'journal' | 'struck' | 'outcome'>, truthOnly: boolean): Beat | null {
  if (s.outcome || s.struck) return null
  const placed = Object.keys(s.placed).length
  if (!truthOnly && s.struck === null && s.journal.length === 1) return 3
  if (s.journal.length > 0) return null
  if (placed === 0) return 1
  if (placed <= 2) return 2
  return null
}
