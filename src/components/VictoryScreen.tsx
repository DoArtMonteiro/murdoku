import { motion, useReducedMotion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import type { Puzzle } from '../core/types'
import { roomIdAt } from '../core/engine'
import { getAllPuzzles } from '../core/catalog'
import { buildShareText, copyShareText } from '../core/share'
import { loadStreak } from '../core/daily'
import { resolveClueHighlights } from '../core/ux'
import type { ClueHighlight } from '../core/ux'

interface Props {
  puzzle: Puzzle
  murderer: string
  timer: string
  /** Raw elapsed time. The share card should not be derived from the display
   *  string: a future change to the timer's format would silently corrupt it. */
  elapsedSeconds?: number
  hintsLeft: number
  completedIds: string[]
  onNext: () => void
  onPlayUnsolved: (id: string) => void
  onHome: () => void
}

export default function VictoryScreen({ puzzle, murderer, timer, elapsedSeconds, hintsLeft, completedIds, onNext, onPlayUnsolved, onHome }: Props) {
  const [showReplay, setShowReplay] = useState(false)
  const killer = puzzle.people.find(p => p.id === murderer)!
  const victim = puzzle.people.find(p => p.id === puzzle.victimId)!
  const room = puzzle.rooms.find(r => r.id === roomIdAt(puzzle, puzzle.solution[puzzle.victimId]))
  const allPuzzles = getAllPuzzles()
  const order = allPuzzles.map(p => p.id)
  const hasNext = order.indexOf(puzzle.id) < order.length - 1
  const unsolved = allPuzzles.find(p => !completedIds.includes(p.id) && p.id !== puzzle.id)
  const hasUnsolved = !hasNext && !!unsolved
  const reduceMotion = useReducedMotion()

  // The real elapsed seconds when the caller supplies them; parsing the MM:SS
  // display is only a fallback so the component still works standalone.
  const [timerM, timerS] = timer.split(':').map(Number)
  const seconds = elapsedSeconds ?? (timerM || 0) * 60 + (timerS || 0)
  const streak = loadStreak()
  const shareText = buildShareText({
    caseNumber: puzzle.caseNumber,
    difficulty: puzzle.difficulty,
    size: puzzle.size,
    seconds,
    hintsLeft,
    hintsTotal: 3,
    streak: streak.current > 1 ? streak.current : undefined,
  })

  // The stamp is the emotional payoff — a rubber verdict being pressed onto the
  // dossier. Spring with overshoot so it physically thuds. Reduced motion: plain
  // fade, no vestibular movement.
  const stamp = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.2 } }
    : {
        initial: { scale: 1.45, rotate: -8, opacity: 0 },
        animate: { scale: 1, rotate: -2, opacity: 1 },
        transition: { delay: 0.05, type: 'spring' as const, bounce: 0.4, duration: 0.55 },
      }

  // The killer name materialises out of blur — evidence arriving, not switching on.
  const reveal = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.4, duration: 0.2 } }
    : {
        initial: { scale: 0.85, opacity: 0, filter: 'blur(8px)' },
        animate: { scale: 1, opacity: 1, filter: 'blur(0px)' },
        transition: { delay: 0.55, type: 'spring' as const, bounce: 0.2, duration: 0.55 },
      }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      data-testid="victory-screen"
      aria-labelledby="victory-title"
      className="desk-surface flex min-h-screen flex-col items-center justify-center px-6 py-8"
    >
      {/* CASE CLOSED stamp — the payoff */}
      <motion.div
        {...stamp}
        className="mb-8"
        style={{ willChange: 'transform, opacity', transformOrigin: 'center' }}
      >
        <div
          className="border-4 border-danger px-8 py-3"
          style={{
            boxShadow: '0 0 0 2px color-mix(in srgb, var(--color-danger) 30%, transparent), var(--shadow-cut)',
          }}
        >
          <h1
            id="victory-title"
            className="font-display text-2xl font-bold tracking-[0.35em] text-danger-text uppercase"
          >
            Case Closed
          </h1>
        </div>
      </motion.div>

      {/* Evidence header label */}
      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-paper-muted"
      >
        PERPETRATOR IDENTIFIED
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }}
        className="mb-6 font-mono text-[11px] uppercase tracking-[0.24em] text-accent-text"
      >
        CASE RECONSTRUCTED
      </motion.p>

      {/* Killer name — presented like a name plate on a case file */}
      <motion.div
        {...reveal}
        className="w-full max-w-xs border-2 border-danger px-6 py-5 text-center"
        style={{
          boxShadow: '0 12px 32px -18px color-mix(in srgb, var(--color-danger) 55%, transparent), var(--shadow-elevated)',
          background: 'color-mix(in srgb, var(--color-danger) 6%, var(--color-bg-surface))',
        }}
      >
        <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-paper-muted mb-2">SUBJECT</p>
        <h2 className="font-display text-3xl font-bold text-text-primary tracking-wide">
          {killer.name}
        </h2>
      </motion.div>

      {/* Case file stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
        className="w-full max-w-xs border border-border-strong bg-bg-panel px-5 py-4 my-6 grid grid-cols-2 gap-3 text-center"
        style={{ boxShadow: 'var(--shadow-cut)' }}
      >
        <Stat label="Victim" value={victim.name} />
        <Stat label="Scene" value={room?.name ?? '—'} />
        <Stat label="Time" value={timer} />
        <Stat label="Hints used" value={`${3 - hintsLeft} / 3`} />
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.05 }}
        className="w-full max-w-xs flex flex-col gap-3"
      >
        {hasNext && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onNext}
            className="focus-ring w-full py-3.5 font-display font-semibold tracking-widest uppercase text-sm border-2 border-accent"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-strong))',
              color: 'var(--color-on-accent)',
              boxShadow: 'var(--shadow-cut)',
            }}
          >
            NEXT CASE →
          </motion.button>
        )}
        {hasUnsolved && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onPlayUnsolved(unsolved!.id)}
            className="focus-ring w-full py-3.5 font-display font-semibold tracking-widest uppercase text-sm border-2 border-accent"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent-strong))',
              color: 'var(--color-on-accent)',
              boxShadow: 'var(--shadow-cut)',
            }}
          >
            ANOTHER CASE →
          </motion.button>
        )}

        {/* Share result — spoiler-free card */}
        <ShareButton shareText={shareText} />

        {/* Replay: opt-in, never automatic — the stamp-and-reveal is the payoff */}
        {!showReplay && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => setShowReplay(true)}
            aria-label="Review clues: how the clues solved the case"
            className="focus-ring w-full py-3 border border-border-strong font-display text-sm tracking-widest uppercase flex items-center justify-center gap-2"
            style={{
              background: 'var(--color-bg-surface)',
              color: 'var(--color-text-secondary)',
              boxShadow: 'var(--shadow-cut)',
              minHeight: 44,
            }}
          >
            <BookOpen size={14} strokeWidth={2} aria-hidden />
            REVIEW CLUES
          </motion.button>
        )}

        {showReplay && (
          <ClueReplay puzzle={puzzle} />
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onHome}
          className="focus-ring w-full py-3 border border-border-strong text-paper-dim font-display text-sm tracking-widest uppercase"
          style={{ background: 'var(--color-bg-surface)', boxShadow: 'var(--shadow-cut)' }}
        >
          ALL CASES
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Clue Replay ──────────────────────────────────────────────────────────────
// One step per suspect (non-victim). Shows each suspect's clue text(s) and
// what board region their clues pointed at, described in words.
// Read-only: state is local step index only — nothing is written or stored.

/** Describe a ClueHighlight as a short phrase for the replay list. */
function describeHighlight(highlight: ClueHighlight, puzzle: Puzzle): string {
  if (highlight.roomId) {
    const room = puzzle.rooms.find(r => r.id === highlight.roomId)
    return room ? `the ${room.name}` : highlight.roomId
  }
  if (highlight.furniture) {
    return `the ${highlight.furniture}`
  }
  if (highlight.cells) {
    const n = puzzle.size
    const cells = highlight.cells
    // Detect edge (all cells touch the boundary)
    const isEdge = cells.length === (n * 4 - 4) && cells.every(
      c => c.row === 0 || c.col === 0 || c.row === n - 1 || c.col === n - 1,
    )
    if (isEdge) return 'the outer edge'
    // Detect corner
    const cornerSet = new Set(['0,0', `0,${n - 1}`, `${n - 1},0`, `${n - 1},${n - 1}`])
    const isCorner = cells.length === 4 && cells.every(c => cornerSet.has(`${c.row},${c.col}`))
    if (isCorner) return 'a corner cell'
    // Row or column
    const rows = [...new Set(cells.map(c => c.row))]
    const cols = [...new Set(cells.map(c => c.col))]
    if (rows.length === 1) return `row ${rows[0]! + 1}`
    if (cols.length === 1) return `column ${cols[0]! + 1}`
    return `${cells.length} cells`
  }
  return 'the board'
}

/** One suspect step in the replay. */
interface ReplayStep {
  personId: string
  personName: string
  clueTexts: string[]
  targets: string[]   // human-readable highlight descriptions
}

function buildReplaySteps(puzzle: Puzzle): ReplayStep[] {
  return puzzle.people
    .filter(p => !p.isVictim)
    .map(p => {
      const clueTexts = puzzle.clues
        .filter(ct => ct.clue.person === p.id)
        .map(ct => ct.text)
      const highlights: ClueHighlight[] = resolveClueHighlights(puzzle, p.id)
      const targets = highlights.map(h => describeHighlight(h, puzzle))
      return { personId: p.id, personName: p.name, clueTexts, targets }
    })
    .filter(step => step.clueTexts.length > 0)
}

function ClueReplay({ puzzle }: { puzzle: Puzzle }) {
  const steps = buildReplaySteps(puzzle)
  const [index, setIndex] = useState(0)
  const reduceMotion = useReducedMotion()

  if (steps.length === 0) return null

  const step = steps[index]!
  const isFirst = index === 0
  const isLast = index === steps.length - 1

  const slideVariants = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } }

  return (
    <section
      aria-label="Clue replay"
      className="w-full border border-border-strong"
      style={{
        background: 'var(--color-bg-surface)',
        boxShadow: 'var(--shadow-cut)',
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-2 border-b border-border-subtle flex items-center justify-between"
        style={{ background: 'var(--color-bg-inset)' }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--color-text-muted)' }}>
          CLUE BREAKDOWN
        </p>
        <p className="font-mono text-[10px] tracking-[0.1em]" style={{ color: 'var(--color-text-muted)' }}>
          {index + 1} / {steps.length}
        </p>
      </div>

      {/* Step content */}
      <motion.div
        key={step.personId}
        {...slideVariants}
        transition={{ duration: 0.18 }}
        className="px-4 py-3"
      >
        {/* Suspect name */}
        <p
          className="font-display font-bold text-sm uppercase tracking-[0.14em] mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {step.personName}
        </p>

        {/* Clue texts */}
        <ul className="space-y-1 mb-2" aria-label={`Clues for ${step.personName}`}>
          {step.clueTexts.map((text, i) => (
            <li
              key={i}
              className="font-mono text-[11px] leading-snug"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {text}
            </li>
          ))}
        </ul>

        {/* Board targets in words */}
        {step.targets.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border-subtle">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] mb-1" style={{ color: 'var(--color-text-muted)' }}>
              POINTS AT
            </p>
            <p className="font-mono text-[11px] leading-snug" style={{ color: 'var(--color-text-primary)' }}>
              {step.targets.join(' · ')}
            </p>
          </div>
        )}
      </motion.div>

      {/* Prev / Next */}
      <div className="flex border-t border-border-subtle">
        <button
          type="button"
          onClick={() => setIndex(i => Math.max(0, i - 1))}
          disabled={isFirst}
          aria-label="Previous suspect"
          className="focus-ring flex-1 flex items-center justify-center gap-1 font-display text-[13px] tracking-[0.08em] uppercase border-r border-border-subtle transition-colors"
          style={{
            minHeight: 44,
            color: isFirst ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
            background: 'transparent',
            cursor: isFirst ? 'default' : 'pointer',
          }}
        >
          <ChevronLeft size={14} strokeWidth={2} aria-hidden />
          PREV
        </button>
        <button
          type="button"
          onClick={() => setIndex(i => Math.min(steps.length - 1, i + 1))}
          disabled={isLast}
          aria-label="Next suspect"
          className="focus-ring flex-1 flex items-center justify-center gap-1 font-display text-[13px] tracking-[0.08em] uppercase transition-colors"
          style={{
            minHeight: 44,
            color: isLast ? 'var(--color-text-muted)' : 'var(--color-text-secondary)',
            background: 'transparent',
            cursor: isLast ? 'default' : 'pointer',
          }}
        >
          NEXT
          <ChevronRight size={14} strokeWidth={2} aria-hidden />
        </button>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-paper-muted text-[10px] uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="font-display text-paper text-sm font-semibold tracking-wide">{value}</p>
    </div>
  )
}

