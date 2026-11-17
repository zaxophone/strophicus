import { exercise, Lesson } from '../../exercise/exercise';
import { withoutText } from '../../chant/gabc';

// Lesson 11, "A New Song": a Latin sentence (Psalm 144:9a) sung six ways, first all
// on one note (psalmody), then lifted on the accented syllable of "cantábo", and
// finally with a group of two notes on "us". Workbook pp. 20-21. The staves are
// read from the instructor edition p. 29-32; the clef is on the top line, so
// do is j, ti is i, la is h, sol is g and fa is f. The Kyrie warm-up has its
// clef on the third line (c3), where do is h. The flat sign in melodies 2-6 is
// on the ti of "tá": it is sung te.
const workbook = "Words with Wings Children's Workbook";
const instructor = 'Words with Wings Instructor Edition';

export const KYRIE = '(c3) Ký(h)ri(f)e(f) e(f)lé(f)i(e)son(f)';

const WORDS = 'Deus, canticum novum cantabo tibi.';

/** The sentence on one pitch, with the notes given for each syllable (De us cán ti cum no vum can tá bo ti bi). */
const deus = (
  de: string,
  us: string,
  tá: string,
  end: [string, string, string],
  mid = 'h',
): string =>
  `(c4) De(${de})us,(${us}) cán(${mid})ti(${mid})cum(${mid}) no(${mid})vum(${mid}) can(${mid})tá(${tá})bo(${end[0]}) ti(${end[1]})bi.(${end[2]})`;

export interface Melody {
  n: number;
  key: string;
  gabc: string;
  intro: string;
}

export const MELODIES: Melody[] = [
  {
    n: 1,
    key: 'la=a',
    gabc: deus('h', 'h', 'h', ['h', 'h', 'h']),
    intro: `
We will sing the whole Latin phrase on one note the first time, as we have become used to doing. Look at melody 1 on page 20 of your workbook: all twelve notes are la.`,
  },
  {
    n: 2,
    key: 'la=a',
    gabc: deus('h', 'h', 'ixi', ['h', 'h', 'h']),
    intro: `
Let us look for an important word and lift the tone on its accented syllable. Here the second syllable of "cantábo" goes up to te: the note has a flat sign in front of it, so you sing te, not ti.

Do you remember what we called the note over the second syllable of "cantábo"? It is the accent.`,
  },
  {
    n: 3,
    key: 'la=a',
    gabc: deus('h', 'h', 'ixi', ['h', 'g', 'h']),
    intro: `
In Gregorian chant, as in all art, balance is very important. If the melody goes up in one spot, you can restore the balance by going down somewhere else. Here the melody goes down on "ti" of "tibi".

Because it goes down, "tibi" gets extra attention as well. It is an accent that does not go up, but sounds as if you are bowing respectfully.`,
  },
  {
    n: 4,
    key: 'sol=g',
    gabc: deus('g', 'h', 'ixi', ['h', 'g', 'h']),
    intro: `
We make the melody even more beautiful. Before birds (or airplanes) can fly, they must take off. It is the same with a Gregorian melody: we start a little lower, on sol. The note after "De" is la, as before.`,
  },
  {
    n: 5,
    key: 'fa=f',
    gabc: deus('f', 'h', 'ixi', ['h', 'g', 'h']),
    intro: `
Or a little lower still: the first note is now fa.`,
  },
  {
    n: 6,
    key: 'fa=f',
    gabc: `(c4) De(f)us,(gh) cán(h)ti(h)cum(h) no(h)vum(h) can(h)tá(ixi)bo(h) ti(g)bi.(h)`,
    intro: `
There is quite a leap at the word "Deus". Maybe we can close the gap a bit? The syllable "us" is now sung on a group of two notes. Arrive on the lower note first and then move upward, tying the notes smoothly together when you sing.

Sing it while you trace this figure in the air (workbook page 21). What you are singing should sound just like what you are drawing.`,
  },
];

export const GLORIA = '(c4) Et(e) in(g) ter(h)ra(h) pax(g) ho(h)mi(i)ni(h)bus(h,) bo(h)nae(h) vo(g)lun(hh)tá(g)tis(e)';

export const LESSON_11: Lesson = {
  id: 'wow-11',
  number: 11,
  title: 'A New Song',
  summary: 'Sing a Latin sentence on one note, lift its accent, and meet a group of two notes.',
  exercises: [
    exercise({
      id: 'wow-11-kyrie',
      recording: 15,
      title: 'Warm-up: Kyrie eleison',
      key: 'do=a/b-flat/b',
      gabc: KYRIE,
      instructions: `
Let us begin by singing. The names of the notes are: do, la, la, la, la, sol, la. Sing the Kyrie eleison with the words.

Note that here the clef is on the third line from the bottom.`,
      source: `${instructor}, Lesson 11, p. 29`,
    }),
    exercise({
      id: 'wow-11-text',
      recording: 26,
      title: 'A Latin sentence',
      kind: 'read',
      instructions: `
Here is a Latin sentence: "${WORDS}" (Psalm 144:9a). Press Hear the choir to hear it spoken.

Word for word:

Deus = God
canticum = a song
novum = new
cantabo = I will sing
tibi = for you

On page 20 of your workbook you can see the Latin phrase and its words, translated. Can you write an English sentence using these words on the dotted line?

Then we sing the whole phrase on one note, as we have become used to doing.`,
      source: `${workbook}, p. 20; ${instructor}, Lesson 11, p. 29`,
    }),
    ...MELODIES.map((m) =>
      exercise({
        id: `wow-11-${m.n}`,
        recording: 26 + m.n,
        title: `Melody ${m.n}`,
        key: m.key,
        gabc: m.gabc,
        instructions: m.intro.trim(),
        source: `${workbook}, p. ${m.n <= 3 ? 20 : 21}, melody ${m.n}; ${instructor}, Lesson 11, p. ${m.n <= 3 ? 29 : 31}`,
      }),
    ),
    exercise({
      id: 'wow-11-gloria',
      recording: 18,
      title: 'Et in terra pax',
      key: 'mi=f-sharp/g/g-sharp',
      gabc: GLORIA,
      instructions: `
Let us finish this lesson by singing the words the angels sang as they looked down upon Jesus lying in the manger: "Et in terra pax hominibus bonae voluntatis" (and on earth peace to men of good will).

Sing along with the choir. Take a short pause at the small tick above the staff after "hominibus".`,
      source: `${instructor}, Lesson 11, p. 31-32`,
    }),
    exercise({
      id: 'wow-11-names',
      title: 'Name the notes',
      kind: 'name',
      key: 'mi=f-sharp/g/g-sharp',
      gabc: withoutText(GLORIA),
      instructions: `
This is the homework of the lesson (page 21 of the workbook): write down the note names of the melody you just sang. With which note do you begin? Find do on the clef, then count up or down from there.`,
      source: `${workbook}, p. 21; ${instructor}, Lesson 11, p. 32`,
    }),
  ],
};
