import { exercise, Exercise, Lesson } from '../../exercise/exercise';
import { withoutText } from '../../chant/gabc';
import { AL_CLOSE, AL_OPEN, AL_SECOND } from './haecDies';

// Lesson 14, "The Easter Story (1)": the Alleluia Haec dies, learnt in three passages
// from the Gospel of Easter morning, each sung between Alleluias (workbook pp. 26-28).
// Every staff has the do clef on the third line (c3), so do is h, re is i, mi is j,
// ti is g, la is f, sol is e and fa is d; the key tag is [do=a]. The pieces were read
// from the workbook scan (the instructor edition's page edge cuts off the end of
// each top line). Every piece has the same Alleluia before it, and the same two
// Alleluias after it, apart from the words of its passage.
const key = 'do=a';
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

interface Passage {
  n: number;
  /** Recordings: the Latin spoken, the passage sung, and the whole piece. */
  spoken: number;
  sung: number;
  piece: number;
  latin: string;
  english: string;
  /** The passage on its own, two lines of gabc. */
  passage: [string, string];
  /** The first line of the piece: the Alleluia, line 1 of the passage, then "alleluia". */
  line1: string;
  /** The second line: line 2 of the passage, then two Alleluias. */
  line2: string;
  /** The notes of the passage's two lines, as they come in the piece. */
  page: [number, number];
}

const PASSAGES: Passage[] = [
  {
    n: 1,
    spoken: 51,
    sung: 52,
    piece: 53,
    latin: 'Haec dies quam fecit Dóminus,\nexsultémus et laetémur in ea.',
    english: 'This is the day the Lord has made; let us rejoice and be glad in it.',
    passage: [
      '(c3) Haec(f) di(f)es(f) quam(f) fe(f)cit(e) Dó(f)mi(e)nus,(d)',
      '(c3) ex(f)sul(f)té(f)mus(f) et(f) lae(f)té(f)mur(e) in(d) e(fh)a.(h)',
    ],
    line1: `(c3) ${AL_OPEN} Haec(f) di(f)es(f) quam(f) fe(f)cit(e) Dó(f)mi(e)nus,(d::) ${AL_SECOND}`,
    line2: `(c3) ex(f)sul(f)té(f)mus(f) et(f) lae(f)té(f)mur(e) in(d) e(fh)a.(h::) ${AL_CLOSE}`,
    page: [26, 27],
  },
  {
    n: 2,
    spoken: 54,
    sung: 55,
    piece: 56,
    latin: 'Lapis revolútus est\nab óstio monuménti.',
    english: 'The stone that had covered the entrance to the tomb had been rolled away.',
    passage: [
      '(c3) La(f)pis(f) re(f)vo(e)lú(f)tus(e) est(d)',
      '(c3) ab(f) ós(f)ti(f)o(f) mo(d)nu(f)mén(h)ti.(h)',
    ],
    line1: `(c3) ${AL_OPEN} La(f)pis(f) re(f)vo(e)lú(f)tus(e) est,(d::) ${AL_SECOND}`,
    line2: `(c3) ab(f) ós(f)ti(f)o(f) mo(d)nu(f)mén(h)ti.(h::) ${AL_CLOSE}`,
    page: [27, 27],
  },
  {
    n: 3,
    spoken: 57,
    sung: 58,
    piece: 59,
    latin: 'Tulérunt Dóminum meum,\net néscio ubi posuérunt eum.',
    english: 'They have taken away my Lord, and I do not know where they have laid him.',
    passage: [
      '(c3) Tu(f)lé(f)runt(f) Dó(f)mi(f)num(e) me(fe)um,(d)',
      '(c3) et(f) nés(f)ci(f)o(f) u(f)bi(f) po(f)su(f)é(e)runt(d) e(fh)um.(h)',
    ],
    line1: `(c3) ${AL_OPEN} Tu(f)lé(f)runt(f) Dó(f)mi(f)num(e) me(fe)um,(d::) ${AL_SECOND}`,
    line2: `(c3) et(f) nés(f)ci(f)o(f) u(f)bi(f) po(f)su(f)é(e)runt(d) e(fh)um.(h::) ${AL_CLOSE}`,
    page: [28, 28],
  },
];

/** The two lines of a passage as one melody, the second on a new line of the staff. */
const together = (p: Passage): string => `${p.passage[0]}(z) ${p.passage[1].replace('(c3) ', '')}`;

