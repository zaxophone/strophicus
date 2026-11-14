import { exercise, Lesson } from '../../exercise/exercise';

// "In the Beginning ...", the instructor edition's introduction for children
// (p. 3). It has no workbook page, so it is only read: the symbols are drawn
// as notation instead of described. The instructor's script is turned into
// text for a student working alone.
const instructor = 'Words with Wings Instructor Edition';

export const LESSON_INTRO: Lesson = {
  id: 'wow-intro',
  title: 'In the Beginning',
  summary: 'What Gregorian chant is, where it got its name, and how its notation looks.',
  exercises: [
    exercise({
      id: 'wow-intro-chant',
      recording: 1,
      title: 'Gregorian chant',
      kind: 'read',
      instructions: `
Gregorian chant is very old music: over a thousand years old. It is music from the Middle Ages, and it is still sung in many monasteries and churches all over the world.

Have you ever heard monks singing in a language you did not know, in a way that sounded a little unusual, like a bird gliding through the air? There is a good chance that what you heard was Gregorian chant.

Why is it called Gregorian? Around the year 600 there was a pope called Gregory, who decided what was to be sung in church. For centuries people thought Gregory himself had composed all the songs. That was not true, but the name stuck.

You will often see Gregory in pictures with a dove near his ear. People said: "Look, that dove is the Holy Spirit, whispering melodies into his ear!"

We will not sing as well as the monks do. After all, they sing chant every day and have practised for many years. But in the lessons to come you will learn to sing it.`,
      source: `${instructor}, "In the Beginning ...", p. 3`,
    }),
    exercise({
      id: 'wow-intro-notation',
      title: 'The staff and the notes',
      kind: 'read',
      instructions: `
You will notice that a Gregorian staff has four lines, not five as is usual. And the notes are not round, but square.

{{gabc: (c4) (g) (h) (i) (h) (g) (f) (g)}}

The sign at the start of the staff is a clef, which means "key". This one is the do clef. It sits on a line, and the note on that line is do.

{{gabc: (c4) do(j)}}

The do clef can sit on other lines too, and then do moves with it.

{{gabc: (c3) do(h)}}

We will sing the names of the notes: do, re, mi, fa, sol, la, ti, and do again. Did you know those names were invented in the Middle Ages?

{{gabc: (c4) do(c) re(d) mi(e) fa(f) sol(g) la(h) ti(i) do(j)}}`,
      source: `${instructor}, "In the Beginning ...", p. 3`,
    }),
  ],
};
