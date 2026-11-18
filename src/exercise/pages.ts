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

/** A paragraph that is nothing but bold text, such as a sentence being quoted. */
const isBoldLine = (paragraph: string) => /^\*\*[^*]+\*\*$/.test(paragraph);

/** Whether the bold line that ends a unit was introduced by a paragraph ending in a colon ("Here is the sentence:"). */
const introduced = (unit: string[]) => unit.length > 1 && unit[unit.length - 2].endsWith(':');

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
  // only kept together if they would still fit on one page
  const fitsWith = (unit: string[], paragraph: string) =>
    [...unit, paragraph].reduce((total, p) => total + blockSize(p), 0) <= limit;
  for (const paragraph of paragraphs) {
    const before = units[units.length - 1];
    const last = before?.[before.length - 1];
    if (before && isFigure(paragraph) && !isFigure(last)) before.push(paragraph);
    // a line set in bold stays with the paragraph before it, and with the one after it if the one before ends in a colon
    else if (before && fitsWith(before, paragraph) && (isBoldLine(paragraph) || (last !== undefined && isBoldLine(last) && introduced(before)))) before.push(paragraph);
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
