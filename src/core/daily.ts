import type { Difficulty, Puzzle } from './types'
import { isFiniteNumber, isPlainObject } from './storage'

// ============================================================================
// The daily case, the solve streak, and the badge set.
//
// All three are derived from data the game already keeps (the seeded catalog,
// `completedIds`, and `records`), so nothing here needs authoring per case and
// nothing goes stale when the catalog grows.
// ============================================================================

export const STREAK_KEY = 'murdoku_streak_v1'

/**
 * A local YYYY-MM-DD stamp. Deliberately local rather than UTC: the daily case
 * must turn over at the player's midnight, not at 01:00 for anyone east of GMT.
 */
export function todayStamp(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function hashStamp(stamp: string): number {
  let h = 2166136261
  for (let i = 0; i < stamp.length; i++) { h ^= stamp.charCodeAt(i); h = Math.imul(h, 16777619) }
  return Math.abs(h)
}

/** Whole days since 1970-01-01 for a YYYY-MM-DD stamp, or null for anything else. */
function dayNumber(stamp: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(stamp)
  if (!m) return null
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  if (Number.isNaN(t)) return null
  const back = new Date(t)
  // reject 2026-02-31 style stamps that Date.UTC silently rolls over
  if (back.getUTCFullYear() !== Number(m[1]) || back.getUTCMonth() !== Number(m[2]) - 1 || back.getUTCDate() !== Number(m[3])) return null
  return Math.floor(t / 86_400_000)
}

/**
 * The week's difficulty rhythm, by day of week (0 = Sunday): a gentle start on
 * Monday, building to Master on Saturday, and a mid-difficulty Sunday. The daily
 * used to be drawn only from the two-storey tiers, so a player who wanted a
 * quick Monday case never got one. Keyed by the player's LOCAL calendar date,
 * so it turns over at their midnight and is the same for everyone on that date.
 */
/** Natural id order ('easy-2' before 'easy-10'); one collator, because building one per call is slow. */
const ID_ORDER = new Intl.Collator('en', { numeric: true })

const WEEK: readonly Difficulty[] = ['Medium', 'Very Easy', 'Easy', 'Medium', 'Hard', 'Expert', 'Master']
const TIER_ORDER: readonly Difficulty[] = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Expert', 'Master']

/**
 * The case everyone gets today.
 *
 * 1. Same date, same case for everyone: the day is read from the stamp itself,
 *    never from the clock, time zone or the order the catalog arrived in.
 * 2. The tier follows WEEK. Within a tier the daily walks the cases in id order
 *    (natural order, so "easy-2" precedes "easy-10"), one step per occurrence of
 *    that tier, so every case in a tier is served before any repeats.
 * 3. The stamp is local, not UTC: `todayStamp` uses the player's clock.
 *
 * If the catalog holds no case of today's tier (a degraded catalog, or a test
 * fixture), the nearest populated tier is used so a daily always exists. An
 * empty catalog returns null.
 */
export function dailyPuzzle(puzzles: Puzzle[], stamp: string = todayStamp()): Puzzle | null {
  if (!puzzles.length) return null
  const ordered = [...puzzles].sort((a, b) => ID_ORDER.compare(a.id, b.id))
  const day = dayNumber(stamp)
  if (day === null) return ordered[hashStamp(stamp) % ordered.length]

  const weekday = (((day + 4) % 7) + 7) % 7 // 1970-01-01 was a Thursday (4)
  const tier = WEEK[weekday]
  const want = TIER_ORDER.indexOf(tier)
  let pool: Puzzle[] = []
  for (let reach = 0; reach < TIER_ORDER.length && !pool.length; reach++) {
    for (const idx of reach === 0 ? [want] : [want - reach, want + reach]) {
      const name = TIER_ORDER[idx]
      if (name) pool = pool.concat(ordered.filter(p => p.difficulty === name))
      if (pool.length) break
    }
  }
  if (!pool.length) pool = ordered
  // One step per time this weekday comes round; Medium appears twice a week
  // (Wednesday and Sunday), so those two days take alternate steps.
  const perWeek = WEEK.filter(t => t === tier).length
  const slot = WEEK.slice(0, weekday).filter(t => t === tier).length
  const step = Math.floor((day + 4) / 7) * perWeek + slot
  return pool[((step % pool.length) + pool.length) % pool.length]
}

export interface StreakState {
  /** Last date the daily case was solved, as YYYY-MM-DD. */
  lastSolved: string | null
  current: number
  best: number
}

const EMPTY_STREAK: StreakState = { lastSolved: null, current: 0, best: 0 }

function isStreakState(value: unknown): value is StreakState {
  if (!isPlainObject(value)) return false
  return (value.lastSolved === null || (typeof value.lastSolved === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.lastSolved)))
    && isFiniteNumber(value.current) && value.current >= 0
    && isFiniteNumber(value.best) && value.best >= 0
}

