import { Suspense, lazy, useState, useEffect, useRef } from 'react'
import { MotionConfig } from 'framer-motion'
import { useGame } from './hooks/useGame'
import { useTheme } from './hooks/useTheme'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/GameScreen'
import ErrorBoundary from './components/ErrorBoundary'

const importVictory = () => import('./components/VictoryScreen')
const importReleases = () => import('./components/ReleaseNotes')
const VictoryScreen = lazy(importVictory)
const ReleaseNotes = lazy(importReleases)
// R1 reference case: `?ref=nightplan` | `?ref=plan3d` plays very-easy-1 in one of
// the two competing board variants. Honoured in production builds on purpose:
// the reference build is what the owner reviews.
const ReferenceGame = lazy(() => import('./reference/ReferenceGame'))
// `?ref=city`: visual-language prototype of the city / casebook (R2).
const CityMap = lazy(() => import('./reference/city/CityMap'))
const isCityRoute = () => new URLSearchParams(window.location.search).get('ref') === 'city'
function referenceVariant(): 'nightplan' | 'plan3d' | 'illustrated' | null {
  const v = new URLSearchParams(window.location.search).get('ref')
  return v === 'nightplan' || v === 'plan3d' || v === 'illustrated' ? v : null
}

function Fallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-deep">
      <span className="text-paper-muted text-xs font-sans tracking-widest animate-pulse">Loading…</span>
    </div>
  )
}

export default function App() {
  // `reducedMotion="user"` makes EVERY Framer animation below respect the OS
  // setting. The global CSS block in index.css only silences CSS animations —
  // it never touched Framer's JS-driven springs, so without this the whole app
  // ignored prefers-reduced-motion.
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AppInner />
      </MotionConfig>
    </ErrorBoundary>
  )
}

