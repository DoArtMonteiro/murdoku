import { useEffect, useId, useRef } from 'react'
import { useModalKeys } from '../hooks/useModalKeys'

interface Props {
  onClose: () => void
}

/**
 * Where Alibi comes from, and what it is not. The first paragraph credits the
 * format's originator and states that Alibi is independent; the rest credit the
 * third-party material that ships with the game. Keep the wording in step with
 * PROVENANCE.md and public/THIRD-PARTY-NOTICES.txt.
 */
export default function About({ onClose }: Props) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // Focus moves into the dialog on open and returns to whatever opened it on close.
  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeRef.current?.focus()
    return () => { if (opener?.isConnected) opener.focus() }
  }, [])
  // Escape closes and Tab stays inside, even after a click on text has moved focus to the panel or <body>.
  useModalKeys(panelRef, onClose)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'var(--overlay-scrim)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-testid="about"
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md border bg-bg-surface p-5 max-h-[min(720px,calc(100dvh-2rem))] overflow-y-auto overscroll-contain outline-none"
        style={{ borderColor: 'var(--color-border-strong)', boxShadow: 'var(--shadow-elevated)' }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-text-muted">ABOUT</p>
        <h2 id={titleId} className="mt-1 font-display text-xl font-bold uppercase tracking-wide text-text-primary">
          Alibi and its credits
        </h2>

        <p className="mt-4 font-mono text-[12px] leading-relaxed text-text-secondary" data-testid="about-credit">
          Alibi is an independent deduction puzzle inspired by the murder-mystery logic format Murdoku, which was
          created by Manuel Garand. Alibi is not affiliated with, endorsed by, or sponsored by Manuel Garand, the
          owner of the Murdoku name, or the publishers of the Murdoku books.
        </p>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.24em] text-text-muted">MADE WITH</p>
        <ul className="mt-2 flex flex-col gap-2 font-mono text-[12px] leading-relaxed text-text-secondary">
          <li>3D furniture and plant models, and the isometric furniture sprites, by Kenney (kenney.nl), released under CC0.</li>
          <li>Suspect avatars: the Notionists style by Zoish, released under CC0 1.0, drawn with DiceBear.</li>
          <li>Type: Barlow Condensed, Courier Prime and Hanken Grotesk, under the SIL Open Font License 1.1.</li>
        </ul>

        <p className="mt-4 font-mono text-[12px] leading-relaxed text-text-secondary">
          <a
            href="/THIRD-PARTY-NOTICES.txt"
            target="_blank"
            rel="noopener"
            className="focus-ring underline underline-offset-2"
            data-testid="notices-link"
          >
            Licences of the software and fonts in this game
          </a>
        </p>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="focus-ring mt-5 w-full min-h-[44px] border px-3 font-display text-sm font-semibold uppercase tracking-widest"
          style={{ borderColor: 'var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)' }}
        >
          Close
        </button>
      </div>
    </div>
  )
}
