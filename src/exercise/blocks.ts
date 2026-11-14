import { Chant, gabcWords, makeChant, units } from '../chant/chant';
import type { Gesture } from './gestures';

/**
 * What an instruction paragraph is. Most are plain text; a paragraph written as
 * `{{gabc: <snippet>}}` is a small picture of chant notation instead, so a symbol is
 * shown rather than described. The snippet is gabc as in an exercise (see
 * `chant/gabc.ts`), such as `{{gabc: (c4) do(j)}}`; its text, one per syllable, is shown
 * under the notes. A last part after ` @ ` gives each syllable's gesture: `a` for
 * arsis, `t` for thesis, `-` for none, as in `{{gabc: (c3) Jo(e')seph(g') @ - a}}`.
 */
export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'staff'; chant: Chant; words?: string[]; gestures?: (Gesture | null)[] };

const FIGURE = /^\{\{\s*gabc\s*:([\s\S]*)\}\}$/;

export function parseBlock(paragraph: string): Block {
  const match = FIGURE.exec(paragraph.trim());
  if (!match) return { kind: 'text', text: paragraph };
  const [gabc, gestureText] = match[1].split(' @ ').map((part) => part.trim());
  const chant = makeChant(gabc);
  const spoken = gabcWords(gabc);
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
