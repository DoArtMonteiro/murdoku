// Sound for One False Alibi: a handful of cues synthesised with WebAudio. No files, no network.
// OFF by default; the player turns it on from the menu, and the choice is kept under this mode's own key
// (never an `alibi_casebook_*` or `murdoku_*` key). The context is only created from a tap.
//
// On iOS, WebAudio follows the ringer switch; where Safari's `navigator.audioSession` exists we ask for
// "ambient", which respects the switch and never interrupts the player's own music.

export type Cue = 'place' | 'lift' | 'lens' | 'collision' | 'crack' | 'stand' | 'bell'

export const SOUND_KEY = 'alibi_ofa_sound_v1'

export function loadSoundPref(): boolean {
  try { return localStorage.getItem(SOUND_KEY) === '1' } catch { return false }
}
export function saveSoundPref(on: boolean): void {
  try { localStorage.setItem(SOUND_KEY, on ? '1' : '0') } catch { /* the choice lasts this visit only */ }
}

interface Note { f: number; to?: number; at: number; dur: number; gain: number; type?: OscillatorType }
interface Burst { at: number; dur: number; gain: number; lowpass: number }
interface Recipe { notes: Note[]; noise?: Burst }

/** The harbour bell: a struck bell is inharmonic, so its partials are not whole multiples. */
const BELL: Note[] = [1, 2, 2.4, 3.02, 4.17].map((m, i) => ({
  f: 196 * m, at: 0, dur: 2.6 - i * 0.32, gain: [0.1, 0.05, 0.045, 0.03, 0.018][i], type: 'sine' as OscillatorType,
}))

const RECIPES: Record<Cue, Recipe> = {
  // a ceramic tick: a bright click over a short, dry body
  place: { notes: [{ f: 1500, to: 900, at: 0, dur: 0.035, gain: 0.05, type: 'triangle' }, { f: 620, to: 420, at: 0.004, dur: 0.07, gain: 0.05, type: 'sine' }] },
  lift: { notes: [{ f: 520, to: 760, at: 0, dur: 0.06, gain: 0.035, type: 'triangle' }] },
  // a soft ochre chime
  lens: { notes: [{ f: 659, at: 0, dur: 0.22, gain: 0.04, type: 'sine' }, { f: 988, at: 0.07, dur: 0.3, gain: 0.03, type: 'sine' }] },
  // a soft crack, as of dry paint starting to give way: a contradiction is recorded
  collision: { notes: [{ f: 140, to: 70, at: 0, dur: 0.22, gain: 0.04, type: 'triangle' }], noise: { at: 0, dur: 0.07, gain: 0.035, lowpass: 1600 } },
  crack: { notes: [{ f: 150, to: 45, at: 0, dur: 0.4, gain: 0.1, type: 'sawtooth' }], noise: { at: 0, dur: 0.14, gain: 0.1, lowpass: 2600 } },
  stand: { notes: [{ f: 262, to: 233, at: 0, dur: 0.3, gain: 0.05, type: 'sine' }] },
  bell: { notes: BELL },
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
    const r = RECIPES[cue]
    for (const n of r.notes) {
      const osc = c.createOscillator(), g = c.createGain()
      osc.type = n.type ?? 'sine'
      osc.frequency.setValueAtTime(n.f, t0 + n.at)
      if (n.to) osc.frequency.exponentialRampToValueAtTime(n.to, t0 + n.at + n.dur)
      g.gain.setValueAtTime(0.0001, t0 + n.at)
      g.gain.exponentialRampToValueAtTime(n.gain, t0 + n.at + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.dur)
      osc.connect(g).connect(c.destination)
      osc.start(t0 + n.at)
      osc.stop(t0 + n.at + n.dur + 0.03)
    }
    if (r.noise) {
      const b = r.noise
      const len = Math.max(1, Math.floor(c.sampleRate * b.dur))
      const buf = c.createBuffer(1, len, c.sampleRate)
      const data = buf.getChannelData(0)
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
      const src = c.createBufferSource(), lp = c.createBiquadFilter(), g = c.createGain()
      src.buffer = buf
      lp.type = 'lowpass'; lp.frequency.value = b.lowpass
      g.gain.value = b.gain
      src.connect(lp).connect(g).connect(c.destination)
      src.start(t0 + b.at)
    }
  } catch { /* a failed cue is never worth an error */ }
}
