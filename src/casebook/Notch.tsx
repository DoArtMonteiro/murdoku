/** The ink mark of a shared lane: a small crossed disc on a token or a portrait. Red pencil is only for the accusation. */
export function Notch({ className = 'cb-notch' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 10 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="5" /><path d="M2.9 2.9 L7.1 7.1 M7.1 2.9 L2.9 7.1" /></svg>
  )
}
