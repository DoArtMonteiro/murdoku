# Clue semantics

What every clue sentence on a suspect card **literally means**. This is the
contract between the generator, the in-game engine and the player. It is also
the specification of the independent interpreter in `tests/truth/literal.ts`,
which reads the sentence text a player sees (not the clue objects behind it) and
decides every case by brute force with no code from `src/core`.

If a sentence could reasonably be read two ways, the **wording** is changed in
the generator (`clueToText` in `src/core/generate.ts`); the interpreter is never
bent to accept a looser reading.

## The board

- The board is `N x N` cells. A house has one storey (`floors` absent) or two
  (`floors: 2`); both storeys share the same `N x N` footprint.
- A **cell** is `(floor, row, column)`. Floor 0 is the ground floor, floor 1 is
  upstairs. In text, rows and columns are numbered **from 1**:
  "In row 3" is row index 2. Row index 0 is "the top row", column index 0 is
  "the leftmost column"; "the bottom row" and "the rightmost column" are index
  `N - 1`. These are the data's own axes (the isometric board draws row 0 along
  the upper-right edge and column 0 along the upper-left edge, so a UI should
  label the axes rather than rely on "top" being up on screen).
- Every person stands on exactly one cell. **No two people share a row and no
  two share a column, across both storeys** (a person upstairs in row 3 uses up
  row 3 downstairs too). People never share a cell.
- A **room** is a set of cells on one storey. Room names are unique within a
  case (a name never repeats on the other storey).
- A **piece of furniture** has a type and a rectangular footprint on one storey.
  It lies entirely inside one room. A person can stand on any cell of a piece.

## The victim and the murderer

Exactly one person is the victim. The **murderer** is the one other person who
is in the victim's room (same room, same storey); a valid case has exactly one
such person. Being in the same row, beside, or on another storey does not count.

The line `The victim — found alone with the murderer.` is a heading on the
victim's card. It asserts nothing about position.

## Sentence forms

`P` is the person whose card carries the sentence. `X` is another person's name.

| Sentence | Meaning |
|---|---|
| `In the <Room>.` | P's cell is in the room with that name. |
| `Never set foot in the <Room>.` | P's cell is not in that room. |
| `In the same room as X.` | P and X are in the same room. |
| `Was not in the same room as X.` | P and X are in different rooms. |
| `In the top row.` / `In the bottom row.` / `In row k.` | P's row index is `0` / `N-1` / `k-1`. |
| `In the leftmost column.` / `In the rightmost column.` / `In column k.` | P's column index is `0` / `N-1` / `k-1`. |
| `On the outer edge of the board.` | P is in row `0` or `N-1`, or column `0` or `N-1`. Not the walls between rooms. |
| `In a corner of the board.` | P is in one of the four corner cells of the board: row in `{0, N-1}` and column in `{0, N-1}`. |
| `On the ground floor.` / `Upstairs.` | P is on floor 0 / floor 1. |
| `On a <thing>.` | P stands on a cell covered by at least one piece of that type on P's storey. |
| `On the <thing>.` | As above, and the house has **exactly one** piece of that type (all storeys). |
| `The only person on a <thing>.` / `...on the <thing>.` | P stands on such a piece **and nobody else** stands on any piece of that type (each person on their own storey). |
| `Beside a <thing>.` / `Beside the <thing>.` | See "Beside" below. |
| `Beside a <A> or a <B>.` | Beside a piece of type A or a piece of type B. |
| `Right beside X.` | P and X are on the same storey in orthogonally adjacent cells. |
| `Directly above the <Room>.` | P is on floor `f >= 1` and the cell one storey down (same row and column) is in that room. Nobody on the ground floor is above anything. |
| `Directly below the <Room>.` | P is on floor `f` and floor `f + 1` **exists** and the cell one storey up (same row and column) is in that room. Nobody on the top storey is below anything. |
| `Directly above X.` / `Directly below X.` | Same row and column as X, exactly one storey higher / lower. |
| `Exactly one row north of X.` (`two`, `3`... rows) | P's row index equals X's minus the number. Says nothing about columns or storeys. `south` = plus. |
| `Exactly one column west of X.` | P's column index equals X's minus the number. `east` = plus. |
| `Somewhere north of X.` / `south` / `east` / `west` | P's row (north/south) or column (east/west) index is strictly less / greater than X's. |

### "Beside"

> There is a piece of the named type, on P's storey, that P is **not standing
> on**, with a footprint cell **orthogonally next to** P's cell, **in the same
> room as P**.

So: standing on one half of a two-cell sofa does not make you "beside the sofa";
a TV that is on the other side of a wall, in the next room, is not "beside" you;
diagonal contact does not count. Pieces on the other storey never count.

### "the" and "a"

`the <thing>` is only printed when the house has exactly one piece of that type
on all storeys. Otherwise the sentence says `a <thing>`, meaning *any* piece of
that type. A sentence that says `the lamp` in a house with three lamps is an
error and the interpreter rejects it.

### Floors

Two-storey clues are only meaningful in two-storey cases. A floor that does not
exist has no rooms. This is the rule the earlier engine broke: it treated the
room "above the top storey" as whichever ground-floor room had the same row and
column, so it printed *Directly below the Dining Room* for someone upstairs.

## Where this is enforced

- `src/core/engine.ts` implements the meaning (`unaryClueHolds`, `clueHolds`,
  `besideFurniture`, `roomIdAt`); the generator and the validator call the same
  functions.
- `tests/truth/literal.ts` re-implements the meaning from the sentences alone.
  `tests/truth/*.test.ts` check, for all 60 cases, that every sentence is
  literally true of the stored solution, that the solution is unique, and that
  the murderer is determined; and, case by case, that the seven formerly broken
  cases now say true things.
- A sentence the interpreter does not know **fails** the suite. Adding a new
  clue form means adding it here, in `literal.ts`, and in the engine.
