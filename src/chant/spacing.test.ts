import { Column, flowBreaks, lineCentres, pitches } from './spacing';

const col = (kind: Column['kind'], text = 0, half = 5): Column => ({ left: half, right: half, text, kind });
const SPACE = 20;

describe('column spacing, as Gregorio sets it', () => {
  it('keeps the notes of a word closer than the notes of two words, and a bar furthest', () => {
    const [, word] = pitches([col('start'), col('word')], SPACE);
    const [, next] = pitches([col('start'), col('newWord')], SPACE);
    const [, bar] = pitches([col('start'), col('bar')], SPACE);
    expect(word.pitch).toBeLessThan(next.pitch);
    expect(next.pitch).toBeLessThan(bar.pitch);
  });

  it('lets wide words push their columns apart', () => {
    const [, tight] = pitches([col('start'), col('word')], SPACE);
    const [, wide] = pitches([col('start', 60), col('word', 60)], SPACE);
    expect(wide.pitch).toBeGreaterThan(tight.pitch);
    expect(wide.pitch).toBeGreaterThanOrEqual(60);
  });

  it('stretches the spaces between syllables and words a little, and bars the most', () => {
    const columns = [col('start'), col('word'), col('newWord'), col('word'), col('bar'), col('word')];
    const all = pitches(columns, SPACE);
    const natural = lineCentres(columns, all, 0, 6, 0, false);
    const wide = lineCentres(columns, all, 0, 6, 400, true);
    const step = (xs: number[], i: number) => xs[i] - xs[i - 1];
    expect(step(wide, 1)).toBeGreaterThan(step(natural, 1)); // inside a word: a little
    expect(step(wide, 2)).toBeGreaterThan(step(natural, 2)); // between words: stretches
    expect(step(wide, 4)).toBeGreaterThan(step(natural, 4)); // round a bar: stretches most
    expect(step(wide, 4) - step(natural, 4)).toBeGreaterThan(step(wide, 2) - step(natural, 2));
    // the last line is not stretched
    expect(lineCentres(columns, all, 0, 6, 400, false)).toEqual(natural);
  });

  it('cuts a full line at a phrase bar, and otherwise where the next column would overflow', () => {
    const columns = Array.from({ length: 12 }, (_, i) => col(i === 6 ? 'bar' : 'word'));
    const all = pitches(columns, SPACE);
    const room = 8 * all[1].pitch;
    expect(flowBreaks(columns, all, [6], [6], [], room)).toEqual([6]);
    expect(flowBreaks(columns, all, [], [], [], room).length).toBeGreaterThan(0);
    expect(flowBreaks(columns, all, [], [], [3], 10000)).toEqual([3]);
  });
});
