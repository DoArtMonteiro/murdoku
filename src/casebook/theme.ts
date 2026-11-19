// Theme for the slice. It follows, in order: `?theme=dark|light`, the app's own
// `theme-dark` / `theme-light` class on <html> (set by the page's inline script),
// then prefers-color-scheme. It never touches `murdoku_theme` or any murdoku_*
// key, so it does not use the app's useTheme hook (which writes that key).
import { useEffect, useState } from 'react'

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
