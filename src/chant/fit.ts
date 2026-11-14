/** Staff spacing (pixels per line gap) a staff is normally drawn at. */
export const FULL_SPACE = 20;
/** Smallest spacing worth drawing at; below this the notes are too small to read. */
export const MIN_SPACE = 10;

/**
 * The staff spacing at which `systems` lines of staff, each spanning `steps`
 * half-spaces from its lowest to its highest mark, plus `fixed` pixels of
 * labels and gap under each (less `lastGap` after the final one), fit in
 * `maxHeight`. It never exceeds the normal spacing or falls below the minimum.
 */
export function fitSpace(
  systems: number,
  steps: number,
  fixed: number,
  lastGap: number,
  maxHeight: number | undefined,
): number {
  if (maxHeight === undefined || maxHeight <= 0) return FULL_SPACE;
  const room = (maxHeight + lastGap) / systems - fixed;
  const space = (2 * room) / steps;
  return Math.max(MIN_SPACE, Math.min(FULL_SPACE, space));
}
