// Veni Sancte Spiritus (Lessons 18 to 20, workbook pp. 43-46). Staves have the do clef on
// the top line (c4): do is j, ti is i, la is h, sol is g, fa is f, mi is e. The key tag is
// [sol=a]. Read from 400 dpi scans with tools/read_staff.py and checked by eye.
export const VENI_KEY = 'sol=a';

/** The four phrases of the first half, each as the book teaches them (pp. 43). */
export const VENI_PHRASES = {
  veni: '(c4) Ve(g)ni(e) Sa(f)ncte(d) Spí(fhg)ri(fg)tus,(g)',
  reple: '(c4) re(g)ple(g) tu(g)ó(h)rum(g) cor(h)da(j) fi(g)dé(h)li(g)um,(f)',
  amoris: '(c4) et(f) tu(g)i(h) a(j)mó(ji)ris(hg)',
  ignem: '(c4) in(hj) e(hg)is(gh) i(hg)gnem(fe) ac(fgf)cén(g)de:(g)',
};

/** The first half as the book prints it on two lines (p. 44): a tick after "tus", and after "ris". */
export const VENI_LINES = [
  '(c4) Ve(g)ni(e) Sa(f)ncte(d) Spí(fhg)ri(fg)tus,(g,) re(g)ple(g) tu(g)ó(h)rum(g) cor(h)da(j) fi(g)dé(h)li(g)um,(f)',
  '(c4) et(f) tu(g)i(h) a(j)mó(ji)ris(hg,) in(hj) e(hg)is(gh) i(hg)gnem(fe) ac(fgf)cén(g)de:(g)',
];

/** The second half, "Qui per diversitátem" (workbook p. 45): the same two phrases are the last two lines of the song. */
export const VENI_QUI = {
  per: '(c4) qui(f) per(g) di(h)ver(j)si(k)tá(ji)tem(h) lin(j)guá(h)rum(g) cunc(h)tá(g)rum(f)',
  gentes: '(c4) gen(f)tes(g) in(h) u(j)ni(k)tá(ji)te(h) fi(j)dé(hg)i(gh) con(h)gre(fg)gá(g)sti.(g)',
};
