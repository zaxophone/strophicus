import { Canvas, Line, Path, Rect, Text as SkiaText, vec } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BAR_UNITS,
  Chant,
  layoutBreaks,
  ledgerLines,
  separators,
  splitSystems,
  staffPosition,
  STAFF_LINES,
  TOP_LINE,
  units,
} from './chant';
import {
  clefRaise,
  custosGlyph,
  FINALIS_GAP,
  HEAD_CENTRE,
  MORA_CENTRE,
  LINE_1,
  LINE_PITCH,
  LINE_THICKNESS,
  UNITS_PER_EM,
} from './fontMetrics';
import { fitSpace, FULL_SPACE } from './fit';
import { GLYPHS, GlyphName } from './glyphs';
import { HEAD_UNITS, neumeFor } from './neumes';
import { ChantMark, syllableMark } from './marks';
import { Column, flowBreaks, lineCentres, pitches } from './spacing';
import { useChantFont } from './typeface';
import { WavePoint, wavePath } from './wave';
import type { Gesture } from '../exercise/gestures';

export type { ChantMark } from './marks';

interface Props {
  width: number;
  chant: Chant;
  labels: string[];
  /** A smaller second line under each label, such as the words over the names. */
  captions?: string[];
  marks: ChantMark[];
  /**
   * The line's gesture at each syllable: an arsis or thesis at an ictus, null for a note
   * between ictus marks, or 'pending' for an ictus still to be answered (the line skips it).
   */
  gestures?: (Gesture | 'pending' | 'none' | null)[];
  /** Draws the hand's line over the staff, as the workbook does: above the notes, under each thesis, round each arsis. */
  wave?: boolean;
  inkColor?: string;
  /** Tallest the staff may be, in pixels; it is drawn smaller to fit if need be. */
  maxHeight?: number;
  /**
   * Lay the chant out as a score to read: each column as wide as its syllable and figure need, lines
   * cut at the phrase bars and spread to fill the width, drawn at full size however long it is (so
   * the parent scrolls). Without it every column is alike and the staff shrinks to fit `maxHeight`.
   */
  flow?: boolean;
  /** With `flow`: the note to keep in view. `onFocus` is told the top of its line, in pixels, whenever it moves to a new line. */
  focus?: number;
  onFocus?: (top: number) => void;
  /** Makes each note tappable, as when the student picks which one to name. */
  onPressNote?: (index: number) => void;
}

/** Width of a staff space in pixels; the font is scaled so its staff matches. */
/**
 * A flowing score is drawn smaller, with text in Gregorio's proportion to the staff: its 10pt text
 * against a 0.2862cm (8.15pt) staff space, about 1.23 spaces.
 */
const FLOW_SPACE = 14;
const TEXT_PER_SPACE = 10 / 8.15;
/** Room under the staff for a label and its hint, and for a caption under them. */
const LABEL_ZONE = 40;
const CAPTION_ZONE = 22;
/** Room kept under a staff with no labels at all, as in a picture of a symbol. */
const BARE_ZONE = 6;
const SYSTEM_GAP = 6;
/** Narrowest and widest a note's share of the line may be, in pixels. */
const MIN_UNIT = 22;
const LABEL_SIZE = 15;
const CAPTION_SIZE = LABEL_SIZE;
const MAX_UNIT = 40;
/** How far the clef reaches above and below its line, in staff steps. */
const CLEF_REACH = 1.8;
const HALO = 'rgba(79, 70, 229, 0.16)';
const WAVE = 'rgba(79, 70, 229, 0.75)';
const PLAYING_HALO = 'rgba(245, 158, 11, 0.38)';

type Division = 'bar' | 'major' | 'double' | 'tick';

/** Which kind of division, if any, comes just before a note. */
function divisionBefore(chant: Chant, noteIndex: number): Division | null {
  if (chant.doubles.includes(noteIndex)) return 'double';
  if (chant.majors.includes(noteIndex)) return 'major';
  if (chant.bars.includes(noteIndex)) return 'bar';
  if (chant.ticks.includes(noteIndex)) return 'tick';
  return null;
}