function AppInner() {
  const game = useGame()
  const theme = useTheme()
  const [aux, setAux] = useState<'none' | 'releases'>('none')

  useEffect(() => { window.scrollTo(0, 0) }, [game.screen, aux])

  // Dev deep link: `?case=<id>` opens a case directly so the scene QA loop
  // (screenshots, diagnostics) does not have to click through the catalog.
  // Only honoured once, on the home screen, and never in production builds.
  const refVariant = useRef(referenceVariant()).current
  const deepLinked = useRef(false)
  useEffect(() => {
    if (!import.meta.env.DEV || deepLinked.current) return
    const id = new URLSearchParams(window.location.search).get('case')
    if (!id || game.screen !== 'home' || !game.puzzles.some(p => p.id === id)) return
    deepLinked.current = true
    game.start(id, game.mode)
  }, [game])

  // Warm the split chunks on idle so the win / releases transition never
  // stalls on a mid-animation fetch (which caused a visible repaint hiccup).
  useEffect(() => {
    const warm = () => { importVictory(); importReleases() }
    const ric = (window as any).requestIdleCallback
    if (ric) ric(warm); else setTimeout(warm, 400)
  }, [])

  function nextCase() {
    if (!game.puzzle) return
    const order = game.puzzles.map(p => p.id)
    const next = order[order.indexOf(game.puzzle.id) + 1]
    if (next) game.start(next, game.mode)
  }

  if (isCityRoute()) {
    return (
      <Suspense fallback={<Fallback />}>
        <CityMap game={game} />
      </Suspense>
    )
  }

  if (refVariant) {
    return (
      <Suspense fallback={<Fallback />}>
        <ReferenceGame variant={refVariant} game={game} />
      </Suspense>
    )
  }

  // Cold start: the 60-case catalog is generated one case per macrotask AFTER
  // first paint, so the shell is on screen and interactive instead of the tab
  // hanging on a blank page for the length of the build. A warm cache resolves
  // on the first tick and never renders this.
  if (game.catalogProgress && !game.puzzles.length) {
    const { done, total } = game.catalogProgress
    return (
      <div className="min-h-screen bg-bg-base text-text-primary font-sans flex flex-col items-center justify-center gap-3 px-6">
        <p className="font-display text-lg font-bold uppercase tracking-wide">Alibi</p>
        <p
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-text-muted"
          role="status"
          aria-live="polite"
        >
          Assembling the case index — {done} of {total}
        </p>
        <div
          className="h-1 w-56 max-w-full"
          style={{ background: 'color-mix(in srgb, var(--color-text-primary) 14%, transparent)' }}
        >
          <div
            className="h-full transition-[width] duration-150"
            style={{ width: `${Math.round((done / Math.max(1, total)) * 100)}%`, background: 'var(--color-accent)' }}
          />
        </div>
      </div>
    )
  }

  // The solving screen wants full width; everything else sits in a phone frame.
  if (aux === 'none' && game.screen === 'game' && game.puzzle) {
    return (
      <div className="min-h-screen bg-bg-deep text-paper font-sans">
        <GameScreen
          puzzle={game.puzzle}
          mode={game.mode}
          marks={game.marks}
          marksPerFloor={game.marksPerFloor}
          activeFloor={game.activeFloor}
          conflicts={game.conflicts}
          placedOf={game.placedOf}
          selectedPerson={game.selectedPerson}
          tool={game.tool}
          hintsLeft={game.hintsLeft}
          timer={game.timer}
          hideTimer={game.hideTimer}
          canUndo={game.history.length > 0}
          canRedo={game.future.length > 0}
          feedback={game.feedback}
          accusationsLeft={game.accusationsLeft}
          revealed={game.revealed}
          attempts={game.attempts}
          resolvedClues={game.resolvedClues}
          onSelectPerson={game.selectPerson}
          onSetTool={game.setTool}
          onCell={game.clickCell}
          onToggleClue={game.toggleClue}
          onUndo={game.undo}
          onRedo={game.redo}
          onClear={game.clearAll}
          onHint={game.hint}
          onAssist={game.assist}
          onToggleTimer={game.toggleTimer}
          onSubmit={game.submit}
          onReveal={game.reveal}
          onStartOver={game.startOver}
          onDismissFeedback={game.dismissFeedback}
          onBack={() => game.navigate('home')}
          onSwitchFloor={game.switchFloor}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-inset text-paper font-sans">
      {/*
        The app shell is FULL-BLEED. It used to be `max-w-[560px] lg:max-w-4xl`
        inside a centring flex, which capped the ENTIRE application at 896px on
        any monitor — a simulated phone frame. Every downstream `max-w-*` was
        effectively dead code because this ceiling bound first.
        Screens now own their own measure: a reading-width column where that
        helps (HomeScreen, ReleaseNotes), and the full viewport where the work
        happens (GameScreen). Do not reintroduce a width cap here.
      */}
      <div className="relative w-full min-h-screen bg-bg-deep">
        <Suspense fallback={<Fallback />}>
          {aux === 'releases' && <ReleaseNotes onBack={() => setAux('none')} />}

          {aux === 'none' && game.screen === 'home' && (
            <HomeScreen
              puzzles={game.puzzles}
              completedIds={game.completedIds}
              records={game.records}
              mode={game.mode}
              onSetMode={game.setMode}
              onSelect={(id) => game.start(id, game.mode)}
              inProgress={game.inProgress}
              onResume={game.start}
              onOpenReleases={() => setAux('releases')}
              resolvedTheme={theme.resolved}
              onToggleTheme={theme.toggle}
            />
          )}

          {aux === 'none' && game.screen === 'victory' && game.puzzle && game.murderer && (
            <VictoryScreen
              puzzle={game.puzzle}
              murderer={game.murderer}
              timer={game.timer}
              elapsedSeconds={game.elapsedSeconds}
              hintsLeft={game.hintsLeft}
              completedIds={game.completedIds}
              onNext={nextCase}
              onPlayUnsolved={(id) => game.start(id, game.mode)}
              onHome={() => game.navigate('home')}
            />
          )}
        </Suspense>
      </div>
    </div>
  )
}
