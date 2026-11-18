import { memo, useContext } from 'react'
import Avatar from '../../components/Avatar'
import { PortraitMap } from './portraitContext'

/** The suspect's bundled illustrated avatar (no network), sized by the box. */
export const Portrait = memo(function Portrait({ personId, size, label }: { personId: string; size: number; label?: string }) {
  const person = useContext(PortraitMap)[personId]
  return (
    <span
      className="rs-portrait"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ width: size, height: size }}
    >
      <Avatar seed={person?.avatarSeed ?? personId} accent={person?.accent} size={size} className="h-full w-full" dead={person?.isVictim} name={person?.name ?? personId} />
    </span>
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
