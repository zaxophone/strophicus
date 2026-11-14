import { exercise, Exercise, Lesson } from '../../exercise/exercise';
import { MELODY, PUER_NATUS_CLEF, PUER_NATUS_KEY, VERSE_TEXT } from './puerNatus';

// Lesson 8, "A Child Is Born": the Christmas chant Puer natus in Bethlehem
// (workbook p. 15, with the words, and p. 16, the same five staves without them
// for writing the note names). The clef is on the top line, so do is j, ti is i
// and re is d; the key tag is [re=d]. The third staff has the first flat sign:
// the ti of "jubilo" is sung as te. Read from the instructor edition p. 21-22
// (the workbook's own scan of p. 15-16 has the same staves).
const clefLine = PUER_NATUS_CLEF;
const key = PUER_NATUS_KEY;
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

interface Line {
  /** Which line of the song, 1 to 4. */
  n: number;
  notes: string;
  text: string;
  /** Opening instruction for singing the line. */
  intro: string;
}

const LINES: Line[] = [
  {
    n: 1,
    notes: MELODY[0],
    text: VERSE_TEXT[1][0],
    intro: 'The first line of the song. It climbs gently to its highest note on "Bét", the accented syllable of Bethlehem.',
  },
  {
    n: 2,
    notes: MELODY[1],
    text: VERSE_TEXT[1][1],
    intro: 'The second line has a bar in the middle: take a breath there. The four notes in a row on "alleluia" are all the same.',
  },
  {
    n: 3,
    notes: MELODY[2],
    text: VERSE_TEXT[1][2],
    intro: 'Look at the fifth note: it has a flat sign in front of it, so you sing te there, not ti.',
  },
  {
    n: 4,
    notes: MELODY[3],
    text: VERSE_TEXT[1][3],
    intro: 'The last line starts on the highest note, do, on the top line. Take a breath at the bar.',
  },
];

/**
 * The five staves of workbook p. 16, where the song is written out without words
 * for the child to name. Page 15's second line is split in two here.
 */
const HOMEWORK = [
  'dffefgfedfe_d.',
  'dfghghgf_|ffff',
  'hgfe',
  'dfghixj_',
  'jfffhgf_e|dffeed',
];

const singLine = (line: Line): Exercise =>
  exercise({
    id: `wow-8-${line.n}`,
    recording: 20,
    title: `Line ${line.n}`,
    key,
    notes: line.notes,
    text: line.text,
    clefLine,
    instructions: `
${line.intro}

Sing it slowly, one syllable to each note. A note with a short line over it (an episema) is held a little longer, and a dot after a note makes it last twice as long. Hear the choir sings the whole song, so you can hear where this line comes in.`,
    source: `${workbook}, p. 15; ${instructor}, Lesson 8, p. 21`,
  });

const nameStaff = (n: number, notes: string): Exercise =>
  exercise({
    id: `wow-8-names-${n}`,
    title: `Staff ${n}: name the notes`,
    kind: 'name',
    given: n === 1 ? 1 : 0,
    key,
    notes,
    clefLine,
    instructions: `
Now name the notes of staff ${n}, as in the homework on page 16 of the workbook. ${
      n === 1 ? 'The first note is given: re. ' : ''
    }Find do on the clef, then count up or down from there.${
      n === 4 ? ' Remember: the note with the flat sign is te.' : ''
    }`,
    source: `${workbook}, p. 16; ${instructor}, Lesson 8, p. 22`,
  });

export const LESSON_8: Lesson = {
  id: 'wow-8',
  number: 8,
  title: 'A Child Is Born',
  summary: 'Sing the Christmas chant Puer natus in Bethlehem, and meet the flat sign.',
  exercises: [
    exercise({
      id: 'wow-8-text',
      recording: 19,
      title: 'The words',
      kind: 'read',
      notes: '',
      instructions: `
This song is called Puer natus in Bethlehem. It means "A child is born in Bethlehem." You guessed it: it is a Christmas song.

Read the words aloud, a line at a time:

Puer natus in Bethlehem, alleluia;
Unde gaudet Jerusalem, alleluia, alleluia.
In cordis jubilo
Christum natum adoremus,
Cum novo cantico.

In English: a child is born in Bethlehem, alleluia; wherefore Jerusalem rejoices, alleluia, alleluia. In jubilation of heart, let us adore the newborn Christ with a new song.

Some Latin words have a mark over a syllable. That syllable has the emphasis. In words of two syllables, such as puer and natus, there is no mark, because the accent is always on the first syllable.

Try singing the whole text on one single note. How does it sound? In Gregorian chant, longer or shorter parts of a phrase are often sung on one note, as if the singer were saying that all words about God are equally important.`,
      source: `${instructor}, Lesson 8, p. 20-21`,
    }),
    singLine(LINES[0]),
    singLine(LINES[1]),
    exercise({
      id: 'wow-8-flat',
      title: 'A new sign: the flat',
      kind: 'read',
      notes: '',
      instructions: `
In the next line you will meet a sign you have not seen yet. It looks a little like a b. We call it a flat sign.

{{staff; 4; hgixj}}

When the flat sign stands in front of a note, that note is lowered a little. Instead of ti, you sing te. Te sounds a little lower than ti. The flat holds until the next bar.`,
      source: `${instructor}, Lesson 8, p. 22`,
    }),
    singLine(LINES[2]),
    singLine(LINES[3]),
    ...HOMEWORK.map((notes, i) => nameStaff(i + 1, notes)),
  ],
};
