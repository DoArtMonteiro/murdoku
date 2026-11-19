import type { Puzzle } from '../core/types'
import { firstName } from './cells'
import type { Recon } from './recon'
import { Portrait } from './Portrait'

interface Props {
  puzzle: Puzzle
  recon: Recon
  /** 0..frames.length-1 = a placement; frames.length = the finale. */
  step: number
  auto: boolean
  motive: string | null
  proved: boolean
  onNext: () => void
  onAuto: () => void
  onSkip: () => void
  onClose: () => void
}

/** The night, one deduction at a time. Tap Next (or the plan) to advance. */
export function Replay({ puzzle, recon, step, auto, motive, proved, onNext, onAuto, onSkip, onClose }: Props) {
  const total = recon.frames.length
  const finale = step >= total
  const frame = recon.frames[Math.min(step, total - 1)]
  const who = puzzle.people.find(p => p.id === (finale ? recon.finale.murderer : frame.person))!
  return (
    <section className="cb-replay" aria-label="Reconstruction" data-finale={finale || undefined}>
      <div className="cb-replay-head">
        <Portrait person={who} size={40} />
        <p className="cb-replay-count">{finale ? 'The night, in the end' : `Step ${step + 1} of ${total}`}</p>
      </div>
      <p className="cb-replay-line" aria-live="polite">{finale ? recon.finale.line : frame.line}</p>
      {finale && (
        <p className="cb-replay-motive">
          <span className="cb-pencil-name">{firstName(puzzle, recon.finale.murderer)}</span>
          {motive ? `: ${motive.charAt(0).toLowerCase()}${motive.slice(1)}` : ''}
          {!proved && <em className="cb-unproven"> The plan was never proven.</em>}
        </p>
      )}
      <div className="cb-replay-bar">
        {!finale ? (
          <>
            <button type="button" className="cb-primary" onClick={onNext}>Next</button>
            <button type="button" className="cb-ghostbtn" aria-pressed={auto} onClick={onAuto}>{auto ? 'Auto: on' : 'Auto'}</button>
            <button type="button" className="cb-ghostbtn" onClick={onSkip}>Skip</button>
          </>
        ) : (
          <button type="button" className="cb-primary" onClick={onClose}>Close the case</button>
        )}
      </div>
    </section>
  )
}
