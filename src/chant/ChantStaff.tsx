import { Canvas, Line, Path, Rect, Text as SkiaText, vec } from '@shopify/react-native-skia';
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
  gestures?: (Gesture | 'pending' | null)[];
  /** Draws the hand's line over the staff, as the workbook does: above the notes, under each thesis, round each arsis. */
  wave?: boolean;
  inkColor?: string;
  /** Tallest the staff may be, in pixels; it is drawn smaller to fit if need be. */
  maxHeight?: number;
  /** Makes each note tappable, as when the student picks which one to name. */
  onPressNote?: (index: number) => void;
}

/** Width of a staff space in pixels; the font is scaled so its staff matches. */
const SPACE = FULL_SPACE;
/** Room under the staff for a label and its hint, and for a caption under them. */
const LABEL_ZONE = 40;
const CAPTION_ZONE = 16;
/** Room kept under a staff with no labels at all, as in a picture of a symbol. */
const BARE_ZONE = 6;
const SYSTEM_GAP = 6;
/** Narrowest and widest a note's share of the line may be, in pixels. */
const MIN_UNIT = 22;
const LABEL_SIZE = 15;
const CAPTION_SIZE = 12;
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

export function ChantStaff({ width, chant, labels, captions, marks, gestures, wave = true, inkColor = '#111827', onPressNote, maxHeight }: Props) {
  const positions = [...chant.notes].map(staffPosition);
  // A syllable is a note on its own or a group of notes drawn as one figure; each gets a column.
  const syllables = units(chant);
  const neumes = syllables.map((u) =>
    u.length > 1 ? neumeFor(positions.slice(u.start, u.start + u.length)) : null,
  );
  const syllableOfNote = syllables.flatMap((u, i) => Array.from({ length: u.length }, () => i));
  const clefWidth = 2.2 * SPACE;
  const rightMargin = 2 * SPACE;
  const room = width - clefWidth - rightMargin;
  const divisions = separators(chant).map((n) => syllableOfNote[n]);
  // Words need more room than a note does, so a line holds fewer syllables. What matters
  // is that neighbouring words do not run together, not the single widest word.
  const widths = labels.map((l, i) => Math.max(textWidth(l, LABEL_SIZE), textWidth(captions?.[i] ?? '', CAPTION_SIZE)));
  const needed = Math.max(0, ...widths.map((w, i) => (w + (widths[i + 1] ?? w)) / 2));
  // and a joined figure must fit its column
  const widestFigure = Math.max(0, ...neumes.map((n) => (n ? (n.glyph.advance * SPACE) / LINE_PITCH : 0)));
  // and a note with a flat sign needs room for the sign beside it
  const flatFigure = chant.flats.length ? ((GLYPHS.Punctum.advance + GLYPHS.Flat.advance) * SPACE) / LINE_PITCH : 0;
  const minUnit = Math.max(MIN_UNIT, Math.ceil(needed + 6), Math.ceil(widestFigure + 8), Math.ceil(flatFigure + 8));
  const maxUnit = Math.max(MAX_UNIT, minUnit);
  const breaks = layoutBreaks(
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
  const sp = fitSpace(systems.length, top - bottom, labelZone + SYSTEM_GAP, SYSTEM_GAP, maxHeight);
  const stp = sp / 2;
  const scl = sp / LINE_PITCH;
  const font = useChantFont(UNITS_PER_EM * scl);
  const staffHeight = (top - bottom) * stp;
  const systemHeight = staffHeight + labelZone + SYSTEM_GAP;
  const y = (p: number) => (top - p) * stp;

  // Every line shares one note spacing so columns line up from line to line.
  const unitsOf = (indexes: number[]) =>
    indexes.length + divisions.filter((b) => indexes.includes(b) && b !== indexes[0]).length * BAR_UNITS;
  const unit = Math.min(maxUnit, room / Math.max(...systems.map(unitsOf)));

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
      glyph(key('clef', 0), 'CClef', 4, origin - clefRaise(chant.clefLine) * scl),
    );

    const wavePoints: WavePoint[] = [];
    let lastGesture: Gesture | null = null;
    let cursor = clefWidth;
    let previousX: number | null = null;
    indexes.forEach((syllable, column) => {
      const { start, length } = syllables[syllable];
      const neume = neumes[syllable];
      const notes = Array.from({ length }, (_, j) => start + j);
      const division = column > 0 ? divisionBefore(chant, start) : null;
      if (division) cursor += BAR_UNITS * unit;
      const x = cursor + 0.5 * unit;
      cursor += unit;
      const mark = syllableMark(notes.map((n) => marks[n]));
      const ink = mark?.color ?? inkColor;

      if (division && previousX !== null) {
        elements.push(...divisionGlyphs(division, (previousX + x) / 2, key('bar', column)));
      }
      previousX = x;

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
      } else {
        elements.push(glyph(key('note', column), 'Punctum', x - noteW / 2, onStaff(ps[0]), ink));
        if (chant.flats.includes(start)) {
          // The flat sign stands just before its note, on the same line or space.
          const flatW = GLYPHS.Flat.advance * scl;
          elements.push(glyph(key('flat', column), 'Flat', x - noteW / 2 - flatW - sp * 0.1, onStaff(ps[0]), ink));
        }
      }
      if (notes.some((n) => chant.episemas.includes(n))) {
        // The line over the notes: in the space above the highest head, clear of the line above a space note.
        const high = Math.max(...ps);
        const lineY = at(high) - (high % 2 === 0 ? 0.62 : 0.8) * sp;
        const half = neume ? figureW / 2 : noteW * 0.55;
        elements.push(
          <Line key={key('episema', column)} p1={vec(x - half, lineY)} p2={vec(x + half, lineY)} color={ink} strokeWidth={ruleWidth * 1.6} />,
        );
      }
      const ictus = notes.findIndex((n) => chant.ictus.includes(n));
      if (ictus >= 0) {
        // The ictus: a short upright stroke just under the head.
        const below = at(ps[ictus]) + sp * 0.62;
        elements.push(
          <Line key={key('ictus', column)} p1={vec(headX(ictus), below)} p2={vec(headX(ictus), below + sp * 0.7)} color={ink} strokeWidth={ruleWidth * 1.6} />,
        );
      }
      const dotted = notes.findIndex((n) => chant.moras.includes(n));
      if (dotted >= 0) {
        // The dot of a punctum mora sits beside the note, in the space above when the note is on a line.
        const p = ps[dotted];
        const dotAt = p % 2 === 0 ? p + 1 : p;
        elements.push(
          glyph(key('mora', column), 'AuctumMora', x + figureW / 2 + sp * 0.18, at(dotAt) + MORA_CENTRE * scl, ink),
        );
      }

      const gesture = gestures?.[syllable];
      // The line passes above every note, under a thesis and round an arsis; an ictus still waiting for its answer leaves a gap.
      if (gesture !== 'pending') {
        // an arsis curls in a C; one straight after another arsis loops all the way round its note
        const arsis = gesture === 'arsis';
        wavePoints.push({ x, y: at(ps[0]), at: gesture === 'thesis' ? 'below' : arsis ? (lastGesture === 'arsis' ? 'loop' : 'c') : 'above' });
        if (gesture) lastGesture = gesture;
      }
      texts.push(
        <View
          key={key('label', column)}
          pointerEvents="none"
          style={[styles.label, { width: unit, left: x - unit / 2, top: dy + staffHeight + 4 }]}
        >
          <Text style={[styles.syllable, { color: ink }]} numberOfLines={1}>
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
              style={{ position: 'absolute', left: x - unit / 2 + (j * unit) / length, width: unit / length, top: dy, height: staffHeight + labelZone }}
            />,
          ),
        );
      }
    });

    if (wave && gestures?.some((g) => g === 'arsis' || g === 'thesis') && wavePoints.length > 0) {
      elements.push(
        <Path key={key('wave', 0)} path={wavePath(wavePoints, sp * 0.9, unit * 0.7)} style="stroke" strokeWidth={Math.max(2.2, ruleWidth * 2)} strokeCap="round" color={WAVE} />,
      );
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
      if (carried) elements.push(...divisionGlyphs(carried, cursor + 0.3 * unit, key('carried', 0)));
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
  caption: { fontSize: CAPTION_SIZE, color: '#6b7280' },
  hint: { fontSize: 14, fontWeight: '700', minHeight: 18 },
});
