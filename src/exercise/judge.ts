import type { SungNote } from '../pitch/noteSegmenter';

export type NoteStatus = 'ok' | 'off' | 'pending';
/**
 * How a note's length was: fine, clipped, dragged, or wrong at a half bar
 * (no rest was left, or the note ran on into the rest).
 */
export type NoteTiming = 'ok' | 'short' | 'long' | 'rest' | 'cut';

export interface NoteResult {
  status: NoteStatus;
  /** Where the melody puts this note, in semitones above the first note sung. */
  expected: number;
  /** Where the note was actually sung, in semitones above the first note. */
  sung: number | null;
  /** Sung minus expected, in cents; positive means too high. */
  errorCents: number | null;
  /** False while the note is still being sung and may yet change. */
  final: boolean;
  /** The singer went past this note without singing it. */
  skipped?: boolean;
  /** Frames the sung note has lasted so far (only for a note that was sung). */
  frames?: number;
  /** Sung as part of one held note that covers several repeated notes (legato). */
  merged?: boolean;
  /** Whether the note lasted about as long as it should, once the rhythm is known. */
  timing?: NoteTiming;
  /** How long the note lasted compared with how long it should, where it could be measured. */
  ratio?: number;
}

export interface Judgement {
  results: NoteResult[];
  /** Every note of the melody sung, each within tolerance of its place. */
  passed: boolean;
  /** No note was clearly too short or too long. True if the rhythm could not be measured. */
  timingOk: boolean;
}

/** What the rhythm should be, in beats. */
export interface TimingSpec {
  /** Time from the start of each note to the start of the next. */
  advance: number[];
  /** How long each note sounds; shorter than `advance` where a rest follows. */
  held: number[];
  /** Whether a half bar (a one-beat rest) follows each note. */
  rest: boolean[];
  /** Notes asked to be "a little longer" (an episema or a tick): right if held at least that long, however much longer. */
  atLeast?: boolean[];
}

/** Costs, in units of 50 cents of error, that decide how sung notes line up with the melody. */
const MISS_CAP = 4;
const SKIP_COST = 2;
const EXTRA_COST = MISS_CAP;
/** Ignoring a very short note, a flicker rather than a note, costs little. */
const SHORT_EXTRA_COST = 1;
/** A sung note is a flicker if it lasts less than this fraction of a typical note. */
const FLICKER = 0.5;
/** Extra cost for each additional repeated note covered by one held note. */
const MERGE_COST = 1;
/** Most repeated notes one held note may stand for. */
const MAX_MERGE = 4;
/** Breaks ties toward lining notes up with earlier places in the melody. */
const LATE_PENALTY = 0.001;

/**
 * How long a note may last, compared with the singer's own pulse, before it is
 * called too short or too long. These are deliberately generous: they allow
 * the ordinary unevenness of a person singing, and only catch clearly clipped
 * or dragged notes.
 */
const SHORTEST = 0.55;
const LONGEST = 1.8;
/** Most audible, unpitched sound between two notes (consonants) that is left out of the first note's length, in frames. */
const MAX_CONSONANT_FRAMES = 12;
/** A note with an episema or tick must come to about the 1.5 beats asked for (a little slack for the measuring). */
const SHORTEST_LENGTHENED = 0.75;
/** A rest is the loosest part of the rhythm: singers often leave a little less than a beat. */
const SHORTEST_BEFORE_REST = 0.5;
/** Notes needed to know the singer's pulse before judging any rhythm. */
const MIN_PULSE_NOTES = 2;
/**
 * At a half bar some silence must be left between the end of the note and the
 * start of the next: at least this fraction of a beat, and a few frames. Both
 * are small, because the detector holds a note's pitch for a moment after the
 * sound stops, which hides the first part of a rest.
 */
const MIN_REST_BEATS = 0.1;
const MIN_REST_FRAMES = 3;
/** A note before a half bar may sound this much longer than it should, in beats. */
const HELD_SLACK_BEATS = 0.8;
/** The detector's hold after a note ends, which makes a note seem this much longer (frames). */
const HOLD_FRAMES = 8;

type Step = 'match' | 'skip' | 'extra' | 'merge';

/** Which sung note an expected note was matched to, and which part of it. */
interface Placement {
  note: number;
  part: number;
  parts: number;
}

/** The middle value, taking the lower of the two middle ones when there are an even number. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[(sorted.length - 1) >> 1];
}

/**
 * Judges sung notes against a melody given as semitone offsets above its tonic.
 * The singer picks the starting pitch, and that first note fixes the key for
 * the rest of the exercise: every later note is measured against where the
 * melody puts it relative to that note, never relative to the note before.
 * Coming back down to a flat "do" is therefore wrong even if every interval
 * along the way was right.
 *
 * Sung notes are lined up with the melody in order, allowing notes of the
 * melody to be skipped and stray sung notes to be ignored, whichever
 * alignment of the whole attempt is cheapest. A missed note therefore costs
 * only that note, not every note after it, while a single note that is merely
 * a little sharp or flat is still judged as itself rather than mistaken for a
 * neighbour.
 *
 * Repeated notes sung legato, with nothing to mark where one ends, show up as
 * a single long note. If it is long enough for the repeats, it counts as them.
 *
 * Given the note values, the rhythm is judged too, against the singer's own
 * pulse: as the first note sets the key, the first few set the tempo.
 */
