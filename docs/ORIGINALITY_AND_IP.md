# Originality and IP review

State of the `reinvent/alibi-casebook` branch. This is a record of what the repository contains and what could be checked from it. It is not legal advice and it clears nothing. The last section lists what an owner should verify with a lawyer or a trademark search.

Labels follow `PROVENANCE.md`: **verified** (checked against a file, a package or a primary source), **inferred**, **unknown**.

## 1. The Murdoku format and its creator

- Murdoku is a puzzle format created by Manuel Garand, according to murdoku.com/about (cited in `PROVENANCE.md`; not re-checked for this review).
- Alibi follows the same family of rules: people on a grid, one per row and column, rooms with furniture, a victim, a murderer who is alone with the victim, literal clues, difficulty tiers. These are game rules and an idea. They are not text, art or code, and no part of this repository is attributed to a Murdoku book or to murdoku.com (**verified** by the repository's own history and provenance record; **not** a proof of independence, because the books were not available to compare).
- Credit is given in the shipped game: About & credits (`src/components/About.tsx`) says Alibi is "an independent deduction puzzle inspired by the murder-mystery logic format Murdoku, which was created by Manuel Garand", and that it is "not affiliated with, endorsed by, or sponsored by Manuel Garand, the owner of the Murdoku name, or the publishers of the Murdoku books". `tests/about.test.tsx` pins that text.
- `README.md` (Portuguese) credits Garand in one sentence ("inspirado na obra de Manuel Garand") and is titled "Murdoku". It does not carry the non-affiliation sentence.
- The casebook route (`?casebook=`, `?tutorial`) has no About, credit or licence link. A player who only sees the casebook sees none of the credit or the non-affiliation notice. See section 7.
- No permission from the creator or the publishers is recorded. The game does not claim one.

## 2. What is original here

All of the following is written for this project (**verified** as to location; authorship caveat in section 3).

- **Game mechanics added on top of the format.** The statement *lens* (lit statements light the squares where all of them hold), *suppose* (a one-step ghost placement that shows what it leaves everyone else), the *alibi roll-call* reveal (everyone told the truth; the murderer is the one whose true account leaves them alone with the victim), the three-level *Why?* hint, the named accusation with strikes, and the three tiers (Proved, Proved with help, Called it). See `src/casebook/`.
- **Case 0**, the first-run walk-through (`src/tutorial/`).
- **The depth generator and gate** (`src/core/depth/`) that produced the 12 deep cases, and the solver and the independent interpreter used to check them (`src/core/engine.ts`, `tests/truth/`).
- **The setting and the stories.** Portinhal, a fictional coastal town; the season mystery of the silent harbour bell; twelve titles, premises, casts, roles, motives and closing lines in `src/casebook/stories.ts`.
- **Art drawn in code.** The illustrated plan board (five style packs, furniture silhouettes, decor, compass, room labels) is SVG generated from puzzle data in `src/reference/boards/illustrated/`. The casebook draws no bitmap and uses none of the Kenney models. The sound cues are synthesised with WebAudio; there are no audio files.
- **The name and wording "Alibi"** as shown to players; see section 6.

## 3. Authorship caveat

The commit history carries AI-assistant co-author trailers. How much of the code, text and art was produced by an assistant has not been itemised. Whether and how AI-assisted output is protected is not settled here (`PROVENANCE.md`). "Original" above means "not copied from a known source in this repository", not "protected by copyright".

## 4. Third-party assets and licences

Details and licence text are in `PROVENANCE.md` and `public/THIRD-PARTY-NOTICES.txt`; this is the summary.

| Material | Licence | Notice in the build |
|---|---|---|
| 161 `.glb` models and 150 isometric sprites, from the Kenney Furniture Kit and Nature Kit | CC0, verified byte-identical to the official downloads | Credited in About; none required. Used by the shipped game, not by the casebook. |
| Suspect portraits: DiceBear core (MIT) with the Notionists style by Zoish (CC0 1.0) | MIT, CC0 | MIT text in the notices file; credited in About |
| Barlow Condensed, Courier Prime, Hanken Grotesk, Newsreader (via `@fontsource/*` 5.3.0) | SIL Open Font License 1.1 | Copyright lines and full licence in the notices file; credited in About. Newsreader was added on this branch (casebook titles and statements). |
| React, React DOM, Scheduler, Framer Motion (motion-dom, motion-utils), lucide-react (ISC), three.js, Workbox core, precaching, routing, strategies | MIT or ISC | Full text in the notices file |

Checked on this branch against `a9fe1f7`: `package.json` gains one runtime package (`@fontsource/newsreader`) and one script (`bake:catalog`); `public/` is unchanged; no new image, audio or model file; no new external URL or request in `src/`. The deployed page's Content-Security-Policy allows only its own origin. Tools used only to build or test the game (Vite, Vitest, Tailwind and the like) are not shipped and not listed.

The OFL fonts are served unmodified as `.woff2` subsets of the `@fontsource` packages, with the licence in the notices file, which meets the OFL's requirement that each copy carry the copyright notice and licence. The OFL's "Reserved Font Name" rule applies to modified versions; none is made.

Left in the repository, not served: `.impeccable/mocks/*.png` (design comps whose metadata names an AI image generator) and old screenshots under `docs/`, some showing portraits that were removed from the build because their origin was unknown. They are in the history.

## 5. Names and places

- **Portinhal.** Written as a fictional town (`src/casebook/stories.ts`). The word reads as Portuguese ("little port"). A web search for it found no town of that name, and nothing was checked against the official Portuguese place-name registers (CAOP, INE). Portuguese place names of the same shape exist (for example Portinha), so a small locality called Portinhal cannot be ruled out from here. Nothing in the stories claims it is real or gives it a real location.
- **Cast.** Given names only, no surnames, in the 12 deep stories, Case 0 and the baked catalogue (Lena, Viraj, Carol, Greta, Marco, Tomas, Priya, Idris, Nadia, Yuki and others, with about 80 more shown names in the deep cases). Roles are generic (ferry-ticket clerk, net-mender, harbour notary). No full name of a real person appears. First names alone are common, so a reader could connect one to someone they know; that is not a legal risk of the kind a surname would be, and it cannot be removed.
- **Victims and crimes.** Each case is a fictional murder among fictional people. The full text of `src/casebook/stories.ts` (all twelve deep stories and the three older ones) and of the Case 0 story was read for this review: apart from Portinhal and the cast's given names it holds no proper noun, and it names no real event, organisation or place. The generated clue text of the 60 archive cases was not read line by line.
- **Case titles.** The twelve deep titles ("A Pinch of Salt", "The Falling Glass", "Second Feature", "Meridian Lines", "The Brass Section", "The Last Peal" and the others) and the 60 archive titles are ordinary phrases. Titles are not protected as such, but several are also titles of published works. For example, the archive case "The Seventh Guest" is close to the 1993 video game "The 7th Guest", and "No Way Out", "Checkmate" and "The Last Train" are common titles. None was searched. The archive titles come from the generator and were not chosen for this game.
- **Furniture, rooms and styles.** Generic room names and furniture types. The five plan styles (Victorian, Art Deco, Tudor, Modernist, Mediterranean) are architectural periods, not brands.
- **Trademarks inside the product.** Apart from the credit sentence naming Murdoku, no third-party brand name appears in the player-facing text that was found. The avatar style is called "Notionists" in the credits; that is the artist's and DiceBear's name for it, and it echoes the name of a company. Worth a glance, low risk.

## 6. The name "Alibi" and "Murdoku"

- **Alibi.** The product name shown to players. "Alibi" is an ordinary English word. A web search on the name with the words puzzle, murder mystery and deduction returned several unrelated products already called Alibi, including a mobile party game, a 1993 board game from Mayfair Games, a 2001 card game, a visual novel and a university social-deduction game, plus several near-names (AlibAi). The word is in use in the same field. That does not decide whether anyone holds a registered mark that conflicts, or in which classes and countries.
- **Murdoku.** Shown to players only in the credit sentence. It remains in the repository name, the name of the existing production Worker, the `murdoku_*` storage keys and the README title and text. Whether "Murdoku" is a registered trademark anywhere, and who owns it, was not assessed. The storage keys are internal and never shown.

## 7. What an owner should verify

None of this is claimed as done.

1. **Trademark search for "Alibi"** in the classes for games and software, and also for entertainment, television and broadcasting (the word is a common title for crime programmes; a web search for a channel of that name was inconclusive and is not evidence either way), plus the app stores and domains where the game will be listed, in Portugal, the EU and anywhere else it will be offered. Check the owners of the existing Alibi games found above.
2. **Whether "Murdoku" is a registered mark** and who holds it, and whether the credit and non-affiliation wording is enough or permission should be sought from Manuel Garand and the publishers. Decide whether the repository, Worker and README should keep the name.
3. **Credit inside the casebook.** If the casebook becomes the main experience, add the Murdoku credit, the non-affiliation sentence and a link to `/THIRD-PARTY-NOTICES.txt` to it (today only the shipped home screen's About has them). Add the same sentence to the README.
4. **Portinhal.** Check it against the Portuguese place-name registers; rename if a real locality of that name would make a story read as about it.
5. **Case titles** against published works, starting with "The Seventh Guest", if titles matter for distribution.
6. **AI-assisted authorship.** Whether the code, text and art are protected as the owner expects, and whether any store or jurisdiction requires disclosure.
7. **Open items from `PROVENANCE.md`**: how the four removed photographs were made (still in the git history), who drew `public/icon.svg`, and whether to keep `.impeccable/mocks/` in a public repository.
8. **Licence texts.** Re-read each `@fontsource` and package licence at the version actually shipped whenever a dependency is updated, and regenerate the notices file; `tests/productionBuild.test.ts` checks that the expected entries are present.

## 8. Copyrighted material used without rights

None found. Every bundled asset is original to the project or under a licence that permits redistribution (CC0, MIT, ISC, SIL OFL 1.1), and the build requests nothing from a third-party host. The caveats are the ones above: the history still holds four images of unknown origin that are no longer shipped, the originality of the text and rules against the Murdoku books could not be compared, and the AI-assistance question is open.
