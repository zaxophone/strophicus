import type { Lesson } from '../exercise/exercise';
import {
  canMoveTo,
  isPassed,
  isUnlocked,
  lessonProgress,
  markPassed,
  nextExerciseIndex,
  parseProgress,
  resumePoint,
} from './progress';

const lesson = (id: string, count: number): Lesson => ({
  id,
  title: id,
  summary: '',
  exercises: Array.from({ length: count }, (_, i) => ({ id: `${id}-${i}` }) as Lesson['exercises'][number]),
});

const A = lesson('a', 3);
const B = lesson('b', 2);

describe('markPassed', () => {
  it('records a pass and keeps the first time', () => {
    const once = markPassed({}, 'a-0', 100);
    expect(once).toEqual({ 'a-0': 100 });
    expect(markPassed(once, 'a-0', 999)).toBe(once);
    expect(isPassed(once, 'a-0')).toBe(true);
    expect(isPassed(once, 'a-1')).toBe(false);
  });

  it('does not change the progress it was given', () => {
    const before = { 'a-0': 1 };
    markPassed(before, 'a-1', 2);
    expect(before).toEqual({ 'a-0': 1 });
  });
});

describe('lessonProgress', () => {
  it('counts what is done', () => {
    expect(lessonProgress(A, {})).toEqual({ done: 0, total: 3, complete: false });
    expect(lessonProgress(A, { 'a-0': 1, 'a-2': 2 })).toEqual({ done: 2, total: 3, complete: false });
    expect(lessonProgress(B, { 'b-0': 1, 'b-1': 2 }).complete).toBe(true);
  });
});

describe('nextExerciseIndex and isUnlocked', () => {
  it('starts at the first exercise', () => {
    expect(nextExerciseIndex(A, {})).toBe(0);
    expect(isUnlocked(A, 0, {})).toBe(true);
    expect(isUnlocked(A, 1, {})).toBe(false);
  });

  it('opens one more exercise each time one is passed', () => {
    const p = { 'a-0': 1 };
    expect(nextExerciseIndex(A, p)).toBe(1);
    expect(isUnlocked(A, 1, p)).toBe(true);
    expect(isUnlocked(A, 2, p)).toBe(false);
  });

  it('keeps earlier exercises open and everything open once finished', () => {
    const done = { 'a-0': 1, 'a-1': 2, 'a-2': 3 };
    expect(nextExerciseIndex(A, done)).toBe(2);
    for (const i of [0, 1, 2]) expect(isUnlocked(A, i, done)).toBe(true);
  });

  it('depends on the first gap, not how many are passed', () => {
    expect(isUnlocked(A, 2, { 'a-1': 5 })).toBe(false);
  });
});

describe('canMoveTo', () => {
  const progress = { 'a-0': 1, 'a-1': 2 };

  it('always lets the student go back', () => {
    expect(canMoveTo(A, 2, 1, false, progress)).toBe(true);
    expect(canMoveTo(A, 1, 0, false, {})).toBe(true);
  });

  it('only lets them go forward from an exercise they have passed', () => {
    // exercise 2 has not been passed, on this visit or before
    expect(canMoveTo(A, 2, 3, false, progress)).toBe(false);
    expect(canMoveTo(A, 1, 2, true, { 'a-0': 1 })).toBe(true);
  });

  it('counts an exercise passed on an earlier visit', () => {
    // exercise 0 and 1 were passed before; no need to sing them again to go on
    expect(canMoveTo(A, 0, 1, false, progress)).toBe(true);
    expect(canMoveTo(A, 1, 2, false, progress)).toBe(true);
  });

  it('can jump ahead to exercises already passed', () => {
    const done = { 'a-0': 1, 'a-1': 2, 'a-2': 3 };
    expect(canMoveTo(A, 0, 2, false, done)).toBe(true);
  });

  it('never skips past an exercise that has not been unlocked', () => {
    expect(canMoveTo(A, 0, 2, true, { 'a-0': 1 })).toBe(false);
    expect(canMoveTo(A, 0, 1, true, { 'a-0': 1 })).toBe(true);
  });

  it('stays put for the same or a missing exercise', () => {
    expect(canMoveTo(A, 1, 1, true, progress)).toBe(false);
    expect(canMoveTo(A, 2, 3, true, progress)).toBe(false); // there is no fourth exercise
    expect(canMoveTo(A, 0, -1, true, progress)).toBe(false);
  });
});

describe('resumePoint', () => {
  it('is null before starting and after finishing everything', () => {
    expect(resumePoint([A, B], {})).toBeNull();
    const all = { 'a-0': 1, 'a-1': 2, 'a-2': 3, 'b-0': 4, 'b-1': 5 };
    expect(resumePoint([A, B], all)).toBeNull();
  });

  it('continues the lesson last worked on', () => {
    expect(resumePoint([A, B], { 'a-0': 1 })).toEqual({ lessonIndex: 0, exerciseIndex: 1 });
    expect(resumePoint([A, B], { 'a-0': 1, 'b-0': 2 })).toEqual({ lessonIndex: 1, exerciseIndex: 1 });
  });

  it('moves on to the first unfinished lesson when that one is complete', () => {
    const p = { 'a-0': 1, 'a-1': 2, 'a-2': 3 };
    expect(resumePoint([A, B], p)).toEqual({ lessonIndex: 1, exerciseIndex: 0 });
  });
});

describe('parseProgress', () => {
  it('reads saved progress and ignores junk', () => {
    expect(parseProgress('{"a-0":12,"b":"x","c":null}')).toEqual({ 'a-0': 12 });
    expect(parseProgress('not json')).toEqual({});
    expect(parseProgress('[1,2]')).toEqual({});
    expect(parseProgress('null')).toEqual({});
  });
});
