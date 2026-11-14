import { useCallback, useEffect, useRef, useState } from 'react';

import { NoteSegmenter, SungNote } from '../pitch/noteSegmenter';
import { playRecording } from './playRecording';
import { HISTORY_LENGTH, Recording } from './usePitchTracker';

export interface ReplayView {
  history: (number | null)[];
  notes: SungNote[];
}

/** How long the finished picture stays up before returning to the live view. */
const LINGER_MS = 600;

/**
 * Plays an attempt back with its audio, feeding the stored pitches through a
 * fresh segmenter on the original clock so the staff and trace animate as
 * they did when it was sung. `view` is null unless a replay is running.
 */
export function useReplay() {
  const [view, setView] = useState<ReplayView | null>(null);
  const active = useRef<{ stop: () => void } | null>(null);

  const stop = useCallback(() => {
    active.current?.stop();
    active.current = null;
    setView(null);
  }, []);

  const play = useCallback(
    (recording: Recording) => {
      stop();
      const segmenter = new NoteSegmenter();
      const history: (number | null)[] = [];
      const audio = playRecording(recording);
      const total = recording.frames.length;
      let cursor = 0;
      let raf: number | null = null;
      let cancelled = false;

      // The audio decides the clock: frames are spread evenly over its length,
      // so a chunk the app dropped can't push the animation out of step.
      const run = (startsAt: number, duration: number) => {
        const frameSeconds = duration / total;
        const tick = () => {
          const elapsed = (performance.now() - startsAt) / 1000;
          const target = Math.min(total, Math.max(0, Math.floor(elapsed / frameSeconds)));
          if (target > cursor) {
            while (cursor < target) {
              const midi = recording.frames[cursor];
              segmenter.push(midi, recording.levels[cursor]);
              cursor++;
              history.push(midi);
              if (history.length > HISTORY_LENGTH) history.shift();
            }
            setView({ history: [...history], notes: [...segmenter.notes] });
          }
          if (cursor >= total && elapsed * 1000 > duration * 1000 + LINGER_MS) {
            stop();
            return;
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      };

      audio.started.then((info) => {
        if (cancelled || !info) return;
        run(info.startsAt, info.duration);
      });
      audio.done.then(() => {
        if (!cancelled && active.current?.stop === cancel) stop();
      });

      const cancel = () => {
        cancelled = true;
        if (raf !== null) cancelAnimationFrame(raf);
        audio.stop();
      };
      active.current = { stop: cancel };
      setView({ history: [], notes: [] });
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  return { view, play, stop };
}
