import { useState, useEffect, useId, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Undo2, Redo2, Trash2, Lightbulb, X as XIcon, MousePointerClick, Pencil,
  HelpCircle, Eye, EyeOff, Info, Palette, Wand2, MoreHorizontal,
} from 'lucide-react'
import type { Puzzle, CellMark, GameMode, Furniture, FurnitureType } from '../core/types'
import { resolveClueHighlights, resolveCluePreviewFloor } from '../core/ux'
import type { Tool } from '../hooks/useGame'
import { makeFrame, makeStoreyFrame, type StoreyView } from '../scene3d/units'
import IsoBoard from './IsoBoard'
import SuspectCard from './SuspectCard'
import CaseProgressStrip from './CaseProgressStrip'
import CaseNotes from './CaseNotes'
import HowToPlay from './HowToPlay'
import FurniturePicker from './FurniturePicker'

interface Props {
  puzzle: Puzzle
  mode: GameMode
  marks: CellMark[][]
  /** Per-floor marks — index 0 = ground, index 1 = upstairs. */
  marksPerFloor?: CellMark[][][]
  /** Active floor index. Only relevant when puzzle.floors === 2. */
  activeFloor?: 0 | 1
  conflicts: Set<string>
  placedOf: Record<string, { row: number; col: number; floor?: number; locked?: boolean }>
  selectedPerson: string | null
  tool: Tool
  hintsLeft: number
  timer: string
  hideTimer: boolean
  canUndo: boolean
  canRedo: boolean
  /** 'wrong' says only that the account is not the solution; 'cold' = no accusations left. */
  feedback: 'none' | 'incomplete' | 'wrong' | 'blocked' | 'cold'
  /** Wrong accusations left before the case goes cold. */
  accusationsLeft?: number
  /** The solution was shown for this case: nothing on it counts. */
  revealed?: boolean
  /** Times this case has been started over. */
  attempts?: number
  resolvedClues: string[]
  onSelectPerson: (id: string) => void
  onSetTool: (t: Tool) => void
  onCell: (r: number, c: number) => void
  onToggleClue: (id: string) => void
  onUndo: () => void
  onRedo: () => void
  onClear: () => void
  onHint: () => void
  onAssist?: () => void
  onToggleTimer: () => void
  onSubmit: () => void
  /** Cold case: show the solution (the case is not counted as solved). */
  onReveal?: () => void
  /** Cold case: clear the board and start a fresh attempt with a full budget. */
  onStartOver?: () => void
  onDismissFeedback: () => void
  onBack: () => void
  /** Switch active floor — only called when puzzle.floors === 2. */
  onSwitchFloor?: (floor: 0 | 1) => void
}

const DIFF_COLOR: Record<string, string> = {
  'Very Easy': 'var(--diff-very-easy-text)', 'Easy': 'var(--diff-easy-text)', 'Medium': 'var(--diff-medium-text)', 'Hard': 'var(--diff-hard-text)', 'Expert': 'var(--diff-expert-text)', 'Master': 'var(--diff-master-text)',
}
const HELP_KEY = 'murdoku_seen_help'

// ── Legend content — shared by the desktop Case File rail (always expanded)
//    and the mobile/narrow disclosure. One source, no drift.
function LegendContent() {
  return (
    <div
      className="border bg-bg-surface p-3 text-[11px] font-mono text-text-secondary grid gap-1.5"
      style={{ borderColor: 'var(--color-border-subtle)', boxShadow: 'var(--shadow-cut)' }}
    >
      <p>• <b className="text-text-primary">Coloured areas</b> are rooms (labelled). Different tint &amp; floor = different room.</p>
      <p>• <b className="text-text-primary">Furniture icons</b> are scene decoration that clues refer to (a chair, a rug, a plant…).</p>
      <p>• <b className="text-text-primary">✕</b> marks a cell where nobody is; faint ✕ is auto-added when you lock a row/column.</p>
      <p>• A glowing ring = a placed suspect; a red ring means two suspects share a row or column.</p>
    </div>
  )
}

