import { exercise, Exercise, Lesson } from '../../exercise/exercise';
import { MELODY, PUER_NATUS_CLEF, PUER_NATUS_KEY, VERSE_TEXT } from './puerNatus';

// Lesson 9, "It Came to Pass": Puer natus in Bethlehem again. The song is first
// sung with the note names (the names written as homework in Lesson 8), then the
// second verse (workbook p. 17) and the third (p. 18) are learnt. Every verse has
// the same four lines of music, so only the words change; the staves of verse 2
// were checked against the instructor edition and match verse 1 note for note.
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

const LINE_NAMES = ['first', 'second', 'third', 'fourth'];

/** A line of the song sung with its note names, as the instructor asks before the new verses. */
const withNames = (i: number): Exercise =>
  exercise({
    id: `wow-9-names-${i + 1}`,
    title: `Sing the names: line ${i + 1}`,
    key: PUER_NATUS_KEY,
    notes: MELODY[i],
    clefLine: PUER_NATUS_CLEF,
    instructions: `
Now sing the ${LINE_NAMES[i]} line of Puer natus with the names of the notes. Sing each name, and form the words clearly with your mouth.${
      i === 2 ? ' The note with the flat sign is te.' : ''
    }`,
    source: `${workbook}, p. 15-16; ${instructor}, Lesson 9, p. 24`,
  });

/** A line of verse 2 or 3. */
const verseLine = (verse: 2 | 3, i: number, page: number): Exercise =>
  exercise({
    id: `wow-9-v${verse}-${i + 1}`,
    recording: verse === 2 ? 22 : undefined,
    title: `Verse ${verse}, line ${i + 1}`,
    key: PUER_NATUS_KEY,
    notes: MELODY[i],
    text: VERSE_TEXT[verse][i],
    clefLine: PUER_NATUS_CLEF,
    instructions: `
${
  i < 2
    ? `Sing the ${LINE_NAMES[i]} line of verse ${verse}. The music is the same as in the first verse; only the words are new.`
    : `Sing the ${LINE_NAMES[i]} line. It is the same words and the same music as in the first verse.`
}${verse === 2 ? ' Hear the choir sings the whole verse, so you can hear where this line comes in.' : ''}`,
    source: `${workbook}, p. ${page}; ${instructor}, Lesson 9, p. 25`,
  });

export const LESSON_9: Lesson = {
  id: 'wow-9',
  number: 9,
  title: 'It Came to Pass',
  summary: 'Sing Puer natus with the note names, then learn its second and third verses.',
  exercises: [
    ...[0, 1, 2, 3].map(withNames),
    exercise({
      id: 'wow-9-v2-text',
      recording: 21,
      title: 'The second verse',
      kind: 'read',
      notes: '',
      instructions: `
Now learn the words of the second verse. Read along on page 17 of your workbook.

Assumpsit carnem Filius, alleluia;
Dei Patris altissimus, alleluia, alleluia.
In cordis jubilo
Christum natum adoremus,
cum novo cantico.

In English: the Son hath assumed flesh, alleluia; the Most High of God the Father, alleluia, alleluia. In jubilation of heart, let us adore the newborn Christ with a new song.

Did you notice anything? The last part of this verse is the same as the last part of the first verse. From which point on, exactly? (It begins with "In cordis jubilo.")`,
      source: `${workbook}, p. 17; ${instructor}, Lesson 9, p. 24`,
    }),
    ...[0, 1, 2, 3].map((i) => verseLine(2, i, 17)),
    exercise({
      id: 'wow-9-v3-text',
      recording: 23,
      title: 'The third verse',
      kind: 'read',
      notes: '',
      instructions: `
And now the third verse. Follow along on page 18 of your workbook.

Per Gabriélem nuntium, alleluia;
Virgo concépit Filium, alleluia, alleluia.
In cordis jubilo
Christum natum adoremus,
cum novo cantico.

In English: through the messenger Gabriel, alleluia; the Virgin conceived a son, alleluia, alleluia. In jubilation of heart, let us adore the newborn Christ with a new song.`,
      source: `${workbook}, p. 18; ${instructor}, Lesson 9, p. 25`,
    }),
    ...[0, 1, 2, 3].map((i) => verseLine(3, i, 18)),
    exercise({
      id: 'wow-9-listen',
      recording: 25,
      title: 'Listen to the song',
      kind: 'read',
      notes: '',
      instructions: `
Now listen to a recording of the verses, following along on page 19 of your workbook. Press Hear the choir and read the words as the choir sings.

Next time you will sing the whole song through.`,
      source: `${workbook}, p. 19; ${instructor}, Lesson 9, p. 25-26`,
    }),
  ],
};
