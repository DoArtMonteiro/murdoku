// A quiet sound identity: four tiny cues synthesised with WebAudio. No audio
// files, no network. Off by default; the player turns it on, and the choice is
// kept under the slice's own key. The context is only ever created from a tap
// (the toggle), so no browser autoplay policy is fought.
//
// Silent mode: on iOS, WebAudio output follows the ringer switch, and where
// Safari's `navigator.audioSession` exists we ask for the "ambient" type, which
// respects the switch and never interrupts the player's own music.
import type { GameState } from './game'
import { SAVE_PREFIX } from './save'

export type Cue = 'place' | 'lift' | 'lens' | 'proved' | 'called' | 'strike'

export const SOUND_KEY = `${SAVE_PREFIX}_sound`

export function loadSoundPref(): boolean {
  try { return localStorage.getItem(SOUND_KEY) === '1' } catch { return false }
}
export function saveSoundPref(on: boolean): void {
  try { localStorage.setItem(SOUND_KEY, on ? '1' : '0') } catch { /* private mode: the choice just lasts this visit */ }
}

/** Which cue a state change deserves, or null. Pure, so it is tested without audio. */
export function cueFor(prev: GameState, next: GameState): Cue | null {
  if (next.outcome !== prev.outcome) {
    if (next.outcome === 'proved') return 'proved'
    if (next.outcome === 'called') return 'called'
    if (next.outcome === 'cold') return 'strike'
  }
  if (next.strikes > prev.strikes) return 'strike'
  const a = Object.keys(prev.placement).length, b = Object.keys(next.placement).length
  const moved = a === b && Object.keys(next.placement).some(k => prev.placement[k] !== next.placement[k])
  if (b > a || moved) return 'place'
  if (b < a) return 'lift'
  const litCount = (s: GameState) => Object.values(s.lit).reduce((n, l) => n + l.length, 0)
  if (litCount(next) > litCount(prev)) return 'lens'
  return null
}

interface Note { f: number; to?: number; at: number; dur: number; gain: number; type?: OscillatorType }

const CUES: Record<Cue, Note[]> = {
  place: [{ f: 520, to: 330, at: 0, dur: 0.11, gain: 0.07, type: 'triangle' }],
  lift: [{ f: 330, to: 470, at: 0, dur: 0.09, gain: 0.05, type: 'triangle' }],
  lens: [{ f: 660, at: 0, dur: 0.1, gain: 0.04, type: 'sine' }, { f: 990, at: 0.06, dur: 0.14, gain: 0.035, type: 'sine' }],
  proved: [
    { f: 392, at: 0, dur: 0.18, gain: 0.07, type: 'triangle' }, { f: 523, at: 0.12, dur: 0.18, gain: 0.07, type: 'triangle' },
    { f: 659, at: 0.24, dur: 0.34, gain: 0.07, type: 'triangle' },
  ],
  called: [{ f: 392, at: 0, dur: 0.16, gain: 0.06, type: 'triangle' }, { f: 494, at: 0.12, dur: 0.26, gain: 0.06, type: 'triangle' }],
  strike: [{ f: 150, to: 90, at: 0, dur: 0.22, gain: 0.09, type: 'sine' }],
}

type AudioWindow = { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
let ctx: AudioContext | null = null

/** Create (or resume) the context. Call from a user gesture. Returns false when audio is unavailable. */
export function primeAudio(): boolean {
  try {
    const w = window as unknown as AudioWindow
    const Ctor = w.AudioContext ?? w.webkitAudioContext
    if (!Ctor) return false
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'ambient'
    const c = (ctx ??= new Ctor())
    if (c.state === 'suspended') void c.resume()
    return true
  } catch { return false }
}

export function playCue(cue: Cue): void {
  const c = ctx
  if (!c || c.state === 'closed') return
  try {
    const t0 = c.currentTime + 0.01
    for (const n of CUES[cue]) {
      const osc = c.createOscillator(), g = c.createGain()
      osc.type = n.type ?? 'sine'
      osc.frequency.setValueAtTime(n.f, t0 + n.at)
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t0 + n.at + n.dur)
      g.gain.setValueAtTime(0.0001, t0 + n.at)
      g.gain.exponentialRampToValueAtTime(n.gain, t0 + n.at + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.dur)
      osc.connect(g).connect(c.destination)
      osc.start(t0 + n.at)
      osc.stop(t0 + n.at + n.dur + 0.03)
    }
  } catch { /* a failed cue is never worth an error */ }
}
