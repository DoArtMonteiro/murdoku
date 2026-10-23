import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { Puzzle } from '../../core/types'
import { FramedPortrait } from './Portrait'
import { backHref } from './util'

/** In-shell "Case closed" panel. Independent of VictoryScreen. */
export function CaseClosed({ puzzle, murdererId, revealed, onAgain, children }: { puzzle: Puzzle; murdererId: string | null; revealed: boolean; onAgain: () => void; children?: ReactNode }) {
  const head = useRef<HTMLHeadingElement>(null)
  useEffect(() => { head.current?.focus() }, [])
  const killer = puzzle.people.find(p => p.id === murdererId)
  const victim = puzzle.people.find(p => p.id === puzzle.victimId)
  const sol = killer ? puzzle.solution[killer.id] : undefined
  const roomId = sol ? (puzzle.roomOfByFloor?.[sol.floor ?? 0]?.[sol.row]?.[sol.col] ?? puzzle.roomOf[sol.row]?.[sol.col]) : undefined
  const room = puzzle.rooms.find(r => r.id === roomId)?.name
  return (
    <section className="rs-closed" data-testid="case-closed" aria-labelledby="rs-closed-title">
      <div className="rs-closed-top">
      <h2 id="rs-closed-title" ref={head} tabIndex={-1} className={`rs-stamp-closed ${revealed ? 'rs-stamp-revealed' : ''}`}>{revealed ? 'Case revealed' : 'Case closed'}</h2>
      {killer ? (
        <div className="rs-killer">
          <FramedPortrait personId={killer.id} size={52} label={`${killer.name} portrait`} />
          <p data-testid="murderer-name">
            <strong>{killer.name}</strong> {revealed ? 'was the killer.' : 'did it.'}
            <span className="rs-closed-sub">
              {victim ? ` Left alone with ${victim.name}` : ' Left alone with the victim'}{room ? ` in the ${room}.` : '.'}
            </span>
          </p>
        </div>
      ) : (
        <p className="rs-closed-sub">The case file is closed.</p>
      )}
      </div>
      {revealed && <p className="rs-closed-sub" data-testid="revealed-note">You gave up and the answer was shown, so this case does not count as solved.</p>}
      {children}
      <div className="rs-closed-actions">
        <a className="rs-btn rs-btn-primary" href={backHref()} data-testid="back-link">Back to Alibi</a>
        {!revealed && <button type="button" className="rs-btn" onClick={onAgain}>Play again</button>}
      </div>
    </section>
  )
}
