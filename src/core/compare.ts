// Locale-independent string ordering.
//
// The generator sorts clue keys to decide which clue it tries to prune first, so
// that order decides which puzzle a player gets. `String.localeCompare` without a
// locale follows the browser's language (Turkish orders "i" and "I" differently,
// for one), which would let two players receive different puzzles under the same
// case id and the same saved progress. Comparing UTF-16 code units depends on
// nothing but the two strings. For the keys the catalogue sorts today it yields
// the same catalogue as en-US `localeCompare`; tests/determinism.test.ts pins that.
export function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}
