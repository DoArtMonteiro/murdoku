import { memo, useContext } from 'react'
import { PortraitMap } from './portraitContext'
import { portraitStyle } from './geometry'

/** Offline photo portrait from the shared contact sheet. */
export const Portrait = memo(function Portrait({ personId, size, label }: { personId: string; size: number; label?: string }) {
  const chosen = useContext(PortraitMap)[personId]
  return (
    <span
      className="rs-portrait"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ width: size, height: size, ...portraitStyle(personId, chosen) }}
    />
  )
})

/** A portrait in a period gilt frame with a painted-canvas finish (cards, interrogation, intro). */
export function FramedPortrait({ personId, size, label, victim }: { personId: string; size: number; label?: string; victim?: boolean }) {
  return (
    <span className={`rs-frame ${victim ? 'rs-frame-victim' : ''}`} style={{ width: size, height: size }}>
      <span className="rs-frame-mat">
        <Portrait personId={personId} size={size - 12} label={label} />
      </span>
    </span>
  )
}
