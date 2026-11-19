import { useEffect, useRef } from 'react'
import type { Puzzle } from '../core/types'
import { firstName } from './cells'
import { MAX_STRIKES } from './verdict'
import type { Verdict } from './verdict'
import { Portrait } from './Portrait'

interface Props {
  puzzle: Puzzle
  verdict: Verdict | null
  /** The person named in the last accusation. */
  accused: string | null
  strikes: number
  hintsUsed: number
  /** Murderer's motive line, only handed over once the case is solved. */
  motive: string | null
  onAccuse: (id: string) => void
  onBack: () => void
  onClose: () => void
  onFinish: () => void
  onReplay: () => void
}

/** The accusation sheet: name one suspect. A wrong name says only that it was not them. */
export function Sheet({ puzzle, verdict, accused, strikes, hintsUsed, motive, onAccuse, onBack, onClose, onFinish, onReplay }: Props) {
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

  const named = verdict && 'kind' in verdict && verdict.kind !== 'invalid'
  return (
    <div className="cb-scrim" onClick={onClose}>
      <div ref={ref} className="cb-sheet" role="dialog" aria-modal="true" aria-labelledby="cb-sheet-title" onClick={e => e.stopPropagation()} data-verdict={named ? verdict.kind : undefined}>
        {!named && (
          <>
            <h2 id="cb-sheet-title" className="cb-sheet-title">Who was alone with {victim}?</h2>
            <p className="cb-sheet-sub">Name one suspect. {strikes > 0 ? `${strikes} of ${MAX_STRIKES} strikes used.` : `${MAX_STRIKES} wrong names and the case goes cold.`}</p>
            <ul className="cb-suspects">
              {suspects.map(p => (
                <li key={p.id}>
                  <button type="button" className="cb-suspect" onClick={() => onAccuse(p.id)}>
                    <Portrait person={p} size={56} />
                    <span>{p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="cb-ghostbtn" onClick={onClose}>Not yet</button>
          </>
        )}
        {verdict?.kind === 'proved' && (
          <>
            <h2 id="cb-sheet-title" className="cb-verdict" data-kind="proved">Proved.</h2>
            <p className="cb-sheet-body">{firstName(puzzle, puzzle.murdererId)} was alone with {victim}, and every square of the plan holds.</p>
            {motive && <p className="cb-motive">{motive}</p>}
            <p className="cb-sheet-sub">{hintsUsed === 0 ? 'No hints used.' : `Hints used: ${hintsUsed}.`}</p>
            <button type="button" className="cb-primary" onClick={onReplay}>Watch the night</button>
            <button type="button" className="cb-ghostbtn" onClick={onClose}>Close</button>
          </>
        )}
        {verdict?.kind === 'calledIt' && (
          <>
            <h2 id="cb-sheet-title" className="cb-verdict" data-kind="called">Called it.</h2>
            <p className="cb-sheet-body">{firstName(puzzle, puzzle.murdererId)} was alone with {victim}. The plan is not proven yet.</p>
            {motive && <p className="cb-motive">{motive}</p>}
            <p className="cb-sheet-sub">{hintsUsed === 0 ? 'No hints used.' : `Hints used: ${hintsUsed}.`}</p>
            <button type="button" className="cb-primary" onClick={onFinish}>Finish the plan</button>
            <button type="button" className="cb-ghostbtn" onClick={onReplay}>Watch the night instead</button>
          </>
        )}
        {verdict?.kind === 'notThem' && (
          <>
            <h2 id="cb-sheet-title" className="cb-verdict" data-kind="no">It was not {firstName(puzzle, accused ?? '')}.</h2>
            <p className="cb-sheet-body">{verdict.cold ? 'Three wrong names. The case has gone cold.' : `Strike ${verdict.strikes} of ${MAX_STRIKES}.`}</p>
            {verdict.cold
              ? <button type="button" className="cb-primary" onClick={onReplay}>Reveal the night</button>
              : <button type="button" className="cb-primary" onClick={onBack}>Back to the plan</button>}
          </>
        )}
      </div>
    </div>
  )
}

