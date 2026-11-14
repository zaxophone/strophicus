import { exercise, Lesson } from '../../exercise/exercise';

// Lesson 5, "For All the Saints (2)": the do clef on the third line again, more
// practice with note names, and the Kyrie that opens and closes the Litany of
// the Saints (workbook p. 7-8). The key tag is [do=a].
// Pitch letters: h is do, g is ti, f is la, e is sol.
const key = 'do=a';
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

export const LESSON_5: Lesson = {
  id: 'wow-5',
  number: 5,
  title: 'For All the Saints (2)',
  summary: 'Practise the note names with the clef on a new line, then sing the Kyrie of the Litany.',
  exercises: [
    exercise({
      id: 'wow-5-1-names',
      title: 'Exercise 1: name the notes',
      kind: 'name',
      given: 4,
      key,
      gabc: '(c3) (h) (g) (f) (e;) (e) (f) (g) (h;) (h) (g) (f) (h;) (h) (f) (f) (e) (f)',
      instructions: `
On which line does the do clef sit in Gregorian chant? That was a trick question. As we have seen, it can be found in different places.

{{gabc: (c3) do(h)}}

Name the notes of the first exercise. The first four are given: do ti la sol. Find do on the clef and count from there.`,
      source: `${workbook}, p. 7, exercise 1; ${instructor}, Lesson 5, p. 13`,
    }),
    exercise({
      id: 'wow-5-1',
      recording: 9,
      title: 'Exercise 1: sing the names',
      key,
      gabc: '(c3) (h) (g) (f) (e;) (e) (f) (g) (h;) (h) (g) (f) (h;) (h) (f) (f) (e) (f)',
      instructions: `
Now sing exercise 1 with the note names. Sing each name, and form the words clearly with your mouth.

At each vertical line, take a breath. The note just before it is sung a little longer.`,
      source: `${workbook}, p. 7, exercise 1; ${instructor}, Lesson 5, p. 13`,
    }),
    exercise({
      id: 'wow-5-2-names',
      title: 'Exercise 2: name the notes',
      kind: 'name',
      given: 1,
      key,
      gabc: '(c3) (h) (f) (f) (f) (f) (e) (f::) (h) (f) (f) (f) (e) (f::) (h) (g) (h) (f) (g) (h)',
      instructions: `
Now name the notes of exercise 2. The first note is given. Each part ends at a double bar.

Take it one part at a time. Find do on the clef and count from there.`,
      source: `${workbook}, p. 7, exercise 2; ${instructor}, Lesson 5, p. 13`,
    }),
    exercise({
      id: 'wow-5-2',
      recording: 10,
      title: 'Exercise 2: sing the names',
      key,
      gabc: '(c3) (h) (f) (f) (f) (f) (e) (f::) (h) (f) (f) (f) (e) (f::) (h) (g) (h) (f) (g) (h)',
      instructions: `
Sing exercise 2 with the note names. Try the first part, up to the double bar, silently to yourself first. Take care to form the words with your mouth while you do.

Then sing it out loud. Do the same with the other two parts.`,
      source: `${workbook}, p. 7, exercise 2; ${instructor}, Lesson 5, p. 13`,
    }),
    exercise({
      id: 'wow-5-3',
      recording: 11,
      title: 'Kyrie eleison',
      key,
      gabc: '(c3) Ký(h)ri(f)e(f) e(f)lé(f)i(e)son.(f::) Chris(h)te,(f) e(f)lé(f)i(e)son.(f::) Ký(h)ri(f)e(f) e(f)lé(f)i(e)son.(f)',
      instructions: `
In the last lesson we sang the names of the saints. Something comes before and after them in the litany, and you have just learned it! The words are Greek: "Kýrie eléison" means "Lord, have mercy". You could also say "Lord, have mercy on me".

Can you guess what "Christe eléison" means? Yes: "Christ, have mercy."

Now sing the Kyrie. You already know this melody: the first two parts are the first two parts of exercise 2, and then the Kyrie comes round once more.`,
      source: `${workbook}, p. 8; ${instructor}, Lesson 5, p. 13–14`,
    }),
    exercise({
      id: 'wow-5-4',
      title: 'Christe, exáudi nos',
      key,
      gabc: '(c3) Chris(h)te,(g) ex(h)áu(f)di(g) nos.(h)',
      instructions: `
The piece that ends the litany means "Christ, hear us". You could also say "Christ, hear our prayer."

It is the third part of exercise 2. Sing it: the accent on "áu" is the note with wings.

In church the litany is much longer: at the Easter Vigil we recall our own baptisms, and the Litany of the Saints is sung. What you have learned is the beginning, the ending, and the pattern of every call in between.`,
      source: `${workbook}, p. 8; ${instructor}, Lesson 5, p. 14`,
    }),
  ],
};
