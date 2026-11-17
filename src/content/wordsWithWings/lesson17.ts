import { exercise, Lesson } from '../../exercise/exercise';
import { withoutText } from '../../chant/gabc';
import { REGINA_CAELI, REGINA_CAELI_KEY } from './reginaCaeli';

// Lesson 17, "From Easter to Pentecost": four Alleluias to sing and move to (workbook
// p. 41), then the antiphon Regina caeli (p. 42). The staves have the do clef on the top
// line (c4): do is j, ti is i, la is h, sol is g, fa is f, mi is e. The books draw wavy
// lines over the Alleluias for the children to move to; the app shows the notes only.
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

// The hand's line over each Alleluia, as the workbook draws it, one letter per note (see
// `gestures` in exercise.ts): `-` the line passes above the note, `t` under it (a thesis), `a`
// curls round it (an arsis; a second arsis after one loops right round). The four-note
// Alleluias go over, under, over, under: the ictus fall on "le" and "ia" and the line ends on a
// thesis. Alleluia 4 has an arsis on "Al", and a looped arsis on the first note of "lú".
const ALLELUIAS = [
  { n: 1, recording: 83, key: 'te=c', gabc: '(c4) Al(ixi)le(h)lú(g)ia.(f)', line: '-t-t', page: 57 },
  { n: 2, recording: 84, key: 'sol=a', gabc: '(c4) Al(g)le(h)lú(ixi)ia.(j)', line: '-t-t', page: 57 },
  { n: 3, recording: 83, key: 'te=c', gabc: '(c4) Al(ixi)le(h)lú(g)ia.(f)', line: '-t-t', page: 57 },
  { n: 4, recording: 85, key: 'mi=f-sharp', gabc: '(c4) Al(e)le(g)lú(gg)ia.(f)', line: 'a-a-t', page: 57 },
];

// Regina caeli: the line is drawn only over each Alleluia ("you sing and move whenever you see
// alleluia"), and nowhere else (`.`).
const REGINA_LINES = [
  '........' + '-t-t' + '.......',
  '...' + '-t-t' + '........' + '-t-t',
  '.......' + 'a-a-t',
];

export const LESSON_17: Lesson = {
  id: 'wow-17',
  number: 17,
  title: 'From Easter to Pentecost',
  summary: 'Sing and move to four Alleluias, then learn the antiphon Regina caeli.',
  exercises: [
    ...ALLELUIAS.map((a) =>
      exercise({
        id: `wow-17-al-${a.n}`,
        recording: a.recording,
        title: `Alleluia ${a.n}`,
        key: a.key,
        gabc: a.gabc,
        gestures: a.line,
        instructions:
          a.n === 1
            ? `
Let us sing and move. Listen and watch me. The first Alleluia (workbook, page 41): the first note has a flat sign, so you sing te, not ti. Move your hand in a wavy line, going up on the notes that rise and down on the notes that fall.`
            : a.n === 2
              ? `The second Alleluia: it begins low, on sol, and goes up. The flat sign is on the third note, te.`
              : a.n === 3
                ? `Now the first Alleluia once more, singing and moving.`
                : `
The fourth Alleluia. Do you see that there are two notes on "lú"? Combine them to sing one long note. While you are holding them, you can count two notes with your voice, singing "lú-hú".`,
        source: `${workbook}, p. 41, melody ${a.n}; ${instructor}, Lesson 17, p. 57`,
      }),
    ),
    exercise({
      id: 'wow-17-regina-text',
      recording: 86,
      title: 'Regina caeli: the words',
      kind: 'read',
      instructions: `
I will now sing the song that you will find on page 42 of your workbook. It is a song about the "Queen of Heaven". Who is that? The text reads:

Regina caeli laetáre, alleluia:
Quia quem meruísti portáre, alleluia.
Resurréxit, sicut dixit, alleluia:
Ora pro nobis Deum, alleluia.

Queen of heaven, rejoice; alleluia. For he whom thou wast made worthy to bear, alleluia. Has risen as he said; alleluia. Pray for us to God; alleluia.

What do you think "wast made worthy to bear" means?

Press Hear the choir. I will sing it now. You sing the Alleluia.`,
      source: `${workbook}, p. 42; ${instructor}, Lesson 17, p. 58`,
    }),
    ...REGINA_CAELI.map((gabc, i) =>
      exercise({
        id: `wow-17-regina-${i + 1}`,
        recording: 86,
        title: `Regina caeli: line ${i + 1}`,
        key: REGINA_CAELI_KEY,
        gabc,
        gestures: REGINA_LINES[i],
        instructions: `
${
  i === 0
    ? 'The first line of Regina caeli. Remember: a flat sign holds until the next bar, so every "i" after it is te, until a bar comes.'
    : i === 1
      ? 'The second line. The small tick above the staff is a short pause, with no breath.'
      : 'The last line. Do you see the two notes on "lú"? Hold them together as one long note.'
} Hear the choir sings the whole song; sing your line with them.${
          i < 2 ? ' The small note at the end of the line is the custos: it shows where the next line begins, and is not sung.' : ''
        }`,
        source: `${workbook}, p. 42; ${instructor}, Lesson 17, p. 58`,
      }),
    ),
    exercise({
      id: 'wow-17-episema',
      title: 'Mark the long notes',
      kind: 'read',
      instructions: `
Now I will sing it again. Can you now mark a horizontal line (episema) over every note I sang as a long note?

We will sing together. You sing and move whenever you see "alleluia". Let us see if you wrote the correct notes for the melody in your homework (workbook, page 40).

For next time, learn the whole song. You can listen to it on the internet: go to the website musicasacra.com/wings and look for Regina caeli.`,
      source: `${instructor}, Lesson 17, p. 59`,
    }),
    ...REGINA_CAELI.map((gabc, i) =>
      exercise({
        id: `wow-17-names-${i + 1}`,
        title: `Name the notes: line ${i + 1}`,
        kind: 'name',
        gabc: withoutText(gabc),
        instructions: `Name the notes of line ${i + 1} of Regina caeli, as in the homework on page 40 of the workbook. Find do on the clef, then count. Remember: a note with a flat sign is te.`,
        source: `${workbook}, p. 40; ${instructor}, Lesson 16, p. 56`,
      }),
    ),
  ],
};
