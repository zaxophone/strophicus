import type { Exercise } from './exercise';

/** Where a student is in a naming exercise. */
export interface NamingState {
  /** The syllable chosen for each note, or null while it is unnamed. */
  named: (string | null)[];
  /** The note being named, or null once all are named. */
  selected: number | null;
  /** The latest wrong answer, shown until the next try. */
  wrong: { index: number; guess: string } | null;
  mistakes: number;
}

const firstUnnamed = (named: (string | null)[], from = 0): number | null => {
  for (let k = 0; k < named.length; k++) {
    const i = (from + k) % named.length;
    if (named[i] === null) return i;
  }
  return null;
};

export function startNaming(exercise: Pick<Exercise, 'labels' | 'given'>): NamingState {
  const named = exercise.labels.map((label, i) => (i < exercise.given ? label : null));
  return { named, selected: firstUnnamed(named), wrong: null, mistakes: 0 };
}

/**
 * Where a student is at the start of an exercise that asks for an answer only at
 * some notes (`null` answers are skipped: they start out settled, with an empty answer).
 */
export function startMarking(answers: (string | null)[]): NamingState {
  const named = answers.map((a) => (a === null ? '' : null));
  return { named, selected: firstUnnamed(named), wrong: null, mistakes: 0 };
}

/** Chooses which note to name next; named notes stay as they are. */
export function selectNote(state: NamingState, index: number): NamingState {
  if (state.named[index] !== null) return state;
  return { ...state, selected: index, wrong: null };
}

/**
 * Tries a syllable for the selected note. A right one names it and moves on to
 * the next unnamed note; a wrong one is remembered so it can be explained.
 */
export function nameNote(
  state: NamingState,
  exercise: Pick<Exercise, 'labels'>,
  guess: string,
): NamingState {
  const i = state.selected;
  if (i === null) return state;
  if (exercise.labels[i] !== guess) {
    return { ...state, wrong: { index: i, guess }, mistakes: state.mistakes + 1 };
  }
  const named = state.named.map((n, k) => (k === i ? guess : n));
  return { named, selected: firstUnnamed(named, i + 1), wrong: null, mistakes: state.mistakes };
}

export function allNamed(state: NamingState): boolean {
  return state.named.every((n) => n !== null);
}
