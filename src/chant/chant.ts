/**
 * Square-note chant on a four-line staff, written in gabc (see `gabc.ts`).
 *
 * In gabc `a` is the lowest pitch and each letter is one step (a line or the
 * space beside it) above the one before; on a four-line staff the lines are
 * d, f, h and j. The do clef marks one line as "do", and every other note's
 * solfege name and interval follows from where it sits relative to that line.
 */

import { parseGabc } from './gabc';
import { Liquescent, neumeFor } from './neumes';

const FIRST_LINE = 'd'.charCodeAt(0);
const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11];
/** The seven note names, in scale order. */
export const SOLFEGE = ['do', 're', 'mi', 'fa', 'sol', 'la', 'ti'];

export const STAFF_LINES = 4;
/** Staff position of the top line; the bottom line is 0 and each step is 1. */
export const TOP_LINE = 2 * (STAFF_LINES - 1);

/** A run of notes sung on one syllable and drawn as one joined figure. */
export interface Group {
  start: number;
  length: number;
}

export interface Chant {
  /** Which clef: do (`c`) or fa (`f`). */
  clef: 'c' | 'f';
  /** Line (1 = bottom) carrying the clef. */
  clefLine: number;
  /** One gabc pitch letter per note. */
  notes: string;
  /** Indexes of notes with a half bar (divisio minor, or a double bar) before them. */
  bars: number[];
  /** The bars among `bars` that are drawn as a double bar. */
  doubles: number[];
  /** The bars among `bars` that are drawn as a full bar across the staff (divisio maior, `:`). */
  majors: number[];
  /** Indexes of notes with a short tick (divisio minima) before them. */
  ticks: number[];
  /** Indexes of notes with a dot (punctum mora), which lasts twice as long. */
  moras: number[];
  /** Indexes of notes with a horizontal line over them (episema), which lasts a little longer. */
  episemas: number[];
  /** Indexes of notes with an ictus, the small vertical stroke under a note (the first note of a group). */
  ictus: number[];
  /**
   * Indexes of the notes a flat sign is drawn before, and the height (note letter) of each sign: it
   * lowers that ti to te, and every ti after it on the same line or space until the next bar (see
   * `flattened`). The sign need not be at the height of the note it stands before, as in `ixdh`.
   */
  flats: number[];
  flatLetters: string[];
  /** Liquescent last notes of groups: the note's index and gabc's mark for it. */
  liquescents: { note: number; mark: Exclude<Liquescent, ''> }[];
  /** The notes joined into one figure (two or three on a syllable); every other note stands alone. */
  groups: Group[];
  /** Indexes where a new line of the staff must begin. */
  breaks: number[];
}

/** What a gabc snippet says about its notes, as `parseGabc` reads it. */
export interface ParsedPhrases {
  clef: 'c' | 'f';
  clefLine: number;
  notes: string;
  bars: number[];
  doubles: number[];
  /** The bars among `bars` that are drawn as a full bar across the staff (divisio maior, `:`). */
  majors: number[];
  ticks: number[];
  moras: number[];
  episemas: number[];
  ictus: number[];
  flats: number[];
  flatLetters: string[];
  liquescents: { note: number; mark: Exclude<Liquescent, ''> }[];
  groups: Group[];
}

/**
 * A chant from a gabc snippet (see `parseGabc`), with each group checked to be
 * drawable, and any flat sign checked to be before ti.
 */
export function makeChant(gabc: string): Chant {
  const { words: _words, ...parsed } = parseGabc(gabc);
  const chant: Chant = parsed;
  const clefLine = doLine(chant);
  for (const letter of chant.flatLetters) {
    if (solfegeName(letter, clefLine) !== 'ti') {
      throw new Error(`A flat sign goes on ti, not ${solfegeName(letter, clefLine)}: "${gabc}"`);
    }
  }
  for (const { start, length } of chant.groups) {
    const positions = [...chant.notes.slice(start, start + length)].map(staffPosition);
    const last = chant.liquescents.find((l) => l.note === start + length - 1);
    if (!neumeFor(positions, last?.mark ?? '')) {
      throw new Error(`No single figure for the group "${chant.notes.slice(start, start + length)}": "${gabc}"`);
    }
  }
  return chant;
}

/** The text under each syllable of a gabc snippet, if it has any (see `parseGabc`). */
export function gabcWords(gabc: string): string[] | undefined {
  return parseGabc(gabc).words;
}

/** One syllable's worth of notes: a joined group, or a note on its own. */
export interface Unit {
  start: number;
  length: number;
}

/** The chant as syllables, in order: every group, and every note not in one. */
export function units(chant: Pick<Chant, 'notes' | 'groups'>): Unit[] {
  const out: Unit[] = [];
  for (let i = 0; i < chant.notes.length; ) {
    const group = chant.groups.find((g) => g.start === i);
    const length = group?.length ?? 1;
    out.push({ start: i, length });
    i += length;
  }
  return out;
}

/** Which syllable (unit) note `k` belongs to. */
export function unitIndexOf(chant: Pick<Chant, 'notes' | 'groups'>, k: number): number {
  return units(chant).findIndex((u) => k >= u.start && k < u.start + u.length);
}

/** Joins what is said of each note (a name, say) into one entry per syllable. */
export function unitLabels(chant: Pick<Chant, 'notes' | 'groups'>, perNote: string[]): string[] {
  return units(chant).map((u) => perNote.slice(u.start, u.start + u.length).join(' '));
}

/** Where any bar or tick falls, as every one of them takes room on the line. */
export function separators(chant: Pick<Chant, 'bars' | 'ticks'>): number[] {
  return [...chant.bars, ...chant.ticks].sort((a, b) => a - b);
}

