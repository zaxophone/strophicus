import { exercise, Lesson } from '../../exercise/exercise';
import { joinGabc } from '../../chant/gabc';

// Ave Maria (Salutatio Angelica), the Hail Mary in the simple tone: Solesmes version of the
// Liber Usualis (1961), p. 1861, mode 1, transcribed for GregoBase (id 1860) by Andrew Hinkley.
// The gabc below is that file's music, cut into its phrases at the half bars. The staves have the
// do clef on the top line (c4): do is j, ti is i, la is h, sol is g, fa is f, mi is e, re is d, do (low) is c.
// The flat sign in "Maria" lowers ti to te and holds until the next bar.
const source = 'GregoBase #1860, Ave Maria (Salutatio Angelica), Liber Usualis 1961 p. 1861';

const PHRASES = [
  {
    id: 'ave-maria-1',
    title: 'Hail Mary, full of grace',
    latin: 'Ave Maria, gratia plena, Dominus tecum,',
    english: 'Hail Mary, full of grace, the Lord is with thee,',
    gabc: "(c4) A(f)ve(c') Ma(d)rí(ixdh'!iv)a,(h.) (,) grá(h')ti(g)a(f) ple(g_[uh:l]h)na,(h.) (,) Dó(h')mi(g)nus(f') te(g)cum,(d.) (;)",
  },
  {
    id: 'ave-maria-2',
    title: 'Blessed art thou',
    latin: 'benedicta tu in mulieribus,',
    english: 'blessed art thou among women,',
    gabc: "(c4) be(g)ne(g)dí(h')cta(g) tu(f.) (,) in(ef) mu(g)li(fe)é(d)ri(cd)bus,(d.) (;)",
  },
  {
    id: 'ave-maria-3',
    title: 'And blessed is the fruit',
    latin: 'et benedictus fructus ventris tui, Jesus.',
    english: 'and blessed is the fruit of thy womb, Jesus.',
    gabc: "(c4) et(e) be(c)ne(d')dí(f)ctus(f') fru(e)ctus(f') ven(g)tris(e') tu(g)i,(fe) Je(cd)sus.(df..) (::)",
  },
  {
    id: 'ave-maria-4',
    title: 'Holy Mary, Mother of God',
    latin: 'Sancta Maria, Mater Dei, ora pro nobis peccatoribus,',
    english: 'Holy Mary, Mother of God, pray for us sinners,',
    gabc: "(c4) San(h)cta(g') Ma(h)rí(ji)a,(g.) Ma(g)ter(f) De(gh)i,(h.) (;) o(h)ra(g') pro(f) no(gf)bis(d) pec(f)ca(fe)tó(de)ri(d)bus,(c.) (;)",
  },
  {
    id: 'ave-maria-5',
    title: 'Now and at the hour of our death',
    latin: 'nunc et in hora mortis nostrae. Amen.',
    english: 'now and at the hour of our death. Amen.',
    gabc: "(c4) nunc(d) et(c) in(df) ho(ff!g)ra(f) mor(e')tis(f) no(gh)strae.(fe) A(d.)men.(d.) (::)",
  },
];

/** The whole prayer: each phrase on a line of its own. */
const WHOLE = joinGabc(...PHRASES.map((p) => p.gabc.replace(/\s*\((;|::)\)\s*$/, ' ($1)') + ' (z)')).replace(/\s*\(z\)$/, '');

export const AVE_MARIA: Lesson = {
  id: 'rep-ave-maria',
  title: 'Ave Maria',
  summary: 'The Hail Mary in the simple tone, a chant for every day.',
  free: true,
  exercises: [
    ...PHRASES.map((p, i) =>
      exercise({
        id: `rep-${p.id}`,
        title: p.title,
        gabc: p.gabc,
        source,
        instructions: `
Phrase ${i + 1} of 5 of the Ave Maria: "${p.latin}" (${p.english})

Sing it on the Latin text, one syllable to each note or joined group of notes. Sing the half bars and the little ticks as short breaths, and keep the words flowing.${
          i === 0
            ? '\n\nThe flat sign in "Maria" makes ti into te, and it holds until the next bar.'
            : ''
        }`,
      }),
    ),
    exercise({
      id: 'rep-ave-maria-whole',
      title: 'The whole prayer',
      gabc: WHOLE,
      source,
      instructions: `
Now sing the whole Ave Maria, one phrase to a line: "Ave Maria, gratia plena, Dominus tecum, benedicta tu in mulieribus, et benedictus fructus ventris tui, Jesus. Sancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen."

Take a breath at each half bar and let the last note of each line settle before the next begins.`,
    }),
  ],
};
