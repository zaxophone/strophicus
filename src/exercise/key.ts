import { SOLFEGE, semitonesAtDegree } from '../chant/chant';

/**
 * The key the book suggests for an exercise, written there as `[do=d]`: the
 * named note is sung on that pitch. Singers may use any pitch, so this only
 * says where to start if they want a reference.
 */
export interface ExerciseKey {
  /** Which note of the scale is pinned, such as "do" or "sol". */
  syllable: string;
  /** Pitch class of the pinned note, 0 = C. */
  pitchClass: number;
}

const LETTERS: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

/**
 * Reads the book's tag: "do=d", "mi=f-sharp", "fa=b-flat". Where the book
 * lists alternatives ("do=a/b-flat/b") the first is used.
 */
export function parseKey(text: string): ExerciseKey {
  const match = /^\s*(do|re|mi|fa|sol|la|ti)\s*=\s*([a-g])(?:-(sharp|flat))?\s*(?:\/.*)?$/i.exec(text);
  if (!match) throw new Error(`Unreadable key: "${text}"`);
  const shift = match[3] === 'sharp' ? 1 : match[3] === 'flat' ? -1 : 0;
  return {
    syllable: match[1].toLowerCase(),
    pitchClass: (LETTERS[match[2].toLowerCase()] + shift + 12) % 12,
  };
}

/** Lowest and highest MIDI note chosen for do: comfortable for a child or an adult. */
const DO_LOW = 57;

/** MIDI note for do in this key, within the octave above A3. */
export function keyTonic(key: ExerciseKey): number {
  const above = semitonesAtDegree(SOLFEGE.indexOf(key.syllable));
  const doClass = (((key.pitchClass - above) % 12) + 12) % 12;
  return DO_LOW + ((doClass - DO_LOW) % 12 + 12) % 12;
}

/** How the book would say the key: "do = D". */
export function describeKey(key: ExerciseKey): string {
  return `${key.syllable} = ${NAMES[key.pitchClass]}`;
}
