import { blockSize, isFigure } from './blocks';

/** The most text one instruction page holds, in characters, on a tall screen. */
export const PAGE_CHARS = 380;

/**
 * How much text a page can hold on a screen this tall (in dp) and still leave
 * room for the title, the reference pitch and the arrows without scrolling or
 * shrinking the type. Short screens get shorter pages.
 */
export function pageChars(screenHeight: number): number {
  return Math.max(160, Math.min(PAGE_CHARS, Math.round((screenHeight - 400) * 1.1)));
}

/**
 * Splits written instructions into pages. Paragraphs (separated by a blank
 * line) stay whole; they are packed onto a page until the next would overflow
 * it. A paragraph longer than a page gets a page to itself. A picture of
 * notation counts as a fixed amount of text, and stays on the page with the
 * paragraph that introduces it.
 */
export function paginate(instructions: string, limit = PAGE_CHARS): string[][] {
  const paragraphs = instructions.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const units: string[][] = [];
  for (const paragraph of paragraphs) {
    const before = units[units.length - 1];
    if (before && isFigure(paragraph) && !isFigure(before[before.length - 1])) before.push(paragraph);
    else units.push([paragraph]);
  }
  const pages: string[][] = [];
  let length = 0;
  for (const unit of units) {
    const page = pages[pages.length - 1];
    const size = unit.reduce((total, paragraph) => total + blockSize(paragraph), 0);
    if (page && length + size <= limit) {
      page.push(...unit);
      length += size;
    } else {
      pages.push([...unit]);
      length = size;
    }
  }
  return pages;
}
