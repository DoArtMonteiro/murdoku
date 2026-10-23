import type { FurnitureType } from './types'
import type { FurnitureIcon } from './furniture'
import { SPRITE_DIMS, UNIT_PX } from './kenneySprites'

// ============================================================================
// EVALUATION BRANCH ONLY — Kenney Furniture Kit (CC0) swapped in for the
// hand-drawn noire miniatures, so the two directions can be compared on the
// real board instead of argued about.
//
// Kenney's kit ships every object in four pre-rendered facings
// (NE/NW/SE/SW), which is the one thing it does better than hand-drawn art
// here: a turned piece never has to be rotated by CSS, because the turned
// view already exists. SE is used face-on and SW as the side view, feeding
// the FURNITURE_ICON_SIDE mechanism already in the renderer.
//
// KNOWN GAP: the kit has no clock, which is one of the game's 19 types and
// is referenced by clue text ("Beside the clock"). `radio` stands in for it
// here so the board renders; it would need resolving before this could ship.
// ============================================================================

export const KENNEY_FILE: Record<FurnitureType, string> = {
  chair: 'chair',
  sofa: 'loungeSofa',
  bed: 'bedDouble',
  // tableRound's top hides its legs at this camera angle, so it rendered as a
  // flat tan disc lying on the floor rather than a table. tableCoffee keeps
  // visible legs and a readable slab.
  table: 'tableCoffee',
  box: 'cardboardBoxClosed',
  rug: 'rugRectangle',
  plant: 'pottedPlant',
  shrub: 'plantSmall1',
  lamp: 'lampSquareFloor',
  counter: 'kitchenCabinet',
  tv: 'televisionVintage',
  bathtub: 'bathtub',
  bookshelf: 'bookcaseOpen',
  stove: 'kitchenStove',
  fridge: 'kitchenFridge',
  clock: 'radio', // no clock in the kit — see KNOWN GAP above
  desk: 'desk',
  toilet: 'toilet',
  shower: 'shower',
}

/**
 * A sprite is shown WHOLE and UNRETOUCHED. That sounds obvious; the first
 * attempt did neither, and it is what ruined the art.
 *
 * What went wrong, so it is not repeated:
 *   - the sprite was boxed at 94% of a cell and given `object-fit: contain`.
 *     An isometric object is much taller than its floor footprint, so
 *     `contain` solved for the HEIGHT and shrank the whole piece until its
 *     base covered a fraction of the square it was standing on. Everything
 *     read as a doll's-house miniature dropped in the middle of a big tile.
 *   - a drop-shadow was added on top of art that already carries its own
 *     baked contact shadow, doubling it into a smudge.
 *   - the vertical lift (scaleY) then stretched the result out of proportion.
 *
 * The fix is to stop treating the sprite as an icon in a box. It is bottom
 * anchored and drawn WIDER than its cell, so its floor footprint fills the
 * square and its height is free to rise out of the top — which is how the
 * object was rendered in the first place. `object-fit` is deliberately absent:
 * the image keeps its intrinsic aspect and nothing is cropped or letterboxed.
 */
const sprite = (name: string): FurnitureIcon => ({ size }: { size?: number }) => {
  const [nw] = SPRITE_DIMS[name] ?? [UNIT_PX, UNIT_PX]
  // Width in CELLS, from the sprite's own pixels. --cell is published by the
  // furniture overlay. A floor is applied so genuinely tiny props (a 14px
  // seedling) stay findable on a board where furniture is a clue target.
  const cells = Math.max(nw / UNIT_PX, 0.55)
  return (
    <img
      src={`/kenney/${name}.png`}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{
        position: 'absolute',
        // Stood on the middle of the footprint's floor. `height: auto` keeps
        // the sprite's intrinsic aspect, so a tall object is tall rather than
        // squashed, and is free to rise out of the top of its square exactly
        // as it was rendered.
        left: '50%',
        bottom: '-4%',
        width: size ? `${size}px` : `calc(var(--cell, 40px) * ${cells.toFixed(3)})`,
        height: 'auto',
        transform: 'translateX(-50%)',
        // Nothing is applied over the art. It arrives lit and shadowed.
        pointerEvents: 'none',
      }}
    />
  )
}

export const FURNITURE_ICON: Record<FurnitureType, FurnitureIcon> = Object.fromEntries(
  (Object.keys(KENNEY_FILE) as FurnitureType[]).map(t => [t, sprite(`${KENNEY_FILE[t]}_SE`)]),
) as Record<FurnitureType, FurnitureIcon>

/** SW is the same object seen from the side — used for 90/270 rotations. */
export const FURNITURE_ICON_SIDE: Partial<Record<FurnitureType, FurnitureIcon>> = Object.fromEntries(
  (Object.keys(KENNEY_FILE) as FurnitureType[]).map(t => [t, sprite(`${KENNEY_FILE[t]}_SW`)]),
) as Partial<Record<FurnitureType, FurnitureIcon>>
