import { useLayoutEffect, useState } from 'react'
import type { RefObject } from 'react'

export interface Size { w: number; h: number }

/** Fallback used where layout is unavailable (jsdom) so the shell still renders. */
export const FALLBACK_SIZE: Size = { w: 480, h: 480 }

export function useElementSize(ref: RefObject<HTMLElement | null>): Size {
  const [size, setSize] = useState<Size>({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const read = () => {
      const r = el.getBoundingClientRect()
      const next = r.width > 0 && r.height > 0
        ? { w: Math.floor(r.width), h: Math.floor(r.height) }
        : FALLBACK_SIZE
      setSize(prev => (prev.w === next.w && prev.h === next.h ? prev : next))
    }
    read()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

export interface Viewport { w: number; h: number }
export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useLayoutEffect(() => {
    const on = () => setVp(prev => (prev.w === window.innerWidth && prev.h === window.innerHeight ? prev : { w: window.innerWidth, h: window.innerHeight }))
    window.addEventListener('resize', on)
    window.addEventListener('orientationchange', on)
    return () => { window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on) }
  }, [])
  return vp
}
