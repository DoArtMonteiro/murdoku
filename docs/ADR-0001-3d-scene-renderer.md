# ADR-0001 — Render the dollhouse from Kenney's 3D models, not from isometric sprites

**Status:** accepted (2026-09-02)
**Branch:** `art-kenney-v2`
**Supersedes:** the sprite compositor in `src/components/IsoBoard.tsx` (commits 466263a … 9ef1545 and the uncommitted follow-up preserved on `checkpoint/pre-fable-rebuild-2026-09-02`)

## Context

Five iterations tried to make one case (Midnight Delivery, `very-easy-1`) read as a believable apartment by compositing Kenney's pre-rendered isometric PNGs. Each iteration added a compensating mechanism — furniture offsets, per-sprite scale, ground-offset pixels, blob shadows, wall centre-line diagnostics, "modules" for microwaves — and each still shipped visible defects: furniture off the floor, walls drawn as fins, appliances in open floor, unexplained wall stubs, a fridge whose supports never met the ground.

The Kenney Furniture Kit is a 3D asset pack (140 glTF models, CC0). The PNGs the project used are Kenney's own renders of those models from one fixed camera. Every problem listed above is a consequence of trying to recover 3D relationships (contact, occlusion, rotation, wall thickness, shadow direction) from 2D pictures of them.

## Options evaluated

### A — keep 2D sprites, add a physical model

To become robust the sprite path would need, per sprite and per facing: calibrated ground-contact anchors, true floor footprints, clearance envelopes, depth-sort anchors, wall-facing metadata, support-surface heights, and a consistent hand-drawn shadow. Walls would remain SVG parallelograms with no relation to the sprite camera. Rotation is limited to the four pre-rendered facings and every intermediate pose is impossible. Multi-storey and stairs would need a second sprite compositor. Nothing in that list is derivable: all of it is eyeballed per sprite, which is exactly the class of work that failed five times.

### B — use the glTF models directly (three.js, orthographic camera)

Prototype (`proto/iso3d.ts`, since removed; screenshots in `C:\Users\Duarte\murdoku-checkpoints\proto\`) built in one pass: floor tiles, shell walls with thickness and corners, a partition with a door frame, bed, sofa, counter run, desk, fridge, table and chairs, one directional light with shadows.

Measured on the prototype:

| Concern | Result |
| --- | --- |
| Grounding | every model's bbox min y = 0 in the source files; grounding is a property of the asset, not a setting |
| Rotation | any yaw; four facings are just 90° steps |
| Walls | real boxes with thickness, caps, junctions; door frames are Kenney models standing in real gaps |
| Depth / occlusion | z-buffer; nothing to sort, nothing to bias |
| Shadows | one directional light; contact shadows fall out of the shadow map |
| Determinism | orthographic camera built from `units.ts`; the DOM overlay uses the same closed-form projection to the pixel |
| Assets | 140 glb files, 1.9 MB total, 2–23 KB each, no textures; only used models load |
| Render cost | 1.1 ms/frame, ~300 draw calls, 12k triangles on an integrated GPU; rendered on demand only |
| Bundle | three.js in its own lazy chunk (~153 KB gz) loaded when a board mounts |
| Hit testing | unchanged: DOM polygons from the shared projection; WebGL is never asked "what did I click" |
| Accessibility | unchanged: `role=grid`/`gridcell` DOM stays; the canvas is `aria-hidden` |
| Multi-storey / stairs | y offset per storey; `stairs*` models exist in the kit at wall height (1.34 vs 1.29) |
| Outdoor | Nature Kit (330 glTF models, CC0) shares scale and style |
| Failure mode | no WebGL → renderer returns null, the DOM board still plays (jsdom tests rely on this) |

## Decision

Replace the sprite compositor with a 3D scene system:

- `src/scene3d/units.ts` — one coordinate system (cell → Kenney units) and one projection shared by camera and DOM;
- `src/scene3d/schema.ts` — what an author may say (walls with endpoints and openings, furniture placed *against* walls, *on* surfaces, or *at* a point; no scale, no pixel offsets);
- `src/scene3d/catalog*.ts` — measured geometry for all 140 models plus curated support semantics;
- `src/scene3d/resolve.ts` — pure resolver to world-space boxes;
- `src/scene3d/validate.ts` — machine-checkable invariants (penetration, support, doors, free ends, reachability, visibility, logic contract);
- `src/scene3d/renderer.ts` — three.js drawing of the resolved scene, lazy-loaded;
- `src/components/IsoBoard.tsx` — canvas + DOM overlay, same props as before.

The 2D Kenney PNGs stay in `public/kenney` only for the flat `MapGrid` used by the home-page preview and the furniture picker.

## Consequences

- Scene authoring becomes declarative and checkable; the validator rejects the historical failure classes before a pixel is drawn (see `tests/IsoBoard.test.tsx`, "validator catches the historical failure classes").
- The renderer is ~600 KB minified but isolated in a lazy chunk; the app shell is unchanged.
- A device without WebGL gets the DOM board over an empty canvas. A 2D fallback board (`MapGrid`) exists and can be wired as a visible fallback if analytics ever show this matters.
- Kenney's `KHR_materials_unlit` materials are rebuilt as lit Lambert materials at load; the palette is lifted 15% in saturation to match Kenney's own sample renders under our lighting. This is the only global "look" knob and lives in `renderer.ts`.
