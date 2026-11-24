// Dialogs and the overflow menu. One small Dialog (focus moves in, Escape closes, Tab stays inside) and the
// three sheets that use it: the opening, the doubt confirmation, and the cold case.
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CircleHelp, Ellipsis, Moon, RotateCcw, Sun, Volume2, VolumeX } from 'lucide-react'
import type { Theme } from '../casebook/theme'
import type { LieCase } from './model'
import { nameOf } from './state'

interface DialogProps {
  labelledBy: string
  onClose?: () => void
  children: ReactNode
}

export function Dialog({ labelledBy, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    const before = document.activeElement as HTMLElement | null
    el?.querySelector<HTMLElement>('[data-autofocus], button')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) { onClose(); return }
      if (e.key !== 'Tab' || !el) return
      const f = [...el.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')]
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); before?.focus?.() }
  }, [onClose])
  return (
    <div className="ofa-scrim" onClick={onClose}>
      <div ref={ref} className="ofa-sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

/** The opening: the premise, and the rules in plain words, once. */
export function Intro({ c, truthOnly, onBegin }: { c: LieCase; truthOnly: boolean; onBegin: () => void }) {
  const { story } = c
  return (
    <Dialog labelledBy="ofa-intro-title" onClose={onBegin}>
      <h2 id="ofa-intro-title" className="ofa-sheet-title">{story.title}</h2>
      <p className="ofa-sheet-p">{story.premise}</p>
      <ul className="ofa-rules">
        {truthOnly
          ? <li>Everyone told the truth. Put each person where their account says they were.</li>
          : (
            <>
              <li>Every suspect gave an account. Exactly one statement in all of them is false, and whoever told it is the murderer.</li>
              <li>Scene facts are evidence. They cannot be doubted.</li>
            </>
          )}
        <li>Everyone stands in a row and a column of their own: no two people share one, and the plan dims what is taken.</li>
        {!truthOnly && <li>When accounts cannot all be true, they collide. Doubt the statement you think is false.</li>}
      </ul>
      <button type="button" className="ofa-primary" data-autofocus onClick={onBegin}>Begin</button>
    </Dialog>
  )
}

/** "Doubt {Name}'s statement: '{text}'?" */
export function DoubtSheet({ c, id, onYes, onNo }: { c: LieCase; id: string; onYes: () => void; onNo: () => void }) {
  const st = c.statements.find(s => s.id === id)
  if (!st) return null
  return (
    <Dialog labelledBy="ofa-doubt-title" onClose={onNo}>
      <h2 id="ofa-doubt-title" className="ofa-sheet-title">
        Doubt {nameOf(c, st.author)}&rsquo;s statement: &ldquo;{st.text}&rdquo;?
      </h2>
      <p className="ofa-sheet-p">Doubt the wrong account twice and the case goes cold.</p>
      <div className="ofa-sheet-row">
        <button type="button" className="ofa-ghost" onClick={onNo}>Not yet</button>
        <button type="button" className="ofa-primary" data-kind="doubt" onClick={onYes}>Doubt it</button>
      </div>
    </Dialog>
  )
}

export function ColdSheet({ onRestart }: { onRestart: () => void }) {
  return (
    <Dialog labelledBy="ofa-cold-title">
      <h2 id="ofa-cold-title" className="ofa-sheet-title">The case has gone cold.</h2>
      <p className="ofa-sheet-p">Two accounts you doubted stood. Start again with a clean plan.</p>
      <button type="button" className="ofa-primary" data-autofocus onClick={onRestart}>Start again</button>
    </Dialog>
  )
}

export function RestartSheet({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <Dialog labelledBy="ofa-restart-title" onClose={onNo}>
      <h2 id="ofa-restart-title" className="ofa-sheet-title">Start over?</h2>
      <p className="ofa-sheet-p">Your placements, doubts and notes will be cleared.</p>
      <div className="ofa-sheet-row">
        <button type="button" className="ofa-ghost" data-autofocus onClick={onNo}>Keep playing</button>
        <button type="button" className="ofa-primary" onClick={onYes}>Start over</button>
      </div>
    </Dialog>
  )
}

interface MenuProps {
  sound: boolean
  theme: Theme
  onSound: () => void
  onTheme: () => void
  onRestart: () => void
  onHow: () => void
}

export function Menu({ sound, theme, onSound, onTheme, onRestart, onHow }: MenuProps) {
  const innerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => { if (!innerRef.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); innerRef.current?.querySelector<HTMLElement>('.ofa-menu-btn')?.focus() } }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', key) }
  }, [open, innerRef])
  const act = (f: () => void) => () => { setOpen(false); f() }
  return (
    <div className="ofa-menu" ref={innerRef}>
      <button type="button" className="ofa-icon ofa-menu-btn" aria-label="More" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Ellipsis size={22} aria-hidden="true" />
      </button>
      {open && (
        <div className="ofa-menu-pop" role="menu" aria-label="More">
          <button type="button" role="menuitemcheckbox" aria-checked={sound} onClick={onSound}>
            {sound ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
            <span>Sound</span><em>{sound ? 'On' : 'Off'}</em>
          </button>
          <button type="button" role="menuitem" onClick={onTheme}>
            {theme === 'dark' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
            <span>Theme</span><em>{theme === 'dark' ? 'Dark' : 'Light'}</em>
          </button>
          <button type="button" role="menuitem" onClick={act(onRestart)}>
            <RotateCcw size={18} aria-hidden="true" /><span>Restart</span>
          </button>
          <button type="button" role="menuitem" onClick={act(onHow)}>
            <CircleHelp size={18} aria-hidden="true" /><span>How it works</span>
          </button>
        </div>
      )}
    </div>
  )
}
