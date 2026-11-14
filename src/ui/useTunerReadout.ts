import { useEffect, useRef, useState } from 'react';

import { DisplaySmoother } from '../pitch/displaySmoother';
import { hzToMidi, lockNote, midiToNoteName } from '../pitch/music';

export interface TunerReadout {
  /** Note name with octave, e.g. "A3", or null when nothing is sung. */
  note: string | null;
  /** Offset from the note in cents, live and unrounded, for the needle. */
  cents: number | null;
  /** Offset rounded to 5¢ and refreshed slowly, for the number. */
  centsLabel: number | null;
}

/** Turns a pitch in Hz into a steady note name plus live and readable cents. */
export function useTunerReadout(hz: number | null, labelMs = 200): TunerReadout {
  const locked = useRef<number | null>(null);

  // Smooth for display on top of the tracker's own filtering, using real
  // elapsed time because readings don't arrive at a fixed rate.
  const smoother = useRef(new DisplaySmoother());
  const seen = useRef<{ hz: number | null; at: number | null; midi: number | null }>({
    hz: null,
    at: null,
    midi: null,
  });
  if (hz !== seen.current.hz) {
    const now = performance.now();
    const dt =
      seen.current.at === null ? 1 / 60 : Math.min((now - seen.current.at) / 1000, 0.1);
    seen.current = {
      hz,
      at: hz === null ? null : now,
      midi: smoother.current.push(hz === null ? null : hzToMidi(hz), dt),
    };
  }
  const midi = seen.current.midi;
  locked.current = lockNote(locked.current, midi);

  const note = locked.current;
  const cents =
    midi === null || note === null ? null : (midi - note) * 100;

  const latest = useRef({ cents, note });
  latest.current = { cents, note };
  const [centsLabel, setCentsLabel] = useState<number | null>(null);
  useEffect(() => {
    // Average over roughly half a second so the number is readable, and
    // restart the average when the note changes.
    let average: number | null = null;
    let averagedNote: number | null = null;
    const id = setInterval(() => {
      const { cents: c, note: n } = latest.current;
      if (c === null) {
        average = null;
      } else if (average === null || n !== averagedNote) {
        average = c;
      } else {
        average += 0.35 * (c - average);
      }
      averagedNote = n;
      setCentsLabel(average === null ? null : Math.round(average / 5) * 5);
    }, labelMs);
    return () => clearInterval(id);
  }, [labelMs]);

  return {
    note: note === null ? null : midiToNoteName(note),
    cents,
    centsLabel: cents === null ? null : centsLabel,
  };
}
