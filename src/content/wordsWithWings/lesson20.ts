import { exercise, Lesson } from '../../exercise/exercise';
import { VENI_KEY, VENI_LINES, VENI_QUI } from './veniSancte';

// Lesson 20, "The Dove (3)": the whole Pentecost hymn, Veni Sancte Spiritus (workbook
// p. 46), on four staves. The last lesson of the book.
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

const LINES = [...VENI_LINES, VENI_QUI.per, VENI_QUI.gentes];

export const LESSON_20: Lesson = {
  id: 'wow-20',
  number: 20,
  title: 'The Dove (3)',
  summary: 'Sing the whole Pentecost hymn, Veni Sancte Spiritus, from beginning to end.',
  exercises: [
    exercise({
      id: 'wow-20-text',
      recording: 94,
      title: 'Veni Sancte Spiritus: the words',
      kind: 'read',
      instructions: `
Before we sing the Pentecost song, let us see how successful you were with your homework (workbook, page 45). Then we sing the whole song.

Veni Sancte Spiritus, reple tuórum corda fidélium, et tui amóris in eis ignem accénde:
Qui per diversitátem linguárum cunctárum gentes in unitáte fidei congregásti.

Come, Holy Spirit, fill the hearts of Thy faithful, enkindle in them the fire of Thy love; that from a diversity of tongues all people may be gathered into unity of faith.

Press Hear the choir to listen to the whole song.`,
      source: `${workbook}, p. 46; ${instructor}, Lesson 20, p. 65`,
    }),
    ...LINES.map((gabc, i) =>
      exercise({
        id: `wow-20-line-${i + 1}`,
        recording: 94,
        title: `Veni Sancte Spiritus: line ${i + 1} of 4`,
        key: VENI_KEY,
        gabc,
        instructions:
          i === 0
            ? 'The first line of the whole song. Hear the choir sings all four lines, so you can hear where each comes in.'
            : i === 3
              ? 'The last line. Sing it to the end, and then you have sung the whole song!'
              : `This is line ${i + 1} of the song. Sing it along with the choir.`,
        source: `${workbook}, p. 46; ${instructor}, Lesson 20, p. ${i < 2 ? 65 : 66}`,
      }),
    ),
  ],
};
