import { useCallback, useEffect, useRef, useState } from 'react';

import { noteTimings } from '../exercise/exercise';
import type { Exercise } from '../exercise/exercise';
import { playMelody, Playback } from './playMelody';

/** Plays an exercise's melody from the reference pitch, noting which note is sounding. */
export function useReferencePlayback(exercise: Exercise, tonic: number) {
  const [playing, setPlaying] = useState(false);
  const [playingNote, setPlayingNote] = useState<number | null>(null);
  const playback = useRef<Playback | null>(null);

  const stop = useCallback(() => {
    playback.current?.stop();
    playback.current = null;
    setPlaying(false);
    setPlayingNote(null);
  }, []);
  useEffect(() => stop, [stop]);

  const play = () => {
    stop();
    const timings = noteTimings(exercise);
    const started = playMelody(tonic, exercise.offsets, {
      beats: timings.map((t) => t.advance),
      held: timings.map((t) => t.held),
      bpm: exercise.bpm,
      onNote: setPlayingNote,
    });
    playback.current = started;
    setPlaying(true);
    started.done.then(() => {
      if (playback.current === started) stop();
    });
  };

  return { playing, playingNote, play, stop };
}
