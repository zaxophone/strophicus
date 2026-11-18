import { Canvas, Text as SkiaText } from '@shopify/react-native-skia';
import { GLYPHS } from './glyphs';
import { clefRaise, LINE_1, LINE_PITCH, UNITS_PER_EM } from './fontMetrics';
import { useChantFont } from './typeface';

/** Width, in staff spaces, of the room the inline clef takes. */
export const CLEF_WIDTH = 1.4;
/** How far the clef reaches above and below its line, in staff steps, for both together. */
const CLEF_REACH = 1.8;

/**
 * The do clef alone, small enough to stand in a line of text ("the {{clef}} sign at the
 * start of the staff"), so the reader knows which sign is meant.
 */
export function ClefGlyph({ space = 8, color = '#111827' }: { space?: number; color?: string }) {
  const scl = space / LINE_PITCH;
  const font = useChantFont(UNITS_PER_EM * scl);
  // Cropped to the clef itself: it reaches CLEF_REACH steps (half a space each) above and below its line.
  const height = CLEF_REACH * space;
  const line = height / 2; // the clef's line (the top line of the staff); the bottom line is 3 spaces below
  return (
    <Canvas style={{ width: CLEF_WIDTH * space, height }}>
      {font && (
        <SkiaText x={0} y={line + 3 * space + LINE_1 * scl - clefRaise(4) * scl} text={GLYPHS.CClef.char} font={font} color={color} />
      )}
    </Canvas>
  );
}
