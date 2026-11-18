# Alibi UX/UI Overhaul Plan

## 1. Live audit baseline

Tested locally at `1440x1000` and `390x844` in the current light theme, including the home catalog, first-run help, and the first playable case.

- The application is functionally responsive: no horizontal overflow was found, the desktop game fits one viewport, and the board remains square at both target widths.
- The home surface is visually flat and catalog-heavy. It renders 770 DOM nodes and becomes a 3,565px single-column case index at 390px, with no search, difficulty jump, or resume affordance.
- `What’s new` is only 24px tall and `What am I looking at?` is only 17px tall, below the 44px touch-target contract.
- Mobile solving gets the correct board → clues → tools → accuse order, but progress is absent from the working flow and the action sequence is not externalized.
- Desktop dedicates an entire rail region to duplicated metadata, a permanently expanded legend, and a dead `[ Coming soon ]` notes placeholder.
- The first-run help dialog blocks the board as expected, but its mobile presentation consumes nearly the entire first viewport and should become a tighter, scroll-safe briefing.
- The board and its illustrated furniture are the strongest incumbent artifact. They must remain colorful and nameable because clue comprehension depends on them.
- Home correctly avoids loading all portraits; the game loads only the active case’s four portraits. No avatar-request explosion was observed.
- The current dev page recorded 33 resources and no obvious runtime error. Performance work should focus on DOM density, render containment, and avoiding new image payloads.

Baseline screenshots live in a location outside the repository.

## 2. Direction decision

### Chosen world: Continuity Desk

The interface becomes a cinematic evidence-reconstruction table: the player edits a coherent account of the night one placement at a time. A horizontal continuity strip externalizes the sequence, suspect records behave like contact sheets, and a single amber evidence path binds the active clue to the relevant room or object.

This preserves the product’s literal clue/board mapping while replacing the current flat parchment catalog. It also satisfies the requested cinematic character without drifting into neon cyber-noir or decorative film nostalgia.

- Impeccable seed: `dcf20905`
- Grounded direction: connected evidence wall / continuity desk
- Approved comp: `.impeccable/mocks/continuity-desk-approved.png`
- Rejected comp A: too dependent on photographic evidence the product does not own
- Rejected comp C: turns clues into extra evidence objects and weakens product truth

### Direction contract

- **THESIS:** Solving is the reconstruction of one continuous account, not browsing a dashboard of cards. The interface refuses the generic parchment case-file catalog.
- **OWN-WORLD:** Matte magnetic graphite, smoky olive, bone evidence strips, projector amber for active state, oxblood for accusation and conflict; contact-sheet crop marks, clipped tabs, film perforation rhythm, and taut grease-pencil connectors.
- **STORY:** Pick or resume a case, select the next person in the continuity strip, read one literal clue, connect it to the illustrated board, place the person, and accuse only when the account is complete.
- **FIRST VIEWPORT:** Desktop uses a compact masthead, a full-width continuity strip, a dominant board at roughly 60%, a right dossier, and one bottom action rail. Mobile keeps header → board → compact continuity → clues → tools → accuse.
- **FORM:** Connected evidence wall, grounded direction 7, seed `dcf20905`; approved composition `.impeccable/mocks/continuity-desk-approved.png`.
- **FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md

## 3. Token rewrite

`src/styles/theme.css` remains the single visual source of truth. Existing semantic names stay stable so behavior and legacy classes survive.

### Dark / projection-room default

| Token | Value | Role |
|---|---:|---|
| `--color-bg-base` | `#080a08` | magnetic table |
| `--color-bg-surface` | `#111511` | instrument panel |
| `--color-bg-elevated` | `#192019` | selected evidence plate |
| `--color-bg-inset` | `#050705` | film gate / recess |
| `--color-border-subtle` | `#e8dfc51f` | hairlines only |
| `--color-border-strong` | `#737565` | interactive boundary |
| `--color-text-primary` | `#f1e8ce` | bone-white primary text |
| `--color-text-secondary` | `#c8c0aa` | evidence copy |
| `--color-text-muted` | `#949184` | metadata |
| `--color-accent` | `#d89a22` | projector amber fill |
| `--color-accent-strong` | `#ffc24b` | focus and active outline |
| `--color-accent-text` | `#ffc85e` | amber text on dark |
| `--color-on-accent` | `#160f04` | ink on amber |
| `--color-danger` | `#8c2d24` | accusation / conflict |
| `--color-danger-text` | `#ffb6aa` | danger text on dark |

