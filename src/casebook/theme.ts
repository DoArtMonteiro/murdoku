// Theme for the slice. It follows, in order: `?theme=dark|light`, the app's own
// `theme-dark` / `theme-light` class on <html> (set by the page's inline script),
// then prefers-color-scheme. It never touches `murdoku_theme` or any murdoku_*
// key, so it does not use the app's useTheme hook (which writes that key).
import { useEffect, useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'

export type Theme = 'light' | 'dark'

function resolve(): Theme {
  const asked = new URLSearchParams(window.location.search).get('theme')
  if (asked === 'dark' || asked === 'light') return asked
  const cls = document.documentElement.classList
  if (cls.contains('theme-dark')) return 'dark'
  if (cls.contains('theme-light')) return 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useSliceTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(resolve)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const on = () => setTheme(resolve())
    mq?.addEventListener?.('change', on)
    return () => mq?.removeEventListener?.('change', on)
  }, [])
  return theme
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(!!mq?.matches)
    mq?.addEventListener?.('change', on)
    return () => mq?.removeEventListener?.('change', on)
  }, [])
  return reduced
}

/**
 * True on a phone-width screen whose usable height (after the safe-area insets) is under 820 px.
 * Read from the root's own box and padding, because media queries cannot see env(safe-area-inset-*).
 */
export function useCompact(ref: RefObject<HTMLElement | null>): boolean {
  const [compact, setCompact] = useState(false)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const cs = getComputedStyle(el)
      const usable = el.clientHeight - parseFloat(cs.paddingTop || '0') - parseFloat(cs.paddingBottom || '0')
      setCompact(window.innerWidth < 900 && usable > 0 && usable < 820)
    }
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [ref])
  return compact
}
