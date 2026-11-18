import { motion } from 'framer-motion'
import { Users, LayoutGrid, Sparkles, Search, Timer, ArrowLeft, Building2, Bookmark } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Puzzle, Difficulty, GameMode } from '../core/types'
import { filterCases } from '../core/ux'
import type { InProgressSummary } from '../core/ux'
import type { SavedAttempts } from '../core/saves'
import type { CaseRecord } from '../hooks/useGame'
import ThemeToggle from './ThemeToggle'
import BoardPreview from './BoardPreview'
import About from './About'
import { dailyPuzzle, loadStreak, streakIsLive, computeBadges } from '../core/daily'

interface Props {
  puzzles: Puzzle[]
  completedIds: string[]
  records: Record<string, CaseRecord>
  mode: GameMode
  onSetMode: (m: GameMode) => void
  onSelect: (id: string) => void
  onOpenReleases: () => void
  resolvedTheme: string
  onToggleTheme: () => void
  inProgress?: InProgressSummary | null
  onResume?: (id: string, mode: GameMode) => void
  /** Every saved attempt per case (newest first); the case list marks them and opens them in their own mode. */
  savedAttempts?: SavedAttempts
}

const MODE_LABEL: Record<GameMode, string> = { classic: 'Classic', detective: 'Detective' }
const NO_SAVES: SavedAttempts = {}

