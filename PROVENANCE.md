# Provenance

What the published game ("Alibi") contains, where each part comes from, and how sure that is. Three labels are used:

- **Verified**: checked against the file, the package or a primary source.
- **Inferred**: concluded from file names, documentation or history in this repository, not checked at the source.
- **Unknown**: no record exists in the repository.

This is a record of facts, not legal advice. Licence terms are taken from the licence files shipped in each package and from the publisher's own pages.

## What the build contains

| Part | Where | Origin | Status |
|---|---|---|---|
| Application code, puzzle generator, clue text, hand-written 3D scenes, inline SVG board art | `src/` | Written for this project. The commit history carries AI-assistant co-author trailers; how much of the text and code they wrote has not been itemised. | Verified (history). Whether and how AI-assisted output is protected is not settled here. |
| 3D furniture and plant models (161 `.glb`) | `public/kenney3d/` | Kenney Furniture Kit (140 models) and a 21-model subset of the Nature Kit. CC0. | **Verified** (2026-11-18): all 161 files are byte-identical (SHA-256) to files in the official Furniture Kit and Nature Kit downloads from kenney.nl (140 and 21). The `License.txt` in each pack (Furniture Kit 2.0, Nature Kit 2.1) states Creative Commons Zero (CC0). |
| Isometric furniture sprites (150 `.png`) | `public/kenney/` | Isometric renders from the Kenney Furniture Kit (its `Isometric` folder). CC0. | **Verified** (2026-11-18): all 150 files are byte-identical (SHA-256) to files in the official Furniture Kit download. |
| Suspect avatars | drawn in the browser from `@dicebear/core` and `@dicebear/notionists` | "Notionists" style by Zoish, CC0 1.0; DiceBear code, MIT. The artwork travels inside the npm package, so the game makes no request to a DiceBear service. | Verified from the package's own `LICENSE`. |
| Fonts | `@fontsource/*` packages, Latin subset, bundled as `.woff2` | Barlow Condensed, Courier Prime, Hanken Grotesk and Newsreader, all SIL Open Font License 1.1. Newsreader (copyright 2020 The Newsreader Project Authors, Production Type) sets the casebook's titles and statements; it loads from `src/casebook/fonts.css` with the casebook code, not with the main bundle. Served from the game's own origin. | Verified from each package's `LICENSE` (`@fontsource/*` 5.3.0); full text in `public/THIRD-PARTY-NOTICES.txt`. |
| Paper and desk surfaces | CSS custom properties `--texture-paper`, `--texture-desk` in `src/styles/theme.css` | Gradients written for this project. No image file. | Verified. |
| App icon | `public/icon.svg` | Hand-written SVG in the repository. Who drew it is not recorded. | Unknown author, probably the project. |
| Runtime libraries | npm | React, React DOM, Scheduler, Framer Motion (with motion-dom, motion-utils), lucide-react, three.js, the DiceBear packages (above), and Workbox core, precaching, routing and strategies (service worker) | Licences in `public/THIRD-PARTY-NOTICES.txt` (served at `/THIRD-PARTY-NOTICES.txt`, linked from About & credits), read from the installed packages. The list was checked against the build: a source-mapped production build contains exactly these packages, and the Workbox file names exactly these four modules. |

Nothing else is served: no audio, video, other raster images, tracking or remote scripts. The build makes no request to a third-party host.

## Removed from this release

- `public/assets/contact-sheet.jpg` (a sheet of eight photographic suspect portraits), `reconstruction-board.jpg`, `evidence-paper.jpg` and `graphite-desk.jpg`. The repository holds no record of who or what produced these four files, and the portraits could not be shown not to resemble real people. They were replaced by the illustrated avatars and by CSS surfaces, and deleted. Their origin remains unknown.
- `public/favicon.svg` and `public/icons.svg`: unused files from the Vite project template, not needed by the game.
- The `?ref=` reference prototypes (alternative boards, a city map, a story layer) are no longer part of a production build. Their source stays in `src/reference/` for development.

## In the repository, not in the build

- `.impeccable/mocks/*.png` are design comps whose embedded metadata names an AI image generator and its provider. They are not served. Whether to keep them in a public repository is the owner's decision.
- `docs/` holds screenshots of earlier versions of the interface. Some show the removed portraits. They are not served.

## Puzzle content

Cases come from a seeded generator and from hand-authored case definitions in this repository. No text, title or layout in the repository is attributed to a Murdoku book or to murdoku.com. That is a statement about the repository, not proof of independence: the books were not available to compare, and one free printable was checked only for its rules and clue style. The game mechanics (one person per row and column, rooms with furniture, a victim, a murderer who is alone with the victim, difficulty tiers) overlap with the published Murdoku format.

## Credit and name

Murdoku was created by Manuel Garand, according to murdoku.com/about. The game says so, and says that it is independent and not affiliated with, endorsed by or sponsored by him, the owner of the Murdoku name or the publishers of the Murdoku books (About & credits on the home screen). It does not claim any permission, because none is recorded.

The published game is named Alibi and shows "Murdoku" only in the credit sentence. The browser storage keys that begin with `murdoku_` are internal, are never shown to players, and are kept so that existing saved progress keeps working. Whether the name Murdoku is protected anywhere, and what that means for this project, was not assessed here.

## Open questions for the owner

1. How the four removed images were made. They are no longer shipped, but they remain in the repository history.
2. Who drew `icon.svg`.
3. Whether any permission from the creator of the format or the owner of the name exists, and whether the name needs more than the credit and non-affiliation notice (a question for a lawyer).
