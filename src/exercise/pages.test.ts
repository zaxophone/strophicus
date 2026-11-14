import { ALL_EXERCISES } from './lessons';
import { PAGE_CHARS, pageChars, paginate } from './pages';

describe('instruction pages', () => {
  it('holds less text on a shorter screen, within limits', () => {
    expect(pageChars(900)).toBe(PAGE_CHARS);
    expect(pageChars(800)).toBeGreaterThan(pageChars(640));
    expect(pageChars(640)).toBeLessThan(300);
    expect(pageChars(400)).toBe(160);
  });

  it('keeps short instructions on one page', () => {
    expect(paginate('One.\n\nTwo.')).toEqual([['One.', 'Two.']]);
  });

  it('starts a new page when the next paragraph would overflow', () => {
    const a = 'a'.repeat(200);
    const b = 'b'.repeat(200);
    const c = 'c'.repeat(100);
    expect(paginate(`${a}\n\n${b}\n\n${c}`, 380)).toEqual([[a], [b, c]]);
  });

  it('keeps a picture on the page with the paragraph that introduces it', () => {
    const a = 'a'.repeat(200);
    const b = 'b'.repeat(200);
    const figure = '{{gabc: (c4) (h) (i) (j)}}';
    // without the rule, b would sit at the end of the first page and its figure would start the next
    expect(paginate(`${a}\n\n${b}\n\n${figure}`, 380)).toEqual([[a], [b, figure]]);
  });

  it('never splits a paragraph, even a long one', () => {
    const long = 'x'.repeat(900);
    expect(paginate(`${long}\n\nshort`, 380)).toEqual([[long], ['short']]);
  });

  it('gives every exercise at least one page and no page more than the limit unless one paragraph is that long', () => {
    for (const e of ALL_EXERCISES) {
      const pages = paginate(e.instructions);
      expect(pages.length).toBeGreaterThan(0);
      for (const page of pages) {
        const size = page.join('').length;
        expect([e.id, page.length === 1 || size <= PAGE_CHARS]).toEqual([e.id, true]);
      }
    }
  });
});
