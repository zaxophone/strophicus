import { makeChant } from '../chant/chant';
import { parseBlock } from './blocks';
import { ruleGestures } from './gestures';
import { LESSONS } from './lessons';

describe('ruleGestures', () => {
  it('lifts at the start, on rising notes and after a bar, and settles otherwise', () => {
    expect(ruleGestures(makeChant("(c3) (e) (e') (e) (g') (h) (i')"))).toEqual([null, 'thesis', null, 'arsis', null, 'thesis']);
    // a phrase after a bar begins with an arsis even when it does not rise
    expect(ruleGestures(makeChant("(c3) (h') (g) (f';) (f') (e)"))).toEqual(['arsis', null, 'thesis', 'arsis', null]);
  });

  it('gives the Alleluia a thesis on le and on ia', () => {
    expect(ruleGestures(makeChant("(c4) (g) (g') (h) (g')"))).toEqual([null, 'thesis', null, 'thesis']);
  });

  it('always ends a phrase with a thesis, even when the melody rises into it', () => {
    // do ti la do: the last note rises, but it ends the phrase
    expect(ruleGestures(makeChant("(c3) (h) (g') (f) (h')"))).toEqual([null, 'thesis', null, 'thesis']);
    expect(ruleGestures(makeChant("(c3) (h) (g') (f) (h';) (h) (g') (f)"))).toEqual([null, 'thesis', null, 'thesis', null, 'thesis', null]);
  });

  it('only gives a gesture at the notes with an ictus', () => {
    expect(ruleGestures(makeChant('(c3) (h) (g) (f)'))).toEqual([null, null, null]);
  });
});

describe('ictus and gestures in notation', () => {
  it('reads an apostrophe as an ictus on the note before it', () => {
    expect(makeChant("(c4) (g') (g) (h') (g)").ictus).toEqual([0, 2]);
    expect(makeChant("(c4) (g'h) (g)").ictus).toEqual([0]);
    expect(() => makeChant("(c4) (')")).toThrow();
  });

  it('reads a figure with a gesture for each syllable', () => {
    const block = parseBlock("{{gabc: (c4) Al(g')le(g)lú(h')ia(g) @ a - t -}}");
    expect(block.kind === 'staff' && block.gestures).toEqual(['arsis', null, 'thesis', null]);
    expect(() => parseBlock('{{gabc: (c4) Al(g)le(g)lú(h)ia(g) @ a t}}')).toThrow();
  });
});

it('puts the arsis and thesis lesson between Lessons 6 and 7', () => {
  const ids = LESSONS.map((l) => l.id);
  expect(ids.indexOf('arsis-thesis')).toBe(ids.indexOf('wow-6') + 1);
  expect(ids.indexOf('wow-7')).toBe(ids.indexOf('arsis-thesis') + 1);
  const marks = LESSONS[ids.indexOf('arsis-thesis')].exercises.filter((e) => e.kind === 'mark');
  expect(marks.length).toBeGreaterThan(0);
  for (const e of marks) {
    expect(e.gestures).toHaveLength(e.chant.notes.length);
    expect(e.gestures!.filter((g) => g !== null)).toHaveLength(e.chant.ictus.length);
  }
});
