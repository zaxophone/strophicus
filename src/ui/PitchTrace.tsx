import { Canvas, Line, Path, Skia, vec } from '@shopify/react-native-skia';
import { useMemo, useRef } from 'react';

interface Props {
  width: number;
  height: number;
  /** Fractional MIDI notes over time, oldest first; null marks a gap. */
  history: (number | null)[];
  /** Pin the middle of the view here instead of following the voice. */
  centreMidi?: number;
  /** Semitone grid lines fall at this pitch plus whole semitones. */
  gridOrigin?: number;
  /** Highlighted guide lines at exact pitches, e.g. the notes to sing. */
  guides?: number[];
  /** Unvoiced samples to draw straight across instead of breaking the line. */
  maxBridge?: number;
  /** Number of samples that fill the full width. */
  length?: number;
  /** Semitones visible above and below the centre of the view. */
  rangeSemitones?: number;
  lineColor?: string;
  gridColor?: string;
  guideColor?: string;
}

export function PitchTrace({
  width,
  height,
  history,
  centreMidi,
  gridOrigin = 0,
  guides = [],
  maxBridge = 8,
  length = 160,
  rangeSemitones = 7,
  lineColor = '#4f46e5',
  gridColor = '#9ca3af',
  guideColor = '#16a34a',
}: Props) {
  // Recentre only when the voice leaves the middle of the view, and ease there,
  // so the grid and the trace don't slide on every frame.
  const centreRef = useRef<number | null>(null);
  const latest = useMemo(() => {
    for (let i = history.length - 1; i >= 0; i--) {
      const midi = history[i];
      if (midi !== null) return midi;
    }
    return null;
  }, [history]);
  if (centreMidi !== undefined) {
    centreRef.current = centreMidi;
  } else if (latest !== null) {
    if (centreRef.current === null) {
      centreRef.current = Math.round(latest);
    } else {
      const off = latest - centreRef.current;
      const limit = rangeSemitones * 0.5;
      if (Math.abs(off) > limit) {
        centreRef.current += (off - Math.sign(off) * limit) * 0.15;
      }
    }
  }
  const centre = centreRef.current ?? 60;

  const y = (midi: number) =>
    height / 2 - ((midi - centre) / rangeSemitones) * (height / 2);

  const path = useMemo(() => {
    const p = Skia.PathBuilder.Make();
    let lastVoiced = -1;
    history.forEach((midi, i) => {
      if (midi === null) return;
      const x = (i / (length - 1)) * width;
      if (lastVoiced >= 0 && i - lastVoiced - 1 <= maxBridge) {
        p.lineTo(x, y(midi));
      } else {
        p.moveTo(x, y(midi));
      }
      lastVoiced = i;
    });
    return p.detach();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, centre, width, height, length, rangeSemitones, maxBridge]);

  const grid = [];
  const first = Math.ceil(centre - rangeSemitones - gridOrigin);
  const last = Math.floor(centre + rangeSemitones - gridOrigin);
  for (let k = first; k <= last; k++) {
    grid.push(
      <Line
        key={`g${k}`}
        p1={vec(0, y(gridOrigin + k))}
        p2={vec(width, y(gridOrigin + k))}
        color={gridColor}
        strokeWidth={0.5}
        opacity={0.35}
      />,
    );
  }

  return (
    <Canvas style={{ width, height }}>
      {grid}
      {guides.map((g, i) => (
        <Line
          key={`t${i}`}
          p1={vec(0, y(g))}
          p2={vec(width, y(g))}
          color={guideColor}
          strokeWidth={2}
          opacity={0.7}
        />
      ))}
      <Path path={path} style="stroke" strokeWidth={3} color={lineColor} strokeJoin="round" strokeCap="round" />
    </Canvas>
  );
}
