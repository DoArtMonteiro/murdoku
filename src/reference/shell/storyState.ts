import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Puzzle } from '../../core/types'
import type { CaseStory, EvidenceStory } from '../story/schema'
import { buildReconstruction } from '../story/reconstruct'
import type { ReconFrame, Reconstruction } from '../story/reconstruct'

// State hooks for the story layer (kept out of the component files so fast refresh stays clean).

// ---- found items (per case, per viewer; storage may be unavailable) --------
const foundKey = (caseId: string) => `alibi.ref.found.${caseId}`

function readFound(caseId: string): string[] {
  try {
    const raw = localStorage.getItem(foundKey(caseId))
    const v = raw ? JSON.parse(raw) : []
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  } catch { return [] }
}

export function useFound(caseId: string): { found: ReadonlySet<string>; markFound: (id: string) => void } {
  const [found, setFound] = useState<ReadonlySet<string>>(() => new Set(readFound(caseId)))
  const markFound = useCallback((id: string) => {
    setFound(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev).add(id)
      try { localStorage.setItem(foundKey(caseId), JSON.stringify([...next])) } catch { /* private mode */ }
      return next
    })
  }, [caseId])
  return { found, markFound }
}

/** Items that exist on the plan right now: all of them once the case is over, only `showDuringPlay` ones before. */
export function visibleEvidence(story: CaseStory, over: boolean): EvidenceStory[] {
  return story.evidence.filter(e => over || e.showDuringPlay)
}

/** Marker disc diameter in px: 0.25 u, kept between 18 and 26 px (the validator guarantees only the 0.08 u core). */
export const markerDiameter = (u: number) => Math.round(Math.min(26, Math.max(18, 0.25 * u)))

/** Does the placement lie outside the grid (porch / lot)? Only those markers exist on the plan during play. */
export const outsideGrid = (e: EvidenceStory, n: number) => e.placement.x < 0 || e.placement.x > n || e.placement.y < 0 || e.placement.y > n

/**
 * Tap-target diameter in px for a marker at board point (x, y) in cells.
 * Play: the marker lives in the lot, and its square target must not overlap ANY cell rectangle (it stops
 * 1 px short of the grid edge), up to 44 px.
 * Reconstruction (cells are locked): up to 44 px on phones, 28 px with a mouse, always inside the distance to
 * the nearest cell centre.
 */
export function markerHit(u: number, x: number, y: number, n: number, play: boolean): number {
  if (play) {
    const gap = Math.max(x - n, -x, y - n, -y) * u // distance from the marker centre to the grid rectangle (outside = positive)
    return Math.round(Math.max(16, Math.min(44, 2 * gap - 1)))
  }
  const frac = (v: number) => Math.abs(v - Math.min(n - 0.5, Math.max(0.5, Math.round(v - 0.5) + 0.5)))
  const nearest = Math.hypot(frac(x), frac(y)) * u
  const want = u < 56 ? 44 : 28
  return Math.round(Math.max(20, Math.min(want, 2 * nearest - 4)))
}


// ---- reduced motion ------------------------------------------------------------
export function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(query).matches)
  useEffect(() => {
    const m = window.matchMedia?.(query)
    if (!m) return
    const on = () => setReduced(m.matches)
    on()
    m.addEventListener?.('change', on)
    return () => m.removeEventListener?.('change', on)
  }, [])
  return reduced
}

// ---- controller ------------------------------------------------------------------
export interface ReconController {
  rec: Reconstruction
  idx: number
  frame: ReconFrame
  playing: boolean
  reduced: boolean
  go: (i: number) => void
  next: () => void
  prev: () => void
  toggle: () => void
  replay: () => void
}

const HOLD_MS = { narrative: 6000, deduce: 3400 }

export function useReconstruction(puzzle: Puzzle, story: CaseStory | null, enabled: boolean): ReconController | null {
  const reduced = useReducedMotion()
  const rec = useMemo(() => (story && enabled ? buildReconstruction(puzzle, story) : null), [puzzle, story, enabled])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const last = (rec?.frames.length ?? 1) - 1

  // Start playing when the reconstruction first appears, unless the viewer asked for less motion.
  const started = rec !== null
  useEffect(() => { setIdx(0); setPlaying(started && !reduced) }, [started]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (reduced) setPlaying(false) }, [reduced])

  useEffect(() => {
    if (!rec || !playing) return
    if (idx >= last) { setPlaying(false); return }
    const f = rec.frames[idx]
    const t = setTimeout(() => setIdx(i => Math.min(last, i + 1)), f.kind === 'deduce' ? HOLD_MS.deduce : HOLD_MS.narrative)
    return () => clearTimeout(t)
  }, [rec, playing, idx, last])

  const go = useCallback((i: number) => { setPlaying(false); setIdx(Math.max(0, Math.min(last, i))) }, [last])
  const next = useCallback(() => go(idx + 1), [go, idx])
  const prev = useCallback(() => go(idx - 1), [go, idx])
  const toggle = useCallback(() => {
    if (reduced) return
    if (idx >= last) { setIdx(0); setPlaying(true) } else setPlaying(p => !p)
  }, [idx, last, reduced])
  const replay = useCallback(() => { setIdx(0); setPlaying(!reduced) }, [reduced])

  if (!rec) return null
  return { rec, idx, frame: rec.frames[Math.min(idx, last)], playing, reduced, go, next, prev, toggle, replay }
}


/** Filmstrip captions: the four steps plus the closing card. */
export const SLOT_NAMES = ['Motive', 'Movements', 'Crucial clue', 'Conclusion', 'Dossier'] as const
