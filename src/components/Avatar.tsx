import { useEffect, useState } from 'react'
import { cachedAvatar, makeAvatar } from './avatarImage'

interface Props {
  seed: string
  size?: number
  accent?: string
  className?: string
  dead?: boolean
  /** Used for the monogram shown while the avatar is being drawn. */
  name?: string
}

/**
 * Suspect portrait: the bundled DiceBear "notionists" illustration (CC0 art,
 * see THIRD-PARTY-NOTICES.md), drawn in the browser. Deterministic per seed.
 * Nothing is fetched from a third party, so a portrait cannot be missing
 * because a remote service is slow, offline or blocked.
 *
 * The generator is loaded lazily, so the first render of a suspect can happen
 * a moment before its illustration exists. Until then, and if the chunk cannot
 * load, the suspect's monogram on their accent colour is shown: still unique
 * per person, still readable.
 */
export default function Avatar({
  seed, size = 56, accent = '#888', className = '', dead = false, name,
}: Props) {
  // The avatar lives in a module cache; this state only asks for a re-render
  // once it has been drawn.
  const [, drawn] = useState(0)
  const url = cachedAvatar(seed, accent)

  useEffect(() => {
    if (url) return
    let live = true
    makeAvatar(seed, accent).then(() => { if (live) drawn(n => n + 1) }, () => {})
    return () => { live = false }
  }, [seed, accent, url])

  // Monogram from the display name when we have it, else from the seed, which
  // is prefixed with the person's name (e.g. "Marco-1234-2").
  const initial = (name ?? seed).trim().charAt(0).toUpperCase() || '?'

  const shared = {
    display: 'block' as const,
    borderRadius: 12,
    filter: dead ? 'grayscale(1) brightness(0.7)' : undefined,
  }

  if (!url) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          ...shared,
          width: size,
          height: size,
          background: accent,
          color: 'var(--color-on-accent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          // Barlow Condensed is the naming voice (DESIGN.md `subject`). This
          // said Oswald, which is loaded nowhere in the project — no @import,
          // no <link>, no Tailwind family — so these initials have been
          // silently rendering in whatever ui-sans-serif resolves to rather
          // than a chosen face. Leftover from a superseded art direction.
          fontFamily: '"Barlow Condensed", ui-sans-serif, system-ui, sans-serif',
          fontWeight: 700,
          fontSize: Math.round(size * 0.46),
          lineHeight: 1,
          // Matches the portrait's edge so a fallback never reads as a
          // different component from the ones that loaded beside it.
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.35)',
        }}
      >
        {initial}
      </span>
    )
  }

  return (
    <img
      src={url}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={className}
      style={shared}
    />
  )
}
