# Words with Wings — content attribution

The exercises in this folder are transcribed from **Words with Wings: Children's
Workbook** by Wilko Brouwers, which is licensed under **CC BY-SA**. They are
adapted here into a machine-readable form: standard **gabc** snippets (the text
format of [Gregorio](https://gregorio-project.github.io/gabc/)), each with the
do clef on the line the book prints it and the words under the notes as the book
prints them.

Because of the share-alike condition, this folder (and anything derived from the
workbook) should be kept apart from the app's code, with its own licence notice,
and moved to a separate package or repository before the app is published.

The wording of the instructions is adapted from the **Instructor Edition**
(Church Music Association of America, 2012, CC BY-SA 3.0): the teacher's script
is turned into directions for a student working alone. The key tags (`do=d`)
and exercise order follow that edition. Both books are © Church Music
Association of America; the adaptation is shared on the same terms.

Each exercise records the workbook page it was read from in its `source` field.
Pages are the printed page numbers.


**Notation.** Melodies are written as gabc snippets, as `\gabcsnippet` takes them: a
clef, then each syllable's text with its notes in parentheses, for example
`(c4) Pu(d)er(f) na(f)tus(e) in(f) Bét(g)le(f)hem,(e;)`. The app reads this subset:
pitches `a`-`m` after a do clef (`c1`-`c4`); notes in one pair of parentheses are a
joined figure on one syllable (`(de)`); after a note `.` is a dot (punctum mora), `_`
an episema, `'` an ictus; and the divisions `,`
(divisio minima), `;` (divisio minor, a half bar) and `::` (a double bar). Syllables of
one word touch, and a space starts the next word, so the hyphens printed under the
notes are derived. Anything else in gabc is refused with an error rather than misread.
Every snippet is also compiled with the `gregorio` program by a test
(`src/content/gabc.compile.test.ts`), so each one is valid gabc and not only valid for
this app.

**Psalm texts need a separate permission check.** The sentences in Lessons 1
and 2 ("Come, let us ring out our joy to the LORD", and the seven workbook
sentences) are quoted from *The Revised Grail Psalms*, © 2010 Conception
Abbey/The Grail, administered by GIA Publications, Inc., all rights reserved.
The book reprints them under its own permission, which the CC BY-SA licence
does not extend to. Before the app is published, get permission for these
texts or replace them with a public-domain translation.

**Not from the book.** The lesson 4 exercise "Sancte Bonefáti, ora pro nobis"
is built here by the four rules the instructor gives (p. 11–12) for the name
"Bonefáti" in the Appendix list (p. 67). The workbook has the student write
their own saint's melody.

**Recordings (`audio/`).** Recordings 1–18 are the companion Audio Library to
the books, sung by choristers of the Madeleine Choir School, Salt Lake City
(director Melanie Malinka), downloaded from
https://musicasacra.com/music-pedagogy-for-children/wings/ (hosted at
media.churchmusicassociation.org). Their tags say 2013 and give no licence, and
the same library is sold on CD, so **the books' CC BY-SA licence cannot be
assumed to cover them**. Ask the Church Music Association of America for
permission before the app is published, or drop the `audio/` folder and
`recordings.ts`. Each exercise's `recording` is the number the instructor
edition prints beside it.

**Flat sign.** From Lesson 8 on, a letter followed by `x` is a flat sign at that
height, standing before the next note (as in gabc: `ixi` is a flat on ti, then the note
ti, and `ixdh` a flat on ti before the notes re and la); it is allowed only on ti,
which is then sung as te, and holds on that line or space until the next bar. Recordings 19 and 20 (Lesson 8) are bundled like 1-18,
with the same unclear-rights note.

**Later lessons (11 to 20).** Lessons 11-20 are encoded the same way, from the instructor
edition (and the workbook scan where the edition's page edge cuts a staff off).
Recordings 26-94 are bundled too: the audio folder is now 38 MB, with the same
unclear-rights note as above, so that is also a size to weigh before publishing.
New notation these lessons use: the fa clef (`f3`), line breaks (`(z)`), the full bar
(`:`), the liquescent marks `~` `>` `<`, repeated notes in one syllable (`(gg)`), and
key tags with "te" (te is the flatted ti). The A/B/C listening puzzles of Lessons 13-15
are one sing page per phrase, since the app plays one recording per page. The wavy
movement lines the books draw over the Alleluias of Lesson 17 are encoded as `gestures`
(`-` over a note, `t` under it, `a` curling round it, `.` no line), read from the scan.
`tools/read_staff.py` and `tools/read_page.py` read note heads from a scan as gabc
letters; every staff of Lessons 11-20 was checked against them.

**Repertoire (`src/content/repertoire/`), not from the workbook.** *Ave Maria* (Salutatio
Angelica, simple tone) is the GregoBase chant no. 1860 (https://gregobase.selapa.net/chant.php?id=1860),
Solesmes version of the Liber Usualis 1961 p. 1861 (also Chants of the Church 1956 p. 86), mode 1,
transcribed to gabc by Andrew Hinkley. Check GregoBase's licence terms for that chant before
the app is published. The gabc is used as it stands, cut into phrases, with these changes the
app needs: `ho(ffg)ra` is written `ho(ff!g)ra` (the app has no single figure for it), and the
double dot `..` is read as one dot, a virga as a plain note.
