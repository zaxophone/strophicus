import { exercise, Lesson } from '../../exercise/exercise';

// Lesson 1, "Words with Wings": speaking a sentence and deciding which word
// matters most. There is no notation in it. The workbook has seven short psalm
// sentences (p. 1); the student reads one aloud and marks the word they chose
// to give wings. The instructor's script is turned into text for a student
// working alone.
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

export const LESSON_1: Lesson = {
  id: 'wow-1',
  number: 1,
  title: 'Words with Wings',
  summary: 'Speak a sentence and hear which word matters most.',
  exercises: [
    exercise({
      id: 'wow-1-words',
      title: 'Some words are more important',
      kind: 'read',
      instructions: `
To understand how to sing Gregorian chant, let us begin with a sentence. Speaking and singing chant fit closely together.

Here is a sentence of ten words:

**Come, let us ring out our joy to the LORD.**

Are all the words of the same importance?

Say it three times. First lift your voice on **joy**. Then say it again and lift your voice on **our**. Then once more, lifting it on **LORD**.

**Come, let us ring out our joy to the LORD.**

Each time the sentence means something a little different. With **joy** it says: **Let's not only greet him, but do so with joy!** With **our**: **Let the joy that is rung out be truly ours!** With **LORD**: **Let us ring it out to the LORD, and not to anyone else!**

How can you hear that one word matters more than the others? Your voice goes up on it. It is as if that one word had been given wings.`,
      source: `${instructor}, Lesson 1, p. 4`,
    }),
    exercise({
      id: 'wow-1-pick',
      title: 'Choose your word',
      kind: 'accent',
      lines: [
        'I will thank you forever.',
        'O that I had wings like a dove.',
        'I will sing to your name forever.',
        'Your right hand upholds me.',
        'Sing a new song to the LORD.',
        'His mighty works he has shown to his people.',
        'God is the strength of my heart.',
      ],
      instructions: `
Here are seven short sentences from the Psalms. Pick one and read it aloud, so that anyone listening could hear which word you value most.

Then mark that word with an accent mark: tap it. The mark goes above the word you gave wings. You can try other words and other sentences too.`,
      source: `${workbook}, p. 1; ${instructor}, Lesson 1, p. 5`,
    }),
  ],
};
