import { exercise } from './exercise';
import { allNamed, nameNote, selectNote, startNaming } from './naming';

// do re mi re do on the second-line clef
const e = exercise({ id: 'n', title: 'n', notes: 'fghgf', kind: 'name', given: 1, instructions: 'x' });

describe('naming the notes', () => {
  it('starts with the given notes named and the first other note selected', () => {
    const s = startNaming(e);
    expect(s.named).toEqual(['do', null, null, null, null]);
    expect(s.selected).toBe(1);
  });

  it('moves on after a right answer', () => {
    const s = nameNote(startNaming(e), e, 're');
    expect(s.named).toEqual(['do', 're', null, null, null]);
    expect(s.selected).toBe(2);
    expect(s.mistakes).toBe(0);
  });

  it('keeps the note and counts a mistake after a wrong answer', () => {
    const s = nameNote(startNaming(e), e, 'fa');
    expect(s.named[1]).toBeNull();
    expect(s.selected).toBe(1);
    expect(s.wrong).toEqual({ index: 1, guess: 'fa' });
    expect(s.mistakes).toBe(1);
    expect(nameNote(s, e, 're').wrong).toBeNull();
  });

  it('lets the student pick any unnamed note, then comes back to the ones before it', () => {
    let s = selectNote(startNaming(e), 3);
    expect(s.selected).toBe(3);
    s = nameNote(s, e, 're');
    expect(s.selected).toBe(4);
    s = nameNote(s, e, 'do');
    // wraps round to the earliest unnamed note
    expect(s.selected).toBe(1);
  });

  it('ignores a tap on a note that is already named', () => {
    const s = startNaming(e);
    expect(selectNote(s, 0)).toBe(s);
  });

  it('is finished when every note is named', () => {
    let s = startNaming(e);
    for (const name of ['re', 'mi', 're', 'do']) s = nameNote(s, e, name);
    expect(allNamed(s)).toBe(true);
    expect(s.selected).toBeNull();
    expect(nameNote(s, e, 'do')).toBe(s);
  });
});
