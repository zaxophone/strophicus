import { Canvas, Text as SkiaText } from '@shopify/react-native-skia';
import { GLYPHS } from './glyphs';
import { clefRaise, LINE_1, LINE_PITCH, UNITS_PER_EM } from './fontMetrics';
import { useChantFont } from './typeface';

/** Width, in staff spaces, of the room the inline clef takes. */
export const CLEF_WIDTH = 1.4;

/**
 * The do clef alone, small enough to stand in a line of text ("the {{clef}} sign at the
 * start of the staff"), so the reader knows which sign is meant.
 */
export function ClefGlyph({ space = 7, color = '#111827' }: { space?: number; color?: string }) {
  const scl = space / LINE_PITCH;
  const font = useChantFont(UNITS_PER_EM * scl);
  const pad = 0.6 * space;
  const height = 3 * space + 2 * pad;
  const bottom = pad + 3 * space;
  return (
    <Canvas style={{ width: CLEF_WIDTH * space, height }}>
      {font && (
        <SkiaText x={0} y={bottom + LINE_1 * scl - clefRaise(4) * scl} text={GLYPHS.CClef.char} font={font} color={color} />
      )}
    </Canvas>
  );
}
