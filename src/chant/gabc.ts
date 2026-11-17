/**
 * Reads chant written in gabc, the text format of Gregorio (https://gregorio-project.github.io/gabc/):
 *
 *   (c4) Pu(d)er(f) na(f)tus(e) in(f) Bét(g)le(f)hem,(e;) al(d)le(f)lú(e_)ia.(d.)
 *
 * Only the music part of a gabc file is written ("a snippet", as GregorioTeX's
 * \gabcsnippet takes it): a clef in its own parentheses, then each syllable's text
 * followed by its notes in parentheses. A header ending in `%%` is accepted and
 * ignored. This reads the part of gabc the app can draw and refuses the rest with
 * an error instead of misreading it:
 *
 *   - pitches a..m on a four-line staff, after a do clef (`c1` to `c4`) or a fa clef (`f1` to `f4`)
 *   - notes in one pair of parentheses with no space between them are one joined
 *     figure on one syllable: `(gh)`; a syllable with no text is written `(g)`
 *   - after a note: `.` dot (punctum mora), `_` line over it (episema), `'` ictus,
 *     `x` flat sign (only before ti; it holds on that line or space until the next bar)
 *   - divisions inside the parentheses after the notes, or alone: `,` divisio minima (a
 *     short tick), `;` divisio minor (a half bar: a one-beat rest), `:` divisio maior (a full bar, also a
 *     rest), `::` divisio finalis
 *     (a double bar)
 *   - `(z)`: a line break, so the staff starts a new line there (with a custos, the little
 *     guide note, at the end of the line above)
 *   - text: syllables of one word touch each other and a space starts the next word, so
 *     `Pu(d)er(f) na(f)tus(e)` is Pu- er na- tus; `-` after a syllable's text is allowed
 *
 *   - `~`, `>`, `<` after the last note of a group: a liquescent (half-voiced) ending
 *
 *   - `!`, `/` or a space inside the parentheses: a break between neumes on one syllable, as in
 *     `rí(ghh!jv)a`; the later neumes stand under the same syllable with no text of their own
 *   - `..` after a note is read as the one dot, `v` (virga) on a single note as a plain note, and
 *     `[...]` after an episema (its placement) is ignored
 *
 * Not read yet, and refused: clefs with a flat (`cb3`), naturals, liquescents on a single note,
 * quilismas and the other note shapes and modifiers.
 */

import type { Group, ParsedPhrases } from './chant';

export interface ParsedGabc extends ParsedPhrases {
  /** Notes where a new staff line starts, from forced line breaks `(z)`. */
  breaks: number[];
  /** Line (1 = bottom) carrying the clef. */
  clefLine: number;
  /** The text under each syllable, with a trailing `-` where the word goes on, as the book prints it; absent if the snippet has no text. */
  words?: string[];
}

const DIVISION = /^(,|;|:|::)$/;

