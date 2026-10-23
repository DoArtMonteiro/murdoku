import { useEffect, useRef, useState } from 'react'
import type { BoardVariant } from './contract'
import { REFERENCE_CASE_ID } from './contract'
import type { BoardModule, GameApi } from './shell/types'
import { Shell } from './shell/Shell'
import { useTheme } from '../hooks/useTheme'
import { backHref, peekSavedMode, readStoredMode, restoreStoredMode } from './shell/util'
import './shell/shell.css'

// Static strings so Vite can split each board into its own chunk.
const loaders: Record<BoardVariant, () => Promise<{ default: BoardModule['Board']; boardLayout: BoardModule['boardLayout']; BoardLabels?: BoardModule['Board'] }>> = {
  nightplan: () => import('./boards/nightplan'),
  plan3d: () => import('./boards/plan3d'),
  illustrated: () => import('./boards/illustrated'),
}

/**
 * Reference case host: waits for the catalog, starts very-easy-1 (classic),
 * loads the requested board lazily and hands everything to the shared shell.
 * `&case=<id>` plays another catalog case in the same shell — the scalability
 * check for the Night Plan direction; very-easy-1 stays the judged reference.
 */
export default function ReferenceGame({ variant, game }: { variant: BoardVariant; game: GameApi }) {
  const theme = useTheme()
  const resolved: 'light' | 'dark' = theme.resolved === 'light' ? 'light' : 'dark'
  const [board, setBoard] = useState<BoardModule | null>(null)
  const [boardError, setBoardError] = useState(false)

  useEffect(() => {
    let live = true
    setBoard(null)
    loaders[variant]()
      .then(m => { if (live) setBoard({ Board: m.default, boardLayout: m.boardLayout, Labels: m.BoardLabels }) })
      .catch(() => { if (live) setBoardError(true) })
    return () => { live = false }
  }, [variant])

  const started = useRef(false)
  const prevMode = useRef<string | null | undefined>(undefined)
  const ready = game.puzzles.length > 0
  const { start } = game
  const asked = new URLSearchParams(window.location.search).get('case')
  const caseId = asked && game.puzzles.some(p => p.id === asked) ? asked : REFERENCE_CASE_ID
  useEffect(() => {
    if (!ready || started.current) return
    started.current = true
    if (game.puzzle?.id === caseId) return
    // Never disturb the main UI's save: a saved detective attempt on this case is
    // resumed in its own mode (so the autosave keeps it), a classic one resumes
    // classic, otherwise start classic. start() also rewrites the stored mode
    // preference; it is put back below.
    prevMode.current = readStoredMode()
    const saved = peekSavedMode(caseId)
    start(caseId, saved === 'detective' ? 'detective' : 'classic')
  }, [ready, start, game.puzzle?.id, caseId])
  useEffect(() => {
    if (prevMode.current === undefined || game.puzzle?.id !== caseId) return
    const restore = () => restoreStoredMode(prevMode.current ?? null)
    restore()
    const t = setTimeout(restore, 50)
    return () => clearTimeout(t)
  }, [game.puzzle?.id, game.mode, caseId])

  if (game.puzzle && game.puzzle.id === caseId) {
    return (
      <>
        <Shell game={game} board={board} variant={variant} theme={resolved} onToggleTheme={theme.toggle} />
        {boardError && <p className="rs-boarderr" role="alert">The {variant} board failed to load; the plan is still playable.</p>}
      </>
    )
  }

  if (!ready) {
    const p = game.catalogProgress
    return (
      <div className="rs-loading" data-testid="ref-loading">
        <p className="rs-loading-title">Alibi</p>
        <p role="status" aria-live="polite">{p ? `Assembling the case file: ${p.done} of ${p.total}` : 'Assembling the case file'}</p>
        {p && <div className="rs-bar"><div style={{ width: `${Math.round((p.done / Math.max(1, p.total)) * 100)}%` }} /></div>}
      </div>
    )
  }

  // Catalog loaded but the reference case is not (yet) started.
  return (
    <div className="rs-loading" data-testid="ref-loading">
      <p role="status">{started.current ? 'Opening the reference case' : 'Assembling the case file'}</p>
      <a className="rs-btn" href={backHref()}>Back to Alibi</a>
    </div>
  )
}
