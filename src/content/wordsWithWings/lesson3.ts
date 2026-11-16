import { exercise, Lesson } from '../../exercise/exercise';

// Lesson 3, "Do, Re, Mi, and so on". The books print the do clef on the top
// line, so do is the clef line itself and the low do sits in the space below
// the staff. Pitch letters: c is that low do, d is re, e is mi, and so on up to
// j, the clef line.
//
// The notes are transcribed from the workbook and checked against the
// instructor edition, which prints the same staves with the key to sing each in
// (`key`, the book's [do=d]). The wording is the instructor's script turned
// into directions for a student working alone: the teacher's questions become
// instructions, and "write the names" becomes the naming exercises.
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

export const LESSON_3: Lesson = {
  id: 'wow-3',
  number: 3,
  title: 'Do, Re, Mi, and so on',
  summary: 'Learn the names of the notes, then sing the scale and short tunes with them.',
  exercises: [
    exercise({
      id: 'wow-3-names',
      title: 'Name the scale',
      kind: 'name',
      given: 1,
      key: 'do=d',
      // the staff printed at the top of workbook page 4: the scale from high to low
      gabc: '(c4) (j) (i) (h) (g) (f) (e) (d) (c)',
      instructions: `
Gregorian chant is written on a staff of four lines, not five, and the notes are square.

The sign at the start of the staff is the do clef. It sits on the top line, so the note on that line is do.

{{gabc: (c4) do(j)}}

The notes of this scale go down the staff, from the highest to the lowest.

Tap a note, then choose its name: do re mi fa sol la ti. The first one is given to you. Remember that the scale from do goes do re mi fa sol la ti do, so counting down from the top it runs do ti la sol fa mi re do.`,
      source: `${workbook}, p. 4 (top); ${instructor}, Lesson 3, p. 9`,
    }),
    exercise({
      id: 'wow-3-scale',
      title: 'Sing the scale',
      key: 'do=d',
      // up from the low do to the do on the clef line, then back down; the
      // books print only the descending half
      gabc: '(c4) (c) (d) (e) (f) (g) (h) (i) (j) (z) (i) (h) (g) (f) (e) (d) (c)',
      instructions: `
Now sing what you have named: the scale from the low do up to the high do and back down again.

Tap Start listening and sing the first note on any pitch that is comfortable. That note is do, and every other note is measured from it, so keep each step the same size.

Give every note the same length, like steady footsteps, and choose a pace that feels natural. Then try singing it once more looking only at the notes, not at the names.`,
      source: `${workbook}, p. 4 (opening staff), sung up and back; ${instructor}, Lesson 3, p. 9`,
    }),
    exercise({
      id: 'wow-3-1-names',
      title: 'Exercise 1: name the notes',
      kind: 'name',
      given: 3,
      key: 'do=d',
      gabc: '(c4) (c) (d) (e;) (e) (d) (c;) (c) (d) (d;) (d) (c) (d;) (d) (e) (d)',
      instructions: `
Here is a longer line. The first three notes are named for you: do, re, mi. Name the rest.

Do is the note in the space below the staff, the one the clef points to from the top line. Count up from it: re is on the bottom line, and mi is the space above that.

The short vertical lines divide the music into small phrases, like commas in a sentence. They do not change the names.`,
      source: `${workbook}, p. 4, Exercise 1; ${instructor}, Lesson 3, p. 9`,
    }),
    exercise({
      id: 'wow-3-1',
      recording: 5,
      title: 'Exercise 1: sing it',
      key: 'do=d',
      gabc: '(c4) (c) (d) (e;) (e) (d) (c;) (c) (d) (d;) (d) (c) (d;) (d) (e) (d)',
      instructions: `
Sing the names you just worked out: do re mi, mi re do, and so on.

At each vertical line take a breath. Sing the note before the line for one beat, then rest for one beat while you breathe, and carry on.

Start on do, the lowest note, and use your first note as the key for the whole exercise. Every other note is one beat.`,
      source: `${workbook}, p. 4, Exercise 1; ${instructor}, Lesson 3, p. 9`,
    }),
    exercise({
      id: 'wow-3-2-names',
      title: 'Exercise 2: name the notes',
      kind: 'name',
      given: 1,
      key: 'do=d',
      gabc: '(c4) (c) (d) (e) (d;) (d) (d) (d) (e;) (e) (d) (e) (d;) (c) (d) (e) (d)',
      instructions: `
The next line starts on do. Name the rest of the notes, group by group.

Look for notes that sit side by side at the same height. They have the same name, because they are the same note sung again.`,
      source: `${workbook}, p. 4, Exercise 2; ${instructor}, Lesson 3, p. 10`,
    }),
    exercise({
      id: 'wow-3-2',
      recording: 6,
      title: 'Exercise 2: sing it',
      key: 'do=d',
      gabc: '(c4) (c) (d) (e) (d;) (d) (d) (d) (e;) (e) (d) (e) (d;) (c) (d) (e) (d)',
      instructions: `
Four groups of four notes. Start on do and sing the names you just worked out.

The second group stays on re three times before it steps up to mi, so sing each re at exactly the same pitch. You can sing them smoothly, one clear note after another; you do not need to stop your voice between them.

At each vertical line, sing the last note for one beat and then rest for one beat.`,
      source: `${workbook}, p. 4, Exercise 2; ${instructor}, Lesson 3, p. 10`,
    }),
    exercise({
      id: 'wow-3-3-names',
      title: 'Exercise 3: name the notes',
      kind: 'name',
      given: 1,
      key: 're=e',
      // the book labels the four phrases A to D and starts this one on re
      gabc: '(c4) (d) (c) (d) (e;) (d) (d) (e) (c) (d;) (e) (c) (c) (d;) (d) (e) (c) (e) (d)',
      instructions: `
This is the hardest one, and it does not start on do. The first note is re, on the bottom line, and the next note goes down to do.

Name every note. The four groups are called A, B, C and D in your workbook.`,
      source: `${workbook}, p. 5, Exercise 3; ${instructor}, Lesson 3, p. 10`,
    }),
    exercise({
      id: 'wow-3-3',
      recording: 7,
      title: 'Exercise 3: sing it',
      key: 're=e',
      gabc: '(c4) (d) (c) (d) (e;) (d) (d) (e) (c) (d;) (e) (c) (c) (d;) (d) (e) (c) (e) (d)',
      instructions: `
Sing the names of this line, starting on re.

Choose a comfortable pitch for re. Do is the step just below it.

Take a breath at each vertical line: one beat of singing on the last note, then one beat of rest. When you can do it with the names, try the same melody on the single syllable "nu" and see whether you could still tell the four groups apart.`,
      source: `${workbook}, p. 5, Exercise 3; ${instructor}, Lesson 3, p. 10`,
    }),
  ],
};