const passageExercises = (p: Passage): Exercise[] => [
  exercise({
    id: `wow-14-${p.n}-text`,
    recording: p.spoken,
    title: `Passage ${p.n}: the words`,
    kind: 'read',
    instructions: `
${p.n === 1 ? 'The song begins like this (workbook, page 26):' : p.n === 2 ? 'Here comes the second part (workbook, page 27):' : "Here's the third and final passage for the day (workbook, page 28):"}

"${p.english}"

And in Latin:

${p.latin}

Press Hear the choir to hear it spoken. Sing both lines on one note first.`,
    source: `${workbook}, p. ${p.page[0]}; ${instructor}, Lesson 14, p. ${40 + p.n}`,
  }),
  exercise({
    id: `wow-14-${p.n}-sung`,
    recording: p.sung,
    title: `Passage ${p.n}: sing it`,
    key: 'la=f-sharp',
    gabc: together(p),
    instructions: `
Now sing the passage with its melody. Most of the words stay on one note, la, and the melody falls at the end of the first line, and rises again at the end of the second.`,
    source: `${workbook}, p. ${p.page[0]}; ${instructor}, Lesson 14, p. ${40 + p.n}`,
  }),
  exercise({
    id: `wow-14-${p.n}-line1`,
    recording: p.piece,
    title: `Passage ${p.n} with Alleluias: line 1`,
    key,
    gabc: p.line1,
    instructions: `
Now the passage is sung between Alleluias. ${
      p.n === 1
        ? 'The choir sings the Alleluias for now. You sing the passage you have just learned.'
        : 'We sing back and forth: the choir sings the Alleluias and you sing the passage.'
    } This is the first line: an Alleluia, the first half of the passage, and another alleluia. The double bar is a longer pause.`,
    source: `${workbook}, p. ${p.page[1]}; ${instructor}, Lesson 14, p. ${40 + p.n}`,
  }),
  exercise({
    id: `wow-14-${p.n}-line2`,
    recording: p.piece,
    title: `Passage ${p.n} with Alleluias: line 2`,
    key,
    gabc: p.line2,
    instructions: `
The second line: the end of the passage, and then two Alleluias. Look at the little tick above the staff after the first "ia": it is a short pause, with no breath.`,
    source: `${workbook}, p. ${p.page[1]}; ${instructor}, Lesson 14, p. ${40 + p.n}`,
  }),
];

/** The three short phrases of the puzzler on workbook p. 26, sung "on nu", in some order. */
const PUZZLE: { n: number; recording: number; gabc: string }[] = [
  { n: 1, recording: 48, gabc: '(c3) (h) (h) (iji) (h)' },
  { n: 2, recording: 49, gabc: '(c3) (h) (g) (hih) (f)' },
  { n: 3, recording: 50, gabc: '(c3) (h) (g) (fgf) (e)' },
];

const HOMEWORK = '(c3) (hih) (hgh) (f) (ghf) (g) (e) (e)';

export const LESSON_14: Lesson = {
  id: 'wow-14',
  number: 14,
  title: 'The Easter Story (1)',
  summary: 'Learn the Alleluia Haec dies, one passage of the Easter Gospel at a time.',
  exercises: [
    ...PUZZLE.map((p) =>
      exercise({
        id: `wow-14-puzzle-${p.n}`,
        recording: p.recording,
        title: `Phrase ${'ABC'[p.n - 1]}`,
        key,
        gabc: p.gabc,
        instructions:
          p.n === 1
            ? `
We begin with a challenge, on page 26 of your workbook: three short phrases, A, B and C. Sing phrase A on "nu", and listen to the choir to find out which one it is.`
            : `Now sing phrase ${'ABC'[p.n - 1]} on "nu", and listen to the choir.`,
        source: `${workbook}, p. 26; ${instructor}, Lesson 14, p. 40`,
      }),
    ),
    exercise({
      id: 'wow-14-story',
      title: 'The Easter song',
      kind: 'read',
      instructions: `
At Christmas we sang Puer natus in Bethlehem, and we will sing again at the next big feast. Which is the next big feast, and in fact the Church's greatest feast? Easter. The song we will learn and sing at church on Easter tells of what happened on the day Mary of Magdala (she is also called Mary Magdalen) discovered the empty tomb in which Jesus had been laid.

If you like, read the Gospel according to John, chapter 20, verses 1 to 16.`,
      source: `${instructor}, Lesson 14, p. 40`,
    }),
    ...PASSAGES.flatMap(passageExercises),
    exercise({
      id: 'wow-14-names',
      title: 'Name the notes',
      kind: 'name',
      gabc: withoutText(HOMEWORK),
      instructions: `
Homework: write down the note names of the melody on page 29 of your workbook, with just a letter each: d for do, r for re, m for mi, f for fa, s for sol, l for la and t for ti. The clef is on the third line.

Also see if you can find out how many syllables there are in the melody when you sing it with words.`,
      source: `${workbook}, p. 29; ${instructor}, Lesson 14, p. 44`,
    }),
  ],
};
