// The Alleluia Haec dies, as lessons 14 to 16 teach it: each passage of the Easter
// Gospel is sung between Alleluias. All staves have the do clef on the third line
// (c3), so do is h, re is i, ti is g, la is f and sol is e; the key tag is [do=a].
// The Alleluias are the same in every verse, so they are written once here.

/** The key the book gives for the whole piece. */
export const HAEC_DIES_KEY = 'do=a';

/** The Alleluia sung before each passage. */
export const AL_OPEN = 'Al(h)le(h)lú(iji)ia.(hi;)';
/** The shorter Alleluia between the halves of a passage, with a double bar after it. */
export const AL_SECOND = 'al(f)le(e)lú(fe)ia,(d::)';
/** The two Alleluias that close each verse; the tick after the first is a short pause. */
export const AL_CLOSE = 'Al(h)le(g)lú(hih)ia,(f,) al(f)le(efe)lú(d)ia.(d::)';

/**
 * One verse as two lines of gabc: the Alleluia, the first half of the passage (its last
 * note carries the double bar), another Alleluia; then the second half and two Alleluias.
 */
export function haecDiesVerse(first: string, second: string): [string, string] {
  return [`(c3) ${AL_OPEN} ${first} ${AL_SECOND}`, `(c3) ${second} ${AL_CLOSE}`];
}
