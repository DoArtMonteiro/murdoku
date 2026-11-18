import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'

/**
 * Keyboard behaviour of a modal dialog: Escape closes it and Tab stays inside it.
 *
 * It listens on `document`, not on the dialog, because clicking text that cannot take
 * focus moves focus to <body>, and a listener on the dialog would never hear the next
 * key. The panel should also be focusable (tabIndex -1) so that click lands focus on it
 * instead. Focus that is outside the panel, or on the panel itself, is brought to the
 * first control (last, with Shift) on Tab.
 */
export function useModalKeys(panel: RefObject<HTMLElement | null>, onClose: () => void): void {
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        // Nothing behind the dialog (menus, the board) should also react to this key.
        event.stopPropagation()
        close.current()
        return
      }
      if (event.key !== 'Tab') return
      const root = panel.current
      if (!root) return
      const controls = Array.from(root.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      if (!controls.length) { event.preventDefault(); root.focus(); return }
      const first = controls[0]
      const last = controls[controls.length - 1]
      const active = document.activeElement
      const onControl = active instanceof HTMLElement && controls.includes(active)
      if (!onControl) { event.preventDefault(); (event.shiftKey ? last : first).focus(); return }
      if (event.shiftKey && active === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [panel])
}