export function judgeMelody(
  sung: SungNote[],
  offsets: number[],
  toleranceCents = 50,
  timing?: TimingSpec,
): Judgement {
  const n = sung.length;
  const m = offsets.length;
  const expectedAt = (k: number) => offsets[k] - offsets[0];
  const errorAt = (i: number, k: number) =>
    (sung[i].midi - sung[0].midi - expectedAt(k)) * 100;

  const missCost = (i: number, k: number) =>
    Math.min(MISS_CAP, Math.abs(errorAt(i, k)) / 50) + LATE_PENALTY * k;

  // How long a typical note is, from the gaps between the starts of the notes
  // sung, so a held note can be recognised as several repeats.
  const gaps = sung.slice(1).map((note, i) => note.startFrame - sung[i].startFrame);
  const typical = gaps.length >= 2 ? median(gaps) : null;

  /** What it costs to ignore sung note `i`: little for a flicker, a lot for a held note. */
  const extraCost = (i: number) =>
    typical !== null && sung[i].frames < FLICKER * typical ? SHORT_EXTRA_COST : EXTRA_COST;

  /** Whether sung note `i` could be `size` repeated notes ending at melody note `j - 1`. */
  const canMerge = (i: number, j: number, size: number) => {
    if (typical === null || j - size < 0) return false;
    for (let k = j - size; k < j; k++) if (offsets[k] !== offsets[j - 1]) return false;
    const frames = sung[i].frames;
    return frames >= (size - 0.45) * typical && frames <= (size + 1.2) * typical;
  };

  // cost[i][j]: cheapest way to account for the first i sung notes and first j melody notes
  const cost = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(Infinity));
  const step = Array.from({ length: n + 1 }, () => new Array<Step>(m + 1));
  const span = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(1));
  cost[0][0] = 0;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (i === 0 && j === 0) continue;
      let best = Infinity;
      let how: Step = 'match';
      let size = 1;
      if (i > 0 && j > 0) {
        const c = cost[i - 1][j - 1] + missCost(i - 1, j - 1);
        if (c < best) [best, how] = [c, 'match'];
        for (let s = 2; s <= MAX_MERGE; s++) {
          if (!canMerge(i - 1, j, s)) continue;
          const merged = cost[i - 1][j - s] + missCost(i - 1, j - 1) + MERGE_COST * (s - 1);
          if (merged < best) [best, how, size] = [merged, 'merge', s];
        }
      }
      if (j > 0 && cost[i][j - 1] + SKIP_COST < best) {
        [best, how, size] = [cost[i][j - 1] + SKIP_COST, 'skip', 1];
      }
      if (i > 0 && cost[i - 1][j] + extraCost(i - 1) < best) {
        [best, how, size] = [cost[i - 1][j] + extraCost(i - 1), 'extra', 1];
      }
      cost[i][j] = best;
      step[i][j] = how;
      span[i][j] = size;
    }
  }

  // The latest note can't be waved away as a stray until a later note shows it
  // was one, so it must line up with a note of the melody (unless the melody is
  // already complete). Whatever follows is simply not sung yet.
  let end = 0;
  let endsOnMatch: { size: number } | null = null;
  if (n > 0) {
    end = m;
    let best = cost[n][m];
    for (let j = 1; j <= m; j++) {
      const single = cost[n - 1][j - 1] + missCost(n - 1, j - 1);
      if (single <= best) [best, end, endsOnMatch] = [single, j, { size: 1 }];
      for (let s = 2; s <= MAX_MERGE; s++) {
        if (!canMerge(n - 1, j, s)) continue;
        const merged = cost[n - 1][j - s] + missCost(n - 1, j - 1) + MERGE_COST * (s - 1);
        if (merged <= best) [best, end, endsOnMatch] = [merged, j, { size: s }];
      }
    }
  }

  const results: NoteResult[] = offsets.map((_, k) => ({
    status: 'pending',
    expected: expectedAt(k),
    sung: null,
    errorCents: null,
    final: false,
  }));
  const placed: (Placement | null)[] = offsets.map(() => null);
  const settled = n === 0 || !sung[n - 1].open;
  for (let i = n, j = end, first = true; i > 0 || j > 0; first = false) {
    const how: Step = first && endsOnMatch ? (endsOnMatch.size > 1 ? 'merge' : 'match') : step[i][j];
    const size = first && endsOnMatch ? endsOnMatch.size : span[i][j];
    if (how === 'match' || how === 'merge') {
      const note = sung[i - 1];
      for (let t = 0; t < size; t++) {
        const k = j - size + t;
        const errorCents = errorAt(i - 1, k);
        results[k] = {
          status: Math.abs(errorCents) <= toleranceCents ? 'ok' : 'off',
          expected: expectedAt(k),
          sung: note.midi - sung[0].midi,
          errorCents,
          final: !note.open,
          frames: Math.floor(note.frames / size),
          ...(size > 1 ? { merged: true } : {}),
        };
        placed[k] = { note: i - 1, part: t, parts: size };
      }
      i--;
      j -= size;
    } else if (how === 'skip') {
      results[j - 1] = {
        status: 'off',
        expected: expectedAt(j - 1),
        sung: null,
        errorCents: null,
        final: settled || i < n,
        skipped: true,
      };
      j--;
    } else {
      i--;
    }
  }

  const timingOk = timing ? judgeTiming(results, placed, sung, timing) : true;

  return {
    results,
    passed: results.every((r) => r.status === 'ok'),
    timingOk,
  };
}

