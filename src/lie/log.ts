// The playtest log: a local record of how each run of each case went, so a human playtest can be read afterwards.
// Local only (localStorage `alibi_ofa_log_v1`), capped, never sent anywhere. Everything is wrapped in try/catch.
// Times are absolute milliseconds in storage and shown relative to the start of the run.
import type { LogEvent } from './state'

export const LOG_KEY = 'alibi_ofa_log_v1'
const MAX_RUNS = 5
const MAX_EVENTS = 300

export interface Stamped { t: number; k: LogEvent['k'] | 'start'; d?: string }
export interface Run { startedAt: number; events: Stamped[] }
export interface CaseLog { title: string; runs: Run[] }
export type Log = Record<string, CaseLog>

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x)

export function loadLog(): Log {
  try {
    const raw = JSON.parse(localStorage.getItem(LOG_KEY) ?? '{}')
    if (!isObj(raw)) return {}
    const out: Log = {}
    for (const [id, v] of Object.entries(raw)) {
      if (!isObj(v) || !Array.isArray(v.runs)) continue
      const runs: Run[] = []
      for (const r of v.runs) {
        if (!isObj(r) || typeof r.startedAt !== 'number' || !Array.isArray(r.events)) continue
        const events = (r.events as unknown[]).filter((e): e is Stamped => isObj(e) && typeof e.t === 'number' && typeof e.k === 'string')
        runs.push({ startedAt: r.startedAt, events: events.slice(-MAX_EVENTS) })
      }
      out[id] = { title: typeof v.title === 'string' ? v.title : id, runs: runs.slice(-MAX_RUNS) }
    }
    return out
  } catch { return {} }
}

function save(log: Log): void {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(log)) } catch { /* the log lasts this visit only */ }
}

/** Open a run: a new one when the player starts fresh, or the latest when they pick a case up where they left it. */
export function beginRun(caseId: string, title: string, fresh: boolean, now = Date.now()): void {
  const log = loadLog()
  const entry = log[caseId] ?? { title, runs: [] }
  entry.title = title
  if (fresh || !entry.runs.length) entry.runs = [...entry.runs, { startedAt: now, events: [{ t: now, k: 'start' as const }] }].slice(-MAX_RUNS)
  else entry.runs[entry.runs.length - 1].events.push({ t: now, k: 'start', d: 'resumed' })
  log[caseId] = entry
  save(log)
}

/** Append events to the latest run of a case. */
export function logEvents(caseId: string, events: readonly LogEvent[], now = Date.now()): void {
  if (!events.length) return
  const log = loadLog()
  const run = log[caseId]?.runs[log[caseId].runs.length - 1]
  if (!run) return
  // only the first move after the proof matters, so later ones are not kept
  let moved = run.events.some(x => x.k === 'move2')
  const fresh = events.filter(e => {
    if (e.k !== 'move2') return true
    if (moved) return false
    moved = true
    return true
  })
  if (!fresh.length) return
  run.events = [...run.events, ...fresh.map(e => ({ t: now, k: e.k, d: e.d }))].slice(-MAX_EVENTS)
  save(log)
}

export function clearLog(): void {
  try { localStorage.removeItem(LOG_KEY) } catch { /* nothing to clear */ }
}

const mmss = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

const LADDER = ['', 'hint line', 'a suspect pulsed', 'a statement was pinned']

/** One run as plain text. */
export function summarizeRun(run: Run): string[] {
  const at = (k: Stamped['k'], pick?: (e: Stamped) => boolean) => run.events.find(e => e.k === k && (!pick || pick(e)))
  const rel = (e: Stamped | undefined) => (e ? `+${mmss(e.t - run.startedAt)}` : 'not yet')
  const lines: string[] = []
  const stamp = new Date(run.startedAt)
  lines.push(`  started ${Number.isNaN(stamp.getTime()) ? '?' : stamp.toISOString().replace('T', ' ').slice(0, 16)}`)
  lines.push(`  first pin ${rel(at('pin'))} · first citation ${rel(at('cite'))} · first recorded contradiction ${rel(at('record'))}`)
  const cites = run.events.filter(e => e.k === 'cite')
  if (cites.length) lines.push(`  citations: ${cites.map(e => `${rel(e)} ${e.d}`).join('; ')}`)
  const doubts = run.events.filter(e => e.k === 'doubt')
  if (doubts.length) lines.push(`  doubts: ${doubts.map(e => `${rel(e)} ${e.d}`).join('; ')}`)
  lines.push(`  proof ${rel(at('proof'))} · act 2 first move ${rel(at('move2'))} · complete ${rel(at('complete'))}`)
  const falseSteps = cites.filter(e => e.d === 'redundant' || e.d === 'satisfiable').length + doubts.filter(e => e.d !== 'proved').length
  const level = Math.max(0, ...run.events.filter(e => e.k === 'ladder').map(e => Number(e.d) || 0))
  lines.push(`  false steps: ${falseSteps} · help reached: ${level ? `${level} (${LADDER[level]})` : 'none'}`)
  return lines
}

/** The whole log as text a tester can paste into a message. */
export function summarizeLog(log: Log = loadLog()): string {
  const out = ['One False Alibi — playtest notes (local, nothing was sent anywhere)']
  const ids = Object.keys(log)
  if (!ids.length) out.push('', 'No runs recorded yet.')
  for (const id of ids) {
    const { title, runs } = log[id]
    runs.forEach((run, i) => {
      out.push('', `${id} "${title}" — run ${i + 1} of ${runs.length}`)
      out.push(...summarizeRun(run))
    })
  }
  return out.join('\n')
}

/** Copy text to the clipboard. Resolves false when the browser will not let us. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch { /* fall through to the selection trick */ }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.className = 'ofa-sr'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(area)
    return ok
  } catch { return false }
}