### Light / daylight editing bench

| Token | Value |
|---|---:|
| `--color-bg-base` | `#d7d3c7` |
| `--color-bg-surface` | `#ebe6d9` |
| `--color-bg-elevated` | `#f6f0e1` |
| `--color-bg-inset` | `#c5c2b7` |
| `--color-border-subtle` | `#3f433522` |
| `--color-border-strong` | `#575b4e` |
| `--color-text-primary` | `#171914` |
| `--color-text-secondary` | `#3f433b` |
| `--color-text-muted` | `#686b61` |
| `--color-accent` | `#a46c08` |
| `--color-accent-strong` | `#704900` |
| `--color-accent-text` | `#704900` |
| `--color-on-accent` | `#fff7e4` |
| `--color-danger` | `#8a2a22` |
| `--color-danger-text` | `#702019` |

Typography becomes `Barlow Condensed` for case/display language, `Courier Prime` for evidence, and `Hanken Grotesk` for dense controls. Board materials and per-room colors stay intact.

Add reusable system tokens for perforation spacing, projector glow, clipped corners, focus, motion durations (`120ms`, `220ms`, `420ms`), and one physical easing curve (`cubic-bezier(.2,.8,.2,1)`).

## 4. Component architecture

### `App.tsx` / `index.html`

- Emit the direction contract as the first body comment so it survives production build.
- Preserve lazy routes and `MotionConfig reducedMotion="user"`.
- Pass in-progress case metadata from `useGame` to the home surface.

### `HomeScreen.tsx`

- Replace the oversized crest and uninterrupted case wall with a compact case-index masthead.
- Add an in-progress `Continue reconstruction` strip when a saved case exists.
- Add a real search field plus five difficulty filters and an All state. Filters are buttons with square clipped tabs, never pills.
- Keep all 27 cases available, but render only matching sections; add `content-visibility: auto` to off-screen case groups.
- Restyle cases as contact-sheet records with case number, title, grid size, cast dots, solved/in-progress state, and best time.
- Keep portraits out of the catalog to prevent remote-request multiplication.
- Give `What’s new`, filters, and all case controls a 44px minimum target.

### `GameScreen.tsx`

- Remove the duplicated three-column case-file rail and the dead notes placeholder.
- Add `CaseProgressStrip`: ordered people, selected state, placed state, conflict state, victim label, and an `aria-live` placed-count summary.
- Desktop: masthead → continuity strip → two-column workspace (board 58–64%, dossier remainder) → command rail. The board remains fully visible at 1024px+.
- Mobile: masthead → board → horizontally scrollable compact continuity strip → suspect clues → notes disclosure → tools → accuse. No sticky element may obscure a board cell or clue.
- Replace the small legend link with a 44px disclosure control.
- The active suspect’s literal clue highlights the corresponding room or furniture cells without changing placement semantics.
- Keep feedback focus-safe and preserve the imperative shake restart.

### `MapGrid.tsx`

- Preserve the illustrated floor materials and recognizable furniture artwork.
- Accept an optional semantic highlight descriptor (`roomId`, `furniture`, or exact cells) and mark matching cells with an amber projector outline plus `aria-describedby` context.
- Add row/column labels at the perimeter without shrinking cells below the current playable size.
- Use CSS-only scan light and selection trace; reduced motion shows the final state immediately.

### `SuspectCard.tsx`

- Recompose as a contact-sheet record: frame number, portrait, name, role, clue, placed/check state.
- Selected state uses amber crop marks and an inset light sweep, not a rounded card glow.
- Preserve visible clue text and 44px controls.

### `CaseNotes.tsx` (new)

- Replace `[ Coming soon ]` with a real per-case notes field.
- Autosave locally using a new versioned `murdoku_case_notes_v1` record keyed by puzzle id.
- Show saved state accessibly; allow clear with confirmation; never send notes over the network.

### Victory, help, release notes, and theme toggle

- Translate them into the same continuity/evidence grammar.
- First-run help becomes a compact three-step briefing with a scroll-safe mobile body.
- Victory reveal uses a red accusation plate followed by an amber `case reconstructed` state; reduced motion skips the sequence.

