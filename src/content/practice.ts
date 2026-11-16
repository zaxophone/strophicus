import { exercise, Lesson } from '../exercise/exercise';

// Short warm-ups made for the app (not from the workbook).
export const PRACTICE: Lesson = {
  id: 'practice',
  title: 'Warm-ups',
  summary: 'Short exercises to get your ear and voice ready.',
  exercises: [
    // do clef on the second line: do is f, and the scale climbs through the staff
    exercise({
      id: 'scale',
      title: 'Scale',
      gabc: '(c2) (f) (g) (h) (i) (j) (k) (l) (m) (z) (l) (k) (j) (i) (h) (g) (f)',
      instructions: `
Sing up the scale one step at a time, then back down again: do re mi fa sol la ti do, and then ti la sol fa mi re do.

Tap Start listening and begin on any note that feels comfortable. That note is do, and it sets the key for everything that follows.`,
    }),
    exercise({
      id: 'do-re-mi',
      title: 'Do Re Mi',
      gabc: '(c2) (f) (g) (h)',
      instructions: `
Sing the first three steps of the scale: do, re, mi.

Start on any comfortable note. Listen to the gap between each step and try to keep the steps even.`,
    }),
    exercise({
      id: 'up-and-back',
      title: 'Up and back',
      gabc: '(c2) (f) (g) (h) (g) (f)',
      instructions: `
Climb three steps and come back down: do re mi re do.

The last do should land exactly where you started. If it drifts, the staff will mark it.`,
    }),
    exercise({
      id: 'long-note',
      title: 'Long note',
      // the dot after the third note makes it last twice as long
      gabc: '(c2) (f) (g) (h.) (g) (f)',
      instructions: `
Sing do re mi re do, but hold mi for twice as long as the others.

The dot after a note means it lasts twice as long. Count the steps: do, re, mi-i, re, do.

Every other note is the same length, so keep a steady pace.`,
    }),
    exercise({
      id: 'dotted-bar',
      title: 'Dot before a bar',
      // the half bar after the dotted note cuts off its second beat
      gabc: '(c2) (f) (g) (h.;) (g) (f)',
      instructions: `
Sing do re mi, rest, then re do. The vertical line is a half bar: a rest of one beat.

Mi has a dot, which would make it last two beats. But the half bar comes straight after it and cuts the dot short: sing mi for one beat, then rest for one beat.

Count: do, re, mi, (rest), re, do.`,
    }),
    exercise({
      id: 'fifth',
      title: 'Fifth',
      gabc: '(c2) (f) (j) (f)',
      instructions: `
Sing do, leap up to sol, and come back down to do.

Sol is a fifth above do. Imagine the note before you sing it, then sing straight to it.`,
    }),
    exercise({
      id: 'step-down',
      title: 'Step down',
      gabc: '(c2) (j) (i) (h) (g) (f)',
      instructions: `
Start on sol and walk down to do: sol fa mi re do.

Whatever note you begin on is sol. The rest of the notes are measured down from it.`,
    }),
    exercise({
      id: 'joined-pair',
      title: 'Two notes, one syllable',
      // do re, joined going up (a podatus); fa re, joined going down (a clivis)
      gabc: '(c2) (f) (fg) (h) (ig) (f)',
      instructions: `
Sometimes two notes are sung on one syllable. Then they are joined into one figure. Sing them smoothly, with no break between them.

Two notes joined and going up are a podatus: the lower note comes first, then the upper.

{{gabc: (c2) (fg)}}

Two notes joined and going down are a clivis.

{{gabc: (c2) (ig)}}

Sing do, do-re, mi, fa-re, do. Each joined pair is two notes in one breath.`,
    }),
    exercise({
      id: 'joined-three',
      title: 'Three notes, one syllable',
      // re mi re (a torculus), mi re mi (a porrectus), do re mi (a scandicus)
      gabc: '(c2) (f) (ghg) (f) (hgh) (f) (fgh)',
      instructions: `
Three notes can be joined too. Which way the middle note goes tells them apart.

If the middle note is the highest, the figure is a torculus.

{{gabc: (c2) (ghg)}}

If the middle note is the lowest, it is a porrectus.

{{gabc: (c2) (hgh)}}

If all three climb, it is a scandicus.

{{gabc: (c2) (fgh)}}

Sing do, re-mi-re, do, mi-re-mi, do, do-re-mi. Join each group smoothly.`,
    }),
  ],
};
