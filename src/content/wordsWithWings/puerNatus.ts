// The melody of Puer natus in Bethlehem (workbook p. 15-19), shared by Lessons
// 8, 9 and 10: every verse is sung to the same four lines of music, with the
// last two lines (In cordis jubilo ...) as the refrain. The clef is on the top
// line, so do is j and re is d (the key tag is [re=d]). Line 3 has the flat sign.
export const PUER_NATUS_CLEF = 4;
export const PUER_NATUS_KEY = 're=d';

/** The four lines of music, in the notation `exercise()` reads. */
export const MELODY = [
  'dffefgfedfe_d.',
  'dfghghgf_|ffffhgf_e.',
  'dfghixj_',
  'jfffhgf_e|dffeed',
];

/** The words of each verse under the four lines, one word or syllable per note as the book prints them. */
export const VERSE_TEXT: Record<number, string[]> = {
  1: [
    'Pu- er na- tus in Bét- le- hem, al- le- lú- ia',
    'Un- de gau- det Je- rú- sa- lem, al- le- lú- ia, al- le- lú- ia',
    'In cor- dis jú- bi- lo',
    'Chri- stum na- tum a- do- ré- mus, Cum no- vo cán- ti- co',
  ],
  2: [
    'As- súmp- sit car- nem Fi- li- us, al- le- lú- ia',
    'De- i Pa- tris al- tis- si- mus, al- le- lú- ia, al- le- lú- ia',
    'In cor- dis jú- bi- lo',
    'Chri- stum na- tum a- do- ré- mus cum no- vo cán- ti- co',
  ],
  3: [
    'Per Ga- bri- é- lem nún- ti- um, al- le- lú- ia',
    'Vir- go con- cé- pit Fí- li- um, al- le- lú- ia, al- le- lú- ia',
    'In cor- dis jú- bi- lo',
    'Chri- stum na- tum a- do- ré- mus Cum no- vo cán- ti- co',
  ],
};
