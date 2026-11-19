import { useEffect, useRef } from 'react'
import type { Puzzle } from '../core/types'
import { firstName } from './cells'
import { wrongAccusationLine } from './rollcall'
import { MAX_STRIKES, TIER_LABEL } from './verdict'
import type { Verdict } from './verdict'
import { Portrait } from './Portrait'

interface Props {
  puzzle: Puzzle
  verdict: Verdict | null
  /** The person named in the last accusation. */
  accused: string | null
  strikes: number
  /** The answer has been shown: a right name can only be "Called it" now. */
  revealed: boolean
  onAccuse: (id: string) => void
  onBack: () => void
  onClose: () => void
  onFinish: () => void
  /** Open the alibi roll-call (the reveal). */
  onRoll: () => void
}

/** The accusation sheet: name one suspect. A wrong name says only that they have an alibi. */
export function Sheet({ puzzle, verdict, accused, strikes, revealed, onAccuse, onBack, onClose, onFinish, onRoll }: Props) {
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
        {(verdict?.kind === 'proved' || verdict?.kind === 'provedHelp') && (
          <>
            <h2 id="cb-sheet-title" className="cb-verdict" data-kind="proved">{TIER_LABEL[verdict.kind]}.</h2>
            <p className="cb-sheet-body">{firstName(puzzle, puzzle.murdererId)} was alone with {victim}, and every square of the plan holds.</p>
            <button type="button" className="cb-primary" onClick={onRoll}>Hear the alibis</button>
          </>
        )}
        {verdict?.kind === 'calledIt' && (
          <>
            <h2 id="cb-sheet-title" className="cb-verdict" data-kind="called">{TIER_LABEL.calledIt}.</h2>
            <p className="cb-sheet-body">{firstName(puzzle, puzzle.murdererId)} was alone with {victim}. {revealed ? 'You had seen the answer, so this stays a call, not a proof.' : 'The plan is not proven yet.'}</p>
            <button type="button" className="cb-primary" onClick={revealed ? onClose : onFinish}>{revealed ? 'Close' : 'Finish the plan'}</button>
            {!revealed && <button type="button" className="cb-ghostbtn" onClick={onRoll}>Hear the alibis instead</button>}
          </>
        )}
        {verdict?.kind === 'notThem' && (
          <>
            <h2 id="cb-sheet-title" className="cb-verdict" data-kind="no">{wrongAccusationLine(firstName(puzzle, accused ?? ''))}</h2>
            <p className="cb-sheet-body">{verdict.cold ? 'Three wrong names. The case has gone cold.' : `${verdict.strikes} of ${MAX_STRIKES} accusations used.`}</p>
            {verdict.cold
              ? <button type="button" className="cb-primary" onClick={onRoll}>Hear the alibis</button>
              : <button type="button" className="cb-primary" onClick={onBack}>Back to the plan</button>}
          </>
        )}
      </div>
    </div>
  )
}

