import type { Lesson } from '../exercise/exercise';

/** Exercises the student has passed, by id, with when they first did. */
export type Progress = Record<string, number>;

export function isPassed(progress: Progress, id: string): boolean {
  return id in progress;
}

/** Records a pass; the first time is kept if it was passed before. */
export function markPassed(progress: Progress, id: string, at: number): Progress {
  return id in progress ? progress : { ...progress, [id]: at };
}

export interface LessonProgress {
  done: number;
  total: number;
  complete: boolean;
}

export function lessonProgress(lesson: Lesson, progress: Progress): LessonProgress {
  const total = lesson.exercises.length;
  const done = lesson.exercises.filter((e) => isPassed(progress, e.id)).length;
  return { done, total, complete: done === total };
}

/**
 * Index of the exercise the student should do next in a lesson: the first one
 * not yet passed, or the last one if they have passed them all.
 */
export function nextExerciseIndex(lesson: Lesson, progress: Progress): number {
  const first = lesson.exercises.findIndex((e) => !isPassed(progress, e.id));
  return first === -1 ? lesson.exercises.length - 1 : first;
}

/**
 * Where to start a lesson opened from the home page: at its beginning once it has been
 * passed all the way through, otherwise at the next exercise still to do.
 */
export function startIndex(lesson: Lesson, progress: Progress): number {
  return lessonProgress(lesson, progress).complete ? 0 : nextExerciseIndex(lesson, progress);
}

/**
 * Whether a lesson can be opened: the first always, and each of the others once the one before
 * it has been passed. A lesson already begun stays open, so progress made before lessons were
 * locked is not lost. Pieces of repertoire are never locked.
 */
export function isLessonUnlocked(lessons: Lesson[], index: number, progress: Progress): boolean {
  const lesson = lessons[index];
  if (lesson.free || index === 0) return true;
  if (lessonProgress(lessons[index - 1], progress).complete) return true;
  return lesson.exercises.some((e) => isPassed(progress, e.id));
}

/**
 * Whether an exercise can be opened: any up to and including the next one to
 * do. Later ones stay closed until the ones before them are passed.
 */
export function isUnlocked(lesson: Lesson, index: number, progress: Progress): boolean {
  // a lesson passed all the way through can be visited in any order
  if (lesson.free || lessonProgress(lesson, progress).complete) return true;
  const first = lesson.exercises.findIndex((e) => !isPassed(progress, e.id));
  return first === -1 || index <= first;
}

/**
 * Whether the student may go from one exercise to another. Going back is
 * always fine. Going forward needs the exercise they are on to have been sung
 * correctly, either this visit or on an earlier one, and the target to be
 * unlocked, so an exercise that has not been passed can never be skipped.
 */
export function canMoveTo(
  lesson: Lesson,
  from: number,
  to: number,
  clearedNow: boolean,
  progress: Progress,
): boolean {
  if (to < 0 || to >= lesson.exercises.length || to === from) return false;
  if (lesson.free || lessonProgress(lesson, progress).complete) return true;
  if (to < from) return true;
  // An exercise just sung right counts at once, before its pass is saved.
  const current = lesson.exercises[from].id;
  const known = clearedNow ? markPassed(progress, current, 0) : progress;
  return isPassed(known, current) && isUnlocked(lesson, to, known);
}

export interface ResumePoint {
  lessonIndex: number;
  exerciseIndex: number;
}

/**
 * Where to pick up: the unfinished exercise in the lesson the student last
 * passed something in, or else the first unfinished one anywhere. Null if the
 * student hasn't started, or has finished everything.
 */
export function resumePoint(lessons: Lesson[], progress: Progress): ResumePoint | null {
  let latest: { lessonIndex: number; at: number } | null = null;
  lessons.forEach((lesson, lessonIndex) => {
    for (const e of lesson.exercises) {
      const at = progress[e.id];
      if (at !== undefined && (latest === null || at > latest.at)) latest = { lessonIndex, at };
    }
  });
  if (latest === null) return null;

  const open = (lessonIndex: number) => {
    const exerciseIndex = lessons[lessonIndex].exercises.findIndex((e) => !isPassed(progress, e.id));
    return exerciseIndex === -1 ? null : { lessonIndex, exerciseIndex };
  };
  const same = open((latest as { lessonIndex: number }).lessonIndex);
  if (same) return same;
  for (let i = 0; i < lessons.length; i++) {
    const found = open(i);
    if (found) return found;
  }
  return null;
}

/** Reads saved progress, ignoring anything that isn't an id with a time. */
export function parseProgress(text: string): Progress {
  try {
    const raw = JSON.parse(text);
    const out: Progress = {};
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      for (const [id, at] of Object.entries(raw)) {
        if (typeof at === 'number' && Number.isFinite(at)) out[id] = at;
      }
    }
    return out;
  } catch {
    return {};
  }
}
