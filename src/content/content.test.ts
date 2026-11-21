import { staffPosition, units } from '../chant/chant';
import { parseBlock } from '../exercise/blocks';
import { noteTimings, timingSpec } from '../exercise/exercise';
import { judgeMelody } from '../exercise/judge';
import { ALL_EXERCISES, LESSONS } from '../exercise/lessons';
import { RECORDINGS } from './wordsWithWings/recordings';
import { LESSON_3 } from './wordsWithWings/lesson3';

const byId = (id: string) => ALL_EXERCISES.find((e) => e.id === id)!;
/** The exercises with a melody on a staff (the others are only read, or pick a word from a sentence). */
const withNotes = ALL_EXERCISES.filter((e) => e.chant.notes.length > 0);
const bookLessons = LESSONS.filter((l) => l.id.startsWith('wow-'));

describe('lesson content', () => {
  it('has unique exercise ids', () => {
    const ids = ALL_EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps syllables, offsets, beats and notes in step', () => {
    for (const e of ALL_EXERCISES) {
      const n = e.chant.notes.length;
      expect([e.id, e.labels.length, e.offsets.length, e.beats.length]).toEqual([e.id, n, n, n]);
      if (e.words) expect([e.id, e.words.length]).toEqual([e.id, units(e.chant).length]);
      for (const bar of [...e.chant.bars, ...e.chant.ticks]) expect(bar).toBeGreaterThan(0), expect(bar).toBeLessThan(n);
      for (const bar of e.chant.doubles) expect(e.chant.bars).toContain(bar);
      for (const letter of e.chant.notes) {
        const p = staffPosition(letter);
        expect(p).toBeGreaterThanOrEqual(-4);
        expect(p).toBeLessThanOrEqual(10);
      }
    }
  });

  it('can be sung correctly from any starting pitch', () => {
    for (const e of withNotes) {
      for (const start of [48, 55.3, 62.7]) {
        const sung = e.offsets.map((o, i) => ({
          midi: start + o - e.offsets[0],
          startFrame: i * 20,
          frames: 15,
          open: i === e.offsets.length - 1,
        }));
        expect(judgeMelody(sung, e.offsets).passed).toBe(true);
      }
    }
  });

  it('gives every exercise written instructions and every lesson a summary', () => {
    for (const lesson of LESSONS) {
      expect(lesson.summary.length).toBeGreaterThan(10);
      for (const e of lesson.exercises) {
        expect([e.id, e.instructions.length > 40]).toEqual([e.id, true]);
        expect(e.instructions).toBe(e.instructions.trim());
      }
    }
  });

  it('records where the workbook exercises came from', () => {
    for (const lesson of bookLessons) {
      for (const e of lesson.exercises) expect([e.id, e.source]).toEqual([e.id, expect.stringMatching(/Words with Wings/)]);
    }
  });

  it('draws every picture in the instructions', () => {
    for (const e of ALL_EXERCISES) {
      for (const paragraph of e.instructions.split(/\n\s*\n/)) expect(() => parseBlock(paragraph)).not.toThrow();
    }
  });

  it('gives every accent exercise either a melody and its answer, or sentences to pick from', () => {
    for (const e of ALL_EXERCISES.filter((x) => x.kind === 'accent')) {
      if (e.chant.notes) {
        expect(e.answer).toBeGreaterThanOrEqual(0);
        expect(e.answer).toBeLessThan(e.chant.notes.length);
      } else {
        expect(e.lines!.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('Lesson 3 as transcribed from the workbook', () => {
  it('sings the scale up from the low do to the clef do and back down', () => {
    const e = byId('wow-3-scale');
    expect(e.labels).toEqual([
      'do', 're', 'mi', 'fa', 'sol', 'la', 'ti', 'do',
      'ti', 'la', 'sol', 'fa', 'mi', 're', 'do',
    ]);
    expect(e.offsets).toEqual([-12, -10, -8, -7, -5, -3, -1, 0, -1, -3, -5, -7, -8, -10, -12]);
    expect(e.chant.breaks).toEqual([8]); // up on one line, down on the next
  });

  it('puts exercise 1 on do re mi with four bars', () => {
    const e = byId('wow-3-1');
    expect(e.labels.slice(0, 3)).toEqual(['do', 're', 'mi']);
    expect(e.chant.notes).toHaveLength(15);
    expect(e.chant.bars).toEqual([3, 6, 9, 12]);
    expect(e.offsets.slice(0, 6)).toEqual([-12, -10, -8, -8, -10, -12]);
  });

  it('puts exercise 2 in four phrases of four', () => {
    const e = byId('wow-3-2');
    expect(e.chant.notes).toHaveLength(16);
    expect(e.chant.bars).toEqual([4, 8, 12]);
    expect(e.labels.slice(0, 4)).toEqual(['do', 're', 'mi', 're']);
  });

  it('starts exercise 3 on re, as the book prints', () => {
    const e = byId('wow-3-3');
    expect(e.labels[0]).toBe('re');
    expect(e.chant.notes).toHaveLength(18);
    expect(e.chant.bars).toEqual([4, 9, 13]);
  });
});

describe('naming exercises in Lesson 3', () => {
  const naming = LESSON_3.exercises.filter((e) => e.kind === 'name');

  it('pair each with a singing exercise of the same notes', () => {
    expect(naming.map((e) => e.id)).toEqual([
      'wow-3-names',
      'wow-3-1-names',
      'wow-3-2-names',
      'wow-3-3-names',
    ]);
    for (const id of ['wow-3-1', 'wow-3-2', 'wow-3-3']) {
      const named = byId(`${id}-names`);
      const sung = byId(id);
      expect(named.chant).toEqual(sung.chant);
      expect(named.labels).toEqual(sung.labels);
      expect(named.key).toEqual(sung.key);
      // the singing exercise comes straight after its naming exercise
      const all = LESSON_3.exercises.map((e) => e.id);
      expect(all.indexOf(id)).toBe(all.indexOf(`${id}-names`) + 1);
    }
  });

  it('give the book hints as the first notes, never the whole melody', () => {
    for (const e of naming) {
      expect(e.given).toBeGreaterThanOrEqual(1);
      expect(e.given).toBeLessThan(e.labels.length);
    }
    expect(byId('wow-3-1-names').given).toBe(3);
  });

  it('name the descending scale printed on workbook page 4', () => {
    expect(byId('wow-3-names').labels).toEqual(['do', 'ti', 'la', 'sol', 'fa', 'mi', 're', 'do']);
  });

  it('take the key from the instructor edition', () => {
    expect(byId('wow-3-1').key).toEqual({ syllable: 'do', pitchClass: 2 });
    expect(byId('wow-3-3').key).toEqual({ syllable: 're', pitchClass: 4 });
  });
});

describe('rhythm in the lessons', () => {
  it('gives every plain note one beat and a dotted note two', () => {
    expect(byId('long-note').beats).toEqual([1, 1, 2, 1, 1]);
    expect(byId('long-note').chant.moras).toEqual([2]);
    const plain = (x: { chant: { moras: number[]; episemas: number[]; ticks: number[] } }) =>
      x.chant.moras.length + x.chant.episemas.length + x.chant.ticks.length === 0;
    for (const e of ALL_EXERCISES.filter(plain)) {
      expect(e.beats.every((b) => b === 1)).toBe(true);
    }
  });

  it('lengthens a note with an episema, and the note before a tick, a little', () => {
    expect(byId('wow-2-1').beats).toEqual([1.5, 1, 1, 1, 1, 1, 1, 1, 1, 2]);
    expect(byId('wow-2-1-tick').beats).toEqual([1.5, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
    // a tick is no rest: the next note follows at once
    expect(noteTimings(byId('wow-2-1-tick'))[0]).toEqual({ held: 1.5, advance: 1.5, rest: false });
  });

  it('does not lengthen a dotted final note twice over', () => {
    expect(noteTimings(byId('wow-2-1'))[9]).toEqual({ held: 2, advance: 2, rest: false });
    expect(noteTimings(byId('wow-3-1'))[14].held).toBe(2);
  });

  it('gives the note before a half bar one beat of sound and one beat of rest', () => {
    const timings = noteTimings(byId('wow-3-1'));
    expect(timings).toHaveLength(15);
    for (const k of [2, 5, 8, 11]) {
      expect(timings[k]).toEqual({ held: 1, advance: 2, rest: true });
    }
    expect(timings[0]).toEqual({ held: 1, advance: 1, rest: false });
    // the final note is lengthened a little
    expect(timings[14].held).toBe(2);
  });

  it('lets the half bar cut off the second beat of a dotted note before it', () => {
    const timings = noteTimings(byId('dotted-bar'));
    // fa sol mi. | sol fa: mi is dotted and a bar follows it
    expect(byId('dotted-bar').beats).toEqual([1, 1, 2, 1, 1]);
    expect(timings[2]).toEqual({ held: 1, advance: 2, rest: true });
    // a dotted note with no bar after it sounds for both beats
    expect(noteTimings(byId('long-note'))[2]).toEqual({ held: 2, advance: 2, rest: false });
  });

  it('gives the judge the time to the next note, how long it sounds, and where the rests are', () => {
    for (const e of withNotes) {
      const spec = timingSpec(e);
      expect(spec.advance).toHaveLength(e.offsets.length);
      expect(spec.held).toHaveLength(e.offsets.length);
      expect(spec.rest).toHaveLength(e.offsets.length);
    }
    expect(timingSpec(byId('wow-3-1')).rest.filter(Boolean)).toHaveLength(4);
  });

  it('can be sung correctly with even notes', () => {
    for (const e of withNotes) {
      let at = 0;
      const sung = e.offsets.map((o, i) => {
        const t = noteTimings(e)[i];
        // each note sounds a little less than it is worth, then the detector holds it a moment
        const note = { midi: 55 + o - e.offsets[0], startFrame: at, frames: 20 * t.held - 2 + 8, open: i === e.offsets.length - 1 };
        at += 20 * t.advance;
        return note;
      });
      const j = judgeMelody(sung, e.offsets, 50, timingSpec(e));
      expect([e.id, j.passed, j.timingOk]).toEqual([e.id, true, true]);
    }
  });
});

describe('the book\'s recordings', () => {
  it('only point at recordings that are bundled', () => {
    for (const e of ALL_EXERCISES.filter((x) => x.recording !== undefined)) {
      expect([e.id, e.recording! in RECORDINGS]).toEqual([e.id, true]);
    }
  });

  it('never give away the answer to a naming exercise', () => {
    // the choirs sing the note names, so a naming exercise must not play them
    for (const e of ALL_EXERCISES.filter((x) => x.kind === 'name')) expect(e.recording).toBeUndefined();
  });

  it('puts melodies 1, 2 and 3 of Lesson 2 on recordings 2, 3 and 4 in every notation', () => {
    for (const [n, rec] of [[1, 2], [2, 3], [3, 4]]) {
      for (const suffix of ['-which', '', '-tick']) expect(byId(`wow-2-${n}${suffix}`).recording).toBe(rec);
    }
  });

  it('matches the Lesson 3 exercises to recordings 5, 6 and 7, and Lesson 5 to 9, 10 and 11', () => {
    expect([1, 2, 3].map((n) => byId(`wow-3-${n}`).recording)).toEqual([5, 6, 7]);
    expect(['wow-5-1', 'wow-5-2', 'wow-5-3'].map((id) => byId(id).recording)).toEqual([9, 10, 11]);
    expect(byId('wow-4-1').recording).toBe(8);
  });
});

describe('groups of notes in the lessons', () => {
  it('sings a joined pair as two notes on one syllable', () => {
    const e = byId('joined-pair');
    expect(e.chant.groups).toEqual([{ start: 1, length: 2 }, { start: 4, length: 2 }]);
    expect(e.labels).toEqual(['do', 'do', 're', 'mi', 'fa', 're', 'do']);
    expect(e.offsets).toHaveLength(7);
    expect(units(e.chant)).toHaveLength(5);
  });

  it('judges every note of a group, so a wrong note inside a figure is caught', () => {
    const e = byId('joined-three');
    const sung = e.offsets.map((o, i) => ({ midi: 55 + o - e.offsets[0] + (i === 2 ? 2 : 0), startFrame: i * 20, frames: 15, open: false }));
    expect(judgeMelody(sung, e.offsets).passed).toBe(false);
  });
});

describe('Lessons 1 and 2 and the introduction', () => {
  it('only reads the introduction', () => {
    expect(LESSONS[0].exercises.map((e) => e.kind)).toEqual(['read', 'read']);
  });

  it('lets the student mark a word in the seven workbook sentences', () => {
    expect(byId('wow-1-pick').lines).toHaveLength(7);
  });

  it('sets the three melodies of workbook p. 2 on la, the line below the clef', () => {
    expect(byId('wow-2-1-which').chant.notes).toBe('hhhhghiiih');
    expect(byId('wow-2-2-which').chant.notes).toBe('hhhghihhgh');
    expect(byId('wow-2-3-which').chant.notes).toBe('hhhhhhhghi');
    expect(byId('wow-2-1').labels.slice(0, 4)).toEqual(['la', 'la', 'la', 'la']);
    expect(byId('wow-2-1').key).toEqual({ syllable: 'la', pitchClass: 9 });
  });

  it('puts the line over "Come" and the dot on the last word, as p. 2 prints them', () => {
    for (const id of ['wow-2-1', 'wow-2-2', 'wow-2-3']) {
      expect(byId(id).chant.episemas).toEqual([0]);
      expect(byId(id).chant.moras).toEqual([9]);
      expect(byId(id).words).toEqual('Come, let us ring out our joy to the LORD!'.split(' '));
    }
  });

  it('puts a tick after "Come" and no line or dot, as p. 3 prints them', () => {
    for (const id of ['wow-2-1-tick', 'wow-2-2-tick', 'wow-2-3-tick']) {
      expect(byId(id).chant.ticks).toEqual([1]);
      expect(byId(id).chant.episemas).toEqual([]);
      expect(byId(id).chant.moras).toEqual([]);
    }
  });

  it('has the same melodies in both notations', () => {
    for (const n of [1, 2, 3]) {
      expect(byId(`wow-2-${n}-tick`).chant.notes).toBe(byId(`wow-2-${n}`).chant.notes);
      expect(byId(`wow-2-${n}-tick`).offsets).toEqual(byId(`wow-2-${n}-which`).offsets);
    }
  });

  it('asks for the word the melody rises on, which is its first highest note', () => {
    for (const n of [1, 2, 3]) {
      const e = byId(`wow-2-${n}-which`);
      expect(e.answer).toBe(e.offsets.indexOf(Math.max(...e.offsets)));
    }
    expect(['joy', 'our', 'LORD']).toEqual([1, 2, 3].map((n) => byId(`wow-2-${n}-which`).words![byId(`wow-2-${n}-which`).answer!].replace(/\W/g, '')));
  });
});

describe('Lessons 4 and 5 as transcribed from the workbook', () => {
  it('puts the clef on the third line, with do on it', () => {
    for (const lesson of LESSONS.filter((l) => l.number === 4 || l.number === 5)) {
      for (const e of lesson.exercises) expect([e.id, e.chant.clefLine]).toEqual([e.id, 3]);
    }
    expect(byId('wow-4-1').labels).toEqual(['do', 'do', 'do', 're', 'ti', 'ti', 'la', 'ti', 'do', 'do']);
  });

  it('takes the key do = A from the instructor edition', () => {
    for (const id of ['wow-4-1', 'wow-5-1', 'wow-5-2', 'wow-5-3']) {
      expect(byId(id).key).toEqual({ syllable: 'do', pitchClass: 9 });
    }
  });

  it('sings "Sancte Gregori, ora pro nobis" in two phrases with the accent on "go"', () => {
    const e = byId('wow-4-1');
    expect(e.chant.bars).toEqual([5]);
    expect(e.chant.doubles).toEqual([5]);
    expect(e.words![e.labels.indexOf('re')]).toBe('gó-');
    expect(byId('wow-4-wings').answer).toBe(3);
  });

  it('builds "Sancte Bonefati" by the four rules: a note per syllable, up on the accent, then down', () => {
    const e = byId('wow-4-2');
    expect(e.labels.slice(0, 6)).toEqual(['do', 'do', 'do', 'do', 're', 'ti']);
    expect(e.words![4]).toBe('fá-');
  });

  it('reads exercise 1 of Lesson 5 as four phrases with single bars, starting do ti la sol', () => {
    const e = byId('wow-5-1');
    expect(e.labels.slice(0, 4)).toEqual(['do', 'ti', 'la', 'sol']);
    expect(e.chant.bars).toEqual([4, 8, 12]);
    expect(e.chant.doubles).toEqual([]);
    expect(byId('wow-5-1-names').given).toBe(4);
  });

  it('reads exercise 2 of Lesson 5 as three parts, the Kyrie, Christe and Christe exaudi nos', () => {
    const e = byId('wow-5-2');
    expect(e.chant.notes).toBe('hffffefhfffefhghfgh');
    expect(e.chant.doubles).toEqual([7, 13]);
    expect(byId('wow-5-3').chant.notes).toBe('hffffefhfffefhffffef');
    expect(byId('wow-5-4').chant.notes).toBe('hghfgh');
  });

  it('pairs each naming exercise with a singing exercise of the same notes', () => {
    expect(byId('wow-5-1-names').chant.notes).toBe(byId('wow-5-1').chant.notes);
    expect(byId('wow-5-2-names').chant.notes).toBe(byId('wow-5-2').chant.notes);
  });
});

describe('Lessons 6 and 7 as transcribed from the instructor edition', () => {
  const solfege = (id: string) => byId(id).labels.join(' ');

  it("sings each melody's solfege as the instructor prints it", () => {
    expect(solfege('wow-6-1')).toBe('sol sol la sol');
    expect(solfege('wow-6-2')).toBe('sol sol sol ti do re');
    expect(solfege('wow-6-4')).toBe('do la la la la sol la');
    expect(solfege('wow-6-5')).toBe('fa mi fa mi re');
  });

  it('gives each melody one word per note, with a tick in the last melody', () => {
    for (let n = 1; n <= 7; n++) {
      const e = byId(`wow-6-${n}`);
      expect(e.words).toHaveLength(e.chant.notes.length);
      expect(e.recording).toBe(11 + n);
    }
    expect(byId('wow-6-7').chant.ticks).toEqual([9]);
  });

  it("draws the workbook's line for the melodies whose line can be read", () => {
    expect(byId('wow-6-1').gestures).toEqual([null, 'thesis', null, 'thesis']);
    // the Kyrie: a loop round "Ký" and "lé", under the notes after them
    expect(byId('wow-6-4').gestures).toEqual(['arsis', null, 'thesis', 'thesis', 'arsis', null, 'thesis']);
    expect(byId('wow-6-7').gestures?.filter((g) => g === 'arsis')).toEqual(['arsis']);
    expect(byId('wow-6-7').gestures?.[0]).toBe('arsis');
  });

  it('never has more than two arses in a row', () => {
    for (const lesson of LESSONS) {
      for (const e of lesson.exercises) {
        const run = (e.gestures ?? []).filter((g) => g !== null).join(',');
        expect(`${e.id}: ${run}`).not.toContain('arsis,arsis,arsis');
      }
    }
  });

  it('repeats the seven melodies in Lesson 7 after a drawing page', () => {
    expect(byId('wow-7-draw').kind).toBe('read');
    for (let n = 1; n <= 7; n++) expect(byId(`wow-7-${n}`).chant.notes).toBe(byId(`wow-6-${n}`).chant.notes);
  });
});

it('lists lessons with at least one exercise', () => {
  for (const lesson of LESSONS) expect(lesson.exercises.length).toBeGreaterThan(0);
});
