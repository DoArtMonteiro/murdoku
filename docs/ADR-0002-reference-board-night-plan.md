# ADR-0002 — The playable board is a 2D "Night Plan", not a three.js scene

**Status:** proposed (R1, 23/10/2026). It awaits the owner's approval.
**Supersedes:** ADR-0001 for the playable board. The three.js pipeline stays in the repository, but it no longer draws a board a player uses.

## Context

The R0 audit (https://claude.ai/artifact/Jjc8PFNX5bpRtLZWusU1aA) found that the isometric three.js board hid the puzzle. The clues name rows and columns, but the 45° camera drew those rows and columns as diagonals and showed no numerals. Beams covered playable cells in 25 of 60 cases. The hand-authored scenes added props that were not clue targets.

R1 built two playable versions of `very-easy-1` (Midnight Delivery). Both run on the same verified puzzle state and the same shell, so the board drawing was the only difference.

1. **Night Plan:** an SVG floor plan drawn from the puzzle data (`src/reference/boards/nightplan`).
2. **Plan 3D:** three.js with an orthographic camera at azimuth 0° and elevation 72°. Its floor projects exactly onto the shell's cell grid (`src/reference/boards/plan3d`).

Both use the same layout contract (`src/reference/contract.ts`): an axis-aligned cell grid, with numerals, tokens and the hit grid drawn by the shell.

## Evidence

The art director (Fable) assessed both versions on their own (`scratchpad/r1/fable-ab/CRITIQUE.md`). A fresh adversarial reviewer also tested them (`scratchpad/r1/gate/REPORT.md`). Both are archived in the R1 evidence tarball.

| Measure | Night Plan | Plan 3D |
|---|---|---|
| Cell at 1440×900 | 115 px | 115×109 px |
| Cell at 390×664 (iPhone 13 viewport) | 44 px | 44×42 px |
| Playable cells hidden by geometry | 0 | 0 (render-ID pass, 83 storeys) |
| Drawn pieces vs logical pieces (very-easy-1) | 16 / 16, each inside its cells | 36 drawn: 15 decorative, 11 spilling more than 10 % outside their cells |
| Coordinate taps registered correctly | 60 / 60 | 60 / 60 |
| Without WebGL | Same picture | Blank grid, no message |
| Deterministic picture | Yes (0 px diff) | Yes (0 px diff) |
| Fable scores (legibility / credibility / beauty / UX / mobile / scalability) | 8 / 6 / 7 / 7 / 7 / 7 | 4 / 5 / 5 / 4 / 3 / 4 |
| Adversarial reviewer verdict | Pass | No-go (D1 art does not match the data; D2 no WebGL) |

## Decision

The playable board becomes the Night Plan, drawn from the puzzle data alone.

- Each logical piece is drawn exactly once, inside its own cells, and no decorative piece appears on a playable cell.
- Walls sit on room boundaries; every room has a door whose swing area is clear of furniture.
- Numerals stay permanently in the margins, rows run horizontally on screen, and labels sit on the poché so a token never hides them.
- The picture is deterministic and needs neither WebGL nor any network asset.

The three.js code is parked. It may later render static images off the board, such as index thumbnails or the share card, and must never draw a playable board.

## Consequences

- Cases can be added without hand-written scene files. The 92 files in `src/scene3d/scenes` are no longer needed for play. They stay in the repository until the migration ends.
- The 59 other cases still use the old isometric `GameScreen`. Migrating them is P0 of the next round. That migration also removes finding A1 from the gate: decorative props in the old 3D scenes contradict "the X" wording.
- The Plan 3D prototype stays at `?ref=plan3d` only as evidence for this decision. It is not a supported route.
