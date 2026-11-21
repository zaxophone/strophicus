import { exercise, Exercise, Lesson } from '../../exercise/exercise';

// Lesson 6, "The Singer With Wings": seven short melody fragments sung with a
// hand movement that follows the melody. The workbook draws a wavy line over
// each staff for the movement; the app shows the notes only. All notes are
// single puncta. Every staff's clef line and key tag were checked against the
// solfege the instructor gives (for example melody 1: sol sol la sol).
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

export interface Fragment {
  /** The book's recording, and the number of the melody. */
  n: number;
  /** The melody as gabc, with the words under the notes as the book prints them. */
  gabc: string;
  key: string;
  /** What the words mean, as the instructor gives it. */
  meaning?: string;
  /** Workbook page of the staff. */
  page: number;
  /**
   * The line the workbook draws over the staff, read from its scan: `a` where it loops
   * round the note, `t` where it passes under it, `-` where it passes above.
   */
  line?: string;
}

export const FRAGMENTS: Fragment[] = [
  { n: 1, gabc: '(c4) Al(g)le(g)lú(h)ia(g)', key: 'sol=a', meaning: '"Praise God."', page: 9, line: '-t-t' },
  { n: 2, gabc: '(c3) Jo(e)seph(e) fi(e)li(g) Da(h)vid(i)', key: 'sol=e', meaning: '"Joseph, son of David."', page: 9, line: '-t-t-t' },
  {
    n: 3,
    gabc: '(c3) Sal(h)ve(g) ra(f)dix,(e) sal(f)ve(h) por(i)ta(h)',
    key: 'do=a',
    meaning: '"Hail, root; hail, gate."',
    page: 9,
    line: '-t-t-t-t',
  },
  { n: 4, gabc: '(c3) Ký(h)ri(f)e(f) e(f)lé(f)i(e)son(f)', key: 'do=a', page: 9, line: 'a-tta-t' },
  { n: 5, gabc: '(c4) Be(f)ne(e)dí(f)ctus(e) es(d)', key: 'fa=a', meaning: '"You are the blessed."', page: 10, line: 'a-a-t' },
  { n: 6, gabc: '(c4) Ad(g) te(h) cla(i)má(j)mus(g)', key: 'sol=e', meaning: '"To thee do we cry."', page: 10, line: 'a-t-t' },
  {
    n: 7,
    // a short tick (divisio minima) after "bus"
    gabc: '(c4) Et(e) in(g) ter(h)ra(h) pax(g) ho(h)mí(i)ni(h)bus(h,) bo(h)nae(h) vo(g)lún(h)tá(g)tis(e)',
    key: 'mi=f-sharp',
    meaning: '"And on earth peace to men of good will."',
    page: 10,
    line: 'a-t-ttt-t-t-t-t',
  },
];

/** One melody as a sing exercise; Lessons 6 and 7 both use it. */
export function fragmentExercise(f: Fragment, lesson: number, instructions: string): Exercise {
  return exercise({
    id: `wow-${lesson}-${f.n}`,
    recording: 11 + f.n,
    title: `Melody ${f.n}`,
    key: f.key,
    gabc: f.gabc,
    gestures: f.line,
    instructions,
    source: `${workbook}, p. ${f.page}; ${instructor}, Lesson 6, p. ${f.n <= 2 ? 15 : f.n <= 5 ? 16 : 17}`,
  });
}

const first = `
In this lesson we will sing and move, as if we had wings. Do what I do.

Look at the first melody. A wavy line runs over the notes: it lifts over some and dips under others. Sing it, and let your hand draw that line in the air as you sing.

{{gabc: (c4) Al(g)le(g)lú(h)ia(g) @ - t - t}}

"Alleluia" means "Praise God". The word is a contraction of "Hallelu" and "jah", and "Jah" is short for Yahweh, the Hebrew name of God.

Tap Hear it, then sing along. Begin on any comfortable note.`;

export const LESSON_6: Lesson = {
  id: 'wow-6',
  number: 6,
  title: 'The Singer With Wings',
  summary: 'Sing seven short fragments of Gregorian melody while your hand follows the tune.',
  exercises: FRAGMENTS.map((f, i) =>
    fragmentExercise(
      f,
      6,
      i === 0
        ? first
        : `
${f.meaning ? `These words mean ${f.meaning} ` : 'Do you remember what Kýrie eléison means? Is it Latin? '}Hear it, then sing it, and let your hand follow the line in the air.`,
    ),
  ),
};
