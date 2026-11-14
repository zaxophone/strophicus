export interface SungNote {
  /** Pitch of the note as fractional MIDI (median, ignoring the onset glide). */
  midi: number;
  startFrame: number;
  frames: number;
  /** Still being sung, so its pitch may yet change. */
  open: boolean;
}

export interface NoteSegmenterOptions {
  /** Semitones a frame may stray from the note and still belong to it. */
  tolerance?: number;
  /** Frames a pitch must hold before it counts as a note. */
  minFrames?: number;
  /** Unvoiced frames that end a note, so a repeated note is a new note. */
  gapFrames?: number;
  /**
   * Semitones the first and second half of a new note's opening frames may
   * differ by. A slow glide between notes can hover in a narrow band for as
   * long as a note, but unlike a note it is still moving.
   */
  flatness?: number;
  /**
   * A note is split where its loudness falls below this fraction of its recent
   * peak and then recovers, which is how a repeated syllable sounds when the
   * voice never breaks ("re re re" sung on one pitch).
   */
  dipRatio?: number;
  /** How far above the dip the loudness must climb back to count as a new onset. */
  riseRatio?: number;
  /**
   * A new onset must come back at least this fraction of the note's peak, so
   * a small bump while a note fades away is not taken for another syllable.
   */
  onsetFloor?: number;
  /** Frames a part of a split note must have, so a flicker is not a note. */
  minSplitFrames?: number;
}

const DEFAULTS: Required<NoteSegmenterOptions> = {
  tolerance: 0.6,
  minFrames: 8,
  gapFrames: 3,
  flatness: 0.25,
  dipRatio: 0.65,
  riseRatio: 1.25,
  onsetFloor: 0.5,
  minSplitFrames: 6,
};

/** Frames the loudness is averaged over, to steady it against jitter. */
const SMOOTH_FRAMES = 2;

interface Run {
  values: number[];
  /** Loudness of each frame, where known. */
  levels: number[];
  start: number;
  /** Loudest smoothed level so far, and the quietest since then, with where it was. */
  peak: number;
  valley: number;
  valleyAt: number;
  /** Began where a louder note dipped and recovered; hidden until it has held. */
  fromSplit: boolean;
}

function newRun(values: number[], levels: number[], start: number, fromSplit = false): Run {
  const run: Run = { values, levels, start, peak: 0, valley: 0, valleyAt: 0, fromSplit };
  retrack(run);
  return run;
}

/** Recomputes a run's peak and valley from its levels. */
function retrack(run: Run): void {
  run.peak = 0;
  run.valley = 0;
  run.valleyAt = 0;
  for (let i = 0; i < run.levels.length; i++) track(run, i);
}

/** Smoothed loudness at frame `i` of a run: the mean of it and the frames before. */
function smoothed(run: Run, i: number): number {
  const from = Math.max(0, i - SMOOTH_FRAMES + 1);
  let sum = 0;
  for (let k = from; k <= i; k++) sum += run.levels[k];
  return sum / (i - from + 1);
}

/**
 * Folds frame `i` into the run's peak and valley. The peak is taken from the
 * smoothed loudness, but the valley from the raw frame, so a short dip is not
 * averaged away.
 */
