/**
 * Square-note chant on a four-line staff, with pitches written as gabc letters.
 *
 * In gabc `a` is the lowest pitch and each letter is one step (a line or the
 * space beside it) above the one before; on a four-line staff the lines are
 * d, f, h and j. The do clef marks one line as "do", and every other note's
 * solfege name and interval follows from where it sits relative to that line.
 */

import { neumeFor } from './neumes';

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
  /** Line (1 = bottom) carrying the do clef. */
  clefLine: number;
  /** One gabc pitch letter per note. */
  notes: string;
  /** Indexes of notes with a half bar (divisio minor, or a double bar) before them. */
  bars: number[];
  /** The bars among `bars` that are drawn as a double bar. */
  doubles: number[];
  /** Indexes of notes with a short tick (divisio minima) before them. */
  ticks: number[];
  /** Indexes of notes with a dot (punctum mora), which lasts twice as long. */
  moras: number[];
  /** Indexes of notes with a horizontal line over them (episema), which lasts a little longer. */
  episemas: number[];
  /** Indexes of notes with an ictus, the small vertical stroke under a note (the first note of a group). */
  ictus: number[];
  /** Indexes of notes with a flat sign written before them; each lowers its ti to te (see `flattened`). */
  flats: number[];
  /** The notes joined into one figure (two or three on a syllable); every other note stands alone. */
  groups: Group[];
  /** Indexes where a new line of the staff must begin. */
  breaks: number[];
}

export interface ParsedPhrases {
  notes: string;
  bars: number[];
  doubles: number[];
  ticks: number[];
  moras: number[];
  episemas: number[];
  ictus: number[];
  flats: number[];
  groups: Group[];
}

/**
 * Reads notes with phrases split by `|`, as bars are written in the book:
 * "cde|edc" is six notes with a bar between the third and fourth. `||` is a
 * double bar, and a comma is the short tick that asks for a longer note
 * without a breath. Notes in square brackets are joined into one figure on a
 * syllable: "c[de]f". After a note or a group, `.` gives the note (the last
 * one, for a group) a dot (punctum mora) and `_` a line over it (episema, over
 * every note of a group), as in gabc: "cd.e_" or "c[de]_.". An apostrophe puts an
 * ictus (a small vertical stroke) under the note, or the first note of a group.
 * An `x` after a single note's letter puts a flat sign before it ("hix"), as in gabc.
 */
export function parsePhrases(text: string): ParsedPhrases {
  let notes = '';
  const bars: number[] = [];
  const doubles: number[] = [];
  const ticks: number[] = [];
  const moras: number[] = [];
  const episemas: number[] = [];
  const ictus: number[] = [];
  const flats: number[] = [];
  const groups: Group[] = [];
  let pending: 'tick' | 'bar' | 'double' | null = null;
  let previous = '';
  let open: number | null = null; // where the group being read began
  // The notes that a following `.` or `_` belongs to: the last note, or the whole group.
  let target: number[] | null = null;
  const fail = (message: string): never => {
    throw new Error(`${message}: "${text}"`);
  };

  for (const ch of text) {
    if (/\s/.test(ch)) continue;
    if (ch === '|' || ch === ',') {
      if (open !== null) fail('A bar or tick cannot be inside a group');
      if (ch === '|') pending = previous === '|' ? 'double' : 'bar';
      else pending ??= 'tick';
      target = null;
    } else if (ch === '[') {
      if (open !== null) fail('Groups cannot be nested');
      open = notes.length;
      target = null;
    } else if (ch === ']') {
      if (open === null) fail('A group is closed that was never opened');
      const length = notes.length - open!;
      if (length < 2) fail('A group needs at least two notes');
      groups.push({ start: open!, length });
      target = Array.from({ length }, (_, i) => open! + i);
      open = null;
    } else if (ch === 'x') {
      if (open !== null) fail('A flat sign cannot be inside a group yet');
      if (target === null || target.length !== 1 || previous === ']') fail('"x" must follow a single note');
      if (flats.includes(target![0])) fail('A note has only one flat sign');
      flats.push(target![0]);
    } else if (ch === "'") {
      if (target === null) fail(`"'" must follow a note or a group`);
      if (ictus.includes(target![0])) fail('A note has only one ictus');
      ictus.push(target![0]);
    } else if (ch === '.' || ch === '_') {
      if (target === null) fail(`"${ch}" must follow a note or a group`);
      if (ch === '.') {
        const last = target![target!.length - 1];
        if (moras.includes(last)) fail('A note has only one dot');
        moras.push(last);
      } else {
        if (episemas.includes(target![0])) fail('A note has only one episema');
        episemas.push(...target!);
      }
    } else {
      // a note, or the first note of a group, takes the division waiting before it
      if (pending !== null && notes.length > 0 && (open === null || open === notes.length)) {
        if (pending === 'tick') ticks.push(notes.length);
        else {
          bars.push(notes.length);
          if (pending === 'double') doubles.push(notes.length);
        }
      }
      pending = null;
      notes += ch;
      target = open === null ? [notes.length - 1] : null;
    }
    previous = ch;
  }
  if (open !== null) fail('A group is never closed');
  return { notes, bars, doubles, ticks, moras, episemas, ictus, flats, groups };
}

/** A chant from notation as `parsePhrases` reads it, with each group checked to be drawable. */
export function makeChant(text: string, clefLine: number, breaks: number[] = []): Chant {
  const chant: Chant = { clefLine, breaks, ...parsePhrases(text) };
  for (const k of chant.flats) {
    if (solfegeName(chant.notes[k], clefLine) !== 'ti') {
      throw new Error(`A flat sign goes before ti, not ${solfegeName(chant.notes[k], clefLine)}: "${text}"`);
    }
  }
  for (const { start, length } of chant.groups) {
    const positions = [...chant.notes.slice(start, start + length)].map(staffPosition);
    if (!neumeFor(positions)) {
      throw new Error(`No single figure for the group "${chant.notes.slice(start, start + length)}": "${text}"`);
    }
  }
  return chant;
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

/** Steps above the bottom staff line; negative below it. */
export function staffPosition(letter: string): number {
  return letter.charCodeAt(0) - FIRST_LINE;
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
export function flattened(chant: Pick<Chant, 'notes' | 'bars' | 'flats'>): boolean[] {
  const out: boolean[] = [];
  let active: string | null = null;
  for (let k = 0; k < chant.notes.length; k++) {
    if (chant.bars.includes(k)) active = null;
    if (chant.flats.includes(k)) active = chant.notes[k];
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
