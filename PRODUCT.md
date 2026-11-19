# Product

<!-- impeccable:product-schema 1 -->

> **State of this file.** It describes the product as it stands on the `reinvent/alibi-casebook` branch (the redesign). The casebook is behind a build flag and is not the shipped home screen. Where the redesign and the shipped game differ, both are described. Whether the casebook replaces the shipped game is an owner decision, listed at the end.

## Platform

web

## Users

Primary users are solo puzzle players looking for a focused deduction game they can understand quickly and play in short sessions on either a phone or desktop. They need to read evidence, cross-reference a spatial board, test placements, and return to an unfinished case without losing progress.

## Product Purpose

Alibi is an installable, offline-capable murder-mystery deduction puzzle. Each case asks the player to place every person on a house plan so that each occupies exactly one row and one column, then name the suspect left alone with the victim. Success means the player can form and revise a mental model of the case, finish a uniquely solvable grid, and see why the accusation follows from the evidence.

## Direction: the casebook

The redesign rests on one rule, stated on the picker: **everyone told the truth.** Every statement is true, nobody is caught lying, and the murderer is the one whose true account leaves them alone with the victim. The player is not hunting a liar; they are reading the statements until one arrangement is left.

What the casebook adds on this branch:

- **Illustrated plan board.** A top-down plan drawn in SVG from the puzzle data, with five architectural style packs, room labels, a compass and a clear grid (ADR-0003, status "proposed"). Floors switch on two-floor cases.
- **Lens.** Tapping a statement lights the squares where it can be true; lit statements light the squares where all of them hold. It reads only what the statements say, never the solution.
- **Suppose.** Holding a square puts one suspect there as a ghost and shows, one step only, what that leaves everyone else. A contradiction on screen is one the player found.
- **Why?** A three-level hint (whom to look at, which statements to light, the placement), computed from the clues. A hint or a wrong accusation costs a tier.
- **Named accusation.** The player names a suspect. A wrong name is a strike; three strikes close the case cold.
- **Tiers.** *Proved* (right name, exact plan, no hint, no strike), *Proved with help* (a hint or a strike was spent), *Called it* (right name over an unfinished plan, or after the answer was shown).
- **Alibi roll-call.** The reveal. Each other suspect is cleared by their own true account, far from the victim to near, until one is left. Motives and the case's closing line appear only once the case is solved.
- **Case 0.** A first-run walk-through of about 90 seconds on a 4x4 plan, played on the casebook's own desk with a coach: eight beats, a soft amber halo on what to touch, a prologue and a closing card, and a way out ("Skip"). Offered from the picker; a flag records that it was done or skipped.
- **Authored stories.** Each deep case has a title, a premise, a cast with display names, roles and motives, and a closing line (`src/casebook/stories.ts`), set in a fictional coastal town, Portinhal. A season mystery, the harbour bell that has stopped ringing, runs through the twelve. Story text is non-positional: it never names a room, a direction or a person.
- **Small extras.** Light and dark themes, an optional sound set (synthesised in the browser, off by default), reduced-motion support, and the type set in Newsreader, Hanken Grotesk and Courier Prime.

## Content

- **12 deep cases, `pt-01` to `pt-12`** (`src/data/casebook.generated.json`): four each at 6x6 on one floor, 8x8 on one floor and 8x8 on two floors, with five suspects and a victim each, ordered so the longest inference chain never shortens. Canonical data: its digest and every case fingerprint are pinned by tests.
- **60-case archive** (`src/data/catalog.generated.json`): the baked catalogue of the shipped game, in six difficulties from Very Easy to Master, 6x6 to 8x8, 30 of them on two floors. Also canonical and pinned. The casebook picker currently lists the 12 deep cases and two archive cases (`hard-2`, `very-easy-3`); the whole archive is played in the shipped Classic and Detective modes.
- Every case has a unique solution and a logically correct murderer, checked by the solver and, for the deep cases, by an independent interpreter in the tests.

## Positioning

Alibi combines literal witness statements, a spatial house plan and permutation-grid logic: the room, furniture and relationship language in each statement maps directly to visible plan features and produces one valid arrangement. The format is credited to Murdoku and its creator; see `docs/ORIGINALITY_AND_IP.md`.

## Operating Context