/** Reads a gabc snippet; throws if it uses anything the app does not draw. */
export function parseGabc(source: string): ParsedGabc {
  function fail(message: string): never {
    throw new Error(`${message}: "${source.trim()}"`);
  }

  // drop a gabc header, and comments (a % to the end of the line)
  let body = source;
  const header = /^\s*%%\s*$/m.exec(body);
  if (header) body = body.slice(header.index + header[0].length);
  body = body.replace(/%.*$/gm, '');

  let notes = '';
  const bars: number[] = [];
  const doubles: number[] = [];
  const majors: number[] = [];
  const ticks: number[] = [];
  const moras: number[] = [];
  const episemas: number[] = [];
  const ictus: number[] = [];
  const flats: number[] = [];
  const liquescents: { note: number; mark: '~' | '>' | '<' }[] = [];
  const breaks: number[] = [];
  const groups: Group[] = [];
  const lyrics: string[] = [];
  /** Whether a space came before each syllable's text, which starts a new word. */
  const wordStart: boolean[] = [];
  /** Whether each neume goes on the syllable before it (a second neume of one syllable, after `!` or `/`). */
  const continues: boolean[] = [];
  let clefLine: number | null = null;
  let clef: 'c' | 'f' = 'c';
  let pending: 'tick' | 'bar' | 'major' | 'double' | null = null;

  const setPending = (division: string) => {
    if (division === ',') pending ??= 'tick';
    else pending = division === '::' ? 'double' : division === ':' ? 'major' : 'bar';
  };

  let rest = body;
  while (rest.length > 0) {
    const open = rest.indexOf('(');
    if (open < 0) {
      if (rest.trim() !== '') fail('Text after the last parentheses has no notes');
      break;
    }
    const close = rest.indexOf(')', open);
    if (close < 0) fail('A parenthesis is never closed');
    const lyric = rest.slice(0, open);
    const music = rest.slice(open + 1, close);
    rest = rest.slice(close + 1);

    // the clef
    if (/^[cf]b?[1-4]$/.test(music)) {
      if (notes.length > 0 || clefLine !== null) fail('A clef is only read at the start');
      if (music.length !== 2) fail(`Only the do clef (c1 to c4) and the fa clef (f1 to f4) are read, not "${music}"`);
      clef = music[0] as 'c' | 'f';
      clefLine = Number(music[1]);
      if (lyric.trim() !== '') fail('A clef has no text');
      continue;
    }
    if (clefLine === null) fail('A snippet starts with its clef, such as (c4)');

    // a forced line break: the staff starts a new line before the next note, and shows a custos
    if (music === 'z') {
      if (lyric.trim() !== '') fail('A line break has no text');
      if (notes.length > 0 && !breaks.includes(notes.length)) breaks.push(notes.length);
      continue;
    }

    // a division on its own: it belongs after the notes before it
    if (/^[,;:]/.test(music) && !/[a-m]/.test(music)) {
      if (!DIVISION.test(music)) fail(`Only the divisions , ; : and :: are read, not "${music}"`);
      if (lyric.trim() !== '') fail('A division on its own has no text');
      if (notes.length > 0) setPending(music);
      continue;
    }

    // a syllable: its text, and its notes
    const first = notes.length;
    let pendingBeforeFirst = pending;
    pending = null;
    let i = 0;
    let lastNote = -1;
    let afterNotes = false;
    // The neume being read: the notes between the start of the syllable (or a `!` or `/`) and its end.
    let neumeStart = first;
    let virga = false;
    let neumesSoFar = 0;
    const endNeume = () => {
      const length = notes.length - neumeStart;
      if (length === 0) fail('A neume break needs notes on both sides');
      if (virga && length > 1) fail('A virga (v) is read only on a note of its own');
      if (length > 1) groups.push({ start: neumeStart, length });
      for (const { note } of liquescents) {
        if (note >= neumeStart && (note !== notes.length - 1 || length < 2)) {
          fail('A liquescent mark is read only on the last note of a group');
        }
      }
      // the first neume of a syllable carries its text; the others go on under it
      const text = lyric.replace(/^-/, '').trim();
      if (neumesSoFar === 0 && /\s/.test(text)) fail(`A syllable's text cannot have a space inside it ("${text}")`);
      wordStart.push(neumesSoFar === 0 && /^\s/.test(lyric));
      continues.push(neumesSoFar > 0);
      lyrics.push(neumesSoFar === 0 ? text : '');
      neumesSoFar++;
      neumeStart = notes.length;
      virga = false;
      lastNote = -1;
    };
    while (i < music.length) {
      const ch = music[i];
      if (/[a-m]/.test(ch)) {
        if (afterNotes) fail('A note cannot follow a division in one syllable');
        if (notes.length === first && pendingBeforeFirst !== null && notes.length > 0) {
          if (pendingBeforeFirst === 'tick') ticks.push(notes.length);
          else {
            bars.push(notes.length);
            if (pendingBeforeFirst === 'double') doubles.push(notes.length);
            if (pendingBeforeFirst === 'major') majors.push(notes.length);
          }
          pendingBeforeFirst = null;
        }
        notes += ch;
        lastNote = notes.length - 1;
        i++;
      } else if (ch === '~' || ch === '>' || ch === '<') {
        if (lastNote < 0 || afterNotes) fail(`"${ch}" must follow a note`);
        if (liquescents.some((l) => l.note === lastNote)) fail('A note has only one liquescent mark');
        liquescents.push({ note: lastNote, mark: ch });
        i++;
      } else if (ch === '.' || ch === '_' || ch === "'" || ch === 'x') {
        if (lastNote < 0 || afterNotes) fail(`"${ch}" must follow a note`);
        // a second dot (punctum mora vocis productae) is read as the one dot
        if (ch === '.' && moras.includes(lastNote) && music[i - 1] === '.' && music[i - 2] !== '.') {
          i++;
          continue;
        }
        const list = ch === '.' ? moras : ch === '_' ? episemas : ch === "'" ? ictus : flats;
        const name = ch === '.' ? 'dot' : ch === '_' ? 'episema' : ch === "'" ? 'ictus' : 'flat sign';
        if (list.includes(lastNote)) fail(`A note has only one ${name}`);
        list.push(lastNote);
        i++;
      } else if (ch === ',' || ch === ';' || ch === ':') {
        if (lastNote < 0) fail('A division needs a note before it');
        if (afterNotes) fail('Only one division is read in one pair of parentheses');
        const division = music.startsWith('::', i) ? '::' : ch;
        // anything after a division in the same parentheses must be another division or nothing
        setPending(division);
        afterNotes = true;
        i += division.length;
      } else if (ch === 'v') {
        // a virga is a single note drawn with a stem; it is drawn here as a plain note
        if (lastNote < 0 || afterNotes) fail('"v" must follow a note');
        virga = true;
        i++;
      } else if (ch === '[') {
        // attributes of the sign before it (where an episema sits), which only change how it is drawn
        const end = music.indexOf(']', i);
        if (end < 0 || lastNote < 0 || music[i - 1] !== '_') fail('"[" is read only after an episema');
        i = end + 1;
      } else if (ch === '!' || ch === '/' || ch === ' ') {
        if (afterNotes) fail('A neume break cannot follow a division');
        endNeume();
        i++;
      } else if (/[A-Z]/.test(ch)) {
        fail(`"${ch}" is a note shape (inclinatum or liquescent) that is not read yet`);
      } else {
        fail(`"${ch}" is not read yet`);
      }
    }
    if (notes.length === first) fail('Parentheses with no notes or division');
    endNeume();
  }
  if (clefLine === null) fail('A snippet starts with its clef, such as (c4)');

  // an exercise's divisions after its last note are not kept (the staff always ends with a bar)
  let words: string[] | undefined;
  if (lyrics.some((t) => t !== '')) {
    if (lyrics.some((t, i) => t === '' && !continues[i])) fail('Either every syllable has text or none does');
    // a hyphen follows a syllable's text when the next syllable (not its second neume) goes on the same word
    words = lyrics.map((t, i) => {
      if (continues[i]) return '';
      let next = i + 1;
      while (next < lyrics.length && continues[next]) next++;
      return next < lyrics.length && !wordStart[next] ? `${t}-` : t;
    });
  }
  return { clef, clefLine, notes, bars, doubles, majors, ticks, moras, episemas, ictus, flats, liquescents, groups, breaks: breaks.filter((b) => b < notes.length), words };
}

/** The same snippet without its text: every syllable just its notes, as `(g) (h)`. */
export function withoutText(gabc: string): string {
  const parts = [...gabc.matchAll(/([^()]*)\(([^)]*)\)/g)].map((m) => `(${m[2]})`);
  return parts.join(' ');
}

/** Joins snippets into one (the first one's clef is kept), as the two halves of a song. */
export function joinGabc(...parts: string[]): string {
  return parts.map((part, i) => (i === 0 ? part.trim() : part.trim().replace(/^\(c[1-4]\)\s*/, ''))).join(' ');
}
