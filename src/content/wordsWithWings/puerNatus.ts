// The melody of Puer natus in Bethlehem (workbook p. 15-19), shared by Lessons
// 8, 9 and 10, written as gabc snippets (see chant/gabc.ts). Every verse is sung to
// the same four lines of music, with the last two lines (In cordis jubilo ...) as
// the refrain; each line ends with the bar the book prints at the end of its staff
// (a double bar after the last). The clef is on the top line, so do is j and re is
// d (the key tag is [re=d]). Line 3 has the flat sign before ti.
export const PUER_NATUS_KEY = 're=d';

/** Verses 1 to 3 as gabc, one snippet per line of music, with the words as the book prints them. */
export const PUER_NATUS: Record<number, string[]> = {
  1: [
    '(c4) Pu(d)er(f) na(f)tus(e) in(f) Bét(g)le(f)hem,(e) al(d)le(f)lú(e_)ia(d.;)',
    '(c4) Un(d)de(f) gau(g)det(h) Je(g)rú(h)sa(g)lem,(f_;) al(f)le(f)lú(f)ia,(f) al(h)le(g)lú(f_)ia(e.;)',
    '(c4) In(d) cor(f)dis(g) jú(h)bi(ix)lo(j_;)',
    '(c4) Chri(j)stum(f) na(f)tum(f) a(h)do(g)ré(f_)mus,(e;) Cum(d) no(f)vo(f) cán(e)ti(e)co(d::)',
  ],
  2: [
    '(c4) As(d)súmp(f)sit(f) car(e)nem(f) Fi(g)li(f)us,(e) al(d)le(f)lú(e_)ia(d.;)',
    '(c4) De(d)i(f) Pa(g)tris(h) al(g)tis(h)si(g)mus,(f_;) al(f)le(f)lú(f)ia,(f) al(h)le(g)lú(f_)ia(e.;)',
    '(c4) In(d) cor(f)dis(g) jú(h)bi(ix)lo(j_;)',
    '(c4) Chri(j)stum(f) na(f)tum(f) a(h)do(g)ré(f_)mus(e;) cum(d) no(f)vo(f) cán(e)ti(e)co(d::)',
  ],
  3: [
    '(c4) Per(d) Ga(f)bri(f)é(e)lem(f) nún(g)ti(f)um,(e) al(d)le(f)lú(e_)ia(d.;)',
    '(c4) Vir(d)go(f) con(g)cé(h)pit(g) Fí(h)li(g)um,(f_;) al(f)le(f)lú(f)ia,(f) al(h)le(g)lú(f_)ia(e.;)',
    '(c4) In(d) cor(f)dis(g) jú(h)bi(ix)lo(j_;)',
    '(c4) Chri(j)stum(f) na(f)tum(f) a(h)do(g)ré(f_)mus(e;) Cum(d) no(f)vo(f) cán(e)ti(e)co(d::)',
  ],
};

/**
 * The five staves of workbook p. 16, where the song is written out without words for the
 * child to name. Page 15's second line is split in two here.
 */
export const PUER_NATUS_HOMEWORK: string[] = [
  '(c4) (d) (f) (f) (e) (f) (g) (f) (e) (d) (f) (e_) (d.;)',
  '(c4) (d) (f) (g) (h) (g) (h) (g) (f_;) (f) (f) (f) (f;)',
  '(c4) (h) (g) (f) (e;)',
  '(c4) (d) (f) (g) (h) (ix) (j_;)',
  '(c4) (j) (f) (f) (f) (h) (g) (f_) (e;) (d) (f) (f) (e) (e) (d::)',
];