In the shipped game, players choose a case and either Classic or Detective mode, read suspect clues, place or pencil people onto the map, eliminate impossible cells, use undo, redo, clear, or limited hints, submit an accusation, and review the reveal. In the casebook (`?casebook=`, `?casebook=<id>`, `?tutorial`), the player picks a case from the picker, works the plan with the lens, suppose and Why?, names a suspect and hears the roll-call. The route exists only in a development build or a build made with `VITE_CASEBOOK=1`; a normal production build drops it. Sessions may be interrupted; theme, mode, records, solved cases and in-progress placements persist locally. The app is designed for touch, keyboard, mobile, desktop, light and dark environments.

## Persistence

Local storage only; nothing leaves the device.

- Shipped game: the `murdoku_*` keys (theme, mode, in-progress and per-case saves, solved cases, records, case notes, fingerprints, catalogue version and others). They are compatibility contracts and must not be renamed.
- Casebook and Case 0: the `alibi_*` keys. The casebook never reads or writes a `murdoku_*` key.
  - `alibi_casebook_v1:<caseId>`: the in-progress plan for one case. It carries the fingerprint of the puzzle it was made on; a save whose fingerprint is missing or does not match the current puzzle is discarded, never applied.
  - `alibi_casebook_v1:_sound`: sound on or off.
  - `alibi_theme`: the theme chosen from the menu, written only when the player chooses.
  - `alibi_tutorial_v1`: `done` or `skipped` for Case 0.
  - `alibi_chunk_reload_at` (session storage): guards the single reload after a failed lazy-load.
- Plans saved on earlier casebook previews have no fingerprint and are discarded. That data was preview-only.

## Capabilities and Constraints

- Every case must retain a unique solution and a logically correct murderer.
- Room names and furniture must remain immediately identifiable because statement interpretation depends on them.
- Every person must occupy one unique row and column; board controls must preserve semantic button behaviour and keyboard navigation.
- The baked case files are canonical. Changing a puzzle under a case id changes its fingerprint, which discards players' saves and detaches its authored story; `scripts/bake-casebook.mjs` and `scripts/bake-catalog.mjs` refuse to overwrite without `--force`.
- The page's Content-Security-Policy is `style-src 'self'`: no inline `<style>` element, no inline script, no outside host. Styling that depends on state uses classes, data attributes or the CSS object model.
- The PWA must remain installable and usable offline.

## Brand Commitments

The product name shown to players is **Alibi**. The repository, deployment URL and the shipped game's persistence keys retain the Murdoku name for compatibility. Language is concise, observant and investigative; game terms include case, statement, suspect, victim, alibi, plan and accusation.

## Evidence on Hand

- Puzzle rules, capabilities and architecture: `README.md`
- Current behaviour and interaction constraints: `src/` (the casebook is `src/casebook/` and `src/tutorial/`)
- Case data and the solution model: `src/core/`, `src/data/`
- Visual and accessibility rationale: `DESIGN.md`, `docs/ADR-0003-illustrated-floor-plans.md`
- Third-party material and licences: `PROVENANCE.md`, `public/THIRD-PARTY-NOTICES.txt`
- Originality and IP review: `docs/ORIGINALITY_AND_IP.md`
- No testimonials, commercial claims, customer logos, pricing or external performance claims are available and none should be invented.

## Product Principles

1. Evidence must map to the board without interpretation friction.
2. Every action should preserve the player's chain of reasoning.
3. The interface should make dense logic feel tactile and legible, not administrative.
4. Interruption must be harmless: progress and preferences survive locally.
5. Atmosphere may heighten the mystery but never hide state, controls or statements.

## Accessibility & Inclusion

All core flows must work with keyboard and touch, maintain visible focus, meet WCAG AA contrast, respect reduced-motion preferences, expose non-text board information to assistive technology, and keep interactive targets at least 44px.

## Pending owner decisions

1. Whether the casebook replaces the shipped Classic and Detective home screen, and when `VITE_CASEBOOK` stops being needed.
2. Whether the illustrated plan is approved as the playable board (ADR-0003 is "proposed").
3. How the 60-case archive reaches casebook players (today the picker lists two of them).
4. Where the Murdoku credit, the non-affiliation notice and the licence notices appear inside the casebook (today they are on the shipped home screen's About only).
5. The open IP and naming items in `docs/ORIGINALITY_AND_IP.md`.
