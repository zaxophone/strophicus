import { Gesture, ruleGestures } from './gestures';
import type { TimingSpec } from './judge';
import { ExerciseKey, parseKey } from './key';
import {
  Chant,
  gabcWords,
  makeChant,
  flattened,
  semitonesAboveDo,
  solfegeName,
  unitIndexOf,
  units,
} from '../chant/chant';

/**
 * What the student does. They sing the melody, or name its notes by choosing a
 * solfege syllable for each one, or pick out the word that carries the accent
 * (`accent`), or mark each note as an arsis or a thesis (`mark`), or just read (`read`: written pages and pictures, nothing to do).
 */
export type ExerciseKind = 'sing' | 'name' | 'accent' | 'read' | 'mark';

export interface Exercise {
  id: string;
  title: string;
  kind: ExerciseKind;
  /** The melody as written in gabc, if the exercise has a staff (see `chant/gabc.ts`). */
  gabc?: string;
  /**
   * For naming exercises, how many notes from the start are already named, as
   * the book often writes the first few syllables as a start.
   */
  given: number;
  /** The key the book suggests, if it gives one. */
  key?: ExerciseKey;
  /**
   * The solfege syllable of each note. Under the staff it is what is shown,
   * unless the book prints words there instead (`words`).
   */
  labels: string[];
  /** The words printed under the notes in the book, one per syllable (a joined group counts as one), if it prints any. */
  words?: string[];
  /** Accent exercises without a staff: the lines of text to pick a word from. */
  lines?: string[];
  /** Accent exercises on a melody: the word (note) that is the right answer. */
  answer?: number;
  /**
   * Semitones above the tonic (the "do"). The first note the singer sings
   * fixes the key, and each later note is judged against its place in it.
   */
  offsets: number[];
  /** The melody as written in chant notation. */
  chant: Chant;
  /** Gesture exercises: the arsis or thesis at each ictus (null between them), by the rule the lessons teach. */
  gestures?: (Gesture | null)[];
  /**
   * How long each note lasts, in beats. In plain Solesmes rhythm every note is
   * worth one beat and a dotted note (punctum mora) two; a note with an episema
   * over it, or just before a tick, is "a little longer" (1.5). The
   * lengthening before a bar is not written in here; it is added where it is used.
   */
  beats: number[];
  /** Beats per minute for playback. */
  bpm: number;
  /**
   * What to tell the student, shown beside the staff. Paragraphs are separated
   * by a blank line. It lives with the notes so each exercise is one record.
   */
  instructions: string;
  /** Where the exercise comes from, for attribution. */
  source?: string;
  /** The number of the book's recording of this exercise (the circled number in the instructor edition). */
  recording?: number;
}

export interface Lesson {
  id: string;
  /** The lesson's number in its book, if it has one. */
  number?: number;
  title: string;
  /** A line or two for the home page. */
  summary: string;
  exercises: Exercise[];
}

const DEFAULT_BPM = 80;
/** The gabc of an exercise that has no staff: just a clef. */
const NO_STAFF = '(c2)';
/** A note with an episema, or before a tick: sung a little longer, not twice as long. */
const LONGER = 1.5;

export interface ExerciseSpec {
  id: string;
  title: string;
  /** Singing by default. */
  kind?: ExerciseKind;
  /** Naming exercises: notes named for the student from the start. */
  given?: number;
  /** The book's key tag, such as "do=d". */
  key?: string;
  /**
   * The melody as a gabc snippet (see `chant/gabc.ts`): its clef, then each syllable's text and
   * notes, as in `(c4) Pu(d)er(f) na(f)tus(e)`. The text is the words under the notes as the
   * book prints them; leave it out for an exercise that shows the note names instead. Omitted
   * for an exercise with no staff.
   */
  gabc?: string;
  /** Accent exercises without a staff: the lines to pick a word from. */
  lines?: string[];
  /** Accent exercises on a melody: the index of the word that is the right answer. */
  answer?: number;
  /**
   * The hand's line drawn over the staff, one letter per note: `a` for an arsis ictus
   * (the line loops round the note), `t` for a thesis ictus (it passes under the note),
   * `-` for a note between ictus marks (it passes above). As the workbook draws it.
   */
  gestures?: string;
  beats?: number[];
  bpm?: number;
  instructions: string;
  source?: string;
  recording?: number;
}