// ── Share button ─────────────────────────────────────────────────────────────
// Never reveals murderer, victim, room, or clue text — buildShareText enforces
// this; we only pass case number, shape, time, and hint pips.

type ShareStatus = 'idle' | 'copied' | 'failed'

function ShareButton({ shareText }: { shareText: string }) {
  const [status, setStatus] = useState<ShareStatus>('idle')

  // Reset "Copied" feedback after 2 s
  useEffect(() => {
    if (status !== 'copied') return
    const t = setTimeout(() => setStatus('idle'), 2000)
    return () => clearTimeout(t)
  }, [status])

  async function handleShare() {
    const ok = await copyShareText(shareText)
    setStatus(ok ? 'copied' : 'failed')
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={handleShare}
        aria-label="Share result"
        className="focus-ring w-full py-3 border border-border-strong font-display text-sm tracking-widest uppercase"
        style={{
          background: 'var(--color-bg-surface)',
          color: 'var(--color-text-primary)',
          boxShadow: 'var(--shadow-cut)',
          minHeight: 44,
        }}
      >
        {status === 'copied' ? 'Copied ✓' : 'Share result'}
      </motion.button>

      {status === 'failed' && (
        <div className="flex flex-col gap-1">
          <p className="font-mono text-[11px] text-text-secondary text-center">
            Copy failed — select and copy below:
          </p>
          <textarea
            readOnly
            value={shareText}
            aria-label="Share text — select and copy"
            rows={5}
            className="focus-ring w-full border border-border-strong bg-bg-inset px-3 py-2 font-mono resize-none"
            style={{
              fontSize: 11,
              color: 'var(--color-text-primary)',
              lineHeight: 1.5,
            }}
            onFocus={e => e.currentTarget.select()}
          />
        </div>
      )}
    </div>
  )
}
