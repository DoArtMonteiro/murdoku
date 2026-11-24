// Trade emblems: a suspect is a tile with a trade on it, not a face.
// Each glyph is drawn by hand on a 48 x 48 tile: cal ground, cobalt border, quarter-disc
// azulejo corners, one line icon. Everything strokes with currentColor, so the tile takes
// its colour from CSS (.lem sets it to --cobalt) and follows the theme. No ids, no <style>,
// no inline style: the Content-Security-Policy is style-src 'self'.
import type { JSX } from 'react'
import type { EmblemId } from '../model'
import './art.css'

/** Tile size in the emblem's own coordinate space. */
export const EMBLEM_BOX = 48

const GLYPHS: Record<EmblemId, JSX.Element> = {
  // Beam, two bowls on chains, a post: the oldest shape of a verdict.
  scales: (
    <>
      <circle cx="24" cy="11" r="2" />
      <path d="M24 13V37M17 37H31M12 16H36" />
      <path d="M12 16L7.5 27M12 16L16.5 27M7.5 27H16.5A4.5 4.5 0 0 1 7.5 27ZM36 16L31.5 27M36 16L40.5 27M31.5 27H40.5A4.5 4.5 0 0 1 31.5 27Z" />
    </>
  ),
  // A harbour lantern: ring, cap, glass, flame, foot.
  lantern: (
    <>
      <path d="M19 13C19 8.5 29 8.5 29 13" />
      <path d="M19 13H29L31.5 18H16.5ZM17.5 18V33M30.5 18V33M16 33H32V37H16Z" />
      <path className="lem-fill" d="M24 21.5C27.2 25 27.2 28 24 31C20.8 28 20.8 25 24 21.5Z" />
    </>
  ),
  anchor: (
    <>
      <circle cx="24" cy="11.5" r="3" />
      <path d="M24 14.5V37.5M18 19.5H30" />
      <path d="M10.5 27C11.5 34.5 17 37.5 24 37.5C31 37.5 36.5 34.5 37.5 27M6.5 29L10.5 26.5L13.5 30.5M41.5 29L37.5 26.5L34.5 30.5" />
    </>
  ),
  // Dome, lip, clapper, and two arcs of sound.
  bell: (
    <>
      <circle cx="24" cy="10.5" r="2" />
      <path d="M13 33C16 30.5 17 27 17 22.5C17 17.5 20 14 24 14C28 14 31 17.5 31 22.5C31 27 32 30.5 35 33ZM11.5 33.5H36.5" />
      <circle className="lem-fill" cx="24" cy="38" r="2.4" />
      <path d="M8 20Q6 24 8 28M40 20Q42 24 40 28" />
    </>
  ),
  // A square of mesh turned on its corner, knotted where the cords cross.
  net: (
    <g transform="rotate(45 24 24)">
      <rect x="13" y="13" width="22" height="22" rx="1.5" />
      <path d="M20.33 13V35M27.67 13V35M13 20.33H35M13 27.67H35" />
      <circle className="lem-fill" cx="20.33" cy="20.33" r="1.5" />
      <circle className="lem-fill" cx="27.67" cy="20.33" r="1.5" />
      <circle className="lem-fill" cx="20.33" cy="27.67" r="1.5" />
      <circle className="lem-fill" cx="27.67" cy="27.67" r="1.5" />
    </g>
  ),
  // Bow at the top left, bit at the bottom right: it runs on the diagonal.
  key: (
    <>
      <circle cx="15.5" cy="15.5" r="5.8" />
      <circle cx="15.5" cy="15.5" r="1.8" />
      <path d="M19.8 19.8L38 38M31 31L35 27M35.5 35.5L39.5 31.5" />
    </>
  ),
  // A needle on the other diagonal, its thread looping away into open space.
  needle: (
    <>
      <path d="M10 38.5L34.5 14" />
      <ellipse cx="36" cy="12.5" rx="1.5" ry="3.4" transform="rotate(45 36 12.5)" />
      <path d="M37 11.5C44 9.5 44.5 19 37.5 21.5C30.5 24 29.5 31 37.5 33" />
    </>
  ),
  // A round loaf from above, scored three times.
  bread: (
    <>
      <ellipse cx="24" cy="25" rx="15" ry="10.5" />
      <path d="M16 21.5L19.5 28.5M22.5 19.5L26 29M29 21L32 28" />
    </>
  ),
  quill: (
    <>
      <path d="M9.5 38.5C10 27 19 15 37.5 10C37 21 30 31 18 34.5Z" />
      <path d="M9.5 38.5L33.5 14.5M17 29L23 31.5M22 23L28.5 26M28 17.5L33.5 20.5" />
    </>
  ),
  bottle: (
    <>
      <path d="M21.5 9.5H26.5V15.5C26.5 19 32 20.5 32 26V36Q32 38 30 38H18Q16 38 16 36V26C16 20.5 21.5 19 21.5 15.5Z" />
      <path d="M21 12.5H27M17.5 27.5H30.5V33.5H17.5Z" />
    </>
  ),
  // A heap of salt from the pans, strata across it, two crystals glinting.
  salt: (
    <>
      <path d="M7.5 37.5C14 37 18 32 21 27C22.5 24.5 23.5 22.5 24 22C24.5 22.5 25.5 24.5 27 27C30 32 34 37 40.5 37.5Z" />
      <path d="M14.5 33H33.5M19 28H29" />
      <path d="M24 10V16M21 13H27M36.5 17V21M34.5 19H38.5M11.5 19V23M9.5 21H13.5" />
    </>
  ),
  compass: (
    <>
      <circle cx="24" cy="24" r="15.5" />
      <path d="M24 11.5L27.2 20.8L36.5 24L27.2 27.2L24 36.5L20.8 27.2L11.5 24L20.8 20.8Z" />
      <path className="lem-fill" d="M24 11.5L27.2 20.8L24 24L20.8 20.8Z" />
    </>
  ),
}

/** Every emblem id, in the order the model lists them. Used by the gallery and the tests. */
export const EMBLEM_IDS = Object.keys(GLYPHS) as EmblemId[]

/**
 * The tile, as bare SVG content in a 48 x 48 box, so a board can place it with a
 * transform instead of nesting an <svg>. Colour comes from `color` on an ancestor.
 */
export function EmblemTile({ id }: { id: EmblemId }): JSX.Element {
  return (
    <>
      <rect className="lem-ground" x="1.2" y="1.2" width="45.6" height="45.6" rx="4.5" />
      <rect className="lem-hair" x="4.4" y="4.4" width="39.2" height="39.2" rx="2.2" />
      {[0, 90, 180, 270].map(a => (
        <g key={a} transform={`rotate(${a} 24 24)`}>
          <path className="lem-fill" d="M3.4 3.4H9.4A6 6 0 0 1 3.4 9.4Z" />
          <circle className="lem-dot" cx="6.1" cy="6.1" r="0.9" />
        </g>
      ))}
      <g className="lem-glyph">{GLYPHS[id]}</g>
    </>
  )
}

export interface EmblemProps {
  id: EmblemId
  size?: number
  /** Accessible name. Without it the emblem is decorative and hidden from assistive tech. */
  title?: string
}

export function Emblem({ id, size = 40, title }: EmblemProps): JSX.Element {
  return (
    <svg
      className="lem"
      viewBox={`0 0 ${EMBLEM_BOX} ${EMBLEM_BOX}`}
      width={size}
      height={size}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <EmblemTile id={id} />
    </svg>
  )
}
