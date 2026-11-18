// A lazily loaded part of the game can fail to load because the game was updated
// while the page was open: the old file is gone and the server has nothing under
// that name. That is not a problem with the player's saved data and must never be
// presented as one. The fix is to load the current version, once; if that does not
// help (offline, or the server is down) the player gets a plain reload message.
const MESSAGES = [
  /Failed to fetch dynamically imported module/i, // Chromium
  /error loading dynamically imported module/i, // Firefox
  /Importing a module script failed/i, // Safari
  /Unable to preload CSS/i, // Vite
  /Loading (?:CSS )?chunk \S+ failed/i, // webpack-style
]

export function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const { name, message } = error as { name?: unknown; message?: unknown }
  if (name === 'ChunkLoadError') return true
  return typeof message === 'string' && MESSAGES.some(pattern => pattern.test(message))
}

const KEY = 'alibi_chunk_reload_at'
/** Within this window a second failure is shown, not answered with another reload. */
export const RELOAD_GUARD_MS = 30_000

/**
 * Reload the page once for a chunk failure. Returns true if it did. Returns false
 * when it already reloaded within the guard window, or when the guard cannot be
 * stored (then a reload could loop, so it does not reload at all).
 */
export function reloadOnceForChunkError(
  reload: () => void = () => window.location.reload(),
  now: number = Date.now(),
): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY))
    if (last && now - last < RELOAD_GUARD_MS) return false
    sessionStorage.setItem(KEY, String(now))
  } catch {
    return false
  }
  reload()
  return true
}
