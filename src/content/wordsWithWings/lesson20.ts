import { joinGabc } from '../../chant/gabc';
import { exercise, Lesson } from '../../exercise/exercise';
import { VENI_KEY, VENI_LINES, VENI_QUI } from './veniSancte';

// Lesson 20, "The Dove (3)": the whole Pentecost hymn, Veni Sancte Spiritus (workbook
// p. 46), as one score. The last lesson of the book.
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

// The four lines as the book prints them (p. 46): a bar after "fidélium," and a double bar at the
// end of each of the other three, each on its own line.
const ending = (gabc: string, from: string, to: string) => {
  if (!gabc.endsWith(from)) throw new Error('Veni Sancte line does not end as expected');
  return gabc.slice(0, -from.length) + to;
};
const LINES = [
  ending(VENI_LINES[0], '(f)', '(f;)'),
  ending(VENI_LINES[1], '(g)', '(g::)'),
  ending(VENI_QUI.per, '(f)', '(f::)'),
  ending(VENI_QUI.gentes, '(g)', '(g::)'),
];

export const LESSON_20: Lesson = {
  id: 'wow-20',
  number: 20,
  title: 'The Dove (3)',
  score: true,
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
    exercise({
      id: 'wow-20-song',
      recording: 94,
      title: 'Veni Sancte Spiritus',
      key: VENI_KEY,
      gabc: joinGabc(...LINES.flatMap((line, i) => (i ? ['(z)', line] : [line]))),
      instructions:
        'The whole song on one page; it scrolls by itself as you sing. Hear the choir sings it through, so you can follow along. Sing it to the end, and then you have sung the whole song!',
      source: `${workbook}, p. 46; ${instructor}, Lesson 20, pp. 65-66`,
    }),
  ],
};
