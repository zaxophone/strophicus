import { blockSize, FIGURE_CHARS, parseBlock } from './blocks';

describe('instruction blocks', () => {
  it('reads ordinary paragraphs as text', () => {
    expect(parseBlock('Sing it.')).toEqual({ kind: 'text', text: 'Sing it.' });
  });

  it('reads a staff figure with its clef line and notes', () => {
    const block = parseBlock('{{staff; 4; hij}}');
    expect(block.kind).toBe('staff');
    if (block.kind !== 'staff') return;
    expect(block.chant.clefLine).toBe(4);
    expect(block.chant.notes).toBe('hij');
    expect(block.words).toBeUndefined();
  });

  it('reads the symbols written in the notes, and words under them', () => {
    const block = parseBlock('{{staff; 3; h_,g||f; do ti la}}');
    if (block.kind !== 'staff') throw new Error('not a figure');
    expect(block.chant.episemas).toEqual([0]);
    expect(block.chant.ticks).toEqual([1]);
    expect(block.chant.doubles).toEqual([2]);
    expect(block.words).toEqual(['do', 'ti', 'la']);
  });

  it('draws a bare clef when there are no notes', () => {
    const block = parseBlock('{{staff; 2; }}');
    if (block.kind !== 'staff') throw new Error('not a figure');
    expect(block.chant.notes).toBe('');
  });

  it('refuses a figure it cannot draw', () => {
    expect(() => parseBlock('{{staff; 9; hij}}')).toThrow();
    expect(() => parseBlock('{{staff; 4; hij; one two}}')).toThrow();
  });

  it('counts a figure as a fixed amount of text', () => {
    expect(blockSize('{{staff; 4; hij}}')).toBe(FIGURE_CHARS);
    expect(blockSize('twelve chars')).toBe(12);
  });
});
