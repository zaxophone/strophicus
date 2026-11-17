/**
 * How far apart GregorioTeX sets the columns of a chant. The distances are its defaults
 * (gregoriotex-gsp-default.tex), written there in centimetres for a staff whose lines are 0.2862 cm
 * apart; here they are in staff spaces (the gap between two lines), so they scale with the staff.
 *
 * Between two neighbouring syllables the notes keep a minimum distance that depends on what comes
 * between them (a neume of the same syllable, the next syllable of a word, the next word, a bar),
 * and the words under them keep a minimum distance of their own; whichever asks for more wins. A
 * line is then filled by stretching only the glue Gregorio allows to stretch: the spaces between
 * words and around bars. The distances inside a word do not stretch.
 */

const CM = 1 / 0.2862;

export const GAP = {
  /** Between two neumes of one syllable (`interelementspace`). */
  neume: 0.06927 * CM,
  /** Between the notes of two syllables of one word (`intersyllablespacenotes`). */
  word: 0.24 * CM,
  /** Between the notes of two words (`interwordspacenotes`). */
  newWord: 0.29 * CM,
  /** From the notes to a bar, and from the bar to the notes (`notebarspace`), each side. */
  noteBar: 0.31903 * CM,
};

/** The least room the words under two columns keep between them. */
export const TEXT_GAP = {
  /** Two syllables of one word: the hyphen between them is part of the text itself. */
  word: 0,
  /** Between two words (`interwordspacetext`). */
  newWord: 0.17 * CM,
  /** Either side of a bar (`textbartextspace`). */
  bar: 0.24611 * CM,
};

/** How much each kind of glue may stretch, in staff spaces (Gregorio's "plus" values). */
export const STRETCH = {
  neume: 0.00182 * CM,
  word: 0,
  newWord: 0.05 * CM,
  bar: 2 * 0.27345 * CM,
};

/** The width of a division stroke, in staff spaces (it is a thin line). */
export const BAR_STROKE = 0.1;

/** How far the glue of a line may be stretched past its stretch values before the line is left short. */
export const MAX_STRETCH_RATIO = 2.5;

export type ColumnKind = 'start' | 'neume' | 'word' | 'newWord' | 'bar';

export interface Column {
  /** From the figure's centre to the left end of what is drawn for it (a flat sign counts). */
  left: number;
  /** From the figure's centre to the right end (dots count). */
  right: number;
  /** Width of the text under it, 0 for a figure with none of its own. */
  text: number;
  kind: ColumnKind;
}

/** Distance from the centre of column `i - 1` to the centre of column `i`, in pixels, and the glue in between. */
export function pitchBetween(a: Column, b: Column, space: number): { pitch: number; glue: number; stretch: number } {
  const kind = b.kind === 'start' ? 'word' : b.kind;
  const gap =
    kind === 'bar' ? 2 * GAP.noteBar + BAR_STROKE : kind === 'neume' ? GAP.neume : kind === 'newWord' ? GAP.newWord : GAP.word;
  const textGap = kind === 'bar' ? TEXT_GAP.bar : kind === 'newWord' ? TEXT_GAP.newWord : TEXT_GAP.word;
  const notes = a.right + b.left + gap * space;
  const text = (a.text + b.text) / 2 + textGap * space;
  const pitch = Math.max(notes, text);
  return { pitch, glue: pitch - a.right - b.left, stretch: STRETCH[kind] * space };
}

/** The pitches for a whole row of columns (entry 0 is unused). */
export function pitches(columns: Column[], space: number) {
  return columns.map((c, i) => (i === 0 ? { pitch: 0, glue: 0, stretch: 0 } : pitchBetween(columns[i - 1], c, space)));
}

/**
 * Where the centres of columns `start..end-1` fall on a line `room` pixels wide, from the left end of
 * the first one: their natural pitches, with the extra room (if the line is not the last) shared out
 * over the glue that stretches, in proportion to how much it may.
 */
export function lineCentres(
  columns: Column[],
  all: { pitch: number; glue: number; stretch: number }[],
  start: number,
  end: number,
  room: number,
  justify: boolean,
): number[] {
  let natural = columns[start].left + columns[end - 1].right;
  let stretch = 0;
  for (let i = start + 1; i < end; i++) {
    natural += all[i].pitch;
    stretch += all[i].stretch;
  }
  const extra = justify && stretch > 0 ? room - natural : 0;
  // each unit of "plus" stretches by the same ratio, up to a limit
  const ratio = extra > 0 ? Math.min(MAX_STRETCH_RATIO, extra / stretch) : 0;
  const xs = [columns[start].left];
  for (let i = start + 1; i < end; i++) xs.push(xs[xs.length - 1] + all[i].pitch + ratio * all[i].stretch);
  return xs;
}

/**
 * Line breaks for a flowing score. Each line takes as many columns as fit in `capacity`; one that must
 * be cut is cut at its last phrase bar (`preferred`) if that leaves it at least 40% full, else at its last
 * division of any kind if that leaves it 55% full, else just before the column that overflows. Forced
 * breaks (`forced`) are kept. `divisions` and the others are column indexes.
 */
export function flowBreaks(
  columns: Column[],
  all: { pitch: number }[],
  divisions: number[],
  preferred: number[],
  forced: number[],
  capacity: number,
): number[] {
  const width = (start: number, end: number) => {
    let w = columns[start].left + columns[end - 1].right;
    for (let i = start + 1; i < end; i++) w += all[i].pitch;
    return w;
  };
  const breaks: number[] = [];
  let start = 0;
  while (start < columns.length) {
    let end = start + 1;
    while (end < columns.length && !forced.includes(end) && width(start, end + 1) <= capacity) end++;
    if (end < columns.length && !forced.includes(end)) {
      const last = (list: number[]) => [...list].reverse().find((b) => b > start && b <= end);
      const phrase = last(preferred);
      const any = last(divisions);
      if (phrase !== undefined && width(start, phrase) >= 0.4 * capacity) end = phrase;
      else if (any !== undefined && width(start, any) >= 0.55 * capacity) end = any;
    }
    if (end < columns.length) breaks.push(end);
    start = end;
  }
  return breaks;
}
