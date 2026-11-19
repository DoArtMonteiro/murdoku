// Where a casebook token sits inside its square, shared by the casebook plan (which draws it) and the illustrated
// board's room-name plates (which must keep clear of it). Cell units unless a name says px.

/** Token diameter, px: the square leaves at least 4 px (12% of a cell) on every side. */
export const tokenSizeFor = (u: number) => Math.max(14, u - 2 * Math.max(4, Math.round(u * 0.12)))

/** The ring, badge or dashed ghost outline spreads at most this far past the token disc, px. */
export const TOKEN_SPREAD_PX = 4

/** The painted extent of whatever stands in square (r, c), [x0, y0, x1, y1] in cells. */
export function tokenBox(r: number, c: number, u: number): [number, number, number, number] {
  const half = (tokenSizeFor(u) / 2 + TOKEN_SPREAD_PX) / u
  return [c + 0.5 - half, r + 0.5 - half, c + 0.5 + half, r + 0.5 + half]
}

/** `occupied` holds "row:col" keys. */
export const occupiedBoxes = (occupied: Iterable<string> | undefined, u: number): [number, number, number, number][] => {
  const out: [number, number, number, number][] = []
  for (const k of occupied ?? []) {
    const [r, c] = k.split(':').map(Number)
    if (Number.isInteger(r) && Number.isInteger(c)) out.push(tokenBox(r, c, u))
  }
  return out
}
