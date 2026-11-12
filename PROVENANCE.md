# Asset provenance

This is a placeholder for the owner to complete. The repository does not record where the binary assets below came from, who made them, or under what licence they may be used and redistributed. Nothing here has been guessed: every origin is marked unknown until the owner confirms it.

For each asset, fill in:

- **Origin**: who or what produced it (own work, a named photographer or artist, a stock site, an AI image tool and which one, a screenshot).
- **Author / source URL**.
- **Licence or terms**, with a link, and whether attribution is required.
- **Date obtained.**

Rows were produced from `git ls-files` (SHA-256 prefix is the first 16 hex characters of the file hash, so a row can be matched to a file later). All files listed were added in the commits shown.

## Raster images in `public/assets/` (shipped with the app)

| Asset | Size | SHA-256 (prefix) | Added in | Origin | Author / source URL | Licence / terms |
|---|---|---|---|---|---|---|
| `public/assets/contact-sheet.jpg` | 108 KB | `f8c0cdf8f29f604c` | `9386a76` (2026-08-12) | unknown — owner to confirm | | |
| `public/assets/evidence-paper.jpg` | 135 KB | `afa251dc36248dc4` | `9386a76` (2026-08-12) | unknown — owner to confirm | | |
| `public/assets/graphite-desk.jpg` | 146 KB | `ff98766f2eb0b82e` | `9386a76` (2026-08-12) | unknown — owner to confirm | | |
| `public/assets/reconstruction-board.jpg` | 199 KB | `9b67b6811b4fb496` | `9386a76` (2026-08-12) | unknown — owner to confirm | | |

## Design mock-ups in `.impeccable/mocks/` (not served by the app)

`docs/UX_OVERHAUL_PLAN.md` calls these comps and says their invented photographic evidence must not ship. They are listed because they are binary images in the public repository.

| Asset | Size | SHA-256 (prefix) | Added in | Origin | Author / source URL | Licence / terms |
|---|---|---|---|---|---|---|
| `.impeccable/mocks/connected-evidence-wall.png` | 2.0 MB | `aa3a804be758770b` | `9386a76` (2026-08-12) | unknown — owner to confirm | | |
| `.impeccable/mocks/continuity-desk-approved.png` | 1.9 MB | `2a20733653187383` | `9386a76` (2026-08-12) | unknown — owner to confirm | | |
| `.impeccable/mocks/reconstruction-stage.png` | 2.6 MB | `e7406f47c41417be` | `9386a76` (2026-08-12) | unknown — owner to confirm | | |

## Vector icons in `public/`

| Asset | Size | SHA-256 (prefix) | Added in | Origin | Author / source URL | Licence / terms |
|---|---|---|---|---|---|---|
| `public/favicon.svg` | 9 KB | `61bc9a161de58248` | `ce30deb` (2026-07-12) | unknown — owner to confirm | | |
| `public/icon.svg` | 1 KB | `6d7a153d8214f6f8` | `ce30deb` (2026-07-12) | unknown — owner to confirm | | |
| `public/icons.svg` | 5 KB | `7ca2d67c9c3aebf5` | `ce30deb` (2026-07-12) | unknown — owner to confirm | | |

## Notes

- `contact-sheet.jpg` is the one that matters most: `src/components/SuspectCard.tsx` uses it as a sprite of eight suspect portraits (4 columns by 2 rows, picked per suspect id). Portraits of real or recognisable people, or of images from a generator with its own terms, are the highest-risk item here. Please confirm the source of each of the eight faces.
- The other three JPGs are named as paper, desk and board surfaces.
- Fonts and npm packages are not listed. Their licences are carried by the packages themselves.