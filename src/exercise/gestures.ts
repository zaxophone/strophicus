import type { Chant } from '../chant/chant';
import { staffPosition } from '../chant/chant';

/**
 * The two halves of a chant gesture: the arsis lifts, the thesis lets go and
 * settles.
 */
export type Gesture = 'arsis' | 'thesis';

export const GESTURES: Gesture[] = ['arsis', 'thesis'];

/**
 * The rule of thumb the lessons teach, applied at each ictus (the notes the
 * chant marks with one; `null` for the notes between): the end of a phrase is
 * always a thesis, a phrase begins with an arsis, an ictus on a note that rises
 * from the note before it is an arsis, and every other ictus is a thesis. A
 * tendency, not a law; it is what the exercises check.
 */
export function ruleGestures(chant: Pick<Chant, 'notes' | 'bars' | 'ictus'>): (Gesture | null)[] {
  return [...chant.notes].map((letter, i) => {
    if (!chant.ictus.includes(i)) return null;
    const endsPhrase = i === chant.notes.length - 1 || chant.bars.includes(i + 1);
    if (endsPhrase) return 'thesis';
    if (i === 0 || chant.bars.includes(i)) return 'arsis';
    return staffPosition(letter) > staffPosition(chant.notes[i - 1]) ? 'arsis' : 'thesis';
  });
}