export function loadStreak(): StreakState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STREAK_KEY) ?? 'null')
    return isStreakState(parsed) ? parsed : EMPTY_STREAK
  } catch { return EMPTY_STREAK }
}

function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00`)
  const b = Date.parse(`${to}T00:00:00`)
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.NaN
  return Math.round((b - a) / 86_400_000)
}

/**
 * Fold today's daily solve into a streak.
 *
 * Pure, so it is testable without a clock or storage. Solving the same day
 * twice is a no-op rather than a double count, and a gap of two or more days
 * restarts at 1 rather than 0 — the player did just solve one.
 */
export function advanceStreak(previous: StreakState, stamp: string): StreakState {
  if (previous.lastSolved === stamp) return previous
  const gap = previous.lastSolved ? daysBetween(previous.lastSolved, stamp) : Number.NaN
  const current = gap === 1 ? previous.current + 1 : 1
  return { lastSolved: stamp, current, best: Math.max(previous.best, current) }
}

export function saveStreak(state: StreakState): void {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

/** A streak is only live if the last solve was today or yesterday. */
export function streakIsLive(state: StreakState, stamp: string = todayStamp()): boolean {
  if (!state.lastSolved) return false
  const gap = daysBetween(state.lastSolved, stamp)
  return gap === 0 || gap === 1
}

// --- badges -----------------------------------------------------------------

export interface Badge {
  id: string
  name: string
  description: string
  earned: boolean
}

export interface BadgeInput {
  puzzles: Puzzle[]
  completedIds: string[]
  records: Record<string, { bestSeconds: number; hints: number }>
  streak: StreakState
}

/**
 * Badges are computed, never stored. Each one is a question answered from
 * `completedIds` + `records`, so there is no separate badge state to corrupt,
 * migrate, or disagree with the player's actual solve history.
 */
export function computeBadges({ puzzles, completedIds, records, streak }: BadgeInput): Badge[] {
  const solved = new Set(completedIds)
  const solvedPuzzles = puzzles.filter(p => solved.has(p.id))
  const clearedTier = (difficulty: string) => solvedPuzzles.some(p => p.difficulty === difficulty)
  const bestTimes = Object.entries(records)
    .filter(([id]) => solved.has(id))
    .map(([, record]) => record.bestSeconds)
  const unaided = solvedPuzzles.some(p => records[p.id]?.hints === 0)

  const badge = (id: string, name: string, description: string, earned: boolean): Badge =>
    ({ id, name, description, earned })

  return [
    badge('first-case', 'Case Opened', 'Solve your first case.', solvedPuzzles.length >= 1),
    badge('ten-cases', 'Ten Closed', 'Solve ten cases.', solvedPuzzles.length >= 10),
    badge('expert', 'Expert Witness', 'Solve an Expert case.', clearedTier('Expert')),
    badge('master', 'Master Detective', 'Solve a Master case.', clearedTier('Master')),
    badge('unaided', 'No Assistance', 'Solve a case without spending a hint.', unaided),
    badge('quick', 'Open and Shut', 'Solve a case in under two minutes.', bestTimes.some(s => s < 120)),
    badge('streak', 'Regular Caller', 'Hold a seven-day daily streak.', streak.best >= 7),
    badge('complete', 'Full Ledger', 'Solve every case in the index.',
      puzzles.length > 0 && solvedPuzzles.length >= puzzles.length),
  ]
}
