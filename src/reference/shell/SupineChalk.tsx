/**
 * The victim's chalk outline: a supine body seen from above, head to the left,
 * 0.9u wide and 0.7u tall inside a 100x100 cell box (x 5..95, y 15..85). One
 * shape for the play board and the reconstruction. Callers clip it to the
 * victim's cell and draw it below the token.
 */
export function SupineChalk({ shadow }: { shadow?: boolean }) {
  const parts = (
    <>
      <circle cx="17" cy="50" r="9" vectorEffect="non-scaling-stroke" />
      <rect x="28" y="37" width="32" height="26" rx="9" vectorEffect="non-scaling-stroke" />
      <path vectorEffect="non-scaling-stroke" d="M34 38 L26 20 M34 62 L24 80 M60 43 L93 34 M60 57 L92 68" />
    </>
  )
  return shadow ? (
    <>
      <g className="rs-chalk-shadow" fill="none" stroke="#1a1008" strokeOpacity=".4" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">{parts}</g>
      <g className="rs-chalk-line">{parts}</g>
    </>
  ) : <g className="rs-chalk-line">{parts}</g>
}
