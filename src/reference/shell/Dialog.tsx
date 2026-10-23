import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { X } from 'lucide-react'

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea'

/**
 * Modal with initial focus, Escape, a Tab focus trap and focus restore.
 * The page behind it is made inert by the caller.
 */
export function Dialog({ title, onClose, children, variant, hideTitle, closeLabel = 'Close' }: {
  title: string; onClose: () => void; children: ReactNode
  /** 'cinema' = full-bleed opening card; 'wide' = interrogation / evidence sheets. */
  variant?: 'cinema' | 'wide'; hideTitle?: boolean; closeLabel?: string
}) {
  const root = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  // Captured during render: by the time effects run the page behind is already
  // inert and the browser has dropped focus to <body>.
  const [opener] = useState(() => document.activeElement as HTMLElement | null)
  useEffect(() => {
    const pick = root.current?.querySelector<HTMLElement>('[data-autofocus]')
    ;(pick ?? closeBtn.current)?.focus({ preventScroll: true })
    return () => { opener?.focus?.() }
  }, [opener])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
    if (e.key !== 'Tab') return
    const items = [...(root.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
    if (!items.length) { e.preventDefault(); return }
    const first = items[0], last = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === first || !root.current?.contains(active))) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && (active === last || !root.current?.contains(active))) { e.preventDefault(); first.focus() }
  }

  return (
    <div className="rs-scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={root} className={`rs-dialog ${variant ? `rs-dialog-${variant}` : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={onKeyDown} data-testid="dialog">
        <div className={`rs-dialog-head ${hideTitle ? 'rs-dialog-head-end' : ''}`}>
          <h2 id={titleId} className={hideTitle ? 'rs-sr' : undefined}>{title}</h2>
          <button ref={closeBtn} type="button" className="rs-icon-btn" aria-label={closeLabel} onClick={onClose} data-testid="dialog-close">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="rs-dialog-body">{children}</div>
      </div>
    </div>
  )
}

export function HowToPlayBody() {
  return (
    <ol className="rs-rules">
      <li><strong>One per row and column.</strong> Everyone, victim included, stands in a different row and a different column. Most squares stay empty.</li>
      <li><strong>Read the clues.</strong> Pick a suspect, read their account, then tap a square to place them. Clues that name a row, column, room or piece of furniture light it up on the plan.</li>
      <li><strong>Rule things out.</strong> Mark ✕ crosses a square off. Undo takes back the last move.</li>
      <li><strong>Accuse.</strong> When everyone is placed, accuse. The killer is the suspect left alone with the victim.</li>
    </ol>
  )
}

/** Plain-language summary of docs/CLUE_SEMANTICS.md. */
export function ClueGlossary() {
  return (
    <section className="rs-glossary" aria-labelledby="rs-glossary-title" data-testid="clue-glossary">
      <h3 id="rs-glossary-title">How clues read</h3>
      <dl>
        <dt>Beside a TV</dt>
        <dd>A TV touches your square along a side, in the same room, and you are not standing on it. Diagonals and the far side of a wall do not count.</dd>
        <dt>In row 3, in column 2</dt>
        <dd>The numbers printed along the plan edge, counted from 1. Rows run across, columns run down. Top row is row 1; bottom row is the last.</dd>
        <dt>On the outer edge</dt>
        <dd>Any square in the outermost ring of the grid. Walls between rooms do not count.</dd>
        <dt>In a corner</dt>
        <dd>One of the four corner squares of the grid.</dd>
        <dt>A or the</dt>
        <dd>&ldquo;A chair&rdquo; means any chair. &ldquo;The chair&rdquo; is printed only when the house has exactly one.</dd>
      </dl>
    </section>
  )
}
