import { exercise, Lesson } from '../../exercise/exercise';

// Lesson 2, "Come, let us ring out our joy to the LORD": the same ten words
// sung to three melodies, each giving a different word its wings. The books print
// the do clef on the top line, so the first note is on the line below it: la,
// and the key tag is [la=a]. Workbook p. 2 marks the longer notes with a line
// over the note (episema) and a dot; p. 3 sings the same melodies with a short
// tick (divisio minima) after "Come" instead. The pitches are the same.
//
// Pitch letters: j is do (the clef line), i is ti, h is la, g is sol.
const key = 'la=a';
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

// Each melody as gabc, in the two notations the workbook prints: p. 2 has a line over "Come"
// (an episema) and a dot after the last note; p. 3 has a short tick (divisio minima) after "Come".
const melodies = [
  // joy, to and the are all the high note; "joy" is where it first goes up
  {
    answer: 6,
    word: 'joy',
    lined: '(c4) Come,(h_) let(h) us(h) ring(h) out(g) our(h) joy(i) to(i) the(i) LORD!(h.)',
    ticked: '(c4) Come,(h,) let(h) us(h) ring(h) out(g) our(h) joy(i) to(i) the(i) LORD!(h)',
  },
  {
    answer: 5,
    word: 'our',
    lined: '(c4) Come,(h_) let(h) us(h) ring(g) out(h) our(i) joy(h) to(h) the(g) LORD!(h.)',
    ticked: '(c4) Come,(h,) let(h) us(h) ring(g) out(h) our(i) joy(h) to(h) the(g) LORD!(h)',
  },
  {
    answer: 9,
    word: 'LORD',
    lined: '(c4) Come,(h_) let(h) us(h) ring(h) out(h) our(h) joy(h) to(g) the(h) LORD!(i.)',
    ticked: '(c4) Come,(h,) let(h) us(h) ring(h) out(h) our(h) joy(h) to(g) the(h) LORD!(i)',
  },
];

export const LESSON_2: Lesson = {
  id: 'wow-2',
  number: 2,
  title: 'Come, Let Us Ring Out Our Joy to the LORD',
  summary: 'Sing a sentence, find the word with wings, and meet the signs for a longer note.',
  exercises: [
    ...melodies.map(({ lined, answer }, i) =>
      exercise({
        id: `wow-2-${i + 1}-which`,
        // the book's recordings 2, 3 and 4 are these melodies, in either notation
        recording: i + 2,
        title: `Melody ${i + 1}: which word?`,
        kind: 'accent',
        key,
        gabc: lined,
        answer,
        instructions:
          i === 0
            ? `
In the last lesson you made your voice go up on a word you found important. Now we will do something different. The next three melodies all have the same words:

**Come, let us ring out our joy to the LORD.**

Can you figure out which word is the most important in each melody: **our**, **joy** or **LORD**? Tap Hear it and listen. How can you tell? The note goes up, so a word is made more important.

Ignore the little line over the first note and the dot after the last for now. You will meet them soon.`
            : i === 1
              ? `
Here is the second melody. Listen to it, and tap the word that sounds most important.`
              : `
Here comes the last one. Listen, and tap the word that sounds most important.`,
        source: `${workbook}, p. 2, melody ${i + 1}; ${instructor}, Lesson 2, p. 6–7`,
      }),
    ),
    ...melodies.map(({ lined, word }, i) =>
      exercise({
        id: `wow-2-${i + 1}`,
        // the book's recordings 2, 3 and 4 are these melodies, in either notation
        recording: i + 2,
        title: `Melody ${i + 1}: sing it`,
        key,
        gabc: lined,
        instructions:
          i === 0
            ? `
Did you see that there are different ways to make a note longer? Look at the first note, over **Come**. It has a short horizontal line above it. This line is called an episema.

{{gabc: (c4) Come(h_)}}

The last note, over **LORD**, has a dot after it.

{{gabc: (c4) LORD(h.)}}

In both cases the note is sung a little longer. Listen to how strange it sounds if you say **Come, let us ring out our joy to the LORD** with **come** made short, or with the last word not lengthened. That longer note is there for a reason!

Now we're going to try singing ourselves! Begin on any comfortable note.`
            : `
Now sing melody ${i + 1}, with **${word}** given its wings. Remember the line over **Come** and the dot after the last note: both are a little longer.`,
        source: `${workbook}, p. 2, melody ${i + 1}; ${instructor}, Lesson 2, p. 6–7`,
      }),
    ),
    ...melodies.map(({ ticked }, i) =>
      exercise({
        id: `wow-2-${i + 1}-tick`,
        // the book's recordings 2, 3 and 4 are these melodies, in either notation
        recording: i + 2,
        title: `Melody ${i + 1}, with a tick`,
        key,
        gabc: ticked,
        instructions:
          i === 0
            ? `
Let us sing the three melodies again. The notation is different now, but it still shows that some notes are longer than others.

Do you see the tick above the staff after **Come**? It is the same comma you would see in the text: the note before it is sung a little longer. This sign is called a divisio minima. You take no breath at it.

{{gabc: (c4) Come,(h,) let(h) us(h) ring(h)}}

Sing the first melody again.`
            : `
Sing melody ${i + 1} again. The tick after **Come** asks for a little more time on that note, with no breath.`,
        source: `${workbook}, p. 3, melody ${i + 1}; ${instructor}, Lesson 2, p. 8`,
      }),
    ),
  ],
};
