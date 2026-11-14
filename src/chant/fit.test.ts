import { fitSpace, FULL_SPACE, MIN_SPACE } from './fit';

describe('fitting a staff to a height', () => {
  it('keeps the normal spacing when there is room, or no limit', () => {
    expect(fitSpace(2, 12, 46, 6, 1000)).toBe(FULL_SPACE);
    expect(fitSpace(2, 12, 46, 6, undefined)).toBe(FULL_SPACE);
  });

  it('shrinks the spacing until the staff fits', () => {
    // two systems of 12 steps: height = 2 * (12 * space / 2 + 46) - 6
    const space = fitSpace(2, 12, 46, 6, 250);
    expect(2 * ((12 * space) / 2 + 46) - 6).toBeCloseTo(250, 5);
    expect(space).toBeLessThan(FULL_SPACE);
    expect(space).toBeGreaterThan(MIN_SPACE);
  });

  it('never goes below the smallest readable spacing', () => {
    expect(fitSpace(3, 12, 46, 6, 100)).toBe(MIN_SPACE);
  });
});
