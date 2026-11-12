# Murdoku

A deduction puzzle where clues help place suspects and a victim around a house, then identify who was alone with the victim.

**Status:** Live. The published demo is branded **Alibi**; the repository remains Murdoku.

[**Play the demo**](https://murdoku-seven.vercel.app) · [**Browse the source**](https://github.com/DoArtMonteiro/murdoku)

## Why it exists

The game turns written clues and spatial relationships into a logic problem with a verifiable solution. Each person occupies a row and a column. Clues restrict possible positions until one valid arrangement remains. Players mark impossible cells, test hypotheses, and make an accusation.

## How it works

The catalogue contains 60 cases across six difficulty levels, from 6×6 grids to two-floor layouts. The engine can generate cases deterministically from a seed or load hand-authored cases. A solver checks that each puzzle has a unique solution before the game presents it.

## Engineering highlights

- **Game rules are separate from the interface:** clue types, generation, solver, and catalogue live in TypeScript under `src/core`; React renders the game state.
- **Generated puzzles are checked:** the generator starts with a solution, creates true clues, then uses a backtracking solver to reject ambiguous puzzles.
- **Stable catalogue:** consistent seeds and IDs let the game save progress and reuse puzzles after a reload.
- **Offline play:** the app is installable as a PWA and stores progress on the device.

## Architecture

```text
src/core/       types, clue engine, solver, generator, and catalogue
src/hooks/      game state and theme
src/components/ grid, clues, suspects, and game screens
src/styles/     variables and themes
```

The React interface uses the game engine without owning deduction rules. This keeps the logic testable without rendering components.

## Stack

TypeScript · React · Vite · Vitest · Vite PWA

## Run locally

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Build and preview the production version locally:

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
npm run test:coverage
npm run lint
```

Run `npm run verify` to check the catalogue.