/** About how wide a piece of text is at a font size, in pixels. */
function textWidth(text: string, size: number): number {
  let em = 0;
  for (const ch of text) em += /[A-Z]/.test(ch) ? 0.7 : /[a-z0-9áéíóúý]/.test(ch) ? 0.54 : ch === ' ' ? 0.28 : 0.38;
  return em * size;
}

export function ChantStaff({ width, chant, labels, captions, marks, gestures, wave = true, inkColor = '#111827', onPressNote, maxHeight, flow = false, focus, onFocus }: Props) {
  const SPACE = flow ? FLOW_SPACE : FULL_SPACE;
  const labelSize = flow ? TEXT_PER_SPACE * SPACE : LABEL_SIZE;
  const positions = [...chant.notes].map(staffPosition);
  // A syllable is a note on its own or a group of notes drawn as one figure; each gets a column.
  const syllables = units(chant);
  const neumes = syllables.map((u) =>
    u.length > 1
      ? neumeFor(
          positions.slice(u.start, u.start + u.length),
          chant.liquescents.find((l) => l.note === u.start + u.length - 1)?.mark ?? '',
        )
      : null,
  );
  /** Staff position of the flat sign standing before note `n`. */
  const flatPosition = (n: number) => staffPosition(chant.flatLetters[chant.flats.indexOf(n)]);
  const syllableOfNote = syllables.flatMap((u, i) => Array.from({ length: u.length }, () => i));
  const clefWidth = 2.2 * SPACE;
  const rightMargin = 2 * SPACE;
  const room = width - clefWidth - rightMargin;
  const divisions = separators(chant).map((n) => syllableOfNote[n]);
  // Words need more room than a note does, so a line holds fewer syllables. What matters
  // is that neighbouring words do not run together, not the single widest word.
  const widths = labels.map((l, i) => Math.max(textWidth(l, labelSize), textWidth(captions?.[i] ?? '', labelSize)));
  const needed = Math.max(0, ...widths.map((w, i) => (w + (widths[i + 1] ?? 0)) / 2));
  // and a joined figure must fit its column
  const widestFigure = Math.max(0, ...neumes.map((n) => (n ? (n.glyph.advance * SPACE) / LINE_PITCH : 0)));
  // and a note with a flat sign needs room for the sign beside it
  const flatFigure = chant.flats.length ? ((GLYPHS.Punctum.advance + GLYPHS.Flat.advance) * SPACE) / LINE_PITCH : 0;
  const minUnit = Math.max(MIN_UNIT, Math.ceil(needed + 2), Math.ceil(widestFigure + 8), Math.ceil(flatFigure + 8));
  const maxUnit = Math.max(MAX_UNIT, minUnit);
  // In a flowing score the columns are spaced as Gregorio spaces them (see `spacing.ts`).
  const flatSign = (GLYPHS.Flat.advance * SPACE) / LINE_PITCH + 0.1 * SPACE;
  const moraDot = (GLYPHS.AuctumMora.advance * SPACE) / LINE_PITCH;
  let previousLabel = '';
  const columns: Column[] = syllables.map((u, i) => {
    const figure = neumes[i] ? (neumes[i]!.glyph.advance * SPACE) / LINE_PITCH : (GLYPHS.Punctum.advance * SPACE) / LINE_PITCH;
    const continued = chant.continuations.includes(u.start);
    const dotted = chant.moras.some((n) => n >= u.start && n < u.start + u.length);
    const doubled = u.length === 1 && chant.duplex.includes(u.start);
    const dots = dotted ? 0.18 * SPACE + moraDot * (doubled ? 2.2 : 1) : 0;
    const label = labels[i] ?? '';
    const kind: Column['kind'] =
      i === 0 ? 'start' : divisionBefore(chant, u.start) ? 'bar' : continued ? 'neume' : /-$/.test(previousLabel) ? 'word' : 'newWord';
    if (!continued) previousLabel = label;
    return {
      left: figure / 2 + (chant.flats.includes(u.start) ? flatSign : 0),
      right: figure / 2 + dots,
      text: continued ? 0 : textWidth(label, labelSize),
      kind,
    };
  });
  const columnPitches = pitches(columns, SPACE);
  const breaks = flow
    ? flowBreaks(
        columns,
        columnPitches,
        divisions,
        chant.bars.map((n) => syllableOfNote[n]),
        chant.breaks.map((n) => syllableOfNote[n]),
        room,
      )
    : layoutBreaks(
        syllables.length,
        divisions,
        chant.breaks.map((n) => syllableOfNote[n]),
        Math.floor(room / minUnit),
        chant.bars.map((n) => syllableOfNote[n]),
      );
  const systems = splitSystems(syllables.map((_, i) => i), breaks);

  // Every line of the staff shares the same vertical range so they stack evenly.
  const clefAt = 2 * (chant.clefLine - 1);
  // the line over the notes goes well above and below them, so it needs room too
  const waved = wave && !!gestures?.some((g) => g === 'arsis' || g === 'thesis');
  // a loop round a second arsis climbs further than the rest of the line
  const given = (gestures ?? []).filter((g) => g === 'arsis' || g === 'thesis');
  const looped = given.some((g, i) => g === 'arsis' && given[i - 1] === 'arsis');
  const top = Math.max(TOP_LINE + 1, Math.max(...positions) + (waved ? (looped ? 3.9 : 2.3) : 1), clefAt + CLEF_REACH);
  const bottom = Math.min(-1, Math.min(...positions) - (waved ? 2.3 : chant.ictus.length ? 2 : 1), clefAt - CLEF_REACH);
  // A long exercise on a short screen is drawn at a smaller scale to fit.
  const labelled = labels.some(Boolean);
  const labelZone = (labelled ? LABEL_ZONE : BARE_ZONE) + (captions ? CAPTION_ZONE : 0);
  const sp = flow ? SPACE : fitSpace(systems.length, top - bottom, labelZone + SYSTEM_GAP, SYSTEM_GAP, maxHeight);
  const stp = sp / 2;
  const scl = sp / LINE_PITCH;
  const font = useChantFont(UNITS_PER_EM * scl);
  const staffHeight = (top - bottom) * stp;
  const systemHeight = staffHeight + labelZone + SYSTEM_GAP;
  const y = (p: number) => (top - p) * stp;

  // Every line shares one note spacing so columns line up from line to line.
  const unitsOf = (indexes: number[]) =>
    indexes.length + divisions.filter((b) => indexes.includes(b) && b !== indexes[0]).length * BAR_UNITS;
  const unit = flow ? MIN_UNIT : Math.min(maxUnit, room / Math.max(...systems.map(unitsOf)));
  // where a flowing line puts its columns (centres, from the start of its notes): filled out
  // to the width unless it is the last line
  const flowCentres = (s: number) =>
    lineCentres(columns, columnPitches, systems[s][0], systems[s][systems[s].length - 1] + 1, room, s < systems.length - 1);

  // keep the note being sung in view: tell the parent where its line starts
  const focusSystem =
    focus === undefined ? -1 : systems.findIndex((indexes) => indexes.some((sy) => focus >= syllables[sy].start && focus < syllables[sy].start + syllables[sy].length));
  useEffect(() => {
    if (flow && focusSystem >= 0) onFocus?.(focusSystem * systemHeight);
  }, [flow, focusSystem, systemHeight, onFocus]);

  const noteW = GLYPHS.Punctum.advance * scl;
  const ruleWidth = Math.max(1, LINE_THICKNESS * scl);
  const staffLines = Array.from({ length: STAFF_LINES }, (_, i) => 2 * i);

  const elements: React.ReactNode[] = [];
  const texts: React.ReactNode[] = [];

  systems.forEach((indexes, s) => {
    const dy = s * systemHeight;
    const at = (p: number) => dy + y(p);
    const key = (name: string, i: number) => `${name}-${s}-${i}`;

    staffLines.forEach((p) =>
      elements.push(
        <Line key={key('line', p)} p1={vec(0, at(p))} p2={vec(width, at(p))} color={inkColor} strokeWidth={ruleWidth} />,
      ),
    );

    // Where the font's own origin falls: glyphs for the clef and bars are drawn around it.
    const origin = at(0) + LINE_1 * scl;
    const glyph = (k: string, name: GlyphName, left: number, baseline: number, color = inkColor) =>
      font && (
        <SkiaText key={k} x={left} y={baseline} text={GLYPHS[name].char} font={font} color={color} />
      );
    const centred = (name: GlyphName, x: number) => x - (GLYPHS[name].advance * scl) / 2;
    // A note head is drawn so its centre lands on the line or space it belongs to.
    const onStaff = (p: number) => at(p) + HEAD_CENTRE * scl;
    // A bar, tick or double bar centred on x.
    const divisionGlyphs = (kind: Division, centre: number, k: string) => {
      if (kind === 'double') {
        const stroke = GLYPHS.DivisioMaiorFour.advance * scl;
        const gap = FINALIS_GAP * scl;
        const first = centre - (2 * stroke + gap) / 2;
        return [
          glyph(`${k}-a`, 'DivisioMaiorFour', first, origin),
          glyph(`${k}-b`, 'DivisioMaiorFour', first + stroke + gap, origin),
        ];
      }
      const name = kind === 'tick' ? 'DivisioMinimaFour' : kind === 'major' ? 'DivisioMaiorFour' : 'DivisioMinorFour';
      return [glyph(k, name, centred(name, centre), origin)];
    };

    elements.push(
      glyph(key('clef', 0), chant.clef === 'f' ? 'FClef' : 'CClef', 4, origin - clefRaise(chant.clefLine) * scl),
    );

    // the hand's line, in runs: a note marked 'none' breaks it, so a melody can have several separate lines
    const waveRuns: WavePoint[][] = [[]];
    let lastGesture: Gesture | null = null;
    let cursor = clefWidth;
    let previousX: number | null = null;
    let previousRight = 0;
    const centres = flow ? flowCentres(s) : [];
    indexes.forEach((syllable, column) => {
      const { start, length } = syllables[syllable];
      const neume = neumes[syllable];
      const notes = Array.from({ length }, (_, j) => start + j);
      const division = column > 0 ? divisionBefore(chant, start) : null;
      const colW = flow ? Math.max(columns[syllable].text + 8, columns[syllable].left + columns[syllable].right) : unit;
      if (division && !flow) cursor += BAR_UNITS * unit;
      const x = flow ? clefWidth + centres[column] : cursor + 0.5 * colW;
      if (flow) cursor = x + columns[syllable].right;
      else cursor += colW;
      // the label is never narrower than its text, which is wider than the estimate when bold
      const labelW = Math.max(colW, 1.25 * Math.max(textWidth(labels[syllable] ?? '', labelSize), textWidth(captions?.[syllable] ?? '', labelSize)) + 4);
      const mark = syllableMark(notes.map((n) => marks[n]));
      const ink = mark?.color ?? inkColor;

      if (division && previousX !== null) {
        const gapCentre = flow ? (previousRight + (x - columns[syllable].left)) / 2 : (previousX + x) / 2;
        elements.push(...divisionGlyphs(division, gapCentre, key('bar', column)));
      }
      previousX = x;
      previousRight = x + columns[syllable].right;

      // Where the notes of this syllable sit across the column, and how wide the figure is.
      const figureW = neume ? neume.glyph.advance * scl : noteW;
      const left = x - figureW / 2;
      const headX = (j: number) => (neume ? left + (neume.heads[j] + 0.5) * HEAD_UNITS * scl : x);
      const ps = notes.map((n) => positions[n]);

      if (mark?.next || mark?.playing) {
        const wide = Math.max(figureW, sp * 1.4) / 2 + sp * 0.05;
        elements.push(
          <Rect key={key('halo', column)} x={x - wide} y={at(Math.max(...ps)) - sp * 0.8} width={wide * 2} height={(Math.max(...ps) - Math.min(...ps)) * stp + sp * 1.6} color={mark.playing ? PLAYING_HALO : HALO} />,
        );
      }
      ps.forEach((p, j) =>
        ledgerLines(p).forEach((q) =>
          elements.push(
            <Line key={key(`ledger${q}-${j}`, column)} p1={vec(headX(j) - noteW * 0.95, at(q))} p2={vec(headX(j) + noteW * 0.95, at(q))} color={inkColor} strokeWidth={ruleWidth} />,
          ),
        ),
      );
      if (neume) {
        // A joined figure is one glyph, drawn from the baseline of its first note.
        elements.push(
          font && <SkiaText key={key('neume', column)} x={left} y={onStaff(ps[0])} text={neume.glyph.char} font={font} color={ink} />,
        );
        if (chant.flats.includes(start)) {
          const flatWidth = GLYPHS.Flat.advance * scl;
          elements.push(glyph(key('flat', column), 'Flat', left - flatWidth - sp * 0.1, onStaff(flatPosition(start)), ink));
        }
      } else {
        elements.push(glyph(key('note', column), 'Punctum', x - noteW / 2, onStaff(ps[0]), ink));
        if (chant.flats.includes(start)) {
          // The flat sign stands just before its note, on the line or space it flattens.
          const flatW = GLYPHS.Flat.advance * scl;
          elements.push(glyph(key('flat', column), 'Flat', x - noteW / 2 - flatW - sp * 0.1, onStaff(flatPosition(start)), ink));
        }
      }
      // The line of an episema, over or under the notes it marks (from the first to the last of them).
      for (const side of ['over', 'under'] as const) {
        const marked = notes
          .map((n, j) => ({ n, j }))
          .filter(({ n }) => chant.episemas.includes(n) && chant.episemasBelow.includes(n) === (side === 'under'));
        if (marked.length === 0) continue;
        const first = marked[0].j;
        const last = marked[marked.length - 1].j;
        const half = neume ? noteW * 0.55 : noteW * 0.55;
        const from = headX(first) - half;
        const to = headX(last) + half;
        let lineY: number;
        if (side === 'over') {
          // in the space above the highest marked head, clear of the line above a space note
          const high = Math.max(...marked.map(({ n }) => positions[n]));
          lineY = at(high) - (high % 2 === 0 ? 0.62 : 0.8) * sp;
        } else {
          const low = Math.min(...marked.map(({ n }) => positions[n]));
          lineY = at(low) + (low % 2 === 0 ? 0.62 : 0.8) * sp;
        }
        elements.push(
          <Line key={key(`episema-${side}`, column)} p1={vec(from, lineY)} p2={vec(to, lineY)} color={ink} strokeWidth={ruleWidth * 1.6} />,
        );
      }
      const ictus = notes.findIndex((n) => chant.ictus.includes(n));
      if (ictus >= 0) {
        // The ictus: a short upright stroke under the head, or over the upper note of a podatus, as
        // Gregorio sets it (it would run into the lower note there).
        const above = neume?.shape === 'pes' && ictus === length - 1;
        const stroke = sp * 0.4;
        const gap = sp * 0.5;
        const edge = above ? at(ps[ictus]) - gap : at(ps[ictus]) + gap;
        elements.push(
          <Line key={key('ictus', column)} p1={vec(headX(ictus), edge)} p2={vec(headX(ictus), above ? edge - stroke : edge + stroke)} color={ink} strokeWidth={ruleWidth * 1.3} />,
        );
      }
      // The dot of a punctum mora sits beside the note, in the space above when the note is on a line.
      // A double dot (augmentum duplex) puts one beside each note of a figure, one above the other,
      // or two side by side after a single note.
      notes
        .filter((n) => chant.moras.includes(n))
        .forEach((n) => {
          const p = positions[n];
          const dotAt = p % 2 === 0 ? p + 1 : p;
          const first = x + figureW / 2 + sp * 0.18;
          elements.push(glyph(key(`mora${n}`, column), 'AuctumMora', first, at(dotAt) + MORA_CENTRE * scl, ink));
          if (length === 1 && chant.duplex.includes(n)) {
            elements.push(glyph(key(`mora2-${n}`, column), 'AuctumMora', first + GLYPHS.AuctumMora.advance * scl * 1.2, at(dotAt) + MORA_CENTRE * scl, ink));
          }
        });

      const gesture = gestures?.[start];
      if (gesture === 'none') {
        // no line over this note: the one before it ended, and the next begins afresh
        if (waveRuns[waveRuns.length - 1].length > 0) waveRuns.push([]);
        lastGesture = null;
      } else if (gesture !== 'pending') {
        const wavePoints = waveRuns[waveRuns.length - 1];
        // an arsis curls in a C; one straight after another arsis loops all the way round its note
        const arsis = gesture === 'arsis';
        wavePoints.push({ x, y: at(ps[0]), at: gesture === 'thesis' ? 'below' : arsis ? (lastGesture === 'arsis' ? 'loop' : 'c') : 'above' });
        if (gesture) lastGesture = gesture;
      }
      texts.push(
        <View
          key={key('label', column)}
          pointerEvents="none"
          style={[styles.label, { width: labelW, left: x - labelW / 2, top: dy + staffHeight + 4 }]}
        >
          <Text style={[styles.syllable, { color: ink, fontSize: labelSize }, flow && styles.flowSyllable]} numberOfLines={1}>
            {labels[syllable]}
          </Text>
          <Text style={[styles.hint, { color: ink }]}>{mark?.hint ?? ''}</Text>
          {captions && <Text style={styles.caption} numberOfLines={1}>{captions[syllable]}</Text>}
        </View>,
      );
      if (onPressNote) {
        // A tall tap target over the whole column, so a child can hit a small note; a
        // figure of several notes shares its column between them, left to right.
        notes.forEach((n, j) =>
          texts.push(
            <Pressable
              key={key(`tap${j}`, column)}
              onPress={() => onPressNote(n)}
              accessibilityLabel={`Note ${n + 1}`}
              style={{ position: 'absolute', left: x - colW / 2 + (j * colW) / length, width: colW / length, top: dy, height: staffHeight + labelZone }}
            />,
          ),
        );
      }
    });

    if (wave && gestures?.some((g) => g === 'arsis' || g === 'thesis')) {
      waveRuns.forEach((run, r) => {
        if (run.length > 0) {
          elements.push(
            <Path key={key('wave', r)} path={wavePath(run, sp * 0.9, unit * 0.7)} style="stroke" strokeWidth={Math.max(2.2, ruleWidth * 2)} strokeCap="round" color={WAVE} />,
          );
        }
      });
    }
    const lastLine = s === systems.length - 1;
    if (lastLine) {
      // Divisio finalis: two strokes across the staff.
      const stroke = GLYPHS.DivisioMaiorFour.advance * scl;
      const second = width - 3 - stroke;
      const first = second - stroke - FINALIS_GAP * scl;
      elements.push(
        glyph(key('final', 0), 'DivisioMaiorFour', first, origin),
        glyph(key('final', 1), 'DivisioMaiorFour', second, origin),
      );
    } else {
      // A bar that falls where the line breaks is drawn at the end of this line.
      const carried = divisionBefore(chant, syllables[systems[s + 1][0]].start);
      if (carried) elements.push(...divisionGlyphs(carried, flow ? cursor + 0.8 * SPACE : cursor + 0.3 * unit, key('carried', 0)));
      // Custos: a guide at the end of the line showing where the next note sits.
      const nextP = positions[syllables[systems[s + 1][0]].start];
      const custos = custosGlyph(nextP);
      // It stands at the very end of the staff, as in printed books, not in a note's column.
      const custosWidth = GLYPHS[custos].advance * scl;
      const x = width - 1 - custosWidth / 2;
      ledgerLines(nextP).forEach((q) =>
        elements.push(
          <Line key={key(`custos-ledger${q}`, 0)} p1={vec(width - 1 - custosWidth - noteW * 0.25, at(q))} p2={vec(width - 1 + noteW * 0.1, at(q))} color={inkColor} strokeWidth={ruleWidth} />,
        ),
      );
      elements.push(glyph(key('custos', 0), custos, centred(custos, x), onStaff(nextP)));
    }
  });

  const height = systems.length * systemHeight - SYSTEM_GAP;
  return (
    <View style={{ width, height }}>
      <Canvas style={{ width, height }}>{elements}</Canvas>
      {texts}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { position: 'absolute', alignItems: 'center' },
  syllable: { fontSize: LABEL_SIZE, fontWeight: '600' },
  flowSyllable: { fontWeight: '400' },
  caption: { fontSize: CAPTION_SIZE, color: '#6b7280' },
  hint: { fontSize: 14, fontWeight: '700', minHeight: 18 },
});
