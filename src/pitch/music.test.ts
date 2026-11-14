import { lockNote } from './music';

describe('lockNote', () => {
  it('picks the nearest note to start', () => {
    expect(lockNote(null, 57.3)).toBe(57);
    expect(lockNote(null, null)).toBeNull();
  });

  it('sticks with the note near the boundary between two', () => {
    expect(lockNote(57, 57.55)).toBe(57);
    expect(lockNote(57, 57.64)).toBe(57);
  });

  it('moves on once the pitch is clearly on the neighbour', () => {
    expect(lockNote(57, 57.7)).toBe(58);
    expect(lockNote(57, 56.3)).toBe(56);
  });

  it('forgets the note when nothing is sung', () => {
    expect(lockNote(57, null)).toBeNull();
  });
});
