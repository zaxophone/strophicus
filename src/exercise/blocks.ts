import { Chant, makeChant, units } from '../chant/chant';
import type { Gesture } from './gestures';

/**
 * What an instruction paragraph is. Most are plain text; a paragraph written
 * as `{{staff; <clef line>; <notes>; <words under the notes>}}` is a small
 * picture of chant notation instead, so a symbol is shown rather than
 * described. The notes are written as in an exercise (`|` bar, `||` double bar,
 * `,` tick, `.` dot, `_` episema, `'` ictus, `[ab]` notes on one syllable); the words
 * under the notes, one per syllable, are optional, and so is a last part giving
 * each syllable's gesture: `a` for arsis, `t` for thesis, `-` for none.
 */
export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'staff'; chant: Chant; words?: string[]; gestures?: (Gesture | null)[] };

const FIGURE = /^\{\{\s*staff\s*;([\s\S]*)\}\}$/;

export function parseBlock(paragraph: string): Block {
  const match = FIGURE.exec(paragraph.trim());
  if (!match) return { kind: 'text', text: paragraph };
  const [clef, notes, words, gestureText] = match[1].split(';').map((part) => part.trim());
  const clefLine = Number(clef);
  if (!Number.isInteger(clefLine) || clefLine < 1 || clefLine > 4) {
    throw new Error(`A staff figure needs a clef line from 1 to 4: "${paragraph}"`);
  }
  const chant = makeChant(notes ?? '', clefLine);
  const spoken = words ? words.split(/\s+/) : undefined;
  if (spoken && spoken.length !== units(chant).length) {
    throw new Error(`${spoken.length} words under ${units(chant).length} syllables: "${paragraph}"`);
  }
  const gestures = gestureText
    ? gestureText.split(/\s+/).map((g) => {
        if (g !== 'a' && g !== 't' && g !== '-') throw new Error(`A gesture is a, t or -: "${paragraph}"`);
        return g === 'a' ? ('arsis' as const) : g === 't' ? ('thesis' as const) : null;
      })
    : undefined;
  if (gestures && gestures.length !== units(chant).length) {
    throw new Error(`${gestures.length} gestures under ${units(chant).length} syllables: "${paragraph}"`);
  }
  return { kind: 'staff', chant, words: spoken, gestures };
}

export const isFigure = (paragraph: string): boolean => FIGURE.test(paragraph.trim());

/** How much room a paragraph takes on a page, in characters of text. */
export const FIGURE_CHARS = 110;

export function blockSize(paragraph: string): number {
  return isFigure(paragraph) ? FIGURE_CHARS : paragraph.length;
}
