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
  notes: string;
  clefLine: number;
  key: string;
  text: string;
  /** What the words mean, as the instructor gives it. */
  meaning?: string;
  /** Workbook page of the staff. */
  page: number;
  /**
   * The line the workbook draws over the staff, read from its scan: `a` where it loops
   * round the note, `t` where it passes under it, `-` where it passes above. Not given
   * where the scan is too tangled to read (melody 7).
   */
  line?: string;
}

export const FRAGMENTS: Fragment[] = [
  { n: 1, notes: 'gghg', clefLine: 4, key: 'sol=a', text: 'Al- le- lú- ia', meaning: '"Praise God."', page: 9, line: '-t-t' },
  { n: 2, notes: 'eeeghi', clefLine: 3, key: 'sol=e', text: 'Jo- seph fi- li Da- vid', meaning: '"Joseph, son of David."', page: 9, line: '-t-t-t' },
  {
    n: 3,
    notes: 'hgfefhih',
    clefLine: 4,
    key: 'fa=a',
    text: 'Sal- ve ra- dix, sal- ve por- ta',
    meaning: '"Hail, root; hail, gate."',
    page: 9,
    line: '-t-t-t-t',
  },
  { n: 4, notes: 'hffffef', clefLine: 3, key: 'do=a', text: 'Ký- ri- e e- lé- i- son', page: 9, line: 'a-tta-t' },
  { n: 5, notes: 'fefed', clefLine: 4, key: 'fa=a', text: 'Be- ne- dí- ctus es', meaning: '"You are the blessed."', page: 10, line: 'a-a-t' },
  { n: 6, notes: 'ghijg', clefLine: 4, key: 'sol=e', text: 'Ad te cla- má- mus', meaning: '"To thee do we cry."', page: 10, line: 'a-t-t' },
  {
    n: 7,
    // a short tick (divisio minima) after "bus"
    notes: 'eghhghihh,hhghge',
    clefLine: 4,
    key: 'mi=f-sharp',
    text: 'Et in ter- ra pax ho- mí- ni- bus bo- nae vo- lún- tá- tis',
    meaning: '"And on earth peace to men of good will."',
    page: 10,
  },
];

/** One melody as a sing exercise; Lessons 6 and 7 both use it. */
export function fragmentExercise(f: Fragment, lesson: number, instructions: string): Exercise {
  return exercise({
    id: `wow-${lesson}-${f.n}`,
    recording: 11 + f.n,
    title: `Melody ${f.n}`,
    key: f.key,
    notes: f.notes,
    gestures: f.line,
    clefLine: f.clefLine,
    text: f.text,
    instructions,
    source: `${workbook}, p. ${f.page}; ${instructor}, Lesson 6, p. ${f.n <= 2 ? 15 : f.n <= 5 ? 16 : 17}`,
  });
}

const first = `
In this lesson we will sing and move, as if we had wings. Do what I do.

Look at the first melody. A wavy line runs over the notes: it lifts over some and dips under others. Sing it, and let your hand draw that line in the air as you sing.

{{staff; 4; gghg; Al- le- lú- ia}}

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
