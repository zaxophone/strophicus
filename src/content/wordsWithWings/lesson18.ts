import { exercise, Lesson } from '../../exercise/exercise';
import { withoutText } from '../../chant/gabc';
import { VENI_KEY, VENI_LINES, VENI_PHRASES } from './veniSancte';

// Lesson 18, "The Dove (1)": the Pentecost hymn Veni Sancte Spiritus, learnt phrase by
// phrase (workbook p. 43), then the two lines together (p. 44).
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

const PHRASES = [
  {
    id: 1,
    recording: 87,
    key: VENI_KEY,
    gabc: VENI_PHRASES.veni,
    page: 60,
    intro: `
Now we will learn a hymn that we will be able to sing in church at Pentecost. At Pentecost we celebrate the Holy Spirit that God sent to be a helper to people. Do you remember how the Holy Spirit helped St. Gregory? Now you know why this chapter is called "The Dove".

Speak and sing after me. This is the first phrase (workbook, page 43). It means "Come, Holy Spirit."`,
  },
  {
    id: 2,
    recording: 88,
    key: VENI_KEY,
    gabc: VENI_PHRASES.reple,
    page: 60,
    intro: `The second phrase. It means "Fill the hearts of Thy faithful."`,
  },
  {
    id: 3,
    recording: 89,
    key: 'fa=g',
    gabc: VENI_PHRASES.amoris,
    page: 61,
    intro: `The third phrase begins lower: fa is now the starting note.`,
  },
  {
    id: 4,
    recording: 90,
    key: 'la=b',
    gabc: VENI_PHRASES.ignem,
    page: 61,
    intro: `The fourth phrase. The last two phrases mean: "Enkindle in them the fire of Thy love."`,
  },
];

export const LESSON_18: Lesson = {
  id: 'wow-18',
  number: 18,
  title: 'The Dove (1)',
  summary: 'Learn the first half of the Pentecost hymn Veni Sancte Spiritus, one phrase at a time.',
  exercises: [
    ...PHRASES.map((p) =>
      exercise({
        id: `wow-18-${p.id}`,
        recording: p.recording,
        title: `Phrase ${p.id}`,
        key: p.key,
        gabc: p.gabc,
        instructions: p.intro.trim(),
        source: `${workbook}, p. 43, melody ${p.id}; ${instructor}, Lesson 18, p. ${p.page}`,
      }),
    ),
    ...VENI_LINES.map((gabc, i) =>
      exercise({
        id: `wow-18-line-${i + 1}`,
        recording: 91,
        title: `The four phrases together: line ${i + 1}`,
        key: VENI_KEY,
        gabc,
        instructions:
          i === 0
            ? `Now we have all four phrases put together (workbook, page 44). This is the first line: the first two phrases. The small tick above the staff after "tus" is a short pause.`
            : `The second line: the last two phrases. A small tick after "amóris" is another short pause.`,
        source: `${workbook}, p. 44; ${instructor}, Lesson 18, p. 61`,
      }),
    ),
    ...VENI_LINES.map((gabc, i) =>
      exercise({
        id: `wow-18-names-${i + 1}`,
        title: `Name the notes: line ${i + 1}`,
        kind: 'name',
        gabc: withoutText(gabc),
        instructions: `For next time, write the note names (letters) under the notes (workbook, page 44, bottom). Name the notes of line ${i + 1} here. Find do on the clef, then count.`,
        source: `${workbook}, p. 44; ${instructor}, Lesson 18, p. 62`,
      }),
    ),
  ],
};