/** Horizontal room a bar line takes, in note widths. */
export const BAR_UNITS = 0.8;

/** Width a system takes, in note widths: one per note plus room for its bars. */
export function systemUnits(start: number, end: number, bars: number[]): number {
  let units = end - start;
  for (const bar of bars) if (bar > start && bar < end) units += BAR_UNITS;
  return units;
}

/**
 * Chooses where each line of the staff starts. Forced breaks are kept, and any
 * line too long for `capacity` is split at its last bar that fits (or, if
 * there is none, just before the note that overflows). `bars` are everything
 * that takes room on the line; only the `preferred` ones (the bars between
 * phrases, not the ticks) are good places to split. Without one, the notes are
 * shared out evenly over the lines needed, so no line is left with a stray note.
 */
export function layoutBreaks(
  count: number,
  bars: number[],
  forced: number[],
  capacity: number,
  preferred: number[] = bars,
): number[] {
  const breaks: number[] = [];
  let start = 0;
  while (start < count) {
    let end = start + 1;
    while (end < count && !forced.includes(end) && systemUnits(start, end + 1, bars) <= capacity) {
      end++;
    }
    if (end < count && !forced.includes(end)) {
      const lastBar = [...preferred].reverse().find((b) => b > start && b <= end);
      if (lastBar !== undefined) {
        end = lastBar;
      } else {
        // no bar to split at: share the notes out evenly over the lines the stretch needs
        const stop = forced.find((f) => f > start) ?? count;
        const lines = Math.ceil(systemUnits(start, stop, bars) / capacity);
        end = Math.max(start + 1, Math.min(end, start + Math.ceil((stop - start) / lines)));
      }
    }
    if (end < count) breaks.push(end);
    start = end;
  }
  return breaks;
}

/**
 * Line breaks for a staff whose columns have widths of their own (a chant with words, where a
 * syllable may be wide). Each line takes as many columns as fit in `capacity`; a line that has to
 * be cut is cut at its last phrase bar (`preferred`) if that keeps it at least 40% full, else at its
 * last division of any kind if that keeps it 55% full, else just before the column that overflows.
 * `barWidth` is the room a division takes. Forced breaks are kept.
 */
export function flowBreaks(
  widths: number[],
  divisions: number[],
  preferred: number[],
  forced: number[],
  capacity: number,
  barWidth: number,
): number[] {
  const breaks: number[] = [];
  const upTo = (start: number, end: number) => {
    let w = 0;
    for (let i = start; i < end; i++) w += widths[i] + (i > start && divisions.includes(i) ? barWidth : 0);
    return w;
  };
  let start = 0;
  while (start < widths.length) {
    let end = start + 1;
    while (end < widths.length && !forced.includes(end) && upTo(start, end + 1) <= capacity) end++;
    if (end < widths.length && !forced.includes(end)) {
      const last = (list: number[]) => [...list].reverse().find((b) => b > start && b <= end);
      const phrase = last(preferred);
      const any = last(divisions);
      if (phrase !== undefined && upTo(start, phrase) >= 0.4 * capacity) end = phrase;
      else if (any !== undefined && upTo(start, any) >= 0.55 * capacity) end = any;
    }
    if (end < widths.length) breaks.push(end);
    start = end;
  }
  return breaks;
}

/** Steps above the bottom staff line; negative below it. */
export function staffPosition(letter: string): number {
  return letter.charCodeAt(0) - FIRST_LINE;
}

/**
 * The line (counted as for a do clef, so it may lie above the staff) where do sits.
 * A fa clef puts fa on its line, and do is four steps (two lines) above fa.
 */
export function doLine(clef: { clef: 'c' | 'f'; clefLine: number }): number {
  return clef.clef === 'f' ? clef.clefLine + 2 : clef.clefLine;
}

/** Steps from do, counting each line and space as one degree: re is 1, do' is 7. */
export function degree(letter: string, clefLine: number): number {
  return staffPosition(letter) - 2 * (clefLine - 1);
}

export function solfegeName(letter: string, clefLine: number): string {
  const d = degree(letter, clefLine);
  return SOLFEGE[((d % 7) + 7) % 7];
}

/**
 * Which notes are sung flat. A flat sign lowers its note, and the notes after
 * it on the same line or space, until the next bar.
 */
export function flattened(chant: Pick<Chant, 'notes' | 'bars' | 'flats' | 'flatLetters'>): boolean[] {
  const out: boolean[] = [];
  let active: string | null = null;
  for (let k = 0; k < chant.notes.length; k++) {
    if (chant.bars.includes(k)) active = null;
    const sign = chant.flats.indexOf(k);
    if (sign >= 0) active = chant.flatLetters[sign];
    out.push(active === chant.notes[k]);
  }
  return out;
}

/** Semitones above the tonic of a note `d` degrees above do (re is 1). */
export function semitonesAtDegree(d: number): number {
  const octave = Math.floor(d / 7);
  return octave * 12 + MAJOR_SCALE[d - 7 * octave];
}

/** Semitones above the tonic in the major scale. */
export function semitonesAboveDo(letter: string, clefLine: number): number {
  return semitonesAtDegree(degree(letter, clefLine));
}

/** Staff positions of the short lines drawn through a note outside the staff. */
export function ledgerLines(position: number): number[] {
  const lines: number[] = [];
  for (let p = TOP_LINE + 2; p <= position; p += 2) lines.push(p);
  for (let p = -2; p >= position; p -= 2) lines.push(p);
  return lines;
}

/** Splits syllables into the lines of the staff they are written on. */
export function splitSystems<T>(items: T[], breaks: number[]): T[][] {
  const edges = [0, ...breaks, items.length];
  return edges.slice(0, -1).map((start, i) => items.slice(start, edges[i + 1]));
}