export default function GameScreen(props: Props) {
  const {
    puzzle, mode, marks, conflicts, placedOf, selectedPerson, tool, hintsLeft,
    timer, hideTimer, feedback, resolvedClues,
    onSelectPerson: selectPerson, onSetTool: setTool, onCell: commitCell,
  } = props
  const cluesOf: Record<string, string[]> = {}
  for (const ct of puzzle.clues) (cluesOf[ct.clue.person] ||= []).push(ct.text)
  const placedCount = Object.keys(placedOf).length
  const detective = mode === 'detective'
  // Locating a clue on the board is HELP, so it is opt-in per suspect and never
  // fires just because a suspect is selected — selection is a placement tool.
  //
  // The board answers with an amber square around the target cells. There is
  // deliberately no drawn connector: a line between two independently-sized
  // layout regions can only be positioned by guessed percentages, and it landed
  // in open space at every viewport that wasn't the one it was tuned on.
  const [locatedPerson, setLocatedPerson] = useState<string | null>(null)
  const activeFloor = props.activeFloor ?? 0
  const clueHighlight = locatedPerson ? resolveClueHighlights(puzzle, locatedPerson, activeFloor) : null
  const toggleCluePreview = (personId: string) => {
    if (locatedPerson === personId) {
      setLocatedPerson(null)
      return
    }
    const floor = resolveCluePreviewFloor(puzzle, personId)
    if (floor !== null && floor !== activeFloor) props.onSwitchFloor?.(floor)
    setLocatedPerson(personId)
  }
  const clueHighlightLabel = locatedPerson
    ? cluesOf[locatedPerson]?.join(' · ') || 'Selected suspect clue'
    : undefined

  const [help, setHelp] = useState(false)
  const [legend, setLegend] = useState(false)
  const [storeyView, setStoreyView] = useState<StoreyView>('ghost')
  const [placementArmed, setPlacementArmed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const menuPanelRef = useRef<HTMLDivElement>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const leaveTitleId = useId()
  const leaveDescriptionId = useId()
  const clearTitleId = useId()
  const clearDescriptionId = useId()
  const stayRef = useRef<HTMLButtonElement>(null)
  const cancelClearRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (tool !== 'place') setPlacementArmed(false)
  }, [tool])

  const selectForPlacement = useCallback((personId: string) => {
    selectPerson(personId)
    if (tool === 'place') setPlacementArmed(true)
  }, [selectPerson, tool])

  const activatePlaceTool = useCallback(() => {
    setTool('place')
    if (selectedPerson) setPlacementArmed(true)
  }, [setTool, selectedPerson])

  const handleBoardCell = useCallback((row: number, col: number) => {
    if (tool === 'place' && !placementArmed) return
    commitCell(row, col)
    if (tool === 'place') setPlacementArmed(false)
  }, [commitCell, placementArmed, tool])

  // Furniture decoration editor
  const [showDecor, setShowDecor] = useState(false)
  const [placingFurniture, setPlacingFurniture] = useState<FurnitureType | null>(null)
  const [placingRotation, setPlacingRotation] = useState<0 | 90 | 180 | 270>(0)
  const [customFurniture, setCustomFurniture] = useState<Furniture[]>([])

  // NOT YET PORTED to the isometric board: decor placement needs a cell-click
  // mode that competes with suspect placement, and the prototype slice
  // deliberately keeps one click meaning one thing. The state and handler are
  // retained rather than deleted so the feature can be reconnected once the
  // isometric interaction model is settled.
  void customFurniture
  void handlePlaceFurniture

  function handlePlaceFurniture(r: number, c: number) {
    if (!placingFurniture) return
    setCustomFurniture(prev => {
      const sameSpot = prev.findIndex(f => f.row === r && f.col === c && f.type === placingFurniture)
      if (sameSpot >= 0) return prev.filter((_, i) => i !== sameSpot)
      const cleared = prev.filter(f => !(f.row === r && f.col === c))
      return [...cleared, { type: placingFurniture, row: r, col: c, rotation: placingRotation }]
    })
  }

  function handleRotatePlacing() {
    setPlacingRotation(prev => ((prev + 90) % 360) as 0 | 90 | 180 | 270)
  }

  // Every Accuse press bumps this, whether or not `feedback` changes value —
  // two identical rejections in a row must still re-announce themselves.
  const [submitNonce, setSubmitNonce] = useState(0)
  function handleSubmit() {
    setSubmitNonce(n => n + 1)
    props.onSubmit()
  }

  // ── Aria-live announcement region ─────────────────────────────────────────
  // One polite status region owned by GameScreen. It fires a concise message
  // whenever the board state changes in a way the player needs confirmed:
  //   • a suspect placed or lifted
  //   • a cell manually marked or unmarked empty
  //   • Assist crossed off cells (auto-X sweep)
  //   • accusation outcome (incomplete / rejected)
  // Solved is not announced here — a correct submit transitions to the victory
  // screen, so GameScreen is no longer mounted when that happens.
  //
  // Implementation: a useRef snapshot of the previous render's props lets us
  // diff exactly what changed without duplicating game logic. On the very first
  // effect run we seed the ref WITHOUT announcing, so the full initial board
  // state is never read aloud.
  const [liveMsg, setLiveMsg] = useState('')
  const prevPlacedOf = useRef<Props['placedOf'] | null>(null)
  const prevMarks = useRef<CellMark[][] | null>(null)
  const prevFeedback = useRef<Props['feedback']>('none')
  const prevSubmitNonce = useRef(0)

  // Use the placement's floor, which can differ from the currently viewed floor.
  const roomName = useCallback((row: number, col: number, floor = 0): string => {
    const rid = (puzzle.roomOfByFloor?.[floor] ?? puzzle.roomOf)[row]?.[col]
    return puzzle.rooms.find(r => r.id === rid)?.name ?? ''
  }, [puzzle])

  useEffect(() => {
    // First render: seed refs without announcing
    if (prevPlacedOf.current === null) {
      prevPlacedOf.current = placedOf
      prevMarks.current = marks
      prevFeedback.current = feedback
      prevSubmitNonce.current = submitNonce
      return
    }

    const prev = prevPlacedOf.current
    const prevMk = prevMarks.current!

    // ── 1. Placement / lift ───────────────────────────────────────────────
    // Check placedOf before marks so the mass auto-X that follows a placement
    // is NOT mis-reported as Assist.
    const placedNow = Object.keys(placedOf)
    const placedBefore = Object.keys(prev)
    const changedPlacement = (id: string) => !prev[id] || prev[id].row !== placedOf[id].row
      || prev[id].col !== placedOf[id].col || (prev[id].floor ?? 0) !== (placedOf[id].floor ?? 0)
    if (placedNow.length !== placedBefore.length || placedNow.some(changedPlacement)) {

      // Find what changed
      const added = placedNow.filter(changedPlacement)
      const removed = placedBefore.filter(id => !placedOf[id])

      let msg = ''
      if (added.length > 0) {
        const id = added[0]
        const p = puzzle.people.find(p => p.id === id)
        const cell = placedOf[id]
        const room = roomName(cell.row, cell.col, cell.floor)
        msg = `${p?.name ?? id} placed${room ? ` in the ${room}` : ''}, row ${cell.row + 1} column ${cell.col + 1}`
      } else if (removed.length > 0) {
        const id = removed[0]
        const p = puzzle.people.find(p => p.id === id)
        msg = `${p?.name ?? id} lifted`
      }
      if (msg) setLiveMsg(msg)

      // Update refs and skip further checks — placement may auto-X cells
      prevPlacedOf.current = placedOf
      prevMarks.current = marks
      prevFeedback.current = feedback
      prevSubmitNonce.current = submitNonce
      return
    }

    // ── 2. Assist sweep (many new auto-X's in one go) ─────────────────────
    let newAutoX = 0
    let newManualX = 0
    let unmarked = 0
    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        const was = prevMk[r][c]
        const now = marks[r][c]
        if (was.kind === 'empty' && now.kind === 'x') {
          if (now.auto) newAutoX++; else newManualX++
        } else if (was.kind === 'x' && now.kind === 'empty') {
          unmarked++
        }
      }
    }

    if (newAutoX > 1) {
      setLiveMsg(`Assist crossed off ${newAutoX} cell${newAutoX === 1 ? '' : 's'}`)
      prevPlacedOf.current = placedOf
      prevMarks.current = marks
      prevFeedback.current = feedback
      prevSubmitNonce.current = submitNonce
      return
    }

    // ── 3. Single manual mark / unmark ───────────────────────────────────
    if (newManualX === 1 || unmarked === 1) {
      setLiveMsg(newManualX === 1 ? 'Cell marked empty' : 'Cell mark removed')
      prevPlacedOf.current = placedOf
      prevMarks.current = marks
      prevFeedback.current = feedback
      prevSubmitNonce.current = submitNonce
      return
    }

    // ── 4. Accusation outcome ─────────────────────────────────────────────
    if (submitNonce !== prevSubmitNonce.current && feedback !== 'none') {
      const msg =
        feedback === 'incomplete' ? 'Accusation incomplete — place every person first' :
        feedback === 'blocked' ? 'Accusation blocked — that row or column is already taken' :
        feedback === 'wrong' ? "Accusation rejected — the account doesn't hold up" :
        feedback === 'cold' ? 'No accusations left — the case has gone cold' :
        ''
      if (msg) setLiveMsg(msg)
    }

    prevPlacedOf.current = placedOf
    prevMarks.current = marks
    prevFeedback.current = feedback
    prevSubmitNonce.current = submitNonce
  }, [feedback, marks, placedOf, puzzle.people, puzzle.size, roomName, submitNonce])

  // A miss or an illegal placement is a real rejection and earns the shake.
  // "You haven't finished yet" is guidance, not a mistake, so it only surfaces
  // the message — shaking there would scold the player for doing nothing wrong.
  //
  // A rejected accusation says ONE thing: the account does not hold up. It used
  // to report how many suspects were in the right spot and name the first rule
  // the arrangement broke, which turned the Accuse button into a free oracle a
  // script could walk to the answer with. Do not add detail back here.

  // What a rejected accusation may say. Every part is computed from the
  // player's OWN board and notes, never from the solution, so two different
  // wrong accounts that look alike on the board get identical words.
  const budgetWords = ['No accusations left.', 'One accusation left.', 'Two accusations left.']
  const wrongMessage = [
    "The account doesn't hold up.",
    props.accusationsLeft !== undefined ? budgetWords[props.accusationsLeft] : undefined,
    conflicts.size > 0 ? 'Two suspects share a row or column.' : undefined,
    detective && resolvedClues.length < puzzle.people.length
      ? `Not yet checked off: ${puzzle.people.filter(x => !resolvedClues.includes(x.id)).map(x => x.name).join(', ')}.`
      : undefined,
  ].filter(Boolean).join(' ')

  // ── Two-floor derivation ────────────────────────────────────────────────
  // Rows and columns are shared across storeys: a suspect upstairs consumes
  // that row and column for the ground floor too. The board has to SHOW that,
  // otherwise the rule is invisible and the second storey is just scenery.
  const floors = props.puzzle.floors ?? 1
  const twoFloor = floors > 1 && !!props.marksPerFloor
  const otherFloor = activeFloor === 0 ? 1 : 0
  const boardFrame = twoFloor ? makeStoreyFrame(puzzle.size, activeFloor, storeyView) : makeFrame(puzzle.size)
  const ghostMarks = twoFloor ? (props.marksPerFloor?.[otherFloor] ?? null) : null

  const blockedRows = new Set<number>()
  const blockedCols = new Set<number>()
  if (ghostMarks) {
    ghostMarks.forEach((row, r) => row.forEach((cell, c) => {
      if (cell.kind === 'person') { blockedRows.add(r); blockedCols.add(c) }
    }))
  }

  // CROSS-STOREY LOCK REVEAL.
  //
  // Rows and columns are shared across storeys — that is the whole two-floor
  // mechanic — so placing a suspect downstairs silently consumes the same row
  // and column upstairs. Silently is the problem: the player had to switch
  // floors to find out. These are the lanes that became blocked since the last
  // render, handed to the board so it can pulse them where they are, on the
  // floor the player is actually looking at.
  const prevBlocked = useRef<{ rows: Set<number>; cols: Set<number> }>({ rows: new Set(), cols: new Set() })
  const [flashRows, setFlashRows] = useState<ReadonlySet<number>>(new Set())
  const [flashCols, setFlashCols] = useState<ReadonlySet<number>>(new Set())
  const blockedKey = `${[...blockedRows].sort().join(',')}|${[...blockedCols].sort().join(',')}`
  useEffect(() => {
    const newRows = new Set([...blockedRows].filter(r => !prevBlocked.current.rows.has(r)))
    const newCols = new Set([...blockedCols].filter(c => !prevBlocked.current.cols.has(c)))
    prevBlocked.current = { rows: new Set(blockedRows), cols: new Set(blockedCols) }
    if (!newRows.size && !newCols.size) return
    setFlashRows(newRows)
    setFlashCols(newCols)
    const t = setTimeout(() => { setFlashRows(new Set()); setFlashCols(new Set()) }, 1500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockedKey])

  const hardReject = feedback === 'wrong' || feedback === 'blocked' || feedback === 'cold'

  // Replay the shake by restarting the animation IN PLACE rather than by
  // remounting via `key`. Remounting destroys the focused node, so a keyboard
  // user who presses Enter to accuse loses focus to <body> and has to tab back
  // to the CTA — on the game's primary action. Removing the class, forcing a
  // reflow, then re-adding it restarts a CSS animation while keeping the same
  // element (and therefore the focus ring and the screen-reader cursor).
  const ctaRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (submitNonce === 0 || !hardReject) return
    const el = ctaRef.current
    if (!el) return
    el.classList.remove('animate-shake')
    void el.offsetWidth // forced reflow — without it the re-add is coalesced
    el.classList.add('animate-shake')
  }, [submitNonce, hardReject])

  const hasProgress = marks.some(row => row.some(c => c.kind !== 'empty'))

  // Tool hotkeys. Switching tool previously meant leaving the board and
  // reaching for the toolbar under it on every single change, which is the most
  // repeated action in a solve. Draft is bound only in detective mode, where it
  // is the only mode that has the tool.
  // Close the mobile overflow menu when focus leaves it entirely.
  const closeMenu = useCallback(() => {
    setMenuOpen(false)
  }, [])

  // Dismiss on outside click.
  useEffect(() => {
    if (!menuOpen) return
    const onPointer = (e: MouseEvent) => {
      const panel = menuPanelRef.current
      const trigger = menuTriggerRef.current
      if (panel && !panel.contains(e.target as Node) && trigger && !trigger.contains(e.target as Node)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [menuOpen, closeMenu])

  // Escape + focus return for the mobile menu.
  useEffect(() => {
    if (!menuOpen) return
    // Move focus into the panel on open.
    const firstFocusable = menuPanelRef.current?.querySelector<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')
    firstFocusable?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu()
        menuTriggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen, closeMenu])

  const { onSetTool, onHint, onAssist } = props
  const modalOpen = help || confirmClear || confirmLeave || menuOpen
  useEffect(() => {
    if (modalOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const active = document.activeElement as HTMLElement | null
      // Never steal a keystroke from the case-notes field or any other input.
      if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active?.isContentEditable) return
      switch (event.key.toLowerCase()) {
        case 'p': activatePlaceTool(); break
        case 'x': onSetTool('x'); break
        case 'd': if (detective) onSetTool('draft'); else return; break
        case 'h': if (!detective) onHint(); else return; break
        case 'a': if (detective && onAssist) onAssist(); else return; break
        default: return
      }
      event.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, detective, activatePlaceTool, onSetTool, onHint, onAssist])

  useEffect(() => {
    try { if (!localStorage.getItem(HELP_KEY)) { setHelp(true); localStorage.setItem(HELP_KEY, '1') } } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const open = confirmLeave || confirmClear
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const focusTarget = confirmLeave ? stayRef.current : cancelClearRef.current
    focusTarget?.focus()
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setConfirmLeave(false)
      setConfirmClear(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
      previousFocus?.focus()
    }
  }, [confirmLeave, confirmClear])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="desk-surface bg-bg-base flex flex-col min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden"
    >
      {/* ── Screen-reader live region — always mounted so the first announcement
          is not swallowed. aria-atomic so partial text updates are read in full.
          aria-live="polite" defers until the user is idle. */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMsg}
      </div>

      <AnimatePresence>{help && <HowToPlay mode={mode} onClose={() => setHelp(false)} />}</AnimatePresence>

      {/*
        ── THREE-COLUMN DETECTIVE'S DESK ─────────────────────────────────────

        Architecture: CSS grid with `display:contents` wrapper trick.

        At mobile: the three wrapper divs (case-file-col, scene-col, dossier-col)
        are `contents` — they dissolve into the flow and the four sections
        (board, suspects, toolbar, accuse) sequence via `order-*` as if they were
        direct children of this flex column. DOM order preserved; no markup fork.

        At lg+: wrappers become `flex flex-col` grid cells — each column scrolls
        (or not) independently. The SCENE column is non-scrolling by design.

        Two-column grid at lg (1024px+):
          col 1: The Scene       — minmax(0,1fr)
          col 2: Dossier         — minmax(340px,420px)

        Below lg: single scrolling column.

        At desktop widths the whole header+body is capped at 1400px and centered,
        so the board and dossier read as one composed unit rather than being flung
        to opposite edges of a 1920px viewport. The cap is gated behind lg: so
        mobile stays an ordinary scrolling column.
      */}

      {/*
        ── Shared desktop content cap ───────────────────────────────────────
        Wraps BOTH header and body so the grid columns are identical in width
        and the title always centers over the board it names. `lg:flex-1
        lg:min-h-0` preserves the height chain that lets the board fill the
        available vertical space without overflowing.
      */}
      <div
        data-testid="game-content-cap"
        className="flex flex-col flex-1 min-h-0 lg:max-w-[1400px] lg:w-full lg:mx-auto"
      >

      {/* ── Header — two genuinely different layouts ───────────────────────
          MOBILE (below lg): compact three-slot bar — back | title+count | ⋯ menu
          DESKTOP (lg+): mirrors the body's two-column grid exactly so each
            header region aligns above what it names. col 1 (board) gets the
            case identity; col 2 (dossier) gets status and controls.
            Grid def is byte-identical to body's `minmax(0,1fr)_minmax(340px,420px)`
            with no gap at lg so columns cannot drift from the content below.
      */}
      <header
        className="case-masthead pt-safe flex-shrink-0 h-16 items-center
          grid grid-cols-[auto_1fr_auto] gap-0 px-2
          lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:px-0 lg:gap-0"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >

        {/* ── MOBILE: back button ── DESKTOP: hidden (back lives in col-1 below) */}
        <button
          onClick={() => hasProgress ? setConfirmLeave(true) : props.onBack()}
          className="focus-ring lg:hidden text-text-muted font-mono text-xs px-2 h-11 flex items-center whitespace-nowrap tracking-widest uppercase hover:text-text-secondary transition-colors"
        >
          ← Cases
        </button>

        {/* ── MOBILE col 2: title + count (centred in remaining space)
            ── DESKTOP col 1: back + centred title, filling the board column */}
        {/* The desktop back button inside this cell is `absolute left-0`, so
            centring here centres the TITLE on the board column rather than on
            the viewport — the viewport centring is what put the title 210px to
            the right of the board it names. */}
        <div className="min-w-0 flex items-center justify-center lg:h-full lg:px-3 lg:relative">

          {/* Back — desktop only, absolute-left so it doesn't push the title off-centre */}
          <button
            onClick={() => hasProgress ? setConfirmLeave(true) : props.onBack()}
            className="focus-ring hidden lg:flex text-text-muted font-mono text-xs px-2 h-11 items-center whitespace-nowrap tracking-widest uppercase hover:text-text-secondary transition-colors absolute left-0"
          >
            ← Cases
          </button>

          {/* Title block — centred within col 1 on desktop, centred in mobile track */}
          <div className="text-center min-w-0 px-1 flex flex-col justify-center">
            <h1 className="font-display text-text-primary text-sm sm:text-base font-bold leading-snug uppercase tracking-wide truncate">
              {puzzle.title}
            </h1>
            {/* Badges — visible sm+ on mobile; always visible on desktop */}
            <div className="hidden sm:flex lg:flex items-center justify-center gap-2 mt-0.5">
              <span
                className="text-[10px] font-mono tracking-[0.18em] whitespace-nowrap"
                style={{ color: DIFF_COLOR[puzzle.difficulty] }}
              >
                {puzzle.difficulty.toUpperCase()}
              </span>
              <span className="text-text-muted text-[10px] font-mono whitespace-nowrap tracking-wider">
                {puzzle.size}×{puzzle.size}
              </span>
              <span
                className="text-[10px] font-mono tracking-[0.15em] px-1.5 whitespace-nowrap"
                style={{
                  color: detective ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
                  background: detective ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : 'transparent',
                }}
              >
                {detective ? 'DETECTIVE' : 'CLASSIC'}
              </span>
            </div>
          </div>

          {/* Placement count — mobile only, inline beside title */}
          <span
            className="lg:hidden ml-2 flex-shrink-0 font-mono text-[11px] tabular-nums whitespace-nowrap px-1.5 py-0.5 leading-none"
            title="Suspects placed"
            style={{
              color: 'var(--color-accent-text)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 42%, transparent)',
            }}
          >
            <span className="sr-only">Suspects placed: </span>{placedCount}/{puzzle.people.length}
          </span>
        </div>

        {/* ── MOBILE col 3: overflow menu trigger ── DESKTOP: hidden */}
        <div className="lg:hidden relative flex-shrink-0">
          <button
            ref={menuTriggerRef}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="More options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="focus-ring text-text-muted w-11 h-11 flex items-center justify-center hover:text-text-secondary transition-colors"
          >
            <MoreHorizontal size={20} />
          </button>

          {/* Mobile overflow panel — absolutely positioned below trigger.
              Rendered with a plain conditional, NOT AnimatePresence. Measured
              in a real 390px viewport: wrapped in AnimatePresence the exit
              never completed, so the panel stayed in the DOM at opacity 0 with
              visibility:visible and tabIndex 0 items — invisible, but still
              focusable and still exposed to screen readers, so tabbing through
              the header landed on phantom "Hide timer" / "How to play"
              buttons. A 140ms fade is not worth a keyboard trap. */}
          {menuOpen && (
            <div
                ref={menuPanelRef}
                role="menu"
                className="absolute right-0 top-[calc(100%+4px)] z-40 min-w-[200px] border bg-bg-surface py-1"
                style={{
                  borderColor: 'var(--color-border-strong)',
                  boxShadow: 'var(--shadow-elevated)',
                }}
              >
                {/* Timer readout */}
                <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                  <p className="text-[10px] font-mono text-text-muted tracking-[0.2em] uppercase mb-1">Time elapsed</p>
                  {!hideTimer ? (
                    <span className="font-mono text-accent-text text-xl tabular-nums tracking-widest">{timer}</span>
                  ) : (
                    <span className="font-mono text-text-muted text-xl tracking-widest">— : — —</span>
                  )}
                </div>

                {/* Toggle timer action */}
                <button
                  role="menuitem"
                  onClick={() => { props.onToggleTimer(); closeMenu() }}
                  aria-label={hideTimer ? 'Show timer' : 'Hide timer'}
                  className="focus-ring w-full text-left px-4 py-3 flex items-center gap-3 text-[13px] font-mono text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                >
                  {hideTimer ? <EyeOff size={16} /> : <Eye size={16} />}
                  {hideTimer ? 'Show timer' : 'Hide timer'}
                </button>

                {/* How to play action */}
                <button
                  role="menuitem"
                  onClick={() => { setHelp(true); closeMenu() }}
                  aria-label="How to play"
                  className="focus-ring w-full text-left px-4 py-3 flex items-center gap-3 text-[13px] font-mono text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
                >
                  <HelpCircle size={16} />
                  How to play
                </button>
            </div>
          )}
        </div>

        {/* ── DESKTOP col 2: placement count + timer + controls (dossier column) */}
        <div className="hidden lg:flex items-center justify-end gap-1.5 px-3 h-full border-l" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <span
            className="font-mono text-[11px] tabular-nums whitespace-nowrap px-1.5 py-0.5 leading-none"
            title="Suspects placed"
            style={{
              color: 'var(--color-accent-text)',
              border: '1px solid color-mix(in srgb, var(--color-accent) 42%, transparent)',
            }}
          >
            <span className="sr-only">Suspects placed: </span>{placedCount}/{puzzle.people.length}
          </span>
          {!hideTimer && (
            <span className="font-mono text-accent-text text-sm tabular-nums tracking-widest">
              {timer}
            </span>
          )}
          <button
            onClick={props.onToggleTimer}
            aria-label={hideTimer ? 'Show timer' : 'Hide timer'}
            title={hideTimer ? 'Show timer' : 'Hide timer (relaxed)'}
            className="focus-ring text-text-muted w-11 h-11 flex items-center justify-center hover:text-text-secondary transition-colors"
          >
            {hideTimer ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
          <button
            onClick={() => setHelp(true)}
            aria-label="How to play"
            title="How to play"
            className="focus-ring text-text-muted w-11 h-11 flex items-center justify-center hover:text-text-secondary transition-colors"
          >
            <HelpCircle size={19} />
          </button>
        </div>
      </header>

      {/*
        Body grid — three columns at xl, two at lg, one below lg.
        `lg:grid` activates the column layout; below that it's a flex column.
        The wrapper divs use `contents` trick (below lg) / real grid cells (lg+).
      */}
      <div
        className={[
          'relative flex-1 flex flex-col min-h-0',
          // lg: two-column grid
          'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(340px,420px)] lg:grid-rows-[auto_minmax(0,1fr)] lg:min-h-0',
        ].join(' ')}
      >

        <div className="order-2 lg:order-none lg:col-span-full lg:row-start-1">
          <CaseProgressStrip
            puzzle={puzzle}
            placedOf={placedOf}
            conflicts={conflicts}
            selectedPerson={selectedPerson}
            onSelectPerson={selectForPlacement}
          />
        </div>

        {/* ── CASE FILE RAIL (left) ─────────────────────────────────────────
            Mobile: display:contents — contributes nothing to flow, children
            are ordered via order-* on the flex column above.
            lg: hidden (folded into dossier top via xl:block below).
            xl: first grid column — visible side rail.
        */}
        <div className="hidden" aria-hidden="true"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          {/* Case file rail inner — only rendered visually at xl */}
          <div className="hidden xl:flex xl:flex-col xl:gap-4 xl:p-4 xl:flex-1">

            {/* Case metadata block */}
            <div className="border-b pb-4" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <p className="text-[10px] font-mono text-text-muted tracking-[0.25em] uppercase mb-2">Case File</p>
              <p className="font-display font-bold text-text-primary text-lg uppercase tracking-wide leading-tight">{puzzle.title}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className="text-[10px] font-mono tracking-[0.18em]"
                  style={{ color: DIFF_COLOR[puzzle.difficulty] }}
                >
                  {puzzle.difficulty.toUpperCase()}
                </span>
                <span className="text-text-muted text-[10px] font-mono tracking-wider">{puzzle.size}×{puzzle.size}</span>
                <span
                  className="text-[10px] font-mono tracking-[0.15em] px-1.5"
                  style={{
                    color: detective ? 'var(--color-accent-text)' : 'var(--color-text-muted)',
                    background: detective ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : 'transparent',
                  }}
                >
                  {detective ? 'DETECTIVE' : 'CLASSIC'}
                </span>
              </div>
            </div>

            {/* Timer — large, case-file data */}
            <div className="border-b pb-4" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <p className="text-[10px] font-mono text-text-muted tracking-[0.25em] uppercase mb-2">Time Elapsed</p>
              {!hideTimer ? (
                <span className="font-mono text-accent-text text-3xl tabular-nums tracking-widest">{timer}</span>
              ) : (
                <span className="font-mono text-text-muted text-xl tracking-widest">— : — —</span>
              )}
              <button
                onClick={props.onToggleTimer}
                aria-label={hideTimer ? 'Show timer' : 'Hide timer'}
                className="focus-ring block mt-1.5 text-[10px] font-mono text-text-muted tracking-widest uppercase hover:text-text-secondary transition-colors"
              >
                {hideTimer ? '+ Show timer' : '— Hide timer'}
              </button>
            </div>

            {/* Progress */}
            <div className="border-b pb-4" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <p className="text-[10px] font-mono text-text-muted tracking-[0.25em] uppercase mb-2">Progress</p>
              <p className="font-mono text-text-secondary text-sm">
                <span className="text-text-primary font-bold">{placedCount}</span>
                <span className="text-text-muted"> / {puzzle.people.length}</span>
                <span className="text-text-muted text-[10px] ml-2">suspects placed</span>
              </p>
              <p className="font-mono text-text-secondary text-sm mt-1">
                <span className="text-text-primary font-bold">{hintsLeft}</span>
                <span className="text-text-muted text-[10px] ml-1">hints remaining</span>
              </p>
            </div>

            {/* Legend — always expanded on the desktop rail */}
            <div className="border-b pb-4" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <p className="text-[10px] font-mono text-text-muted tracking-[0.25em] uppercase mb-2">Reading the Scene</p>
              <LegendContent />
            </div>

            {/* Future features placeholder — deliberate empty state */}
            <div>
              <p className="text-[10px] font-mono text-text-muted tracking-[0.25em] uppercase mb-2">Detective&apos;s Notes</p>
              <div
                className="border p-3 min-h-[80px] flex items-center justify-center"
                style={{ borderColor: 'var(--color-border-subtle)', borderStyle: 'dashed' }}
              >
                <p className="text-[10px] font-mono text-text-muted tracking-wide text-center">
                  [ Coming soon ]
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ── THE SCENE (centre / full-width at lg) ────────────────────────
            Mobile: contents — board is order-1, toolbar is order-3.
            lg: first grid column (two-col layout), non-scrolling.
            xl: second grid column (three-col layout), non-scrolling.
            The board fills available height — no scrollbar, board always visible.
        */}
        <div
          className={[
            'contents',
            // lg: real grid column — non-scrolling, board fills the height
            'lg:flex lg:flex-col lg:min-h-0 lg:overflow-hidden lg:col-start-1 lg:row-start-2',
          ].join(' ')}
        >
          {/* ── Instruction line (mobile: order 0, desktop: inside centre) ── */}
          <p
            className={[
              'px-5 py-2 text-center text-text-muted text-[12px] font-mono tracking-wide flex-shrink-0',
              // hide on mobile — board is reachable sooner; HowToPlay overlay + ? button cover it
              'hidden lg:block order-0',
            ].join(' ')}
          >
            {detective
              ? 'Place to lock a row & column. Draft to pencil candidates. Assist to cross off provably empty cells. Hints unavailable — every placement must be yours to prove.'
              : 'Each person is in exactly one row and one column. Read the clues, place everyone, use hints if needed, then submit.'}
          </p>

          {/* ── Board slot ────────────────────────────────────────────────
              Single MapGrid instance — no mobile/desktop fork.

              Mobile: the slot is in normal flow (wrapper is `contents`).
                `aspect-square` on the inner makes it a natural square that
                grows to full column width.

              Desktop (lg+): the absolute fill is a size-query container. The
                square uses min(100cqw, 100cqh), so BOTH dimensions resolve from
                the shorter available axis instead of stretching after one axis
                hits a max constraint.
          */}
                {/* Floor switcher — only for two-storey houses. Single-floor
                    cases render exactly as before, with no extra chrome. */}
                {twoFloor && props.onSwitchFloor && (
                  <div className="order-1 shrink-0 grid gap-1.5 px-3 pb-2">
                    <div className="flex items-center gap-1" role="group" aria-label="Choose which floor to view">
                      {([0, 1] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => props.onSwitchFloor?.(f)}
                          aria-pressed={activeFloor === f}
                          className="focus-ring flex-1 min-h-[44px] border px-3 font-display text-[13px] font-medium uppercase tracking-[0.08em] transition-colors"
                          style={{
                            borderColor: activeFloor === f ? 'var(--color-accent-strong)' : 'var(--color-border-strong)',
                            background: activeFloor === f ? 'var(--color-accent)' : 'transparent',
                            color: activeFloor === f ? 'var(--color-on-accent)' : 'var(--color-text-secondary)',
                          }}
                        >
                          {f === 0 ? 'Ground floor' : 'Upstairs'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-4" role="group" aria-label="Choose multi-storey context">
                      {(['ghost', 'exploded'] as const).map(view => (
                        <button
                          key={view}
                          onClick={() => setStoreyView(view)}
                          aria-pressed={storeyView === view}
                          className="focus-ring min-h-[44px] font-mono text-[10px] uppercase tracking-[0.12em] transition-colors"
                          style={{ color: storeyView === view ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                        >
                          {view === 'ghost' ? 'Ghosted context' : 'Exploded overview'}
                        </button>
                      ))}
                    </div>
                    {storeyView === 'exploded' && (
                      <p className="text-center font-mono text-[10px] text-text-secondary px-3 pb-2">
                        Dashed lines connect the stair arrival across the separated floors.
                      </p>
                    )}
                  </div>
                )}

          <div className="order-1 lg:flex-1 lg:min-h-0 lg:relative">
            {/* Absolute fill at desktop only; on mobile this is just a normal div */}
            <div className="lg:absolute lg:inset-0 flex items-center justify-center p-2 pb-9 lg:p-3 lg:[container-type:size]">
              {/* Fits the shorter of available width / height, at the
                  board's OWN aspect ratio rather than a forced square — the
                  isometric scene is measurably wider than tall (see IsoBoard's
                  boardW/boardH), and forcing it into a square slot wasted a
                  large fraction of the box as empty space above or below it.
                  Mobile: w-full drives size, aspect-ratio derives the height
                    (parent has no fixed height so height:100% would be 0).
                  Desktop (lg+): container-query units pick whichever of
                    width/height is the binding constraint at this ratio. */}
              <div
                className="w-full lg:w-[min(100cqw,calc(100cqh*var(--board-ratio)))] lg:h-[min(100cqh,calc(100cqw/var(--board-ratio)))]"
                style={{
                  // Mirrors IsoBoard's boardW/boardH. Constants are imported
                  // from the renderer's projection source so the slot cannot
                  // silently retain an obsolete 104px floor height.
                  ['--board-ratio' as string]: String(boardFrame.width / boardFrame.height),
                  aspectRatio: 'var(--board-ratio)',
                }}
              >
                {/* ISOMETRIC DOLLHOUSE — a projection of the same logical
                    grid MapGrid draws. Identical props, identical rules; only
                    the presentation differs. MapGrid is kept importable so the
                    two can be compared during the migration. */}
                <IsoBoard
                  puzzle={puzzle}
                  marks={marks}
                  conflicts={conflicts}
                  onCellClick={handleBoardCell}
                  highlight={clueHighlight}
                  highlightLabel={clueHighlightLabel}
                  ghostMarks={ghostMarks}
                  blockedRows={blockedRows}
                  blockedCols={blockedCols}
                  flashRows={flashRows}
                  flashCols={flashCols}
                  floor={activeFloor}
                  storeyView={storeyView}
                  armedPerson={tool === 'place' && placementArmed ? selectedPerson : null}
                />
              </div>
            </div>
          </div>

          {/* Legend (mobile only — disclosure; on xl it's in the rail, expanded) */}
          <div className="order-4 lg:hidden mx-auto w-full max-w-[640px] px-4 pb-1">
            <button
              onClick={() => setLegend(v => !v)}
              className="focus-ring flex min-h-[44px] items-center gap-1.5 text-[11px] text-text-muted font-mono mx-auto tracking-widest uppercase hover:text-text-secondary transition-colors"
            >
              <Info size={13} /> {legend ? '— Hide' : 'What am I looking at?'}
            </button>
            <AnimatePresence>
              {legend && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-2"
                >
                  <LegendContent />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Toolbar ─────────────────────────────────────────────────────
              Mobile: order-3 — after board and suspects.
              Desktop: flex-shrink-0 at the bottom of the scene column.
              FurniturePicker lives here so it's beside the board.
          */}
          <div className="command-rail order-5 flex-shrink-0 w-full px-3 py-2 flex flex-col gap-2">
            {/* FurniturePicker — transient, in the scene column */}
            <AnimatePresence>
              {showDecor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <FurniturePicker
                    selected={placingFurniture}
                    rotation={placingRotation}
                    onSelect={setPlacingFurniture}
                    onRotate={handleRotatePlacing}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mode row — Place / Draft / Mark */}
            <div className="flex gap-2 justify-center [&>button]:flex-1 sm:[&>button]:flex-none lg:justify-start">
              <ToolBtn
                active={tool === 'place'}
                onClick={activatePlaceTool}
                icon={<MousePointerClick size={16} />}
                label="Place"
                title={detective ? 'Place a suspect — crosses out their row & column' : 'Place a suspect'}
              />
              {detective && (
                <ToolBtn
                  active={tool === 'draft'}
                  onClick={() => props.onSetTool('draft')}
                  icon={<Pencil size={16} />}
                  label="Draft"
                  title="Pencil in candidates (no elimination)"
                />
              )}
              <ToolBtn
                active={tool === 'x'}
                onClick={() => props.onSetTool('x')}
                icon={<XIcon size={16} />}
                label="Mark ✕"
              />
            </div>

            {/* Actions grid — Undo / Redo / Clear / Hint / Decorate */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-center lg:justify-start">
              <ToolBtn onClick={props.onUndo} disabled={!props.canUndo} icon={<Undo2 size={16} />} label="Undo" />
              <ToolBtn onClick={props.onRedo} disabled={!props.canRedo} icon={<Redo2 size={16} />} label="Redo" />
              <ToolBtn onClick={() => setConfirmClear(true)} icon={<Trash2 size={16} />} label="Clear" />
              {/* Hint — Classic only. Places one suspect correctly (3 per case).
                  Detective mode's contract is proof-first: an answer dropped by
                  the game breaks that contract. Use Assist instead. */}
              {!detective && (
                <ToolBtn onClick={props.onHint} disabled={hintsLeft <= 0 || feedback === 'cold' || !!props.revealed} icon={<Lightbulb size={16} />} label={`Hint ×${hintsLeft}`} />
              )}
              {/* Assist — Detective only. Marks cells that are provably empty
                  from row/column occupancy and unary clues — free and unlimited,
                  never spoils an undeduced answer. Classic players place freely
                  and don't need the elimination pass. */}
              {detective && props.onAssist && (
                <ToolBtn onClick={props.onAssist} icon={<Wand2 size={16} />} label="Assist" title="Cross off cells that are already impossible" />
              )}
              <ToolBtn
                toggled={showDecor}
                onClick={() => { setShowDecor(v => !v); if (showDecor) setPlacingFurniture(null) }}
                icon={<Palette size={16} />}
                label="Decorate"
                title="Place decorative furniture"
              />
            </div>
          </div>

        </div>{/* end scene column */}

        {/* ── DOSSIER (right) ───────────────────────────────────────────────
            Mobile: contents — suspects is order-2, accuse is order-4.
            lg: second grid column. Suspects scroll, Accuse is anchored bottom.
            xl: third grid column.
            Structure: flex-col with suspects taking flex-1 (scrolls) and
            accuse as flex-shrink-0 outside the scroll zone — so the shake's
            translate3d never clips inside an overflow-y container.
        */}
        <div
          className={[
            'contents',
            'lg:flex lg:flex-col lg:min-h-0 lg:border-l lg:col-start-2 lg:row-start-2',
          ].join(' ')}
          style={{ borderColor: 'var(--color-border-subtle)' } as React.CSSProperties}
        >

          {/* Case meta at lg (two-col) — folded rail content at top of dossier.
              On xl it's hidden because the side rail has it. */}
          <div className="hidden flex-shrink-0 px-4 pt-3 pb-2 border-b"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-mono text-text-muted tracking-[0.25em] uppercase">Progress</p>
                <p className="font-mono text-text-secondary text-sm mt-0.5">
                  <span className="text-text-primary font-bold">{placedCount}</span>
                  <span className="text-text-muted"> / {puzzle.people.length}</span>
                  <span className="text-text-muted text-[10px] ml-1.5">placed</span>
                  <span className="text-text-muted text-[10px] ml-2">·</span>
                  <span className="text-text-primary font-bold ml-2">{hintsLeft}</span>
                  <span className="text-text-muted text-[10px] ml-1">hints</span>
                </p>
              </div>
              {/* Timer shown in dossier at lg when the rail isn't visible */}
              {!hideTimer && (
                <span className="font-mono text-accent-text text-xl tabular-nums tracking-widest">{timer}</span>
              )}
            </div>
          </div>

          {/* Suspects list — scrollable region */}
          {/*
            Mobile: order-2 — between board and toolbar in the single column.
            Desktop: flex-1 overflow-y-auto — fills dossier column, scrolls.
          */}
          <div className="order-3 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
            <div className="relative p-3 lg:p-4 flex flex-col gap-3">

              {/* Suspects label */}
              <p className="text-[10px] text-text-muted font-mono uppercase tracking-[0.2em] [text-wrap:balance]">
                {detective
                  ? 'Suspects · select · draft · check off solved clues'
                  : 'Suspects · select · place · use hints to nudge'}
              </p>

              {/* Suspect cards — single column on all breakpoints in the dossier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {puzzle.people.map(person => (
                  <SuspectCard
                    key={person.id}
                    person={person}
                    clues={cluesOf[person.id] ?? []}
                    selected={selectedPerson === person.id}
                    placed={!!placedOf[person.id]}
                    locked={!!placedOf[person.id]?.locked}
                    conflicted={conflicts.has(person.id)}
                    resolved={resolvedClues.includes(person.id)}
                    showCheck={detective}
                    located={locatedPerson === person.id}
                    canLocate={resolveClueHighlights(puzzle, person.id).length > 0}
                    onSelect={() => selectForPlacement(person.id)}
                    onToggleResolved={() => props.onToggleClue(person.id)}
                    onToggleLocate={() => toggleCluePreview(person.id)}
                  />
                ))}
              </div>

              <CaseNotes caseId={puzzle.id} />

            </div>
          </div>

          {/* ── Accuse CTA — anchored OUTSIDE the scroll zone ────────────────
              Mobile: order-4 — last in the single column.
              Desktop: flex-shrink-0 below the suspects scroller.
              Note: Accuse is outside overflow-y-auto on purpose — the shake's
              translate3d(±5px) must not clip inside the scroll container, which
              would also produce a transient horizontal scrollbar at 390px.
          */}
          <div className="command-rail order-6 flex-shrink-0 p-3 lg:p-4 flex flex-col gap-2 border-t"
            style={{ borderColor: 'var(--color-border-subtle)' }}
          >
            {/* ── Accuse — the dramatic beat ─────────────────────────────── */}
            <motion.button
              /* No `key` here on purpose — see the effect above. The class is
                 added imperatively so the element (and its focus) survives. */
              ref={ctaRef}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={feedback === 'cold'}
              className="focus-ring w-full py-4 font-display disabled:opacity-50 disabled:cursor-not-allowed font-bold tracking-[0.15em] uppercase text-sm transition-colors"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-on-accent)',
                boxShadow: 'var(--shadow-cut), 0 8px 22px -12px color-mix(in srgb, var(--color-accent) 60%, transparent)',
                letterSpacing: '0.15em',
              }}
            >
              {/* Count the CAST, not the board. These were the same number
                  while every N x N board had exactly N suspects; now a 10x10
                  Master case has 6 people and this read "0/10". */}
              Accuse — Submit Solution ({placedCount}/{puzzle.people.length})
            </motion.button>

            {/* ── Feedback message ─────────────────────────────────────────
                Framer owns this node's transform (the y entry offset), so it
                must NOT also carry animate-shake — two systems writing one
                composited property fight during the 400ms overlap. The CTA
                above carries the shake; this only re-plays its entry. */}
            <AnimatePresence>
              {feedback !== 'none' && feedback !== 'cold' && (
                <motion.button
                  onClick={props.onDismissFeedback}
                  key={`feedback-${submitNonce}`}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="min-h-[44px] text-[12px] font-mono px-3 py-2 text-center w-full tracking-wide"
                  style={{
                    color: 'var(--color-danger-text)',
                    backgroundColor: 'color-mix(in srgb, var(--color-danger) 14%, transparent)',
                    borderLeft: '2px solid var(--color-danger)',
                  }}
                >
                  {feedback === 'incomplete'
                    ? 'Place every person first.'
                    : feedback === 'blocked'
                    ? 'That row or column is already taken by another suspect.'
                    : wrongMessage}
                </motion.button>
              )}
            </AnimatePresence>
            {props.revealed && feedback !== 'cold' && (
              <p
                role="status"
                data-testid="case-revealed"
                className="text-[12px] font-mono px-3 py-2 w-full tracking-wide"
                style={{ borderLeft: '2px solid var(--color-danger)', color: 'var(--color-danger-text)' }}
              >
                Case revealed — not counted as solved.
              </p>
            )}
            {feedback === 'cold' && (
              <div
                role="group"
                aria-label="Case gone cold"
                data-testid="cold-case"
                className="text-[12px] font-mono px-3 py-2 w-full tracking-wide grid gap-2"
                style={{
                  color: 'var(--color-danger-text)',
                  backgroundColor: 'color-mix(in srgb, var(--color-danger) 14%, transparent)',
                  borderLeft: '2px solid var(--color-danger)',
                }}
              >
                <p>The case has gone cold. Reveal the solution (it will not count as solved) or start over with a fresh set of accusations. Starting over is recorded as attempt {(props.attempts ?? 0) + 2}.{props.revealed ? ' This case was already revealed, so nothing on it counts as solved.' : ''}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={props.onReveal} disabled={!props.onReveal} className="focus-ring min-h-[44px] flex-1 border px-3 font-display font-bold uppercase tracking-[0.12em]" style={{ borderColor: 'var(--color-danger)' }}>Reveal</button>
                  <button type="button" onClick={props.onStartOver} disabled={!props.onStartOver} className="focus-ring min-h-[44px] flex-1 border px-3 font-display font-bold uppercase tracking-[0.12em]" style={{ borderColor: 'var(--color-danger)' }}>Start over</button>
                </div>
              </div>
            )}
          </div>

        </div>{/* end dossier column */}

      </div>{/* end body grid */}

      </div>{/* end shared desktop content cap */}

      {/* ── Leave confirmation ── classified dossier dialog ─────────────── */}
      <AnimatePresence>
        {confirmLeave && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'var(--overlay-scrim)' }}
            onClick={() => setConfirmLeave(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby={leaveTitleId}
            aria-describedby={leaveDescriptionId}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xs border bg-bg-surface p-6 text-center"
              style={{
                borderColor: 'var(--color-border-strong)',
                boxShadow: 'var(--shadow-elevated)',
              }}
            >
              <p id={leaveTitleId} className="font-display font-bold text-text-primary text-lg mb-1 uppercase tracking-[0.12em]">
                Leave this case?
              </p>
              <p id={leaveDescriptionId} className="text-text-secondary text-[13px] font-mono mb-5 tracking-wide">
                Progress is saved — you can pick up where you left off.
              </p>
              <div className="flex gap-3">
                <button
                  ref={stayRef}
                  onClick={() => setConfirmLeave(false)}
                  className="focus-ring flex-1 min-h-[44px] py-2.5 border font-display text-sm uppercase tracking-[0.1em] text-text-secondary hover:text-text-primary transition-colors"
                  style={{ borderColor: 'var(--color-border-strong)' }}
                >
                  Stay
                </button>
                <button
                  onClick={props.onBack}
                  className="focus-ring flex-1 min-h-[44px] py-2.5 font-display text-sm uppercase tracking-[0.1em]"
                  style={{ background: 'var(--color-accent)', color: 'var(--color-on-accent)' }}
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Clear confirmation ── classified dossier dialog ──────────────── */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'var(--overlay-scrim)' }}
            onClick={() => setConfirmClear(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby={clearTitleId}
            aria-describedby={clearDescriptionId}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xs border bg-bg-surface p-6 text-center"
              style={{
                borderColor: 'var(--color-border-strong)',
                boxShadow: 'var(--shadow-elevated)',
              }}
            >
              <p id={clearTitleId} className="font-display font-bold text-text-primary text-lg mb-1 uppercase tracking-[0.12em]">
                Clear the board?
              </p>
              <p id={clearDescriptionId} className="text-text-secondary text-[13px] font-mono mb-5 tracking-wide">
                This removes every placement, ✕ and draft. You can undo it once.
              </p>
              <div className="flex gap-3">
                <button
                  ref={cancelClearRef}
                  onClick={() => setConfirmClear(false)}
                  className="focus-ring flex-1 min-h-[44px] py-2.5 border font-display text-sm uppercase tracking-[0.1em] text-text-secondary hover:text-text-primary transition-colors"
                  style={{ borderColor: 'var(--color-border-strong)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { props.onClear(); setConfirmClear(false) }}
                  className="focus-ring flex-1 min-h-[44px] py-2.5 font-display text-sm uppercase tracking-[0.1em]"
                  style={{ background: 'var(--color-danger)', color: 'var(--color-on-accent)' }}
                >
                  Clear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ToolBtn({ active, toggled, disabled, cta, onClick, icon, label, title }: {
  active?: boolean; toggled?: boolean; disabled?: boolean; cta?: boolean; onClick: () => void; icon: React.ReactNode; label: string; title?: string
}) {
  // `active` = the current TOOL mode (strong fill). `toggled` = an action that
  // is currently engaged, e.g. a locked suspect (outline only — visually
  // distinct from a tool mode so it never reads as "you switched tools").
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active || toggled}
      className="focus-ring flex items-center justify-center gap-1.5 px-3.5 min-h-[44px] border text-[13px] font-display font-medium transition-colors whitespace-nowrap uppercase tracking-[0.08em]"
      style={{
        borderColor: active
          ? 'var(--color-accent)'
          : (toggled || cta)
          ? 'color-mix(in srgb, var(--color-accent) 65%, transparent)'
          : 'var(--color-border-strong)',
        backgroundColor: active
          ? 'color-mix(in srgb, var(--color-accent) 22%, transparent)'
          : 'var(--color-bg-surface)',
        color: active
          ? 'var(--color-accent-text)'
          : (toggled || cta)
          ? 'var(--color-accent-text)'
          : 'var(--color-text-secondary)',
        borderStyle: toggled && !active ? 'dashed' : 'solid',
        opacity: disabled ? 0.35 : 1,
        boxShadow: active ? 'var(--shadow-cut)' : 'none',
      }}
    >
      {icon}{label}
    </button>
  )
}
