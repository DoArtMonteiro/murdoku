// Text widths from the browser, so a panel can reserve exactly the height its statements need.
// OffscreenCanvas measures with the page's own loaded fonts; where it does not exist (a test DOM, an old
// browser) the caller falls back to a generous per-character estimate.

export interface Metrics {
  /** Width in px of one line of text set in the statement face (serif) at the given size; weight 500, the widest a lit chip gets. */
  serif: (text: string, px: number) => number
  /** The same in the interface face (sans), for the "Place X first" line. */
  sans: (text: string, px: number) => number
}

let cached: Metrics | null | undefined

export function browserMetrics(): Metrics | undefined {
  if (cached === undefined) {
    try {
      const ctx = typeof OffscreenCanvas === 'undefined' ? null : new OffscreenCanvas(8, 8).getContext('2d')
      cached = ctx
        ? {
            serif: (t, px) => { ctx.font = `500 ${px}px Newsreader, 'Iowan Old Style', Georgia, serif`; return ctx.measureText(t).width },
            sans: (t, px) => { ctx.font = `400 ${px}px 'Hanken Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`; return ctx.measureText(t).width },
          }
        : null
    } catch { cached = null }
  }
  return cached ?? undefined
}
