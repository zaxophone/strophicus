import { AudioContext, AudioManager } from 'react-native-audio-api';

import type { Playback } from './playMelody';

/** Time between asking the audio engine to start and the sound beginning. */
const LEAD_SECONDS = 0.1;

/** Plays one of the book's bundled recordings (the asset id from `require`). */
export function playBookRecording(source: number): Playback {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let context: AudioContext | undefined;
  let finish: () => void = () => {};
  const done = new Promise<void>((resolve) => (finish = resolve));

  const end = () => {
    if (stopped) return;
    stopped = true;
    if (timer) clearTimeout(timer);
    context?.close().catch(() => {});
    context = undefined;
    finish();
  };

  (async () => {
    try {
      AudioManager.setSystemOptions({
        ios: { category: 'playback', mode: 'default', options: [] },
      });
      await AudioManager.setAudioSessionActivity(true);
      if (stopped) return;

      context = new AudioContext();
      const buffer = await context.decodeAudioData(source);
      if (stopped) return;

      const node = context.createBufferSource();
      node.buffer = buffer;
      node.connect(context.destination);
      node.start(context.currentTime + LEAD_SECONDS);
      // The engine says nothing when a sound ends, so end a moment after its length.
      timer = setTimeout(end, (LEAD_SECONDS + buffer.duration + 0.3) * 1000);
    } catch {
      end();
    }
  })();

  return { stop: end, done };
}
