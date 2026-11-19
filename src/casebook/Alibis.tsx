import type { Puzzle } from '../core/types'
import { firstName } from './cells'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Portrait } from './Portrait'
import type { RollCall as Roll } from './rollcall'

interface Props {
  puzzle: Puzzle
  roll: Roll
  /** 0 = the scene, 1..n = suspects cleared one at a time, n + 1 = the one left, n + 2 = the ending. */
  step: number
  /** Reduced motion: every line at once, as a list. */
  list: boolean
  /** "Proved", "Proved with help", "Called it", or null for a case gone cold. */
  tierLabel: string | null
  motive: string | null
  closing: string
  onAdvance: () => void
  onSkip: () => void
  /** Opens the reconstruction. Without it (Case 0 has none) the ending offers no way to it. */
  onProof?: () => void
  onClose: () => void
}

/** Where the walk-through stands for each portrait: waiting, being read out, cleared, or the last one left. */
function stateOf(step: number, index: number, count: number): 'waiting' | 'now' | 'cleared' | 'last' {
  if (index === count) return step >= count + 1 ? 'last' : 'waiting'
  if (step - 1 === index) return 'now'
  return step - 1 > index ? 'cleared' : 'waiting'
}

/** The alibi roll-call. Tap anywhere on it to move on; Skip jumps to the ending. */
export function Alibis({ puzzle, roll, step, list, tierLabel, motive, closing, onAdvance, onSkip, onProof, onClose }: Props) {
  const count = roll.cleared.length
  const end = count + 2
  const done = step >= end
  // The order they are read out in; the faces are shown in the cast's own order, so the last face is not the one left.
  const order = [...roll.cleared.map(c => c.person), roll.last.person]
  const faces = puzzle.people.map(x => x.id).filter(id => order.includes(id))
  const lines = [roll.victim.line, ...roll.cleared.map(c => c.line), roll.last.line]
  const current = lines[Math.min(step, count + 1)]
  const name = firstName(puzzle, roll.last.person)

  // The ending can be taller than the panel on a short phone: it scrolls above its buttons, and says so.
  const body = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)
  const measure = useCallback(() => {
    const el = body.current
    if (el) setMore(el.scrollHeight - el.clientHeight - el.scrollTop > 3)
  }, [])
  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure, done, list, step, closing])

  return (
    <section className="cb-roll" aria-label="The alibis" data-done={done || undefined} data-list={list || undefined} data-testid="rollcall" onClick={() => { if (!done && !list) onAdvance() }}>
      <ul className="cb-roll-faces" aria-hidden="true">
        {faces.map(id => {
          const state = stateOf(step, order.indexOf(id), count)
          const person = puzzle.people.find(x => x.id === id)!
          return (
            <li key={id} data-state={state} data-testid={`roll-${id}`}>
              <span className="cb-roll-face">
                <Portrait person={person} name={firstName(puzzle, id)} size={38} />
                {state === 'last' && (
                  <svg className="cb-circle" viewBox="0 0 100 100" focusable="false"><path pathLength={1} d="M26 12 C54 0 94 14 95 52 C96 90 52 99 24 90 C3 81 1 38 30 17 C46 6 66 6 78 14" /></svg>
                )}
              </span>
              <span className="cb-roll-name">{firstName(puzzle, id)}</span>
              <span className="cb-roll-state">{state === 'cleared' ? 'cleared' : state === 'last' ? 'no alibi' : ' '}</span>
            </li>
          )
        })}
      </ul>
      <div className="cb-roll-body" ref={body} tabIndex={done || list ? 0 : undefined} role={done || list ? 'region' : undefined} aria-label={done || list ? 'The ending' : undefined} data-more={more || undefined} onScroll={measure}>
        {list ? (
          <ol className="cb-roll-list" aria-label="Alibis">
            {lines.map((l, i) => <li key={i} data-last={i === lines.length - 1 || undefined}>{l}</li>)}
          </ol>
        ) : (
          <p className="cb-roll-line" aria-live="polite" data-last={step > count || undefined}>{current}</p>
        )}
        {done && (
          <div className="cb-roll-end">
            {tierLabel && <p className="cb-roll-tier">{tierLabel}.</p>}
            <p className="cb-roll-motive">
              <b>{name}</b>{motive ? `: ${motive.charAt(0).toLowerCase()}${motive.slice(1)}` : ''}
            </p>
            <p className="cb-roll-closing">{closing}</p>
          </div>
        )}
      </div>
      {done ? (
        <div className="cb-roll-bar" data-end>
          {onProof && <button type="button" className="cb-linkbtn" onClick={e => { e.stopPropagation(); onProof() }}>Show the proof</button>}
          <button type="button" className="cb-primary" onClick={e => { e.stopPropagation(); onClose() }}>Close the case</button>
        </div>
      ) : (
        <div className="cb-roll-bar">
          <button type="button" className="cb-ghostbtn" onClick={e => { e.stopPropagation(); onSkip() }}>Skip</button>
        </div>
      )}
    </section>
  )
}
