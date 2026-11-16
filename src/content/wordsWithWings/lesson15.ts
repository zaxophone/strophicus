import { exercise, Exercise, Lesson } from '../../exercise/exercise';
import { HAEC_DIES_KEY as key, haecDiesVerse } from './haecDies';

// Lesson 15, "The Easter Story (2)": the Our Father phrase "Fiat voluntas tua", three
// Alleluias, and the next three verses of Alleluia Haec dies (workbook pp. 30-32).
// This time the children sing the Alleluias and the teacher sings the passages.
// Same notation as Lesson 14: do clef on the third line, do is h, [do=a].
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

interface Verse {
  n: number;
  spoken: number;
  piece: number;
  intro: string;
  english: string;
  latin: string;
  first: string;
  second: string;
  page: number;
  /** Page of the instructor edition. */
  book: number;
}

const VERSES: Verse[] = [
  {
    n: 4,
    spoken: 64,
    piece: 65,
    intro:
      'Mary from Magdala saw two angels in white robes when she was at the empty tomb. One of them said to her:',
    english: 'Woman, for whom are you looking? Are you looking for the living among the dead?',
    latin: 'Quem quaeris, mulier?\nVivéntem cum mortuis?',
    first: 'Quem(f) quae(f)ris,(e) mú(f)li(e)er?(d::)',
    second: 'Vi(f)vén(f)tem(e) cum(d) mór(fh)tu(h)is?(h::)',
    page: 31,
    book: 46,
  },
  {
    n: 5,
    spoken: 66,
    piece: 67,
    intro: 'And the angel continued:',
    english: 'Weep not, Mary. The Lord is risen.',
    latin: 'Noli flere, Maria:\nresurréxit Dóminus.',
    first: 'No(f)li(f) fle(f)re,(e) Ma(f)rí(e)a:(d::)',
    second: 're(f)sur(e)ré(d)xit(f) Dó(h)mi(h)nus.(h::)',
    page: 31,
    book: 47,
  },
  {
    n: 6,
    spoken: 68,
    piece: 69,
    intro: 'And when Mary of Magdala returned to the place where the other disciples were, they asked her:',
    english: 'Tell us, Mary: what have you seen along the road?',
    latin: 'Dic nobis, Maria:\nquid vidisti in via?',
    first: 'Dic(f) no(f)bis(e) Ma(f)rí(e)a:(d::)',
    second: 'quid(f) vi(f)dí(f)sti(e) in(d) vi(fh)a?(h::)',
    page: 32,
    book: 47,
  },
];

/** Fiat voluntas tua, the first thing the lesson sings (and the homework answer of Lesson 14). */
const FIAT = '(c3) Fi(hih)at(hgh) vo(f)lún(ghf)tas(g) tu(e)a.(e)';

const verseExercises = (v: Verse): Exercise[] => {
  const [line1, line2] = haecDiesVerse(v.first, v.second);
  return [
    exercise({
      id: `wow-15-${v.n}-text`,
      recording: v.spoken,
      title: `Verse ${v.n}: the words`,
      kind: 'read',
      instructions: `
This time we will do things differently. You sing the Alleluia, and I sing the other words. First I will tell you what I am going to sing. ${v.intro}

"${v.english}"

And in Latin:

${v.latin}

Press Hear the choir to hear it spoken.`,
      source: `${workbook}, p. ${v.page}; ${instructor}, Lesson 15, p. ${v.book}`,
    }),
    exercise({
      id: `wow-15-${v.n}-line1`,
      recording: v.piece,
      title: `Verse ${v.n} with Alleluias: line 1`,
      key,
      gabc: line1,
      instructions: `
The first line of verse ${v.n}: an Alleluia, the first half of the passage, and another alleluia. Sing the Alleluias with the choir, and listen to the passage.`,
      source: `${workbook}, p. ${v.page}; ${instructor}, Lesson 15, p. ${v.book}`,
    }),
    exercise({
      id: `wow-15-${v.n}-line2`,
      recording: v.piece,
      title: `Verse ${v.n} with Alleluias: line 2`,
      key,
      gabc: line2,
      instructions: `The second line: the end of the passage, and then two Alleluias.`,
      source: `${workbook}, p. ${v.page}; ${instructor}, Lesson 15, p. ${v.book}`,
    }),
  ];
};

/** The three short phrases of the closing challenge, workbook p. 32: the same as Lesson 14's. */
const PUZZLE = [
  { n: 1, recording: 70, gabc: '(c3) (h) (h) (iji) (h)' },
  { n: 2, recording: 71, gabc: '(c3) (h) (g) (hih) (f)' },
  { n: 3, recording: 72, gabc: '(c3) (h) (g) (fgf) (e)' },
];

export const LESSON_15: Lesson = {
  id: 'wow-15',
  number: 15,
  title: 'The Easter Story (2)',
  summary: 'Sing Fiat voluntas tua and three Alleluias, then learn the next three verses of the Easter song.',
  exercises: [
    exercise({
      id: 'wow-15-fiat',
      recording: 60,
      title: 'Fiat voluntas tua',
      key,
      gabc: FIAT,
      instructions: `
Last time you wrote the note names of this melody in your workbook (page 29). It has seven syllables. Sing it with the words: "Fiat voluntas tua".

These words mean "Thy will be done". Do you recognize them? They come from the Our Father, the prayer that Jesus himself taught. "Thy will be done on earth as it is in heaven." Can you explain what that means? Jesus himself had to adhere to these words. Do you know when that was?`,
      source: `${workbook}, p. 29; ${instructor}, Lesson 15, p. 45`,
    }),
    exercise({
      id: 'wow-15-al-1',
      recording: 61,
      title: 'Alleluia 1',
      key: 'la=f-sharp',
      gabc: '(c3) Al(f)le(e)lú(fe)ia.(d)',
      instructions: `Now we continue with the Easter story. Sing after me: the first of three Alleluias (workbook, page 30).`,
      source: `${workbook}, p. 30; ${instructor}, Lesson 15, p. 45`,
    }),
    exercise({
      id: 'wow-15-al-2',
      recording: 62,
      title: 'Alleluia 2',
      key,
      gabc: '(c3) Al(h)le(h)lú(iji)ia.(ih)',
      instructions: `The second Alleluia. Notice that this one starts on do, and the first one started on la.`,
      source: `${workbook}, p. 30; ${instructor}, Lesson 15, p. 46`,
    }),
    exercise({
      id: 'wow-15-al-3',
      recording: 63,
      title: 'Alleluia 3',
      key,
      gabc: '(c3) Al(h)le(g)lú(hih)ia,(f,) al(f)le(efe)lú(d)ia.(d)',
      instructions: `The third is a double Alleluia. Look at the little tick above the staff after the first "ia": a short pause, with no breath.`,
      source: `${workbook}, p. 30; ${instructor}, Lesson 15, p. 46`,
    }),
    ...VERSES.flatMap(verseExercises),
    ...PUZZLE.map((p) =>
      exercise({
        id: `wow-15-puzzle-${p.n}`,
        recording: p.recording,
        title: `Phrase ${'ABC'[p.n - 1]}`,
        key,
        gabc: p.gabc,
        instructions:
          p.n === 1
            ? `
To finish today's lesson, here is a challenge (workbook, page 32, bottom). In which order do you hear these three phrases? Sing phrase A on "nu", and listen to the choir.`
            : `Now sing phrase ${'ABC'[p.n - 1]} on "nu", and listen to the choir.`,
        source: `${workbook}, p. 32; ${instructor}, Lesson 15, p. 48`,
      }),
    ),
  ],
};
