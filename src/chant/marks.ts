import { colors } from '../ui/theme';

export interface ChantMark {
  color: string;
  /** Short note under the syllable, such as a tick or an arrow. */
  hint: string;
  /** Draws attention to the note to sing next. */
  next: boolean;
  /** The note sounding now during playback. */
  playing?: boolean;
}

const DANGER = '#dc2626';
const TIMING = '#d97706';

/**
 * One mark for a syllable sung on several notes: the worst of its notes' colours
 * (a wrong note, then a note of the wrong length), green only once all are right.
 */
export function syllableMark(marks: (ChantMark | undefined)[]): ChantMark | undefined {
  const present = marks.filter((m): m is ChantMark => m !== undefined);
  if (present.length <= 1) return present[0];
  const tints = present.map((m) => m.color);
  const color =
    [DANGER, TIMING].find((c) => tints.includes(c)) ??
    (tints.every((c) => c === tints[0]) ? tints[0] : tints.find((c) => c !== colors.success) ?? tints[0]);
  const problem = present.map((m) => m.hint).find((h) => h && h !== '✓');
  return {
    color,
    hint: problem ?? (present.every((m) => m.hint === '✓') ? '✓' : ''),
    next: present.some((m) => m.next),
    playing: present.some((m) => m.playing),
  };
}
