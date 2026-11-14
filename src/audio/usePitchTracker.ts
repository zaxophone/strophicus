import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioManager, AudioRecorder } from 'react-native-audio-api';

import { midiToHz } from '../pitch/music';
import { warmRecording } from './playRecording';
import { enableSessionFile, logSessionFile } from './sessionFile';
import {
  HOP_LENGTH,
  PitchPipeline,
  PitchPipelineOptions,
} from '../pitch/pitchPipeline';

export const HISTORY_LENGTH = 160;
/** Longest attempt kept for playback; anything beyond it is not recorded. */
const MAX_RECORD_SECONDS = 90;

/** Everything needed to replay an attempt: what was heard and what was seen. */
export interface Recording {
  /** Files the recorder wrote, in order; the best copy of the audio when present. */
  files: string[];
  /** The audio as it reached JavaScript, used if the files can't be read. */
  samples: Float32Array;
  sampleRate: number;
  /** Stabilised pitch (MIDI) of each hop of audio, null where unvoiced. */
  frames: (number | null)[];
  /** Loudness (RMS) of each hop, so replay can split notes just as listening did. */
  levels: number[];
}

export type TrackerStatus = 'idle' | 'running' | 'denied' | 'error';

export interface PitchTracker {
  status: TrackerStatus;
  /** Smoothed pitch of the latest frame, or null when not singing. */
  hz: number | null;
  /** Recent smoothed pitches as fractional MIDI notes, null for gaps. */
  history: (number | null)[];
  start: () => Promise<void>;
  stop: () => void;
  /** Forget the trace and any note being followed. */
  reset: () => void;
  /** The audio and pitches heard since the last reset, or null if none. */
  getRecording: () => Recording | null;
}

export function usePitchTracker(
  /** Called for every frame with the stabilised pitch (MIDI), null if unvoiced, and its loudness. */
  onPitch?: (midi: number | null, clarity: number, level: number) => void,
  options: PitchPipelineOptions = {},
): PitchTracker {
  const [status, setStatus] = useState<TrackerStatus>('idle');
  const [hz, setHz] = useState<number | null>(null);
  const [history, setHistory] = useState<(number | null)[]>([]);

  const recorder = useRef<AudioRecorder | null>(null);
  const pipeline = useRef<PitchPipeline | null>(null);
  if (pipeline.current === null) {
    pipeline.current = new PitchPipeline(44100, options);
  }
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const historyRef = useRef<(number | null)[]>([]);
  const latestHz = useRef<number | null>(null);
  const dirty = useRef(false);
  const onPitchRef = useRef(onPitch);
  onPitchRef.current = onPitch;
  const raf = useRef<number | null>(null);
  const chunks = useRef<Float32Array[]>([]);
  const frames = useRef<(number | null)[]>([]);
  const levels = useRef<number[]>([]);
  const recorded = useRef({ samples: 0, sampleRate: 44100 });
  const files = useRef<string[]>([]);

  const processChunk = useCallback((chunk: Float32Array, sampleRate: number) => {
    const { midi, clarity, level } = pipeline.current!.push(chunk, sampleRate);
    onPitchRef.current?.(midi, clarity, level);

    const kept = recorded.current;
    if (kept.samples < MAX_RECORD_SECONDS * sampleRate) {
      chunks.current.push(chunk.slice());
      frames.current.push(midi);
      levels.current.push(level);
      kept.samples += chunk.length;
      kept.sampleRate = sampleRate;
    }

    const trace = historyRef.current;
    trace.push(midi);
    if (trace.length > HISTORY_LENGTH) trace.shift();
    if (midi !== null) latestHz.current = midiToHz(midi);
    else if (!pipeline.current!.active) latestHz.current = null;
    dirty.current = true;
  }, []);

  const stop = useCallback(() => {
    const active = recorder.current;
    if (!active) return;
    recorder.current = null;
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    active.clearOnAudioReady();
    const stopped = active.stop();
    stopped
      .then((result) => {
        logSessionFile(result);
        if (result.status === 'success') {
          files.current.push(...result.paths);
          // get playback ready now, after the screen has settled, so it starts at once
          setTimeout(
            () =>
              warmRecording({
                files: [...files.current],
                samples: new Float32Array(0),
                sampleRate: recorded.current.sampleRate,
              }),
            100,
          );
        }
      })
      .catch(() => {});
    AudioManager.setAudioSessionActivity(false).catch(() => {});
    setStatus('idle');
    setHz(null);
  }, []);

  const start = useCallback(async () => {
    if (recorder.current) return;
    try {
      const permission = await AudioManager.requestRecordingPermissions();
      if (permission !== 'Granted') {
        setStatus('denied');
        return;
      }

      // Measurement mode turns off the voice-chat processing (AGC, noise
      // suppression) that distorts pitch.
      AudioManager.setSystemOptions({
        ios: { category: 'playAndRecord', mode: 'measurement', options: [] },
      });
      await AudioManager.setAudioSessionActivity(true);

      const next = new AudioRecorder();
      next.onError(() => setStatus('error'));
      enableSessionFile(next);
      next.onAudioReady(
        { sampleRate: 44100, bufferLength: HOP_LENGTH, channelCount: 1 },
        ({ buffer }) =>
          processChunk(buffer.getChannelData(0), buffer.sampleRate),
      );
      const result = await next.start();
      if (result.status === 'error') {
        setStatus('error');
        return;
      }
      recorder.current = next;
      setStatus('running');

      // Push to React at most once per display frame, however fast audio is.
      const flush = () => {
        if (dirty.current) {
          dirty.current = false;
          setHz(latestHz.current);
          setHistory([...historyRef.current]);
        }
        raf.current = requestAnimationFrame(flush);
      };
      raf.current = requestAnimationFrame(flush);
    } catch {
      setStatus('error');
    }
  }, [processChunk]);

  const getRecording = useCallback((): Recording | null => {
    if (frames.current.length === 0) return null;
    const samples = new Float32Array(recorded.current.samples);
    let at = 0;
    for (const chunk of chunks.current) {
      samples.set(chunk, at);
      at += chunk.length;
    }
    return {
      files: [...files.current],
      samples,
      sampleRate: recorded.current.sampleRate,
      frames: [...frames.current],
      levels: [...levels.current],
    };
  }, []);

  const reset = useCallback(() => {
    chunks.current = [];
    frames.current = [];
    levels.current = [];
    files.current = [];
    recorded.current.samples = 0;
    historyRef.current = [];
    pipeline.current = new PitchPipeline(44100, optionsRef.current);
    latestHz.current = null;
    dirty.current = true;
    // While listening the next frame redraws; when stopped nothing would, and
    // the screen would keep showing the attempt that was just cleared.
    setHistory([]);
    setHz(null);
  }, []);

  useEffect(() => stop, [stop]);

  return { status, hz, history, start, stop, reset, getRecording };
}
