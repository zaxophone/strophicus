import { exercise, Lesson } from '../../exercise/exercise';

// Lesson 4, "For All the Saints (1)": the first line of the Litany of the
// Saints, "Sancte Gregori, ora pro nobis". The do clef now sits on the third
// line, so do is the note on that line (h): the book's key tag is [do=a].
// Pitch letters: h is do, i is re, g is ti, f is la.
//
// The words are split into one per note, since the app labels each note:
// "Sancte" is two syllables and is printed here as "Sanc- te".
const key = 'do=a';
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

export const LESSON_4: Lesson = {
  id: 'wow-4',
  number: 4,
  title: 'For All the Saints (1)',
  summary: 'Sing the first line of the Litany of the Saints, and learn where the accent goes.',
  exercises: [
    exercise({
      id: 'wow-4-wings',
      recording: 8,
      title: 'The note with wings',
      kind: 'accent',
      key,
      gabc: '(c3) Sanc(h)te(h) Gre(h)gó(i)ri,(g)',
      answer: 3,
      instructions: `
A litany is a prayer made of many short calls, each one answered. In the Litany of the Saints we call on the saints by name, and the answer is the same every time: "pray for us".

Let us begin with Saint Gregory, who gave Gregorian chant its name. In Latin his name is "Sancte Gregóri". Tap Hear it and listen to it.

Which note has wings? Which word does the melody go up on? Look for the accent mark over the vowel: that syllable is emphasised, so the melody goes up there.`,
      source: `${workbook}, p. 6; ${instructor}, Lesson 4, p. 11`,
    }),
    exercise({
      id: 'wow-4-1',
      recording: 8,
      title: 'Sancte Gregóri, ora pro nobis',
      key,
      gabc: '(c3) Sanc(h)te(h) Gre(h)gó(i)ri,(g::) o(g)ra(f) pro(g) no(h)bis.(h)',
      instructions: `
Now sing the whole line. It means: "St. Gregory, pray for us."

Look at the clef. Do you see that it is in a different place than it was in the last lesson?

{{gabc: (c3) Sanc(h)te(h) Gre(h)gó(i)ri,(g)}}

The clef is now on the third line, so the note on that line is do. This is a double bar. It ends the first phrase, and you take a breath there.

With Gregorian chant, the clef can be in different places. Find do on the clef and the other notes follow from it.`,
      source: `${workbook}, p. 6; ${instructor}, Lesson 4, p. 11–12`,
    }),
    exercise({
      id: 'wow-4-2-names',
      title: 'Name the notes of "ora pro nobis"',
      kind: 'name',
      key,
      gabc: '(c3) o(g)ra(f) pro(g) no(h)bis.(h)',
      instructions: `
What are the names of the notes of "ora pro nobis"? The words are written under the notes. Find do on the clef, then count the steps up or down to each note.

Tap a note, then choose its name.`,
      source: `${instructor}, Lesson 4, p. 11`,
    }),
    exercise({
      id: 'wow-4-2',
      title: 'Sancte Bonefáti, ora pro nobis',
      key,
      gabc: '(c3) Sanc(h)te(h) Bo(h)ne(h)fá(i)ti,(g::) o(g)ra(f) pro(g) no(h)bis.(h)',
      instructions: `
In the workbook you write the name of a saint you chose, and its notes. Here is how. These four rules fit every name:

1. The first two notes are already there: they are "Sancte" (or "Sancta" for a woman).
2. Each syllable gets one note.
3. On the accented syllable, go up (to re).
4. On the syllables after the accented one, go down (to ti).

Here is "Sancte Bonefáti" (St. Boniface), made with those rules. The accent is on "fá". Sing it, and let the rules tell you where each note goes.`,
      source: `${workbook}, p. 6; ${instructor}, Lesson 4, p. 11–12 and Appendix, p. 67`,
    }),
  ],
};
