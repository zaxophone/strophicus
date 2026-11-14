import { colors } from '../ui/theme';
import { ChantMark, syllableMark } from './marks';

const mark = (color: string, hint = '', next = false): ChantMark => ({ color, hint, next });
const RED = '#dc2626';
const AMBER = '#d97706';

describe('syllableMark', () => {
  it('leaves a single note as it is, and nothing as nothing', () => {
    const only = mark(colors.success, '✓');
    expect(syllableMark([only])).toBe(only);
    expect(syllableMark([])).toBeUndefined();
  });

  it('turns the figure red if any of its notes is wrong, and shows that note\'s hint', () => {
    const joined = syllableMark([mark(colors.success, '✓'), mark(RED, '↑')])!;
    expect(joined.color).toBe(RED);
    expect(joined.hint).toBe('↑');
  });

  it('turns it amber for a note of the wrong length when none is wrong', () => {
    expect(syllableMark([mark(colors.success, '✓'), mark(AMBER, 'short')])!.color).toBe(AMBER);
  });

  it('is green with a tick only once every note is right', () => {
    const done = syllableMark([mark(colors.success, '✓'), mark(colors.success, '✓'), mark(colors.success, '✓')])!;
    expect(done).toMatchObject({ color: colors.success, hint: '✓' });
    const half = syllableMark([mark(colors.success, '✓'), mark(colors.ink)])!;
    expect(half.color).toBe(colors.ink);
    expect(half.hint).toBe('');
  });

  it('lights the figure if any of its notes is the next or the one playing', () => {
    expect(syllableMark([mark(colors.ink), { ...mark(colors.ink), next: true }])!.next).toBe(true);
    expect(syllableMark([mark(colors.ink), { ...mark(colors.ink), playing: true }])!.playing).toBe(true);
  });
});
