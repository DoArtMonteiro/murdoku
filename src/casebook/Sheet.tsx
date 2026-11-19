import { useEffect, useRef } from 'react'
import type { Puzzle } from '../core/types'
import { firstName } from './cells'
import { wrongAccusationLine } from './rollcall'
import { MAX_STRIKES } from './verdict'
import type { Verdict } from './verdict'
import { Portrait } from './Portrait'

interface Props {
  puzzle: Puzzle
  verdict: Verdict | null
  /** The person named in the last accusation. */
  accused: string | null
  strikes: number
  onAccuse: (id: string) => void
  onBack: () => void
  onClose: () => void
  /** Open the alibi roll-call, once the accusations are spent and the case has gone cold. */
  onRoll: () => void
}

/**
 * The accusation sheet: name one suspect. A wrong name says only that they have an alibi. A right name never
 * shows here: it goes straight into the alibi roll-call (Casebook), where the verdict is the payoff.
 */
export function Sheet({ puzzle, verdict, accused, strikes, onAccuse, onBack, onClose, onRoll }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const victim = firstName(puzzle, puzzle.victimId)
  const suspects = puzzle.people.filter(p => p.id !== puzzle.victimId)

  // Focus moves into the sheet, Escape closes it, Tab stays inside it.
  useEffect(() => {
    const el = ref.current
    el?.querySelector<HTMLElement>('button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab' || !el) return
      const f = [...el.querySelectorAll<HTMLElement>('button:not([disabled])')]
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, verdict])

  const wrong = verdict?.kind === 'notThem' ? verdict : null
  return (
    <div className="cb-scrim" onClick={onClose}>
      <div ref={ref} className="cb-sheet" role="dialog" aria-modal="true" aria-labelledby="cb-sheet-title" onClick={e => e.stopPropagation()} data-verdict={wrong?.kind}>
        {!wrong && (
          <>
            <h2 id="cb-sheet-title" className="cb-sheet-title">Who was alone with {victim}?</h2>
            <p className="cb-sheet-sub">Name one suspect. {strikes > 0 ? `${strikes} of ${MAX_STRIKES} accusations used.` : `Three wrong accusations and the case goes cold.`}</p>
            <ul className="cb-suspects">
              {suspects.map(p => (
                <li key={p.id}>
                  <button type="button" className="cb-suspect" onClick={() => onAccuse(p.id)}>
                    <Portrait person={p} name={firstName(puzzle, p.id)} size={56} />
                    <span>{firstName(puzzle, p.id)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="cb-ghostbtn" onClick={onClose}>Not yet</button>
          </>
        )}
        {wrong && (
          <>
            <h2 id="cb-sheet-title" className="cb-verdict" data-kind="no">{wrongAccusationLine(firstName(puzzle, accused ?? ''))}</h2>
            <p className="cb-sheet-count" data-testid="accusations-used">
              <span className="cb-strikes" aria-hidden="true">{Array.from({ length: MAX_STRIKES }, (_, k) => <i key={k} data-on={k < wrong.strikes || undefined} />)}</span>
              {wrong.cold ? 'Three accusations used. The case has gone cold.' : `${wrong.strikes} of ${MAX_STRIKES} accusations used.`}
            </p>
            {wrong.cold
              ? <button type="button" className="cb-primary" onClick={onRoll}>Hear the alibis</button>
              : <button type="button" className="cb-primary" onClick={onBack}>Back to the plan</button>}
          </>
        )}
      </div>
    </div>
  )
}

