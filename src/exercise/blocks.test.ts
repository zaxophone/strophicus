import { blockSize, FIGURE_CHARS, parseBlock } from './blocks';

describe('instruction blocks', () => {
  it('reads ordinary paragraphs as text', () => {
    expect(parseBlock('Sing it.')).toEqual({ kind: 'text', text: 'Sing it.' });
  });

  it('reads a staff figure with its clef line and notes', () => {
    const block = parseBlock('{{gabc: (c4) (h) (i) (j)}}');
    expect(block.kind).toBe('staff');
    if (block.kind !== 'staff') return;
    expect(block.chant.clefLine).toBe(4);
    expect(block.chant.notes).toBe('hij');
    expect(block.words).toBeUndefined();
  });

  it('reads the symbols written in the notes, and words under them', () => {
    const block = parseBlock('{{gabc: (c3) do(h_,) ti(g::) la(f)}}');
    if (block.kind !== 'staff') throw new Error('not a figure');
    expect(block.chant.episemas).toEqual([0]);
    expect(block.chant.ticks).toEqual([1]);
    expect(block.chant.doubles).toEqual([2]);
    expect(block.words).toEqual(['do', 'ti', 'la']);
  });

  it('draws a bare clef when there are no notes', () => {
    const block = parseBlock('{{gabc: (c2)}}');
    if (block.kind !== 'staff') throw new Error('not a figure');
    expect(block.chant.notes).toBe('');
  });

  it('refuses a figure it cannot draw', () => {
    expect(() => parseBlock('{{gabc: (c9) (h) (i) (j)}}')).toThrow();
    expect(() => parseBlock('{{gabc: (c4) one(h) (i) (j)}}')).toThrow();
  });

  it('counts a figure as a fixed amount of text', () => {
    expect(blockSize('{{gabc: (c4) (h) (i) (j)}}')).toBe(FIGURE_CHARS);
    expect(blockSize('twelve chars')).toBe(12);
  });
});