function track(run: Run, i: number): void {
  const level = smoothed(run, i);
  if (level >= run.peak) {
    run.peak = level;
    run.valley = level;
    run.valleyAt = i;
  } else if (run.levels[i] < run.valley) {
    run.valley = run.levels[i];
    run.valleyAt = i;
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/** Median after dropping the first third, where the voice is still gliding in. */
function settled(values: number[]): number {
  return median(values.slice(values.length >= 6 ? Math.floor(values.length / 3) : 0));
}

/**
 * Groups a stream of per-frame pitches (fractional MIDI, null when unvoiced)
 * into the discrete notes a singer sang. Only the pitch relationships matter
 * downstream, so it never needs to know what the notes should be.
 */
export class NoteSegmenter {
  private readonly o: Required<NoteSegmenterOptions>;
  private done: SungNote[] = [];
  private current: Run | null = null;
  private candidate: Run | null = null;
  private gap = 0;
  private frame = 0;

  constructor(options: NoteSegmenterOptions = {}) {
    this.o = { ...DEFAULTS, ...options };
  }

  /** Every note so far, with the one being sung last and marked `open`. */
  get notes(): SungNote[] {
    const current = this.current;
    // A note just split off a longer one isn't counted until it has held a moment.
    if (!current || (current.fromSplit && current.values.length < this.o.minSplitFrames)) {
      return this.done;
    }
    return [...this.done, this.toNote(current, true)];
  }

  /**
   * Ends the note being sung, as if the voice had stopped. Call this when
   * listening stops: no more audio arrives to show the note has ended, so it
   * would stay open (and unjudged as finished) otherwise.
   */
  finish(): void {
    this.candidate = null;
    this.closeCurrent();
  }

  reset(): void {
    this.done = [];
    this.current = null;
    this.candidate = null;
    this.gap = 0;
    this.frame = 0;
  }

  /**
   * Adds one frame: its pitch (null when unvoiced) and, if known, its loudness.
   * Loudness lets a repeated note be told apart when the pitch never moves.
   */
  push(midi: number | null, level = 0): void {
    const index = this.frame++;

    if (midi === null) {
      if (++this.gap >= this.o.gapFrames) {
        this.candidate = null;
        this.closeCurrent();
      }
      return;
    }
    this.gap = 0;

    if (this.current) {
      if (Math.abs(midi - settled(this.current.values)) <= this.o.tolerance) {
        this.current.values.push(midi);
        this.current.levels.push(level);
        this.candidate = null;
        this.splitOnDip();
        return;
      }
      this.extendCandidate(midi, index, level);
      // A new pitch must hold as long as any note, or it's just a glide.
      if (this.isNote(this.candidate!.values)) {
        this.closeCurrent();
        this.current = this.candidate;
        retrack(this.current!);
        this.candidate = null;
      }
      return;
    }

    this.extendCandidate(midi, index, level);
    if (this.isNote(this.candidate!.values)) {
      this.current = this.candidate;
      retrack(this.current!);
      this.candidate = null;
    }
  }

  /**
   * Ends the current note and starts another where the voice got clearly
   * quieter and then louder again without the pitch changing: the next
   * syllable of a repeated note.
   */
  private splitOnDip(): void {
    const run = this.current!;
    const last = run.values.length - 1;
    const level = smoothed(run, last);
    const dipped = run.valley < run.peak * this.o.dipRatio;
    const recovered =
      level > run.valley * this.o.riseRatio && level >= run.peak * this.o.onsetFloor;
    if (!(dipped && recovered && run.valleyAt + 1 >= this.o.minSplitFrames)) {
      track(run, last);
      return;
    }
    const cut = run.valleyAt + 1;
    this.done = [
      ...this.done,
      this.toNote(newRun(run.values.slice(0, cut), run.levels.slice(0, cut), run.start), false),
    ];
    this.current = newRun(run.values.slice(cut), run.levels.slice(cut), run.start + cut, true);
  }

  /** Held long enough, and steady rather than still gliding. */
  private isNote(values: number[]): boolean {
    const n = this.o.minFrames;
    if (values.length < n) return false;
    const recent = values.slice(-n);
    const half = Math.floor(n / 2);
    return (
      Math.abs(median(recent.slice(0, half)) - median(recent.slice(half))) <=
      this.o.flatness
    );
  }

  private extendCandidate(midi: number, index: number, level: number): void {
    const c = this.candidate;
    if (c && Math.abs(midi - median(c.values)) <= this.o.tolerance) {
      c.values.push(midi);
      c.levels.push(level);
    } else {
      this.candidate = newRun([midi], [level], index);
    }
  }

  private closeCurrent(): void {
    const run = this.current;
    if (run) {
      // A split-off piece that ended before it held is a flicker, not a note.
      if (!(run.fromSplit && run.values.length < this.o.minSplitFrames)) {
        this.done = [...this.done, this.toNote(run, false)];
      }
      this.current = null;
    }
  }

  private toNote(run: Run, open: boolean): SungNote {
    return {
      midi: settled(run.values),
      startFrame: run.start,
      frames: run.values.length,
      open,
    };
  }
}
