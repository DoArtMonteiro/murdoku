// Case 0 on screen. The board, statements, portraits, action bar and roll-call are the casebook's own: this
// plays it with a coach (src/casebook/coach.ts). The beat engine (play.ts) owns the game state and decides what
// to say; the casebook draws it. What is added here is the prologue and closing cards, the way out, the soft amber
// halo on the control the current beat wants, and the flag that records the walk-through was heard to the end.
import { useCallback, useMemo, useReducer, useRef, useState } from 'react'
import Casebook from '../casebook/Casebook'
import type { Coach } from '../casebook/coach'
import { fillNames } from '../casebook/stories'
import '../casebook/casebook.css'
import './tutorial.css'
import { AccuseSheet } from './AccuseSheet'
import { case0, case0Story, INVESTIGATOR_LINE } from './case0'
import { accuseReady, beatFor, BEATS, initTut, tutReduce } from './play'
import type { Target } from './play'
import { writeTutorialFlag } from './storage'

const puzzle = case0
// Controls wear a soft amber glow around them. A square wears a pale ring inside itself (the plan clips
// what spills out), drawn on its ::after so it sits above the lens fill. Both pulse; reduced motion keeps them still.
const GLOW = 'animation: var(--tut-glow-anim, tut-glow 1.8s ease-in-out infinite); position: relative; z-index: 4; outline: 2.5px solid #e2a33a; outline-offset: 2px;'
const RING = 'content: ""; opacity: 1 !important; background: transparent !important; animation: var(--tut-ring-anim, tut-ring 1.6s ease-in-out infinite); box-shadow: inset 0 0 0 3.5px #fff6dc, inset 0 0 16px 5px rgba(255, 246, 220, .75);'

/** One soft amber halo per target, as scoped CSS: it survives the board and the chips re-rendering. */
function haloCss(targets: readonly Target[]): string {
  const cells: string[] = [], others: string[] = []
  for (const t of targets) {
    switch (t.kind) {
      case 'cell': cells.push(`.tut-root .cb-cell[data-row="${t.cell.row}"][data-col="${t.cell.col}"]::after`); break
      case 'chip': others.push(`.tut-root .cb-chips li:nth-child(${t.position + 1}) .cb-chip`); break
      case 'who': others.push(`.tut-root .cb-rail li:nth-child(${t.position + 1}) .cb-who`); break
      case 'bar': others.push('.tut-root .cb-bar .cb-accuse'); break
    }
  }
  return [cells.length ? `${cells.join(',')} { ${RING} }` : '', others.length ? `${others.join(',')} { ${GLOW} }` : ''].join(' ')
}

export default function Tutorial() {
  const [ts, dispatch] = useReducer((s: ReturnType<typeof initTut>, a: Parameters<typeof tutReduce>[2]) => tutReduce(puzzle, s, a), puzzle, initTut)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const lineRef = useRef<HTMLParagraphElement>(null)
  const beat = useMemo(() => beatFor(puzzle, ts), [ts])

  // The instruction line is hidden (inert) behind the prologue, so a live region could not announce it on Begin:
  // focus moves onto it instead, and the beat is read out from a region that exists from the start.
  const focusLine = () => { window.setTimeout(() => lineRef.current?.focus({ preventScroll: true }), 0) }
  const begin = () => { setStarted(true); focusLine() }
  const replay = () => { dispatch({ t: 'tutorialReset' }); setFinished(false); setStarted(true); focusLine() }
  // Hearing the roll-call to its last line is the end of Case 0.
  const onEnd = useCallback(() => writeTutorialFlag('done'), [])
  const onClose = useCallback(() => setFinished(true), [])

  const showCard = !started && !finished
  const coach: Coach = {
    state: ts.game,
    dispatch,
    beat: { n: beat.n, of: BEATS },
    instruction: beat.text,
    haloCss: haloCss(beat.targets),
    hold: showCard || finished,
    ready: accuseReady(puzzle, ts),
    lineRef,
    story: case0Story,
    title: 'Case 0',
    header: !finished ? <a className="tut-skip" href="?casebook=" onClick={() => writeTutorialFlag('skipped')}>Skip — I know how to play</a> : null,
    card: finished ? (
      <div className="tut-card tut-done">
        <h2 className="tut-card-title">Case 0, closed.</h2>
        <p className="tut-card-body">That is the whole game: read the statements, light the lamp, place, suppose, name. The real cases are only more of it.</p>
        <div className="tut-card-bar">
          <a className="cb-primary tut-btn" href="?casebook=">Play a real case</a>
          <button type="button" className="cb-ghostbtn" onClick={replay}>Play Case 0 again</button>
        </div>
      </div>
    ) : showCard ? (
      <div className="tut-card tut-prologue" role="group" aria-label="Prologue">
        <p className="tut-card-kicker">Prologue</p>
        <p className="tut-card-body">{case0Story.premise}</p>
        <p className="tut-card-voice">&ldquo;{fillNames(puzzle, INVESTIGATOR_LINE)}&rdquo;</p>
        <div className="tut-card-bar">
          <button type="button" className="cb-primary" onClick={begin}>Begin — about 90 seconds</button>
        </div>
      </div>
    ) : null,
    sheet: p => <AccuseSheet puzzle={puzzle} wrongName={p.wrongName} onAccuse={p.onAccuse} onClose={p.onClose} />,
    onEnd,
    onClose,
  }

  return (
    <div className="tut-root" data-beat={beat.id} data-testid="tutorial">
      <Casebook puzzle={puzzle} coach={coach} />
    </div>
  )
}
