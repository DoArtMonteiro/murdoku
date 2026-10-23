// Per-render registry of <defs> (gradients, patterns, filters, clip paths).
// Scene builders are plain functions that ask the registry for an id; the
// board emits the collected defs once, after everything that references them.
import type { ReactNode } from 'react'
import { darken, lighten, hashStr } from './color'

export class Reg {
  readonly defs: ReactNode[] = []
  private seen = new Set<string>()
  readonly uid: string
  constructor(uid: string) { this.uid = uid }

  /** Register a def once under a stable key; returns the id. */
  once(key: string, make: (id: string) => ReactNode): string {
    const id = `${this.uid}-${key}`
    if (!this.seen.has(id)) {
      this.seen.add(id)
      this.defs.push(make(id))
    }
    return id
  }
  url(id: string): string { return `url(#${id})` }

  /** Soft sheen gradient for a base colour (top-left light, bottom-right shade). */
  sheen(hex: string, k = 1): string {
    const id = this.once(`sh${hex.slice(1)}-${k}`, i => (
      <linearGradient key={i} id={i} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={lighten(hex, 0.14 * k)} />
        <stop offset="0.55" stopColor={hex} />
        <stop offset="1" stopColor={darken(hex, 0.2 * k)} />
      </linearGradient>
    ))
    return this.url(id)
  }
  /** Vertical band gradient (for cylinders such as sofa arms, curtains). */
  band(hex: string): string {
    const id = this.once(`bd${hex.slice(1)}`, i => (
      <linearGradient key={i} id={i} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={darken(hex, 0.25)} />
        <stop offset="0.35" stopColor={lighten(hex, 0.12)} />
        <stop offset="1" stopColor={darken(hex, 0.3)} />
      </linearGradient>
    ))
    return this.url(id)
  }
  /** Radial dome gradient (cushions, domes, canopies). */
  dome(hex: string): string {
    const id = this.once(`dm${hex.slice(1)}`, i => (
      <radialGradient key={i} id={i} cx="0.38" cy="0.34" r="0.8">
        <stop offset="0" stopColor={lighten(hex, 0.22)} />
        <stop offset="0.6" stopColor={hex} />
        <stop offset="1" stopColor={darken(hex, 0.28)} />
      </radialGradient>
    ))
    return this.url(id)
  }
  /** Warm light pool: colour fading to transparent. */
  glow(hex: string, a0: number, a1 = 0): string {
    const id = this.once(`gl${hex.slice(1)}-${Math.round(a0 * 100)}-${Math.round(a1 * 100)}`, i => (
      <radialGradient key={i} id={i}>
        <stop offset="0" stopColor={hex} stopOpacity={a0} />
        <stop offset="0.45" stopColor={hex} stopOpacity={a0 * 0.45 + a1 * 0.55} />
        <stop offset="1" stopColor={hex} stopOpacity={a1} />
      </radialGradient>
    ))
    return this.url(id)
  }
  /**
   * A light pool with a flat core: constant out to ~0.3 of the radius, then a soft
   * fall-off to nothing. The core keeps the lift inside a cell centre zone within a
   * narrow band instead of a hotspot at the source.
   */
  pool(hex: string, a: number): string {
    const id = this.once(`pl${hex.slice(1)}-${Math.round(a * 1000)}`, i => (
      <radialGradient key={i} id={i}>
        <stop offset="0" stopColor={hex} stopOpacity={a} />
        <stop offset="0.3" stopColor={hex} stopOpacity={a} />
        <stop offset="0.62" stopColor={hex} stopOpacity={a * 0.4} />
        <stop offset="1" stopColor={hex} stopOpacity={0} />
      </radialGradient>
    ))
    return this.url(id)
  }
  stable(s: string): number { return hashStr(this.uid + s) }
}
