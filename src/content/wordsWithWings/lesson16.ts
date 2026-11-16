import { exercise, Exercise, Lesson } from '../../exercise/exercise';
import { HAEC_DIES_KEY as key, haecDiesVerse } from './haecDies';

// Lesson 16, "The Easter Story (3)": Fiat voluntas tua again, now with a liquescent
// (the "special note" the book keeps for the letter n), and the last three verses of
// Alleluia Haec dies (workbook pp. 33-36). Same notation as Lessons 14 and 15: do clef
// on the third line, do is h, [do=a].
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

/** Fiat voluntas tua, as in Lesson 15. */
const FIAT = '(c3) Fi(hih)at(hgh) vo(f)lún(ghf)tas(g) tu(e)a.(e)';
/** The same, with the third note of "lún" a liquescent: a small note, sung as a half-voiced "n". */
const FIAT_LIQUESCENT = '(c3) Fi(hih)at(hgh) vo(f)lún(ghf~)tas(g) tu(e)a.(e)';
const FIAT_NU = '(c3) Nu(hih) nu(hgh) nu(f) nu(ghf) nu(g) nu(e) nu(e)';

interface Verse {
  n: number;
  spoken: number;
  sung: number;
  piece: number;
  intro: string;
  english: string;
  latin: string;
  first: string;
  second: string;
  page: number;
  book: number;
}

const VERSES: Verse[] = [
  {
    n: 7,
    spoken: 74,
    sung: 75,
    piece: 76,
    intro:
      'Last time we left off with the disciples\' question to Mary Magdalen: "Tell us, Mary: what did you see?" This was her response:',
    english: 'Angels as witnesses, the veil and the shroud.',
    latin: 'Angélicos testes,\nsudárium et vestes.',
    first: 'An(f)gé(f)li(f)cos(e) te(fe)stes,(d::)',
    second: 'su(f)dá(f)ri(f)um(e) et(d) ve(fh)stes.(h::)',
    page: 34,
    book: 49,
  },
  {
    n: 8,
    spoken: 77,
    sung: 78,
    piece: 79,
    intro: 'The next lines sound like a prayer:',
    english: 'Christ, my hope, is risen; he goes before his own to Galilee.',
    latin: 'Surréxit Christus, spes mea;\npraecédet suos in Galiléam.',
    first: 'Sur(f)ré(f)xit(f) Chris(f)tus,(e) spes(f) me(e)a;(d::)',
    second: 'prae(f)cé(f)det(f) su(f)os(f) in(f) Ga(e)li(d)lé(fh)am.(h::)',
    page: 35,
    book: 50,
  },
  {
    n: 9,
    spoken: 80,
    sung: 81,
    piece: 82,
    intro: 'This is how the Easter song ends:',
    english: 'He, who hung on the cross for us, is risen from the grave.',
    latin: 'Surréxit de sepúlcro\nqui pro nobis pepéndit in ligno.',
    first: 'Sur(f)ré(f)xit(f) de(f) se(e)púl(fe)cro,(d::)',
    second: 'qui(f) pro(f) no(f)bis(f) pe(f)pén(f)dit(e) in(d) li(fh)gno.(h::)',
    page: 36,
    book: 51,
  },
];

const verseExercises = (v: Verse): Exercise[] => {
  const [line1, line2] = haecDiesVerse(v.first, v.second);
  const together = `${(`(c3) ${v.first}`).replace(/\(d::\)$/, '(d)')}(z) ${v.second.replace(/\(h::\)$/, '(h)')}`;
  return [
    exercise({
      id: `wow-16-${v.n}-text`,
      recording: v.spoken,
      title: `Verse ${v.n}: the words`,
      kind: 'read',
      instructions: `
${v.intro}

"${v.english}"

And in Latin:

${v.latin}

Press Hear the choir to hear it spoken.`,
      source: `${workbook}, p. ${v.page}; ${instructor}, Lesson 16, p. ${v.book}`,
    }),
    exercise({
      id: `wow-16-${v.n}-sung`,
      recording: v.sung,
      title: `Verse ${v.n}: sing it`,
      key: 'la=f-sharp',
      gabc: together,
      instructions: `Let us sing it. Most of the words are on one note, la.`,
      source: `${workbook}, p. ${v.page}; ${instructor}, Lesson 16, p. ${v.book}`,
    }),
    exercise({
      id: `wow-16-${v.n}-line1`,
      recording: v.piece,
      title: `Verse ${v.n} with Alleluias: line 1`,
      key,
      gabc: line1,
      instructions: `Now the verse is sung between Alleluias. ${
        v.n === 7 ? 'I will only sing the first Alleluia. You sing the rest.' : 'I start and you follow.'
      } This is the first line.`,
      source: `${workbook}, p. ${v.page}; ${instructor}, Lesson 16, p. ${v.book}`,
    }),
    exercise({
      id: `wow-16-${v.n}-line2`,
      recording: v.piece,
      title: `Verse ${v.n} with Alleluias: line 2`,
      key,
      gabc: line2,
      instructions: `The second line: the end of the verse, and two Alleluias.`,
      source: `${workbook}, p. ${v.page}; ${instructor}, Lesson 16, p. ${v.book}`,
    }),
  ];
};

export const LESSON_16: Lesson = {
  id: 'wow-16',
  number: 16,
  title: 'The Easter Story (3)',
  summary: 'Sing Fiat voluntas tua with a liquescent, and learn the last three verses of the Easter song.',
  exercises: [
    exercise({
      id: 'wow-16-fiat-nu',
      recording: 60,
      title: 'Fiat voluntas tua on "nu"',
      key: 'do=a/b-flat/b',
      gabc: FIAT_NU,
      instructions: `
We start again with a section from the Our Father. How did it go? "Fiat voluntas tua": in English, "Thy will be done." First sing the melody on "nu" (workbook, page 33).`,
      source: `${workbook}, p. 33, melody 1; ${instructor}, Lesson 16, p. 49`,
    }),
    exercise({
      id: 'wow-16-fiat-words',
      recording: 60,
      title: 'Fiat voluntas tua',
      key: 'do=a/b-flat/b',
      gabc: FIAT,
      instructions: `Now sing the melody with the words from the Our Father.`,
      source: `${workbook}, p. 33, melody 1; ${instructor}, Lesson 16, p. 49`,
    }),
    exercise({
      id: 'wow-16-fiat-liquescent',
      recording: 73,
      title: 'Fiat voluntas tua, with a small note',
      key: 'do=a/b-flat/b',
      gabc: FIAT_LIQUESCENT,
      instructions: `
I am going to change something. Do you see the difference? The small third note over "lún" is a special note, and it is reserved here for the letter "n" alone. Pronounce the "n" clearly on this note.`,
      source: `${workbook}, p. 33, melody 2; ${instructor}, Lesson 16, p. 49`,
    }),
    ...VERSES.flatMap(verseExercises),
    exercise({
      id: 'wow-16-all',
      title: 'The whole Easter song',
      kind: 'read',
      instructions: `
At Easter we will sing the entire Easter song, Alleluia haec dies (workbook, pages 37 to 39). A soloist or a group of soloists can sing the verses, and everyone sings the Alleluias. Or a different soloist or group can sing each new verse.

You have homework again: write the note names (letters) under the notes of the melody on page 40 of your workbook. You will meet that melody next time.`,
      source: `${workbook}, pp. 37-40; ${instructor}, Lesson 16, p. 52-56`,
    }),
  ],
};
