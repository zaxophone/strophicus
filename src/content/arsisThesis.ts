import { exercise, Lesson } from '../exercise/exercise';

// A short lesson made for the app, between Lessons 6 and 7 of Words with Wings.
// The instructor edition only says (p. 7) that teachers should learn the
// arsis-thesis gestures elsewhere, so this lesson is not from the book. It
// teaches the idea only: phrases begin and rising notes lift (arsis), the rest
// settles (thesis). The melodies are the ones the children have just sung.
const clef4 = 4;

export const ARSIS_THESIS: Lesson = {
  id: 'arsis-thesis',
  title: 'Arsis and Thesis',
  summary: 'Feel the lift and the landing in a melody, and mark where your hand rises and settles.',
  exercises: [
    exercise({
      id: 'arsis-ictus',
      kind: 'read',
      title: 'The ictus',
      notes: '',
      instructions: `
Chant has a beat, as walking does. Each time the beat lands, we call that point the ictus. It is not a louder note: it is only where the beat touches down, like a foot on the ground.

In some chant books the ictus is written as a very small upright stroke under a note.

{{staff; 3; ee'eg'hi'; Jo- seph fi- li Da- vid}}

Sing it and feel the beat land under the marked notes, lightly, without pushing. In a word of two syllables the ictus usually falls on the second; the notes between flow along. You do not need to work out where the ictus falls: it is marked for you.`,
    }),
    exercise({
      id: 'arsis-feel',
      kind: 'read',
      title: 'Lift and settle',
      notes: '',
      instructions: `
In Lesson 6 your hand drew a wave in the air as you sang. Let us look at that movement more closely. Every wave has two halves.

Throw a ball up and catch it. First it rises, and then it settles in your hand. In chant the rising half is called the arsis, and the settling half is called the thesis. Your hand is arsis or thesis at each ictus.

{{staff; 3; ee'eg'hi'; Jo- seph fi- li Da- vid; - a - a - t}}

The line curls round an arsis and lowers into a thesis. Sing it and feel it: lift, settle, lift.

Here is a rule of thumb, not a law. A phrase begins with an arsis, and so does an ictus on a note that rises from the note before it. Every other ictus is a thesis, and the end of a phrase is always a thesis. Two arses can follow one another, but never three: the second makes a loop around its note. The line lifts over the notes between the ictus marks and settles under each thesis.`,
    }),
    exercise({
      id: 'arsis-1',
      kind: 'mark',
      title: 'Alleluia',
      notes: "gg'hg'",
      clefLine: clef4,
      key: 'sol=a',
      text: 'Al- le- lú- ia',
      instructions: `
Now you decide. Sing "Alleluia" with your hand. At each ictus, is it an arsis (the hand lifts) or a thesis (the hand settles)?

Tap a marked note, then choose. Remember: a phrase begins with an arsis, and a note that rises is an arsis. Everything else settles.`,
    }),
    exercise({
      id: 'arsis-2',
      kind: 'mark',
      title: 'Joseph, son of David',
      notes: "ee'eg'hi'",
      // "seph" and "li" are two arses in a row: the melody lifts from the repeated low note
      gestures: '-a-a-t',
      clefLine: 3,
      key: 'sol=e',
      text: 'Jo- seph fi- li Da- vid',
      instructions: `
Here the melody stays low for a while and then climbs. Mark each ictus as an arsis or a thesis.`,
    }),
    exercise({
      id: 'arsis-3',
      kind: 'mark',
      title: 'You are the blessed',
      notes: "fe'fe'd",
      clefLine: clef4,
      key: 'fa=a',
      text: 'Be- ne- dí- ctus es',
      instructions: `
This melody goes up a little and down again. Mark each ictus.`,
    }),
  ],
};
