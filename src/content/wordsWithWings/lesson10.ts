import { exercise, Lesson } from '../../exercise/exercise';
import { joinGabc, withoutText } from '../../chant/gabc';
import { PUER_NATUS, PUER_NATUS_KEY } from './puerNatus';

// Lesson 10, "Practice Makes Perfect": Puer natus in Bethlehem sung from the
// beginning to the end, with all the verses on workbook p. 19. The four lines of
// music are sung in two halves (lines 1-2 and lines 3-4), because all 48 notes with
// their words do not fit one screen and lessons never scroll; each verse is the same
// melody with its own words. The recordings (24 spoken, 25 sung) cover verses 1 to 5 only.
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

/** The song in two halves: lines 1 and 2, then lines 3 and 4 (the refrain). */
const HALVES = [[0, 1], [2, 3]];
const halfOf = (verse: number, which: number) => joinGabc(...HALVES[which].map((i) => PUER_NATUS[verse][i]));
const HALF_NAMES = ['first half', 'second half'];

export const LESSON_10: Lesson = {
  id: 'wow-10',
  number: 10,
  title: 'Practice Makes Perfect',
  summary: 'Sing Puer natus in Bethlehem all the way through.',
  exercises: [
    exercise({
      id: 'wow-10-listen',
      recording: 25,
      title: 'Practice',
      kind: 'read',
      instructions: `
What do you think the saying "practice makes perfect" has to do with singing Gregorian chant?

Today you practise Puer natus in Bethlehem from the beginning and all the way through. You may listen to the recording first, or begin right away, or do both. Look at page 19 of your workbook for all the words.`,
      source: `${workbook}, p. 19; ${instructor}, Lesson 10, p. 27`,
    }),
    exercise({
      id: 'wow-10-verses-1-3',
      recording: 24,
      title: 'Verses 1 to 3',
      kind: 'read',
      instructions: `
1. Puer natus in Bethlehem, alleluia,
unde gaudet Jerusalem, alleluia, alleluia.
In cordis jubilo
Christum natum adoremus,
cum novo cantico.

2. Assumpsit carnem Filius, alleluia,
Dei Patris altissimus, alleluia, alleluia.
In cordis jubilo ...

3. Per Gabrielem nuntium, alleluia,
virgo concepit Filium, alleluia, alleluia.
In cordis jubilo ...

(The last two lines are the same in every verse.)`,
      source: `${workbook}, p. 19; ${instructor}, Lesson 10, p. 27`,
    }),
    exercise({
      id: 'wow-10-verses-4-7',
      title: 'Verses 4 to 7',
      kind: 'read',
      instructions: `
4. Hic jacet in praesepio, alleluia,
qui regnat sine termino, alleluia, alleluia.
In cordis jubilo ...

He lies in a manger, alleluia, who reigns without end, alleluia, alleluia.

5. Et Angelus pastoribus, alleluia,
revelat quod sit Dominus, alleluia, alleluia.
In cordis jubilo ...

And the Angel reveals to the shepherds, alleluia, that this is the Lord, alleluia, alleluia.

6. Reges de Saba veniunt, alleluia,
aurum, thus, myrrham efferunt, alleluia, alleluia.
In cordis jubilo ...

Kings from Saba come, alleluia, offering gold, incense and myrrh, alleluia, alleluia.

7. In hoc natali gaudio, alleluia,
benedicamus Domino, alleluia, alleluia.
In cordis jubilo ...

On this joyous natal day, alleluia. Let us bless the Lord, alleluia, alleluia.`,
      source: `${workbook}, p. 19; ${instructor}, Lesson 10, p. 27-28`,
    }),
    ...[0, 1].map((half) =>
      exercise({
        id: `wow-10-names-${half + 1}`,
        title: `Sing the names: ${HALF_NAMES[half]}`,
        key: PUER_NATUS_KEY,
        gabc: withoutText(halfOf(1, half)),
        instructions: `
Sing the ${HALF_NAMES[half]} of the song with the names of the notes. Take a breath at each bar.${
          half === 1 ? ' The flat sign in the first line makes that note te.' : ''
        }`,
        source: `${workbook}, p. 15; ${instructor}, Lesson 10, p. 27`,
      }),
    ),
    ...[1, 2, 3].flatMap((verse) =>
      [0, 1].map((half) =>
        exercise({
          id: `wow-10-verse-${verse}-${half + 1}`,
          recording: verse === 1 ? 25 : undefined,
          title: `Verse ${verse}: ${HALF_NAMES[half]}`,
          key: PUER_NATUS_KEY,
          gabc: halfOf(verse, half),
          instructions: `
Sing the ${HALF_NAMES[half]} of verse ${verse} of Puer natus in Bethlehem. Take a breath at each bar, and hold the notes with a line over them or a dot a little longer.${
            verse === 1 ? ' Hear the choir sings the first five verses.' : ''
          }`,
          source: `${workbook}, p. 15-19; ${instructor}, Lesson 10, p. 27`,
        }),
      ),
    ),
  ],
};
