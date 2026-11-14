import { exercise, Lesson } from '../../exercise/exercise';
import { FRAGMENTS, fragmentExercise } from './lesson6';

// Lesson 7, "Writing and Dancing": the children draw the wavy lines of
// Lesson 6 on paper (workbook pp. 11-14), then sing the seven melodies again
// with movement. The drawing is done on paper, so the app has one page of
// instructions for it and then the seven melodies.
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

export const LESSON_7: Lesson = {
  id: 'wow-7',
  number: 7,
  title: 'Writing and Dancing',
  summary: 'Draw the wavy lines of the last lesson on paper, then sing the seven melodies again.',
  exercises: [
    exercise({
      id: 'wow-7-draw',
      kind: 'read',
      title: 'Draw the wavy lines',
      instructions: `
Now try to draw the wavy lines that appear on pages 9 and 10 of your workbook yourself, on pages 11 and 12. Draw with smooth and continuous motion.

You can draw the same lines one more time at home, on pages 13 and 14. Try to do it even more smoothly. Let your pencil glide across the paper as if it were dancing.

To finish, we will sing the seven melodies again, with movement. Stand up!`,
      source: `${workbook}, pp. 11-14; ${instructor}, Lesson 7, p. 18`,
    }),
    ...FRAGMENTS.map((f) =>
      fragmentExercise(
        f,
        7,
        f.n === 1
          ? `
Sing the first melody again, moving your hand just as you drew the line on paper.`
          : `
Sing melody ${f.n} again, with the same smooth movement.`,
      ),
    ),
  ],
};
