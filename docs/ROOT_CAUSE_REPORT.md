# Root-cause report — why the Midnight Delivery diorama kept failing

Scope: commits 466263a → 9ef1545 on `art-kenney-v2`, the `claude/midnight-delivery-polish` follow-up (babcba9) and the uncommitted iteration preserved on `checkpoint/pre-fable-rebuild-2026-09-02`. Baseline screenshots of the last state are in `C:\Users\Duarte\murdoku-checkpoints\baseline\`.

## The one root cause

**The renderer had no physical model, so every correction was a guess about pixels.**

The sprite compositor knew, for each object, only: a PNG, its canvas size, a grid cell, and a scale. It did not know where the object's feet were inside the PNG, how deep its footprint was, which side was its back, what height its top surface had, or how thick a wall was. Every one of those facts was replaced by a number an agent tuned by eye — `lift: 20`, `offsetCol: -0.15`, `scale: 0.58`, `groundOffsetY`, `shadowOffsetRow` — and every such number is wrong again the moment anything next to it moves.

The five iterations were not converging on a correct scene. They were converging on a set of offsets that happened to look acceptable in one screenshot at one size.

## The failure classes and what actually caused them

| Symptom seen in screenshots | Mechanism in the sprite compositor |
| --- | --- |
| Floating beds/sofas; feet not on the floor | Sprites were bottom-anchored to the cell's *diamond centre + TILE_H/4*. Kenney's PNG canvases include transparent padding and the visible base is at a different height per sprite; nothing measured it. |
| Blob shadows detached, pointing anywhere | Shadows were ellipses at the cell centre with a per-object width, not the object's contact shape; sprite offsets moved the picture but not the ellipse. |
| Walls reading as fins/panels/stairs | Walls were SVG parallelograms of arbitrary height (46–132 px) and a "thickness" drawn as a cap polygon. They were not the same projection as the sprites (Kenney rendered at ~45° elevation; the SVG assumed the tile ratio 148/208), so wall geometry never lined up with furniture geometry. |
| Walls through counters, plant pots eaten by walls | There was no wall volume to test against. The diagnostic checked footprints against a *centre line*, so a cabinet could pass the check while its sprite overlapped the drawn wall. |
| Appliances in open floor; microwave on the ground | "Counter" was a single logical cell; a run of cabinets was three sprites at hand-picked fractional cells. The microwave was `lift: 20px` on top of whichever sprite happened to be under it. |
| Unexplained wall stubs (north-link-low, kitchen-east-service) | Runs were authored as fractional spans (2.36, 0.66, 2.62) to make the picture "close" — the numbers describe a drawing, not a plan, so ends land nowhere. |
| Institutional corridor / grid-derived architecture | Walls were only ever placed on cell edges of the room rectangles because that was the only coordinate the compositor understood. |
| Wrong scale between objects | Per-object `scale` (0.52 … 1.65) exists because the sprite canvases are not one world scale once padding differs; the "right" number was found by eye each time. |
| Tests and diagnostics saying PASS on broken images | They asserted the tuned numbers (spans, heights, offsets) and centre-line non-intersection. They encoded the guess, not an invariant. |
| Kitchen chair = office chair, dining table = coffee table | The type→sprite map had one sprite per logical type and no room-role concept, so every "chair" was `chairDesk`. |

## Why it could not be fixed incrementally

- The sprite set has exactly four facings per model; any pose needing 45° or a mirrored sofa is impossible.
- Kenney's PNGs are renders of the models with baked lighting from one direction, so any additional shadow contradicts the shading already painted on the sprite. Adding shadows made objects look *more* airborne, as the history notes.
- Interior wall thickness, corners and doorways cannot share a projection with pre-rendered sprites unless the walls are also rendered from the same camera — at which point one is rendering 3D anyway.
- Two-storey and stairs would have required a second, taller sprite compositor with its own set of guesses.

## What replaced it

- Geometry comes from the glTF files (`scripts/kenney-catalog.mjs` → `catalog.generated.ts`), so feet, footprints and surface heights are measured, not tuned.
- Objects are placed by relationship (`against` a wall face, `on` a surface, `at` a point) and the resolver computes positions.
- Walls are boxes with thickness; openings are subtracted; door frames are real models in the gap.
- One light, one camera, one projection shared by the renderer and the DOM overlay.
- Invariants are validated on the resolved model, and the tests assert the invariants, not the numbers.

The remaining honest compromise is documented in `ISOMETRIC_SCENE_SYSTEM.md` §"Known limits": tall objects placed against the cut-away south/east shell show their backs (Midnight Delivery's fridge), which the validator reports as a warning for a human to accept or re-plan.
