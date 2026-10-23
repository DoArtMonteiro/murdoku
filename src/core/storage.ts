// ============================================================================
// Defensive localStorage access.
//
// Every value read back from storage is UNTRUSTED: a previous version of the
// app, a browser extension, devtools or a half-finished write can leave "null",
// "[", a number where an object belongs, or an object whose fields have the
// wrong types. The readers below never throw and never hand back a value of the
// wrong shape; they fall back to the stated default instead. Writers swallow
// quota and privacy-mode errors, because losing a save must never take the
// game down.
// ============================================================================

export const SOLVED_KEY = 'murdoku_solved_v2'
export const RECORDS_KEY = 'murdoku_records'
export const MODE_KEY = 'murdoku_mode'
export const TIMER_KEY = 'murdoku_hide_timer'
export const UPPER_FLOOR_KEY = 'murdoku_floor_marks_v1'
export const CASE_STATE_KEY = 'murdoku_case_state_v1'
export const FINGERPRINT_KEY = 'murdoku_fingerprints_v1'
export const CATALOG_KEY_PREFIX = 'murdoku_catalog_v'

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Parsed JSON stored under `key`, or null when absent, unreadable or not JSON. */
export function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    return JSON.parse(raw)
  } catch { return null }
}

/** A plain object stored under `key`; {} for anything else (including the JSON text "null"). */
export function readObject(key: string): Record<string, unknown> {
  const value = readJson(key)
  return isPlainObject(value) ? value : {}
}

export function readStringArray(key: string): string[] {
  const value = readJson(key)
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : []
}

export function writeJson(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

export function removeKey(key: string): void {
  try { localStorage.removeItem(key) } catch { /* ignore */ }
}

/** Every key currently in storage that starts with `prefix` (empty when storage is unavailable). */
export function keysWithPrefix(prefix: string): string[] {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key !== null && key.startsWith(prefix)) keys.push(key)
    }
    return keys
  } catch { return [] }
}