function fmt(s: number) { return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

const DIFF_TOKEN: Record<string, string> = {
  'Very Easy': 'very-easy', Easy: 'easy', Medium: 'medium', Hard: 'hard', Expert: 'expert',
  Master: 'master',
}
const diffFill = (d: string) => `var(--diff-${DIFF_TOKEN[d]})`
const diffText = (d: string) => `var(--diff-${DIFF_TOKEN[d]}-text)`

const DIFF_ORDER: Difficulty[] = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Expert', 'Master']

// Grid sizes associated with each difficulty level; derived at render time from
// the actual puzzle catalog so this stays accurate if tiers shift.
function tierGridSize(puzzles: Puzzle[], diff: Difficulty): string {
  const p = puzzles.find(x => x.difficulty === diff)
  return p ? `${p.size}×${p.size}` : '—'
}

// Floor count for a tier; derived from the catalog, never hardcoded per
// difficulty — the generator decides difficulty-to-floors, not this view.
function tierFloors(puzzles: Puzzle[], diff: Difficulty): number {
  const p = puzzles.find(x => x.difficulty === diff)
  return p ? (p.floors ?? 1) : 1
}

type StoreyFilter = 'all' | 'one' | 'two'

export default function HomeScreen({
  puzzles, completedIds, records, mode, onSetMode, onSelect,
  onOpenReleases, resolvedTheme, onToggleTheme, inProgress = null, onResume, savedAttempts = NO_SAVES,
}: Props) {
  // 'landing' = Screen 1; any Difficulty string = Screen 2 (case list for that tier)
  const [view, setView] = useState<'landing' | Difficulty>('landing')
  const [storeyFilter, setStoreyFilter] = useState<StoreyFilter>('all')
  const [about, setAbout] = useState<{ opener: HTMLElement | null } | null>(null)

  const resumablePuzzle = inProgress ? puzzles.find(puzzle => puzzle.id === inProgress.id) : undefined

  function resumeCase() {
    if (!inProgress) return
    if (onResume) onResume(inProgress.id, inProgress.mode)
    else onSelect(inProgress.id)
  }

  // Opening a case from the list or the daily panel. With no saved attempt it
  // starts in the selected mode, as always; with one saved in the selected mode
  // it resumes that. Otherwise the player picks: each saved attempt resumes in
  // its own mode, and a new game is only offered in a mode with nothing saved,
  // so nothing saved is ever replaced from here.
  const [chooser, setChooser] = useState<{ id: string; opener: HTMLElement | null } | null>(null)
  function openCase(id: string) {
    const saved = savedAttempts[id] ?? []
    if (!saved.length) onSelect(id)
    else if (saved.length === 1 && saved[0].mode === mode) startIn(id, mode)
    else setChooser({ id, opener: document.activeElement instanceof HTMLElement ? document.activeElement : null })
  }
  function startIn(id: string, m: GameMode) {
    if (onResume) onResume(id, m)
    else onSelect(id)
  }
  function closeChooser() {
    const opener = chooser?.opener
    setChooser(null)
    opener?.focus()
  }
  const chooserPuzzle = chooser ? puzzles.find(p => p.id === chooser.id) : undefined
  const chooserDialog = chooser && chooserPuzzle ? (
    <ResumeChooser
      puzzle={chooserPuzzle}
      attempts={savedAttempts[chooser.id] ?? []}
      mode={mode}
      onStart={m => { setChooser(null); startIn(chooserPuzzle.id, m) }}
      onClose={closeChooser}
    />
  ) : null

  const atmosphereLayers = (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 55% at 50% 0%, color-mix(in srgb, var(--color-accent) 13%, transparent), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="140"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/></filter><rect width="140" height="140" filter="url(#n)"/></svg>'
          )}")`,
        }}
      />
    </>
  )

  if (view !== 'landing') {
    return (
      <>
        <TierScreen
          difficulty={view}
          puzzles={puzzles}
          completedIds={completedIds}
          records={records}
          savedAttempts={savedAttempts}
          mode={mode}
          onSetMode={onSetMode}
          onSelect={openCase}
          onBack={() => setView('landing')}
          atmosphereLayers={atmosphereLayers}
        />
        {chooserDialog}
      </>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="desk-surface relative flex flex-col min-h-screen"
    >
      {atmosphereLayers}

      {/*
        Content column — widened to 1200px at large viewports so the landing
        can use horizontal space deliberately instead of leaving a narrow ribbon.
        Below lg it stays a single scrolling column, same as before.
      */}
      <div
        data-testid="home-content-cap"
        className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col min-h-screen"
      >

        {/* ── Top bar ── */}
        <div className="pt-safe flex items-center justify-between pt-3">
          <button
            onClick={onOpenReleases}
            className="focus-ring min-h-11 text-paper-muted text-xs font-sans tracking-wide hover:text-accent-text transition-colors px-1 py-1"
            style={{ minHeight: 44 }}
          >
            What&rsquo;s new
          </button>
          <ThemeToggle resolved={resolvedTheme} onToggle={onToggleTheme} />
        </div>

        {/*
          ── Above-the-fold: two-column at lg, single column below ────────────
          Left column: identity (logo, title, pitch) + How it works + Today's Case
          Right column: the board preview

          This arrangement puts the two things that communicate the game's idea
          side by side: the text that describes it and the board that shows it.
          On mobile the board appears between the pitch and the steps, same as
          before — no mobile regression.

          DOM order: header → board → steps → daily, so heading order is sane
          and the board appears after the title on mobile without reordering.
        */}
        <div className="lg:grid lg:grid-cols-[1fr_auto] lg:gap-8 lg:items-start">

          {/* Left column — identity + pitch + steps + daily */}
          <div className="flex flex-col">

            {/* ── Hero ── */}
            <header className="flex flex-col items-center lg:items-start pt-2 pb-4 px-4 lg:px-0 relative">
              <div className="relative mb-3">
                <svg width="58" height="58" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <circle cx="40" cy="40" r="37" stroke="var(--color-accent)" strokeOpacity="0.38" strokeWidth="1.5" strokeDasharray="4 3.5"/>
                  <circle cx="40" cy="40" r="30" stroke="var(--color-accent)" strokeOpacity="0.55" strokeWidth="1.8"/>
                  <circle cx="34" cy="34" r="12" stroke="var(--color-accent)" strokeOpacity="0.85" strokeWidth="3" fill="none"/>
                  <circle cx="34" cy="34" r="7" fill="var(--color-accent)" fillOpacity="0.12"/>
                  <line x1="43" y1="43" x2="54" y2="54" stroke="var(--color-accent)" strokeOpacity="0.85" strokeWidth="4" strokeLinecap="round"/>
                  <line x1="34" y1="28" x2="34" y2="40" stroke="var(--color-accent)" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round"/>
                  <line x1="28" y1="34" x2="40" y2="34" stroke="var(--color-accent)" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: '0 0 40px 8px var(--color-accent)', opacity: 0.08 }}/>
              </div>

              <h1
                className="font-display font-bold tracking-tight mt-0.5 leading-none"
                style={{
                  fontSize: 'clamp(2rem, 5vw, 2.8rem)',
                  color: 'var(--color-text-primary)',
                  textShadow: '0 2px 24px color-mix(in srgb, var(--color-accent) 40%, transparent)',
                }}
              >
                ALIBI
              </h1>

              {/* One-line product description */}
              <p
                className="mt-2 text-center lg:text-left font-mono leading-snug text-text-secondary max-w-md sm:max-w-xl"
                style={{ fontSize: 12 }}
              >
                A murder-mystery deduction puzzle. Place every suspect on a house map — one per row, one per column — then accuse whoever is left alone with the victim.
              </p>
            </header>

            {/* ── The product shot — mobile only (below lg) ─────────────────
                On lg+ it lives in the right column. The preview is inert and
                aria-hidden; the steps below carry the same info for AT. */}
            <div className="lg:hidden mb-5 w-full flex justify-center">
              <div className="w-full max-w-[420px]">
                <BoardPreview puzzles={puzzles} />
              </div>
            </div>

            {/* ── How it works (3 steps, scannable) ── */}
            <div className="mb-4 w-full">
              <p
                className="mb-2 font-display font-bold uppercase tracking-[0.14em] text-text-muted"
                style={{ fontSize: 11 }}
              >
                How it works
              </p>
              <ol className="flex flex-col gap-1.5">
                {[
                  'Read the witness clues — room, furniture, and relationship evidence.',
                  'Place every suspect so each holds exactly one row and one column of the house map.',
                  'Accuse the suspect left alone in the same room as the victim.',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="shrink-0 font-display font-bold leading-none mt-px"
                      style={{ fontSize: 13, color: 'var(--color-accent-text)', minWidth: 16 }}
                      aria-hidden
                    >
                      {i + 1}
                    </span>
                    <span className="font-mono leading-snug text-text-secondary" style={{ fontSize: 11 }}>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* ── Today's Case (primary CTA) ── */}
            <DailyPanel puzzles={puzzles} completedIds={completedIds} records={records} onSelect={openCase} />

          </div>{/* end left column */}

          {/* Right column — board preview (lg+ only) */}
          <div
            className="hidden lg:block lg:sticky lg:top-4"
            data-testid="board-preview-desktop"
            style={{ width: 'clamp(340px, 38%, 480px)' }}
          >
            <BoardPreview puzzles={puzzles} />
          </div>

        </div>{/* end above-the-fold two-column */}

        {/* ── Continue strip ── */}
        {resumablePuzzle && inProgress && (
          <section
            data-testid="continue-strip"
            aria-labelledby="continue-reconstruction-heading"
            className="mb-4 border border-accent-strong bg-bg-surface p-3 sm:p-4"
            style={{ boxShadow: 'var(--shadow-cut)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-text">In progress</p>
                <h2 id="continue-reconstruction-heading" className="mt-1 truncate font-display text-lg font-bold uppercase tracking-[0.04em] text-text-primary">
                  {resumablePuzzle.title}
                </h2>
                <p className="mt-1 font-mono text-[11px] text-text-secondary">
                  {inProgress.placedCount} / {resumablePuzzle.people.length} placed · {fmt(inProgress.elapsedSeconds)} · {inProgress.mode === 'detective' ? 'Detective' : 'Classic'}
                </p>
              </div>
              <button
                type="button"
                data-testid="continue-reconstruction"
                onClick={resumeCase}
                className="focus-ring min-h-11 border border-accent-strong bg-accent px-4 font-sans text-xs font-bold uppercase tracking-[0.12em] text-on-accent"
                style={{ minHeight: 44 }}
              >
                Continue reconstruction
              </button>
            </div>
          </section>
        )}

        {/* ── Difficulty tiers — main navigation ── */}
        <section aria-labelledby="tiers-heading" className="mb-4">
          <div className="mb-2 flex items-center justify-between gap-3 flex-wrap">
            <h2
              id="tiers-heading"
              className="font-display font-bold uppercase tracking-[0.14em] text-text-muted"
              style={{ fontSize: 11 }}
            >
              Case tiers
            </h2>
            {/* Storey filter — three-state button group. Matches the ModeBtn
                interaction pattern: no native radio, each button carries
                aria-pressed so assistive technology reads the active state.
                Touch targets are 44px minimum. */}
            <div
              role="group"
              aria-label="Filter tiers by storey count"
              className="flex border border-border-strong bg-bg-surface p-0.5 gap-0.5"
            >
              {([
                { value: 'all', label: 'All' },
                { value: 'one', label: '1 floor' },
                { value: 'two', label: '2 floors' },
              ] as { value: StoreyFilter; label: string }[]).map(({ value, label }) => {
                const active = storeyFilter === value
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStoreyFilter(value)}
                    className="focus-ring px-2.5 font-mono uppercase tracking-[0.08em] transition-colors"
                    style={{
                      fontSize: 10,
                      minHeight: 44,
                      background: active ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : 'transparent',
                      color: active ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
                      boxShadow: active ? 'inset 0 0 0 1px var(--color-border-strong)' : undefined,
                      borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {(() => {
              const visibleDiffs = DIFF_ORDER.filter(diff => {
                const tierPuzzles = puzzles.filter(p => p.difficulty === diff)
                if (!tierPuzzles.length) return false
                const floors = tierFloors(puzzles, diff)
                if (storeyFilter === 'one') return floors < 2
                if (storeyFilter === 'two') return floors >= 2
                return true
              })
              if (!visibleDiffs.length) {
                return (
                  <p
                    className="border border-border-strong bg-bg-surface p-4 text-center font-mono text-text-secondary"
                    style={{ fontSize: 11 }}
                    role="status"
                  >
                    No tiers match that filter.
                  </p>
                )
              }
              return visibleDiffs.map(diff => {
                const tierPuzzles = puzzles.filter(p => p.difficulty === diff)
                const solvedInTier = tierPuzzles.filter(p => completedIds.includes(p.id)).length
                const savedInTier = tierPuzzles.filter(p => savedAttempts[p.id]?.length).length
                const gridSize = tierGridSize(puzzles, diff)
                const floors = tierFloors(puzzles, diff)
                const storeyLabel = floors >= 2 ? '2 floors' : '1 floor'
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setView(diff)}
                    className="focus-ring group flex items-center justify-between border border-border-strong bg-bg-surface px-4 transition-colors hover:border-accent-strong"
                    style={{ minHeight: 52 }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Difficulty colour swatch — same visual language as card spine */}
                      <div
                        className="shrink-0"
                        style={{ width: 4, height: 32, background: diffFill(diff) }}
                        aria-hidden
                      />
                      <span
                        className="font-display font-bold uppercase tracking-[0.12em]"
                        style={{ fontSize: 14, color: diffText(diff) }}
                      >
                        {diff}{' '}<span className="sr-only">cases</span>
                      </span>
                      <span
                        className="font-mono text-text-muted"
                        style={{ fontSize: 11 }}
                      >
                        {gridSize}
                      </span>
                      {/* Storey chip — text carries meaning, icon is decorative.
                          Only shown when there are two storeys to avoid noise on
                          every single-storey row. */}
                      {floors >= 2 && (
                        <span
                          className="flex items-center gap-1 font-mono text-text-muted"
                          style={{ fontSize: 11 }}
                        >
                          <Building2 size={11} aria-hidden />
                          {storeyLabel}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-3 font-mono text-text-secondary" style={{ fontSize: 11 }}>
                      {savedInTier > 0 && (
                        <span data-testid={`tier-saved-${DIFF_TOKEN[diff]}`} className="flex items-center gap-1 text-accent-text">
                          <Bookmark size={11} aria-hidden />{savedInTier} in progress
                        </span>
                      )}
                      {solvedInTier}/{tierPuzzles.length}{' '}<span className="sr-only">solved</span>
                    </span>
                  </button>
                )
              })
            })()}
          </div>
        </section>

        {/* ── Achievements shelf ── */}
        <BadgeShelf puzzles={puzzles} completedIds={completedIds} records={records} />

        {/* Footer */}
        <footer className="pb-safe pb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-auto">
          {(() => {
            const solvedCount = completedIds.filter(id => puzzles.some(p => p.id === id)).length
            const bestTimes = puzzles.map(p => records[p.id]?.bestSeconds).filter((v): v is number => v != null)
            const fastest = bestTimes.length ? Math.min(...bestTimes) : null
            return (
              <>
                <span className="text-paper-muted text-[10px] tracking-wider font-sans opacity-70">
                  {solvedCount}/{puzzles.length} cases solved
                </span>
                {fastest != null && (
                  <span className="text-paper-muted text-[10px] tracking-wider font-sans opacity-70 flex items-center gap-1">
                    <Timer size={11} /> best {fmt(fastest)}
                  </span>
                )}
              </>
            )
          })()}
          <button
            type="button"
            onClick={() => setAbout({ opener: document.activeElement instanceof HTMLElement ? document.activeElement : null })}
            className="focus-ring min-h-11 px-1 text-paper-muted text-[11px] tracking-wider font-sans hover:text-accent-text transition-colors"
          >
            About &amp; credits
          </button>
        </footer>

      </div>{/* /content column */}
      {chooserDialog}
      {about && <About onClose={() => { const opener = about.opener; setAbout(null); opener?.focus() }} />}
    </motion.div>
  )
}

// ── Screen 2: Case list for one difficulty tier ─────────────────────────────

interface TierScreenProps {
  difficulty: Difficulty
  puzzles: Puzzle[]
  completedIds: string[]
  records: Record<string, CaseRecord>
  savedAttempts: SavedAttempts
  mode: GameMode
  onSetMode: (m: GameMode) => void
  onSelect: (id: string) => void
  onBack: () => void
  atmosphereLayers: React.ReactNode
}

function TierScreen({
  difficulty, puzzles, completedIds, records, savedAttempts, mode, onSetMode, onSelect, onBack, atmosphereLayers,
}: TierScreenProps) {
  const [query, setQuery] = useState('')

  const tierPuzzles = useMemo(() => puzzles.filter(p => p.difficulty === difficulty), [puzzles, difficulty])
  const matchingPuzzles = useMemo(() => filterCases(tierPuzzles, query), [tierPuzzles, query])

  const solvedInTier = tierPuzzles.filter(p => completedIds.includes(p.id)).length
  const gridSize = tierPuzzles[0] ? `${tierPuzzles[0].size}×${tierPuzzles[0].size}` : '—'

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="desk-surface relative flex flex-col min-h-screen"
    >
      {atmosphereLayers}

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 flex flex-col min-h-screen">

        {/* ── Masthead with back ── */}
        <div className="pt-safe flex items-center gap-3 pt-3 pb-4 border-b border-border-subtle">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to landing"
            className="focus-ring flex items-center gap-1.5 text-text-secondary hover:text-text-primary transition-colors"
            style={{ minHeight: 44, minWidth: 44 }}
          >
            <ArrowLeft size={16} aria-hidden />
            <span className="font-mono text-[11px] uppercase tracking-[0.12em]">Cases</span>
          </button>

          <div className="flex-1 min-w-0">
            <h1
              className="font-display font-bold uppercase tracking-[0.12em] truncate"
              style={{ fontSize: 18, color: diffText(difficulty) }}
            >
              {difficulty}
            </h1>
            <p className="font-mono text-text-muted" style={{ fontSize: 11 }}>
              {gridSize} · {solvedInTier}/{tierPuzzles.length} solved
            </p>
          </div>
        </div>

        {/* ── Mode toggle — chosen here, just before playing ── */}
        <div className="mt-4 mb-4 w-full max-w-md">
          <div className="flex border border-border-strong bg-bg-surface p-1 gap-1">
            <ModeBtn active={mode === 'classic'} onClick={() => onSetMode('classic')}
              icon={<Sparkles size={14} aria-hidden />} title="Classic"
              desc="Place freely · 3 hints" />
            <ModeBtn active={mode === 'detective'} onClick={() => onSetMode('detective')}
              icon={<Search size={14} aria-hidden />} title="Detective"
              desc="Draft &amp; eliminate · no hints" />
          </div>
        </div>

        {/* ── Search field (within this tier) ── */}
        <section aria-labelledby="case-search-heading" className="mb-5 border border-border-strong bg-bg-surface p-3 sm:p-4">
          {/* Stack on mobile, share a row from sm up. Measured at 320px: as a
              single `justify-between` row the count sat beside the field and
              `flex-1 min-w-0` let the input collapse to 108px inside a 273px
              container — the placeholder clipped to "Search cases, ro" while
              ~150px sat empty beside it. */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
            <div className="min-w-0 w-full sm:w-auto sm:flex-1">
              <h2 id="case-search-heading" className="font-display text-sm font-bold uppercase tracking-[0.14em] text-text-primary">Find a case</h2>
              <label htmlFor="case-search" className="sr-only">Search cases</label>
              <div className="relative mt-2">
                <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  id="case-search"
                  data-testid="home-search"
                  type="search"
                  value={query}
                  onChange={event => setQuery(event.currentTarget.value)}
                  placeholder="Search cases, rooms, or suspects"
                  className="h-11 w-full border border-border-strong bg-bg-inset pl-10 pr-3 font-mono text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-accent-strong"
                  style={{ minHeight: 44 }}
                />
              </div>
            </div>
            <p data-testid="case-result-count" aria-live="polite" className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
              {matchingPuzzles.length} matching {matchingPuzzles.length === 1 ? 'case' : 'cases'}
            </p>
          </div>
        </section>

        {/* ── Case grid ── */}
        <div className="flex-1 overflow-y-auto pb-8">
          {matchingPuzzles.length === 0 && (
            <p className="border border-border-strong bg-bg-surface p-6 text-center font-mono text-sm text-text-secondary" role="status">
              No cases match that search.
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
            {matchingPuzzles.map((p) => {
              const solved = completedIds.includes(p.id)
              const saved = savedAttempts[p.id] ?? []
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className="case-card evidence-strip focus-ring group relative text-left border border-border-strong overflow-hidden"
                  style={{ ['--diff' as string]: diffFill(p.difficulty), minHeight: 44 }}
                >
                  <div className="px-3.5 py-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-[10px] tracking-[0.18em] uppercase font-mono"
                        style={{ color: diffText(p.difficulty) }}
                      >
                        {p.caseNumber}
                      </span>
                      {solved && (
                        <span
                          className="text-[10px] font-display font-bold uppercase tracking-[0.18em] px-1.5 py-[3px] leading-none"
                          style={{
                            color: 'var(--color-accent-text)',
                            border: '1px solid color-mix(in srgb, var(--color-accent) 60%, transparent)',
                            background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                            transform: 'rotate(-1.5deg)',
                            display: 'inline-block',
                          }}
                        >
                          CLOSED
                        </span>
                      )}
                    </div>

                    <h2 className="font-display text-[17px] font-bold leading-[1.15] tracking-[0.01em] mb-2.5 uppercase" style={{ color: '#19150F' }}>
                      {p.title}
                    </h2>

                    {saved.length > 0 && (
                      <p data-testid={`card-saved-${p.id}`} className="-mt-1 mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: '#62400B' }}>
                        <Bookmark size={11} aria-hidden />
                        <span>In progress</span>
                        {saved.map(a => (
                          <span key={a.mode} className="tabular-nums">· {MODE_LABEL[a.mode]} {a.placedCount}/{p.people.length}</span>
                        ))}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] font-sans" style={{ color: '#4B4232' }}>
                      <span className="flex items-center gap-1"><LayoutGrid size={12} aria-hidden />{p.size}×{p.size}</span>

                      {(p.floors ?? 1) >= 2 && (
                        <span className="flex items-center gap-1">
                          <Building2 size={12} aria-hidden />
                          {(p.floors ?? 1)} floors
                        </span>
                      )}

                      <span className="flex items-center gap-[3px]" title={`${p.people.length} people`}>
                        <Users size={12} className="mr-0.5" aria-hidden />
                        {p.people.map(person => (
                          <span
                            key={person.id}
                            aria-hidden
                            style={{
                              width: 6, height: 6,
                              backgroundColor: person.accent,
                              opacity: person.isVictim ? 0.30 : 1,
                              boxShadow: person.isVictim ? 'none' : `0 0 3px ${person.accent}55`,
                            }}
                          />
                        ))}
                      </span>

                      {records[p.id] && (
                        <span className="flex items-center gap-1 text-accent-text ml-auto tabular-nums font-mono text-[10px]">
                          <Timer size={11} aria-hidden />{fmt(records[p.id].bestSeconds)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

      </div>{/* /content column */}
    </motion.div>
  )
}

// ── ResumeChooser ───────────────────────────────────────────────────────────
// Asked when a case holds saved progress that the selected mode alone would not
// open. Each saved attempt resumes in its own mode; a new game is offered only
// in a mode with nothing saved, so this dialog never replaces saved progress.

function ResumeChooser({ puzzle, attempts, mode, onStart, onClose }: {
  puzzle: Puzzle
  attempts: readonly InProgressSummary[]
  mode: GameMode
  onStart: (m: GameMode) => void
  onClose: () => void
}) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const firstRef = useRef<HTMLButtonElement>(null)
  useEffect(() => { firstRef.current?.focus() }, [])
  const freshMode = attempts.some(a => a.mode === mode) ? null : mode
  const savedModes = attempts.map(a => MODE_LABEL[a.mode]).join(' and ')

  function onKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
    if (e.key !== 'Tab' || !panelRef.current) return
    const buttons = Array.from(panelRef.current.querySelectorAll('button'))
    const first = buttons[0], last = buttons[buttons.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--overlay-scrim)' }}
      onClick={onClose}
      onKeyDown={onKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-testid="resume-chooser"
    >
      <div
        ref={panelRef}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm border bg-bg-surface p-5"
        style={{ borderColor: 'var(--color-border-strong)', boxShadow: 'var(--shadow-elevated)' }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">{puzzle.caseNumber}</p>
        <p id={titleId} className="mt-1 font-display text-lg font-bold uppercase tracking-[0.08em] text-text-primary">
          {puzzle.title}
        </p>
        <p id={descriptionId} className="mt-1 mb-4 font-mono text-[12px] leading-snug text-text-secondary">
          Saved progress in {savedModes}. Each attempt opens in its own mode{freshMode ? '' : '; to start one again, open it and clear the board'}.
        </p>
        <div className="flex flex-col gap-2">
          {attempts.map((a, i) => (
            <button
              key={a.mode}
              ref={i === 0 ? firstRef : undefined}
              type="button"
              data-testid={`resume-${a.mode}`}
              onClick={() => onStart(a.mode)}
              className="focus-ring min-h-[44px] border px-3 py-2 text-left"
              style={{ borderColor: 'var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}
            >
              <span className="block font-display text-sm font-bold uppercase tracking-[0.1em] text-text-primary">Resume {MODE_LABEL[a.mode]}</span>
              <span className="block font-mono text-[11px] tabular-nums text-text-secondary">
                {a.placedCount} / {puzzle.people.length} placed · {fmt(a.elapsedSeconds)}{i === 0 && attempts.length > 1 ? ' · most recent' : ''}
              </span>
            </button>
          ))}
          {freshMode && (
            <button
              type="button"
              data-testid="resume-fresh"
              onClick={() => onStart(freshMode)}
              className="focus-ring min-h-[44px] border px-3 py-2 text-left"
              style={{ borderColor: 'var(--color-border-strong)' }}
            >
              <span className="block font-display text-sm font-bold uppercase tracking-[0.1em] text-text-primary">New {MODE_LABEL[freshMode]} game</span>
              <span className="block font-mono text-[11px] text-text-secondary">Your saved {savedModes} progress is kept.</span>
            </button>
          )}
          <button
            type="button"
            data-testid="resume-cancel"
            onClick={onClose}
            className="focus-ring min-h-[44px] px-3 font-display text-sm uppercase tracking-[0.1em] text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ModeBtn ──────────────────────────────────────────────────────────────────

function ModeBtn({ active, onClick, icon, title, desc }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string
}) {
  return (
    <button
      onClick={onClick}
      className="focus-ring flex-1 min-h-11 px-3 py-2 flex items-center gap-2 transition-colors"
      style={{
        background: active ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : 'transparent',
        color: active ? 'var(--color-accent-text)' : 'var(--color-text-secondary)',
        boxShadow: active ? 'inset 0 0 0 1px var(--color-border-strong)' : undefined,
        borderBottom: active ? '2px solid var(--color-accent)' : '2px solid transparent',
        minHeight: 44,
      }}
    >
      {icon}
      <span className="text-left">
        <span className="block font-display font-bold text-xs leading-tight tracking-wide uppercase">{title}</span>
        <span className="block text-[10px] font-mono opacity-70 leading-tight">{desc}</span>
      </span>
    </button>
  )
}

// ── DailyPanel ───────────────────────────────────────────────────────────────

function DailyPanel({
  puzzles,
  completedIds,
  records,
  onSelect,
}: {
  puzzles: Puzzle[]
  completedIds: string[]
  records: Record<string, CaseRecord>
  onSelect: (id: string) => void
}) {
  const daily = useMemo(() => dailyPuzzle(puzzles), [puzzles])
  const streak = useMemo(() => loadStreak(), [])
  const live = useMemo(() => streakIsLive(streak), [streak])

  if (!daily) return null

  const solved = completedIds.includes(daily.id)

  return (
    <section
      aria-labelledby="daily-case-heading"
      className="mb-4 border border-accent-strong bg-bg-surface p-3 sm:p-4"
      style={{ boxShadow: 'var(--shadow-cut)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-text">
            {live && streak.current > 1
              ? `Today's case · ${streak.current}-day streak`
              : "Today's case"}
          </p>
          <h2
            id="daily-case-heading"
            className="mt-1 truncate font-display font-bold uppercase tracking-[0.04em] text-text-primary"
            style={{ fontSize: 17 }}
          >
            {daily.title}
          </h2>
          <p className="mt-1 font-mono text-[11px] text-text-secondary">
            {daily.caseNumber} · {daily.difficulty} · {daily.size}×{daily.size}
            {/* The daily is always drawn from the two-storey pool, so say so
                here as well as on the tier rows and case cards — otherwise the
                one case most players open is the single place the second floor
                goes unannounced. Derived from the puzzle, never hardcoded. */}
            {(daily.floors ?? 1) >= 2 && <> · {daily.floors} floors</>}
            {solved && (
              <span
                className="ml-2 text-[10px] font-display font-bold uppercase tracking-[0.18em] px-1.5 py-[3px] leading-none"
                style={{
                  color: 'var(--color-accent-text)',
                  border: '1px solid color-mix(in srgb, var(--color-accent) 60%, transparent)',
                  background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
                  transform: 'rotate(-1.5deg)',
                  display: 'inline-block',
                }}
              >
                CLOSED
              </span>
            )}
          </p>
          {records[daily.id] && (
            <p className="mt-1 font-mono text-[10px] text-accent-text flex items-center gap-1">
              <Timer size={11} aria-hidden /> best {fmt(records[daily.id].bestSeconds)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onSelect(daily.id)}
          className="focus-ring min-h-11 border border-accent-strong bg-accent px-4 font-sans text-xs font-bold uppercase tracking-[0.12em] text-on-accent"
          style={{ minHeight: 44 }}
          aria-label={solved ? "Play today's case again" : "Play today's case"}
        >
          {solved ? 'Play again' : 'Play'}
        </button>
      </div>
    </section>
  )
}

// ── BadgeShelf ───────────────────────────────────────────────────────────────

function BadgeShelf({
  puzzles,
  completedIds,
  records,
}: {
  puzzles: Puzzle[]
  completedIds: string[]
  records: Record<string, CaseRecord>
}) {
  const [open, setOpen] = useState(false)
  const streak = useMemo(() => loadStreak(), [])
  const badges = useMemo(
    () => computeBadges({ puzzles, completedIds, records, streak }),
    [puzzles, completedIds, records, streak],
  )
  const earnedCount = badges.filter(b => b.earned).length

  return (
    <div data-testid="badge-shelf" className="mb-4 border border-border-strong bg-bg-surface" style={{ boxShadow: 'var(--shadow-cut)' }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-controls="badge-shelf-items"
        className="focus-ring w-full flex items-center justify-between px-3 sm:px-4 py-3 text-left"
        style={{ minHeight: 44 }}
      >
        <span className="font-display font-bold uppercase tracking-[0.14em] text-text-primary" style={{ fontSize: 13 }}>
          Achievements
        </span>
        <span className="font-mono text-[11px] text-text-secondary flex items-center gap-2">
          {earnedCount}/{badges.length}
          <span
            aria-hidden
            className="font-mono text-[10px]"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display: 'inline-block', transition: 'transform 0.2s' }}
          >
            ▾
          </span>
        </span>
      </button>

      {open && (
        <div id="badge-shelf-items" className="px-3 sm:px-4 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {badges.map(badge => (
            <div
              key={badge.id}
              className="flex items-start gap-2 py-2 border-t border-border-strong"
              style={{ opacity: badge.earned ? 1 : 0.4 }}
            >
              <span
                aria-hidden
                className="mt-0.5 font-mono text-[13px]"
                style={{ color: badge.earned ? 'var(--color-accent-text)' : 'var(--color-text-muted)' }}
              >
                {badge.earned ? '◆' : '◇'}
              </span>
              <div className="min-w-0">
                <p
                  className="font-display font-bold uppercase tracking-[0.06em]"
                  style={{ fontSize: 12, color: 'var(--color-text-primary)' }}
                >
                  {badge.name}
                </p>
                <p
                  className="font-mono leading-snug"
                  style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}
                >
                  {badge.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
