import type { Puzzle } from '../../core/types'
import { savedModeFor } from '../../core/saves'
import type { PlacedAt } from './types'

export function placedLabel(at: PlacedAt | undefined): string {
  return at ? `On the plan at R${at.row + 1} · C${at.col + 1}` : 'Not placed yet'
}

/** Current URL with the ?ref switch removed (link back to the real app). */
export function backHref(): string {
  const u = new URL(window.location.href)
  u.searchParams.delete('ref')
  return u.pathname + (u.search || '') + u.hash
}

const MODE_KEY = 'murdoku_mode'

export function readStoredMode(): string | null {
  try { return localStorage.getItem(MODE_KEY) } catch { return null }
}
export function restoreStoredMode(mode: string | null): void {
  try {
    if (mode === null) localStorage.removeItem(MODE_KEY)
    else localStorage.setItem(MODE_KEY, mode)
  } catch { /* storage unavailable */ }
}

/** Mode of the main UI's most recent autosaved attempt on this case, if there is one. */
export function peekSavedMode(puzzle: Puzzle): string | null {
  return savedModeFor(puzzle)
}
