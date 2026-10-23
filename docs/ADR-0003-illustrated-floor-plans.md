# ADR-0003 — Rich illustrated floor plans are the playable board

**Status:** proposed (R2, 23/10/2026). It awaits the owner's approval.
**Refines:** ADR-0002. That ADR keeps a plan-aligned, data-driven 2D board and rejects the three.js board. This ADR keeps that geometry and replaces the sterile "Night Plan" look.

## Context

The owner rejected the R1 Night Plan as "super basic, no personality". They chose "Rich Illustrated Floor Plans" as the primary playable experience, with these requirements:
- distinct architectural styles;
- story and suspects;
- an evidence-led crime scene with an animated reconstruction;
- a future illustrated city with progression.

The puzzle constraints stay. The grid must be readable and aligned, coordinates must be correct, and nothing may hide essential puzzle information.

## Decision

- **Board.** The playable board is `src/reference/boards/illustrated`. It is a painted top-down SVG plan, built only from the puzzle data, using the ADR-0002 contract:
  - an axis-aligned cell grid;
  - numerals, tokens and the hit grid drawn by the shell;
  - room labels drawn in an overlay above the tokens.
- **Styles.** Five style packs (Victorian, Art Deco, Tudor, Modernist, Mediterranean) define materials, furniture silhouettes, non-clue decor and garden kits. `styleFor(puzzle)` picks one deterministically.
- **Narrative.** Narrative lives in `src/reference/story` and is checked by a validator. The validator enforces four rules:
  - interrogation lines restate only that person's clues;
  - pre-solve text is symmetric across suspects;
  - no narrative line claims presence or absence anywhere;
  - no evidence item sits on a playable cell during play.

  The reconstruction's deduction chain is computed from the puzzle itself.
- **Invariants.** Tests over all 60 cases and every storey enforce these:
  - each logical piece is drawn exactly once, inside its footprint;
  - no decorative object of a clue-relevant type;
  - every door swing is clear;
  - labels are at least 10 px and never hidden;
  - cell centres keep their contrast.

## Evidence

- **Fable.** Final critique in `audit-evidence/r2-evidence-2026-10-23.tar.gz`, file `fable-crit/CRITIQUE.md`. Midnight Delivery meets the owner's bar, with beauty 8 and atmosphere 8.
- **Adversarial gate.** Rounds 1 and 2, in `gate/REPORT.md`. Desktop passes. The mobile MAJORs were fixed and then re-verified.
- **Browser runs.** 120 of 120 journeys won on the production build: all 60 cases on desktop and on iPhone 13 by touch. The one-bit accusation rule held in every journey.

## Consequences

- **Authoring.** Each new case needs a story file to get the narrative layer. Cases without one still play on the illustrated board.
- **Phone cell size.** At 360–390 px wide, 8×8 boards give 32–36 px cells. 44 px is not geometrically possible there, and 32–36 px still clears the WCAG 2.2 AA minimum of 24 px.
- **Old renderers.** The Night Plan and plan3d boards remain in the repository as evidence only. The isometric GameScreen is retired once the home flow routes every case to the illustrated board.
