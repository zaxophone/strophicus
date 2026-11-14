import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  width: number;
  /** Offset from the target in cents, or null when nothing is sung. */
  cents: number | null;
  /** Cents within which the needle turns green. */
  inTune?: number;
  range?: number;
  /** Time constant of the needle's easing; larger is smoother. */
  easeSeconds?: number;
}

const HEIGHT = 56;
const NEEDLE = 6;

export function CentsMeter({ width, cents, inTune = 10, range = 50, easeSeconds = 0.08 }: Props) {
  // Ease the needle toward the target every frame. Restarting a spring on each
  // new reading would never build up speed, so this runs its own small loop.
  const target = useRef<number | null>(null);
  const [shown, setShown] = useState(0);
  if (cents !== null) {
    target.current = Math.max(-range, Math.min(range, cents));
  }

  useEffect(() => {
    let current = 0;
    let last = performance.now();
    let id = requestAnimationFrame(function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const goal = target.current ?? 0;
      current += (goal - current) * (1 - Math.exp(-dt / easeSeconds));
      setShown((prev) => (Math.abs(prev - current) < 0.05 ? prev : current));
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [easeSeconds]);

  const needleX = width / 2 + (shown / range) * (width / 2);
  const active = cents !== null;

  const ticks = [-50, -25, 0, 25, 50];
  const near = active && Math.abs(shown) <= inTune;

  return (
    <View style={{ width, height: HEIGHT, marginBottom: 22 }}>
      <View
        style={[
          styles.zone,
          {
            left: width / 2 - (inTune / range) * (width / 2),
            width: (inTune / range) * width,
          },
        ]}
      />
      {ticks.map((t) => (
        <View
          key={t}
          style={[
            styles.tick,
            {
              left: width / 2 + (t / range) * (width / 2) - 0.5,
              height: t === 0 ? HEIGHT : HEIGHT * 0.45,
              top: t === 0 ? 0 : HEIGHT * 0.275,
            },
          ]}
        />
      ))}
      <View
        style={[
          styles.needle,
          {
            left: needleX - NEEDLE / 2,
            opacity: active ? 1 : 0.25,
            backgroundColor: near ? '#16a34a' : '#4f46e5',
          },
        ]}
      />
      <Text style={[styles.label, { left: 0 }]}>♭</Text>
      <Text style={[styles.label, { right: 0 }]}>♯</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
  },
  tick: { position: 'absolute', width: 1, backgroundColor: '#9ca3af' },
  needle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: NEEDLE,
    borderRadius: NEEDLE / 2,
  },
  label: {
    position: 'absolute',
    bottom: -22,
    fontSize: 16,
    color: '#6b7280',
  },
});
