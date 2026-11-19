import { useEffect, useRef } from 'react'
import type { Puzzle } from '../core/types'
import { firstName } from '../casebook/cells'
import { Portrait } from '../casebook/Portrait'
import { wrongAccusationLine } from '../casebook/rollcall'

interface Props {
  puzzle: Puzzle
  /** The person named in the last accusation, when it was a wrong one. */
  wrongName: string | null
  onAccuse: (id: string) => void
  onClose: () => void
}

/** The casebook's accusation sheet, with the stakes taken out: a wrong name is only an alibi. */
export function AccuseSheet({ puzzle, wrongName, onAccuse, onClose }: Props) {
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
  }, [onClose, wrongName])

  return (
    <div className="cb-scrim" onClick={onClose}>
      <div ref={ref} className="cb-sheet" role="dialog" aria-modal="true" aria-labelledby="tut-sheet-title" onClick={e => e.stopPropagation()} data-verdict={wrongName ? 'notThem' : undefined}>
        {wrongName ? (
          <>
            <h2 id="tut-sheet-title" className="cb-verdict" data-kind="no">{wrongAccusationLine(wrongName)}</h2>
            <p className="cb-sheet-body">Nothing is counted in Case 0. Look at the plan again: only one suspect shares a room with {victim}, and nobody else.</p>
            <button type="button" className="cb-primary" onClick={onClose}>Back to the plan</button>
          </>
        ) : (
          <>
            <h2 id="tut-sheet-title" className="cb-sheet-title">Who was alone with {victim}?</h2>
            <p className="cb-sheet-sub">Name one suspect. Nothing is counted in Case 0.</p>
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
      </div>
    </div>
  )
}