## 5. State and QoL updates

- Extend `useGame` with read-only in-progress metadata derived from the existing saved-play payload: case id, mode, elapsed time, placed count, and selected person. Do not rename any existing persistence key.
- Add pure helpers for case search/filtering, saved-play parsing, note serialization, and clue-to-board highlight resolution so each can be unit tested.
- Do not auto-advance or auto-place on behalf of the player. The strip recommends the next unresolved person but selection remains explicit.
- Persist notes independently from puzzle state so clearing a board never destroys reasoning.
- Add semantic test ids only at stable workflow boundaries: home search, resume case, progress strip, case notes, board, tool rail, and accuse.

## 6. Motion and interaction

- CSS is the default. Framer remains only for route/dialog presence and the existing token landing behavior.
- Opening: projector aperture fades from the active board area outward once, `420ms`.
- Selecting a suspect: crop marks snap in at `120ms`; one amber line draws to the clue target at `220ms`.
- Placement: the existing physical token snap stays; the matching continuity frame gains a magnetic lock tick.
- Accusation rejection: keep the existing focus-preserving shake. Incomplete guidance does not shake.
- Hover rules remain inside `(hover: hover) and (pointer: fine)`; all motion is neutralized under `prefers-reduced-motion`.

## 7. Approved-comp implementation inventory

| Visible ingredient | Production medium | Fidelity rule |
|---|---|---|
| Case masthead and timer | semantic HTML/CSS | compact, one line, always reachable |
| Film continuity strip | ordered HTML list + CSS perforation | show selected/placed/conflict without relying on color |
| Illustrated house board | existing React/SVG/CSS assets | preserve color, square cells, room names, and furniture recognizability |
| Selected clue connection | authored SVG/CSS overlay | one line only; never block pointer or board labels |
| Contact-sheet suspect records | semantic buttons + existing avatars | no generated portraits or extra requests |
| Magnetic progress markers | HTML/CSS | number + icon + text state |
| Bottom command rail | semantic buttons + Lucide icons | familiar labels, 44px targets, grouped modes/actions |
| Projector light and film grain | bounded CSS pseudo-elements | no runtime raster asset and no legibility loss |
| Notes field | semantic textarea/local state | local-only, autosaved, labeled |
| Comp-only photographic room render | accepted omission | the shipped illustrated board is product truth and remains the hero artifact |

The mock is a hierarchy and material north star, not a screenshot specification. Its invented photographic evidence, jobs, timestamps, and extra evidence log must not ship.

## 8. Verification gates

1. Unit: note persistence, saved-play parsing, case filters, clue-target resolution, and progress-state helpers.
2. Integration: home resume/search/filter behavior; GameScreen progress, notes, highlight, tool states, and clear/leave confirmations.
3. E2E with the live browser: search and start a case; place, undo, redo; note persistence after reload; submit incomplete feedback; theme toggle; releases; desktop and mobile flows.
4. Viewport proof: screenshots at 390px and 1440px in both themes, captured together in one inspection round and one confirmation round.
5. Mechanical: build, TypeScript, lint, puzzle verifier, tests with coverage, secret scan, console-error scan, Impeccable detector, and diff review.
6. Performance: no home portrait fan-out, no horizontal overflow, no board regression, and no new render-blocking raster asset.

## 9. Worker ownership

- **Luna 1 — layout/responsiveness:** `index.html`, `src/App.tsx`, `src/components/GameScreen.tsx`, new `src/components/CaseProgressStrip.tsx`.
- **Luna 2 — motion/polish:** `src/styles/theme.css`, `src/index.css`, `tailwind.config.js`, `src/components/MapGrid.tsx`, `src/components/SuspectCard.tsx`, `src/components/HowToPlay.tsx`, `src/components/VictoryScreen.tsx`, `src/components/ThemeToggle.tsx`.
- **Luna 3 — QoL/tests:** `src/components/HomeScreen.tsx`, new `src/components/CaseNotes.tsx`, new pure helpers/hooks, `src/hooks/useGame.ts`, test/config files, and `package.json` test scripts. Do not edit Luna 1/2-owned files; expose clean props/helpers for final integration.

Workers share one worktree and must preserve each other’s changes. Root integrates cross-owner props and resolves any remaining compile errors after all three finish.
