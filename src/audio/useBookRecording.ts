import { useCallback, useEffect, useRef, useState } from 'react';

import { RECORDINGS } from '../content/wordsWithWings/recordings';
import type { Exercise } from '../exercise/exercise';
import { playBookRecording } from './playBookRecording';
import type { Playback } from './playMelody';

/**
 * The book's recording for an exercise, if it has one. `toggle` starts it or
 * stops it; the caller silences anything else that is sounding or listening first.
 */
export function useBookRecording(exercise: Pick<Exercise, 'recording'>) {
  const source = exercise.recording === undefined ? undefined : RECORDINGS[exercise.recording];
  const [playing, setPlaying] = useState(false);
  const playback = useRef<Playback | null>(null);

  const stop = useCallback(() => {
    playback.current?.stop();
    playback.current = null;
    setPlaying(false);
  }, []);
  useEffect(() => stop, [stop]);

  const toggle = () => {
    if (source === undefined) return;
    if (playback.current) return stop();
    const started = playBookRecording(source);
    playback.current = started;
    setPlaying(true);
    started.done.then(() => {
      if (playback.current === started) stop();
    });
  };

  return { available: source !== undefined, playing, toggle, stop };
}
