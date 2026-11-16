import { exercise, Lesson } from '../../exercise/exercise';

// Lesson 13, "The First Note": groups of three notes, and the fa clef. The fa clef
// (f3 in gabc) stands on the third line: that line is fa, so the line below it is
// re, which the book calls "the first note" of chant. Letters: h is fa, g is mi,
// f is re, e is do, i is sol, and so on. Workbook pp. 24-25, read from the
// instructor edition p. 37-39.
//
// Pitches of every staff were read from 350-500 dpi crops. The fa clef sits on the
// third of the four lines, and each melody has a torculus (low, high, low) or a
// porrectus (high, low, high) on each syllable.
const key = 're=f';
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

interface Phrase {
  n: number;
  recording: number;
  gabc: string;
  intro: string;
}

const MELODIES: Phrase[] = [
  {
    n: 1,
    recording: 39,
    gabc: '(f3) Nu(fgf;) nu(ghg;) nu(hih;) nu(ghg;) nu(fgf)',
    intro: `
In previous lessons we saw groups of two notes. Now we will learn groups of three notes. Look at melody 1 on page 24 of your workbook. The clef has a new look: this is the fa clef. What is the name of the first note? Re. In Gregorian chant it is the first of all notes.

Each group goes up on the middle note, and comes back down. Sing it with "nu", and take a short pause at each bar. Then try it again, singing all the notes smoothly together.`,
  },
  {
    n: 2,
    recording: 40,
    gabc: '(f3) Nu(fgf) nu(ghg) nu(hih) nu(ghg) nu(f)',
    intro: `
Now sing this in one long breath. Trace each of the groups in the air as you sing (workbook, page 24).`,
  },
  {
    n: 3,
    recording: 41,
    gabc: '(f3) Nu(fef;) nu(gfg;) nu(hgh;) nu(gfg;) nu(fef)',
    intro: `
There are also groups of three notes that do the opposite: they go down on the middle note. They have their own look. Sing after me. Trace them in the air like this: a short line down, then up (workbook, page 24).`,
  },
  {
    n: 4,
    recording: 42,
    gabc: '(f3) Nu(fef) nu(gfg) nu(hgh) nu(gfg) nu(f)',
    intro: `
So now, in one breath, sing the groups that go down in the middle.`,
  },
];

/** The three short phrases of the puzzler on workbook p. 25: sung "on nu", in some order. */
const PUZZLE: Phrase[] = [
  { n: 1, recording: 43, gabc: '(f3) (f) (g) (hih) (gf)', intro: 'Phrase A' },
  { n: 2, recording: 44, gabc: '(f3) (f) (h;) (ihi) (hg) (f)', intro: 'Phrase B' },
  { n: 3, recording: 45, gabc: '(f3) (fhg) (eg) (f)', intro: 'Phrase C' },
];

export const LESSON_13: Lesson = {
  id: 'wow-13',
  number: 13,
  title: 'The First Note',
  summary: 'Meet the fa clef and groups of three notes, and sing a short Alleluia.',
  exercises: [
    exercise({
      id: 'wow-13-intro',
      title: 'The first note',
      kind: 'read',
      instructions: `
In Gregorian chant, re is considered the first note (rather than do). This is the same note we sang when we began Puer natus in Bethlehem!

In the next melodies you will see a new clef: the fa clef. It stands on the third line, and that line is fa. The note on the line below it is re, the first note.

{{gabc: (f3) (e) (f) (g) (h)}}

Do (the lowest of these notes), re, mi, fa: the notes on this staff go up from the bottom.`,
      source: `${instructor}, Lesson 13, p. 37`,
    }),
    ...MELODIES.map((m) =>
      exercise({
        id: `wow-13-${m.n}`,
        recording: m.recording,
        title: `Melody ${m.n}`,
        key,
        gabc: m.gabc,
        instructions: m.intro.trim(),
        source: `${workbook}, p. 24, melody ${m.n}; ${instructor}, Lesson 13, p. 37-38`,
      }),
    ),
    ...PUZZLE.map((p) =>
      exercise({
        id: `wow-13-puzzle-${p.n}`,
        recording: p.recording,
        title: p.intro,
        key,
        gabc: p.gabc,
        instructions:
          p.n === 1
            ? `
Here is a puzzler on page 25 of your workbook: three short phrases, A, B and C, that are sung one after the other. This is phrase A. Sing it on "nu". Hear the choir, and find out which of the three it is.`
            : `
This is phrase ${p.intro.slice(-1)}. Sing it on "nu", and notice which kinds of groups it has.`,
        source: `${workbook}, p. 25; ${instructor}, Lesson 13, p. 38`,
      }),
    ),
    exercise({
      id: 'wow-13-alleluia-1',
      recording: 46,
      title: 'A short Alleluia',
      key: 'do=e-flat',
      gabc: '(f3) Al(ef)le(f)lú(fgf)ia.(f)',
      instructions: `
We will conclude this lesson with a short Alleluia (workbook, page 25). Look for the groups: two notes on "Al", three on "lú".`,
      source: `${workbook}, p. 25; ${instructor}, Lesson 13, p. 39`,
    }),
    exercise({
      id: 'wow-13-alleluia-2',
      recording: 47,
      title: 'The Alleluia, once more',
      key: 'do=e-flat',
      gabc: '(f3) Al(ef)le(f)lú(f_g_f_)ia.(f)',
      instructions: `
This time make the three notes on "lú" a little longer: the line over them is an episema.`,
      source: `${workbook}, p. 25; ${instructor}, Lesson 13, p. 39`,
    }),
  ],
};
