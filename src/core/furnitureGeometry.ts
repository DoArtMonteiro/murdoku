const DEFAULT_VIEWBOX_SIZE = 100

function finiteDimension(value: string | undefined): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : DEFAULT_VIEWBOX_SIZE
}

/** Centring offset for the scale transform on each axis. */
export function frameOffset(viewBox: string, scale: number): { x: number; y: number } {
  const parts = viewBox.trim().split(/\s+/)
  const width = finiteDimension(parts[2])
  const height = finiteDimension(parts[3])

  return {
    x: (width / 2) * (1 - scale),
    y: (height / 2) * (1 - scale),
  }
}
