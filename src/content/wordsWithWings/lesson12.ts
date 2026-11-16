import { exercise, Lesson } from '../../exercise/exercise';
import { GLORIA, KYRIE, MELODIES } from './lesson11';

// Lesson 12, "The Ten-Stringed Lute": a second Latin sentence, "In psaltério
// decachórdo psallam tibi", sung on one note and then with a descent and groups of
// two notes. Workbook pp. 22-23. Read from the instructor edition p. 33-35 (clef on
// the top line: do is j, la is h, sol is g, fa is f). The sentence has 13
// syllables: In psal-té-ri-o de-ca-cór-do psal-lam ti-bi.
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

/** The sentence with the notes for the syllables from "psal" (the 10th) to the end; the first nine are la. */
const psalterio = (tail: [string, string, string, string]): string =>
  `(c4) In(h) psal(h)té(h)ri(h)o(h) de(h)ca(h)cór(h)do(h) psal(${tail[0]})lam(${tail[1]}) ti(${tail[2]})bi.(${tail[3]})`;

const DEUS_6 = MELODIES[5];

const SENTENCES: { n: number; gabc: string; intro: string }[] = [
  {
    n: 1,
    gabc: psalterio(['h', 'h', 'h', 'h']),
    intro: 'First we sing it all on one note: la, thirteen times.',
  },
  {
    n: 2,
    gabc: psalterio(['h', 'h', 'g', 'f']),
    intro:
      'Do you remember that we started the previous sentence on a lower note, as if a bird were ascending? To balance that first sentence, let the melody descend toward the end: "tibi" goes down to sol and then fa.',
  },
  {
    n: 3,
    gabc: psalterio(['h', 'g', 'h', 'gf']),
    intro:
      'Now let us add an accent to the word "tibi", but one that goes up. By going down on "psallam", the melody can rise again on "tibi". After "tibi" it descends again, so that it ends on the right note. The last syllable has a group of two notes, going down: sing them smoothly together (legato).',
  },
  {
    n: 4,
    gabc: psalterio(['g', 'f', 'gh', 'gf']),
    intro:
      'We can make it even better. If we go down even further, we can have two groups of two notes that are bound together: "ti" goes up on a group of two notes, and "bi" comes down on another. Draw the line of each group in the air as you sing it.',
  },
];

export const LESSON_12: Lesson = {
  id: 'wow-12',
  number: 12,
  title: 'The Ten-Stringed Lute',
  summary: 'Sing a second Latin sentence on one note, then with groups of two notes, and join two sentences.',
  exercises: [
    exercise({
      id: 'wow-12-kyrie',
      title: 'Warm-up: name the notes',
      kind: 'name',
      given: 2,
      key: 'do=a/b-flat/b',
      gabc: KYRIE,
      instructions: `
Let us begin the lesson. This is the Kyrie eleison you sang last time. The first two notes are given: do and la. Can you name the rest? Remember that the clef is on the third line.`,
      source: `${instructor}, Lesson 12, p. 33`,
    }),
    exercise({
      id: 'wow-12-review',
      recording: 32,
      title: 'What we learned last time',
      key: DEUS_6.key,
      gabc: DEUS_6.gabc,
      instructions: `
This is what we learned in the previous lesson: "Deus, canticum novum cantabo tibi", with a group of two notes on "us". Sing it again.`,
      source: `${workbook}, p. 22 (top); ${instructor}, Lesson 12, p. 33`,
    }),
    exercise({
      id: 'wow-12-text',
      recording: 33,
      title: 'Another sentence',
      kind: 'read',
      instructions: `
Here is another short sentence. It actually goes with the previous one: "In psaltério decacórdo psallam tibi." Press Hear the choir to hear it spoken.

in = on
psaltério = psalterio (a sort of lute)
decacórdo = with ten strings
psallam = I will sing
tibi = for you

It can be translated as: "I will sing for you on the ten-stringed lute."`,
      source: `${instructor}, Lesson 12, p. 33`,
    }),
    ...SENTENCES.map((m) =>
      exercise({
        id: `wow-12-${m.n}`,
        recording: 33 + m.n,
        title: `Melody ${m.n}`,
        key: 'la=a',
        gabc: m.gabc,
        instructions: m.intro,
        source: `${workbook}, p. ${m.n <= 2 ? 22 : 23}, melody ${m.n}; ${instructor}, Lesson 12, p. ${m.n <= 2 ? 34 : m.n === 3 ? 34 : 35}`,
      }),
    ),
    exercise({
      id: 'wow-12-both',
      recording: 38,
      title: 'Both sentences',
      key: 'fa=f',
      gabc: '(c4) De(f)us,(gh) cán(h)ti(h)cum(h) no(h)vum(h) can(h)tá(ix)bo(h) ti(g)bi:(h:)(z) in(h) psal(h)té(h)ri(h)o(h) de(h)ca(h)cór(h)do(h) psal(g)lam(f) ti(gh)bi.(gf)',
      instructions: `
Now sing both sentences, one after the other. At the asterisk (*) after "tibi", wait and take a quiet breath before beginning the second half.

Do you see the half of a note at the end of the first line? It is standing guard. It lets you know what the first note of the next line is, so that you will not be mistaken. You do not have to sing that half of a note!`,
      source: `${workbook}, p. 23 (bottom two lines); ${instructor}, Lesson 12, p. 35`,
    }),
    exercise({
      id: 'wow-12-gloria',
      recording: 18,
      title: 'Et in terra pax',
      key: 'mi=f-sharp/g/g-sharp',
      gabc: GLORIA,
      instructions: `
We end the lesson as we did the last one, with "Et in terra pax hominibus bonae voluntatis". I wonder whether you wrote the correct note names at home (workbook, page 21). They are: mi, sol, la, la, sol, la, ti, la, la, then la, la, sol, la, sol, mi.

Sing it along with the choir.`,
      source: `${workbook}, p. 21; ${instructor}, Lesson 12, p. 35-36`,
    }),
  ],
};
