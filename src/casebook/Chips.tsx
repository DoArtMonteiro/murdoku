import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Puzzle } from '../core/types'
import { firstName } from './cells'
import type { Placement } from './cells'
import { statementReady, statementsOf } from './lens'

/** Whether the statements overflow their box (a short phone), and whether the end of them is in view. */
export interface ChipsFlow { more: boolean; end: boolean }

interface Props {
  puzzle: Puzzle
  person: string
  placement: Placement
  lit: readonly number[]
  onToggle: (index: number) => void
  /** Told when the box starts or stops scrolling, so the screen can say so. */
  onFlow?: (flow: ChipsFlow) => void
}

const HOLD_MS = 450
const TIP_MS = 2200

/**
 * The selected suspect's statements. Each chip is a lens toggle. Every statement is always on the screen
 * or one vertical swipe away: the chips wrap, and where a short phone cannot spare the height the box
 * scrolls up and down (never sideways) and the screen says how many there are. A statement about someone
 * not yet placed carries that person's initial and a dashed outline; holding it (or tapping it) says why.
 */
export function Chips({ puzzle, person, placement, lit, onToggle, onFlow }: Props) {
  const sts = statementsOf(puzzle, person)
  const box = useRef<HTMLUListElement>(null)
  const [flow, setFlow] = useState<ChipsFlow>({ more: false, end: true })
  const [top, setTop] = useState(false)
  const [tip, setTip] = useState<{ text: string; x: number; y: number; below: boolean } | null>(null)
  const hold = useRef<number | undefined>(undefined)
  const gone = useRef<number | undefined>(undefined)
  const held = useRef(false)

  const measure = useCallback(() => {
    const el = box.current
    if (!el) return
    const next = { more: el.scrollHeight > el.clientHeight + 2, end: el.scrollTop + el.clientHeight >= el.scrollHeight - 2 }
    setFlow(f => (f.more === next.more && f.end === next.end ? f : next))
    setTop(el.scrollTop > 2)
  }, [])
  // A new suspect starts at the top; the box is measured whenever its content or its room changes.
  useLayoutEffect(() => { if (box.current) box.current.scrollTop = 0; measure() }, [person, measure])
  useLayoutEffect(measure)
  useEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])
  useEffect(() => { onFlow?.(flow) }, [flow, onFlow])
  useEffect(() => () => { window.clearTimeout(hold.current); window.clearTimeout(gone.current) }, [])

  const say = (el: HTMLElement, text: string) => {
    const r = el.getBoundingClientRect()
    const x = Math.min(Math.max(r.left + r.width / 2, 96), window.innerWidth - 96)
    const below = r.top < 48
    setTip({ text, x, y: below ? r.bottom + 6 : r.top - 6, below })
    window.clearTimeout(gone.current)
    gone.current = window.setTimeout(() => setTip(null), TIP_MS)
  }

  return (
    <>
      <ul className="cb-chips" ref={box} onScroll={measure} data-more={flow.more || undefined} data-end={(flow.more && flow.end) || undefined} data-top={(flow.more && top) || undefined} aria-label={`${firstName(puzzle, person)}'s statements`}>
        {sts.map(st => {
          const ready = statementReady(st, placement)
          const on = lit.includes(st.index) && ready
          const wait = !ready && st.needs ? `Place ${firstName(puzzle, st.needs)} first` : null
          return (
            <li key={st.index}>
              <button
                type="button"
                className="cb-chip"
                data-on={on || undefined}
                data-wait={!ready || undefined}
                aria-pressed={on}
                aria-disabled={!ready || undefined}
                aria-label={wait ? `${st.text}. ${wait}.` : undefined}
                title={wait ?? undefined}
                onPointerDown={e => {
                  if (!wait) return
                  const el = e.currentTarget
                  window.clearTimeout(hold.current)
                  hold.current = window.setTimeout(() => { held.current = true; say(el, wait) }, HOLD_MS)
                }}
                onPointerUp={() => window.clearTimeout(hold.current)}
                onPointerCancel={() => window.clearTimeout(hold.current)}
                onPointerLeave={() => window.clearTimeout(hold.current)}
                onContextMenu={e => { if (wait) e.preventDefault() }}
                onClick={e => {
                  if (held.current) { held.current = false; return }
                  if (wait) say(e.currentTarget, wait)
                  onToggle(st.index)
                }}
              >
                <span className="cb-chip-text">{st.text}</span>
                {st.needs && !ready && <span className="cb-chip-dep" aria-hidden="true">{firstName(puzzle, st.needs).charAt(0)}</span>}
              </button>
            </li>
          )
        })}
        {sts.length === 0 && <li className="cb-none">No statements of their own.</li>}
      </ul>
      {tip && <span className="cb-tip" role="presentation" aria-hidden="true" style={{ left: tip.x, top: tip.y }} data-below={tip.below || undefined}>{tip.text}</span>}
    </>
  )
}
