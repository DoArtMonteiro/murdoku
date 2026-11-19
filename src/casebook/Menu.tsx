import { useEffect, useRef, useState } from 'react'
import { Ellipsis, Moon, Sun, Volume2, VolumeX } from 'lucide-react'
import type { Theme } from './theme'

interface Props {
  sound: boolean
  theme: Theme
  onSound: () => void
  onTheme: () => void
}

/** The small overflow menu in the header: Sound and Theme, off the play surface. */
export function Menu({ sound, theme, onSound, onTheme }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector<HTMLElement>('.cb-menu-btn')?.focus() } }
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', key) }
  }, [open])

  return (
    <div className="cb-menu" ref={ref}>
      <button type="button" className="cb-menu-btn" aria-label="More" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        <Ellipsis size={22} aria-hidden="true" />
      </button>
      {open && (
        <div className="cb-menu-pop" role="menu" aria-label="More">
          <button type="button" role="menuitemcheckbox" aria-checked={sound} onClick={onSound}>
            {sound ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
            <span>Sound</span><em>{sound ? 'On' : 'Off'}</em>
          </button>
          <button type="button" role="menuitem" onClick={onTheme}>
            {theme === 'dark' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
            <span>Theme</span><em>{theme === 'dark' ? 'Dark' : 'Light'}</em>
          </button>
          <p className="cb-menu-credit">
            Based on the Murdoku puzzle format created by Manuel Garand. Alibi is not affiliated with or endorsed by him.{' '}
            <a href="/THIRD-PARTY-NOTICES.txt" target="_blank" rel="noopener">Notices</a>
          </p>
        </div>
      )}
    </div>
  )
}
