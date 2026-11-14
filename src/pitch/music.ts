export function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

export function midiToHz(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Signed distance from `fromHz` to `toHz` in cents (100 cents = 1 semitone). */
export function centsBetween(fromHz: number, toHz: number): number {
  return 1200 * Math.log2(toHz / fromHz);
}

/**
 * Cents error of `hz` against `targetHz`, ignoring octave so that any voice
 * range can match a target. The result is in (-600, 600].
 */
export function octaveFreeCentsError(hz: number, targetHz: number): number {
  const cents = centsBetween(targetHz, hz);
  return cents - 1200 * Math.round(cents / 1200);
}

/**
 * The note a tuner should display for `midi`, sticking with `current` until the
 * pitch has clearly moved to a neighbour, so the name doesn't flicker at the
 * boundary between two notes.
 */
export function lockNote(
  current: number | null,
  midi: number | null,
  hysteresis = 0.15,
): number | null {
  if (midi === null) return null;
  if (current === null || Math.abs(midi - current) > 0.5 + hysteresis) {
    return Math.round(midi);
  }
  return current;
}

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

/** Name with octave for a whole MIDI note, e.g. 57 is "A3". */
export function midiToNoteName(midi: number): string {
  return `${NOTE_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
}
