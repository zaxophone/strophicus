import { exercise, Lesson } from '../../exercise/exercise';
import { withoutText } from '../../chant/gabc';
import { VENI_KEY, VENI_LINES, VENI_QUI } from './veniSancte';

// Lesson 19, "The Dove (2)": the first half of Veni Sancte Spiritus again, then the
// second half, "Qui per diversitátem ... in unitáte fidei congregásti" (workbook p. 45).
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

export const LESSON_19: Lesson = {
  id: 'wow-19',
  number: 19,
  title: 'The Dove (2)',
  summary: 'Sing the first half of the Pentecost hymn again, and learn its second half.',
  exercises: [
    ...VENI_LINES.map((gabc, i) =>
      exercise({
        id: `wow-19-line-${i + 1}`,
        recording: 91,
        title: `The Pentecost song again: line ${i + 1}`,
        key: VENI_KEY,
        gabc,
        instructions:
          i === 0
            ? `Were you able to write the correct note names under the notes? Read aloud what you came up with. Now let us sing the Pentecost song again (workbook, page 44). This is the first line.`
            : `The second line of the Pentecost song. Can you sing with note names only?`,
        source: `${workbook}, p. 44; ${instructor}, Lesson 19, p. 63`,
      }),
    ),
    exercise({
      id: 'wow-19-qui-1',
      recording: 92,
      title: 'Qui per diversitátem',
      key: 'fa=g',
      gabc: VENI_QUI.per,
      instructions: `Now I will teach you some more of the song (workbook, page 45). This is the first part of the second half: "qui per diversitátem linguárum cunctárum".`,
      source: `${workbook}, p. 45, melody 1; ${instructor}, Lesson 19, p. 63`,
    }),
    exercise({
      id: 'wow-19-qui-2',
      recording: 93,
      title: 'Gentes in unitáte',
      key: 'fa=f',
      gabc: VENI_QUI.gentes,
      instructions: `
The second part: "gentes in unitáte fidei congregásti". This means: "All people from a diversity of tongues are gathered into unity of faith."

Have you ever met anyone who spoke a language different from yours (a language you did not understand) but you could communicate with each other anyway? If so, then you already have a little experience with what Pentecost is all about.`,
      source: `${workbook}, p. 45, melody 2; ${instructor}, Lesson 19, p. 64`,
    }),
    ...[VENI_QUI.per, VENI_QUI.gentes].map((gabc, i) =>
      exercise({
        id: `wow-19-names-${i + 1}`,
        title: `Name the notes: staff ${i + 1}`,
        kind: 'name',
        gabc: withoutText(gabc),
        instructions: `For next time you have a lot of homework: write the correct note names under the notes (workbook, page 45, bottom of page). Name the notes of staff ${i + 1} here. Also learn the entire Pentecost song: go to musicasacra.com/wings and listen to Veni Sancte Spiritus.`,
        source: `${workbook}, p. 45; ${instructor}, Lesson 19, p. 64`,
      }),
    ),
  ],
};