/** The hand's line of an exercise, from the letters written for it. */
function specGestures(spec: ExerciseSpec, chant: Chant): (Gesture | null)[] {
  const letters = [...(spec.gestures ?? '')];
  if (letters.length !== chant.notes.length || letters.some((g) => !'at-'.includes(g))) {
    throw new Error(`${spec.id}: gestures need one of a, t or - for each of ${chant.notes.length} notes`);
  }
  const gestures = letters.map((g) => (g === 'a' ? ('arsis' as const) : g === 't' ? ('thesis' as const) : null));
  // a mark exercise asks for an answer at each ictus, and nowhere else
  if (spec.kind === 'mark' && gestures.some((g, i) => (g !== null) !== chant.ictus.includes(i))) {
    throw new Error(`${spec.id}: gestures must be given exactly at the notes with an ictus`);
  }
  // an arsis is followed by at most one more
  const run = gestures.filter((g) => g !== null).join(',');
  if (run.includes('arsis,arsis,arsis')) throw new Error(`${spec.id}: no more than two arses in a row`);
  return gestures;
}

/**
 * Builds an exercise from its notation, so the notes on the staff, the
 * syllables and the pitches that are judged cannot disagree.
 */
export function exercise(spec: ExerciseSpec): Exercise {
  const gabc = spec.gabc ?? NO_STAFF;
  const chant: Chant = makeChant(gabc);
  const { notes, moras, episemas, ticks } = chant;
  const letters = [...notes];
  const flat = flattened(chant);
  const words = gabcWords(gabc);
  if (spec.kind === 'mark' && chant.ictus.length === 0) throw new Error(`${spec.id}: a mark exercise needs ictus`);
  return {
    id: spec.id,
    title: spec.title,
    kind: spec.kind ?? 'sing',
    gabc: spec.gabc,
    given: spec.given ?? 0,
    key: spec.key === undefined ? undefined : parseKey(spec.key),
    chant,
    gestures:
      spec.gestures !== undefined ? specGestures(spec, chant) : spec.kind === 'mark' ? ruleGestures(chant) : undefined,
    labels: letters.map((n, k) => (flat[k] ? 'te' : solfegeName(n, chant.clefLine))),
    words,
    lines: spec.lines,
    answer: spec.answer,
    offsets: letters.map((n, k) => semitonesAboveDo(n, chant.clefLine) - (flat[k] ? 1 : 0)),
    beats:
      spec.beats ??
      letters.map((_, i) => (moras.includes(i) ? 2 : episemas.includes(i) || ticks.includes(i + 1) ? LONGER : 1)),
    bpm: spec.bpm ?? DEFAULT_BPM,
    instructions: spec.instructions.trim(),
    source: spec.source,
    recording: spec.recording,
  };
}

/** What to call note `k` in a message: the word under it if the book prints one, else its syllable. */
export function noteName(exercise: Pick<Exercise, 'labels' | 'words' | 'chant'>, k: number): string {
  const word = exercise.words?.[unitIndexOf(exercise.chant, k)];
  return word ? word.replace(/[-,.!?;:]+$/, '') : exercise.labels[k];
}

/** Whether a half bar follows note `k`. */
export function endsPhrase(chant: Chant, k: number): boolean {
  return chant.bars.includes(k + 1);
}

/** The last note of the piece lasts at least this long, as the piece comes to rest. */
const FINAL_LENGTHENING = 2;

/** How long a note sounds and how long it is until the next one begins, in beats. */
export interface NoteTiming {
  /** How long the note sounds. */
  held: number;
  /** Time from the start of this note to the start of the next. */
  advance: number;
  /** A rest follows the note, for the half bar after it. */
  rest: boolean;
}

/**
 * The timing of every note. Each note sounds for its value, and the next one
 * follows at once. The exception is a half bar (the short vertical stroke):
 * it is a rest of one beat. If the note before it has a dot, the rest takes
 * the place of the dot's extra beat, which is cut off, so a dotted note and a
 * plain note both sound for one beat and then rest for one. The last note of
 * the piece is simply lengthened.
 */
export function noteTimings(exercise: Pick<Exercise, 'beats' | 'chant'>): NoteTiming[] {
  const last = exercise.beats.length - 1;
  return exercise.beats.map((beats, k) => {
    if (k === last) {
      // a dot or an episema already lengthens it, so it is not lengthened twice over
      const held = Math.max(beats, FINAL_LENGTHENING);
      return { held, advance: held, rest: false };
    }
    if (endsPhrase(exercise.chant, k)) {
      const held = exercise.chant.moras.includes(k) ? beats - 1 : beats;
      return { held, advance: held + 1, rest: true };
    }
    return { held: beats, advance: beats, rest: false };
  });
}

/** What the judge needs to know about the rhythm of an exercise. */
export function timingSpec(exercise: Pick<Exercise, 'beats' | 'chant'>): TimingSpec {
  const timings = noteTimings(exercise);
  return {
    advance: timings.map((t) => t.advance),
    held: timings.map((t) => t.held),
    rest: timings.map((t) => t.rest),
  };
}