/**
 * Marks each note, by the time from where it began to where the next began,
 * against the singer's own pulse (the typical time per beat, taken from the
 * notes with no rest after them). At a half bar it also looks for the rest
 * itself, and for a dotted note being cut off. Returns whether every note was
 * in good time.
 */
function judgeTiming(
  results: NoteResult[],
  placed: (Placement | null)[],
  sung: SungNote[],
  { advance, held, rest, atLeast }: TimingSpec,
): boolean {
  const start = (k: number) => {
    const p = placed[k]!;
    // one held note may stand for several repeated notes: it is shared out by how long each
    // was meant to last, not evenly (a lengthened first note takes more of it)
    const first = k - p.part;
    let before = 0;
    let total = 0;
    for (let j = 0; j < p.parts; j++) {
      const share = advance[first + j] ?? 1;
      if (j < p.part) before += share;
      total += share;
    }
    return sung[p.note].startFrame + (before / total) * sung[p.note].frames;
  };
  /** Frames from the start of note k to the start of note k + 1, if both were sung one after the other. */
  const interval = (k: number): number | null => {
    const a = placed[k];
    const b = placed[k + 1];
    if (!a || !b) return null;
    const sameNote = a.note === b.note && b.part === a.part + 1;
    const nextNote = b.note === a.note + 1 && b.part === 0 && a.part === a.parts - 1;
    if (!sameNote && !nextNote) return null;
    const gap = start(k + 1) - start(k);
    // consonants leading into the next syllable are not a longer note, but silence is: it counts in full
    if (nextNote && !rest[k]) return gap - Math.min(sung[a.note].soundAfter ?? 0, MAX_CONSONANT_FRAMES);
    return gap;
  };

  const intervals = results.map((_, k) => (k < results.length - 1 ? interval(k) : null));
  const pulse = intervals
    .map((frames, k) => (frames === null || rest[k] ? null : frames / (advance[k] ?? 1)))
    .filter((v): v is number => v !== null);
  if (pulse.length < MIN_PULSE_NOTES) return true;
  const beat = median(pulse);

  let ok = true;
  intervals.forEach((frames, k) => {
    if (frames === null) return;
    const ratio = frames / ((advance[k] ?? 1) * beat);
    results[k].ratio = ratio;
    const lengthened = !!atLeast?.[k] && !rest[k];
    const shortest = rest[k] ? SHORTEST_BEFORE_REST : lengthened ? SHORTEST_LENGTHENED : SHORTEST;
    let timing: NoteTiming = ratio < shortest ? 'short' : ratio > LONGEST && !lengthened ? 'long' : 'ok';

    const note = placed[k] && placed[k]!.parts === 1 ? sung[placed[k]!.note] : null;
    if (timing === 'ok' && rest[k] && note) {
      const gap = start(k + 1) - (note.startFrame + note.frames);
      const sounding = note.frames - HOLD_FRAMES;
      if (gap < Math.max(MIN_REST_FRAMES, MIN_REST_BEATS * beat)) {
        timing = 'rest'; // sung straight through the bar
      } else if (sounding > ((held[k] ?? 1) + HELD_SLACK_BEATS) * beat) {
        timing = 'cut'; // sounded for longer than the beat before the rest
      }
    }
    results[k].timing = timing;
    if (timing !== 'ok') ok = false;
  });
  return ok;
}

/** A few words on what was wrong with a note, or '' if it was fine. */
export function describeError(result: NoteResult): string {
  if (result.skipped) return 'skipped';
  if (result.status !== 'off' || result.errorCents === null) return '';
  return result.errorCents > 0 ? 'too high' : 'too low';
}

/** Frames the last note must have held before the exercise counts as done (about 0.3 s). */
export const SETTLE_FRAMES = 12;

/**
 * Whether the exercise is done: every note right and in good time, and the
 * last one held long enough to be sure of. It doesn't wait for the voice to
 * stop, so the exercise can be passed the moment the final note is sung.
 */
export function isComplete(judgement: Judgement, settleFrames = SETTLE_FRAMES): boolean {
  return (
    judgement.passed &&
    judgement.timingOk &&
    judgement.results.every((r) => r.final || (r.frames ?? 0) >= settleFrames)
  );
}
