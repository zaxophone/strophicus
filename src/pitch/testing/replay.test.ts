import { readFileSync } from 'fs';

import { timingSpec } from '../../exercise/exercise';
import { judgeMelody } from '../../exercise/judge';
import { ALL_EXERCISES as EXERCISES } from '../../exercise/lessons';
import { hzToMidi } from '../music';
import { NoteSegmenter } from '../noteSegmenter';
import { HOP_LENGTH, PitchPipeline } from '../pitchPipeline';
import { detectPitch } from '../yin';

/** Reads a mono PCM16 or float32 WAV into samples in -1..1. */
export function readWav(path: string): { samples: Float32Array; sampleRate: number } {
  const buf = readFileSync(path);
  let pos = 12;
  let format = 1;
  let channels = 1;
  let sampleRate = 44100;
  let bits = 16;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    if (id === 'fmt ') {
      format = buf.readUInt16LE(pos + 8);
      channels = buf.readUInt16LE(pos + 10);
      sampleRate = buf.readUInt32LE(pos + 12);
      bits = buf.readUInt16LE(pos + 22);
    } else if (id === 'data') {
      const bytes = bits / 8;
      const frames = Math.floor(Math.min(size, buf.length - pos - 8) / (bytes * channels));
      const out = new Float32Array(frames);
      for (let i = 0; i < frames; i++) {
        const at = pos + 8 + i * bytes * channels;
        out[i] =
          format === 3
            ? buf.readFloatLE(at)
            : bits === 16
              ? buf.readInt16LE(at) / 32768
              : buf.readIntLE(at, 3) / 8388608;
      }
      return { samples: out, sampleRate };
    }
    pos += 8 + size + (size % 2);
  }
  throw new Error('no data chunk');
}

// Replays a captured session. Run with, for example:
//   REPLAY=/path/to/session.wav EXERCISE=wow-3-1 FOLD=1 yarn jest replay
const file = process.env.REPLAY;
(file ? it : it.skip)('replays a captured session', () => {
  const { samples, sampleRate } = readWav(file!);
  const pipeline = new PitchPipeline(sampleRate, { foldOctaves: !!process.env.FOLD });
  const segmenter = new NoteSegmenter();
  const win = new Float32Array(3072);
  const rows: string[] = [];
  let first: number | null = null;
  for (let i = 0, f = 0; i + HOP_LENGTH <= samples.length; i += HOP_LENGTH, f++) {
    const chunk = samples.subarray(i, i + HOP_LENGTH);
    win.copyWithin(0, HOP_LENGTH);
    win.set(chunk, 3072 - HOP_LENGTH);
    const raw = detectPitch(win, sampleRate, { decimate: 4 });
    const out = pipeline.push(chunk, sampleRate);
    segmenter.push(out.midi, out.level);
    if (out.midi !== null && first === null) first = out.midi;
    const rel = (m: number | null) => (m === null || first === null ? '  .  ' : (m - first).toFixed(2).padStart(5));
    let rms = 0;
    for (const v of chunk) rms += v * v;
    rows.push(
      `${String(f).padStart(3)} ${(i / sampleRate).toFixed(2)}s rms=${Math.sqrt(rms / chunk.length).toFixed(3)} ` +
        `raw=${raw ? rel(hzToMidi(raw.hz)) : '  .  '} c=${raw ? raw.clarity.toFixed(2) : ' .  '} out=${rel(out.midi)}`,
    );
  }
  // FROM=<n> and TO=<n> judge only notes n..m, for a recording that holds more than one attempt
  const notes = segmenter.notes.slice(Number(process.env.FROM ?? 1) - 1, process.env.TO ? Number(process.env.TO) : undefined);
  const lines = [
    `${(samples.length / sampleRate).toFixed(1)}s at ${sampleRate} Hz, ${notes.length} notes`,
    ...notes.map((n, i) => `  note ${i + 1}: ${first === null ? '' : (n.midi - notes[0].midi).toFixed(2)} st from first, ${n.frames} frames, start ${n.startFrame}`),
  ];
  const exercise = EXERCISES.find((e) => e.id === process.env.EXERCISE);
  if (exercise) {
    const j = judgeMelody(notes, exercise.offsets, 50, timingSpec(exercise));
    lines.push(
      `  ${exercise.title}: ${j.passed ? 'PASSED' : 'not passed'} ` +
        j.results.map((r) => `${r.status}${r.errorCents === null ? '' : `(${Math.round(r.errorCents)})`}${r.timing && r.timing !== 'ok' ? '[' + r.timing + ']' : ''}${r.merged ? '{merged}' : ''}`).join(' ') + (j.timingOk ? '' : '  TIMING OFF') + '  ratios ' + j.results.map((r) => (r.ratio === undefined ? '.' : r.ratio.toFixed(2))).join(' '),
    );
  }
  console.log(lines.join('\n') + (process.env.FRAMES ? '\n' + rows.join('\n') : ''));
});
