/** The most cards one judge call is ever shown. */
export const MAX_CARDS_PER_JUDGE = 3;

/**
 * Splits a round's cards into judging groups.
 *
 * Pairs wherever possible: two cards side by side is the comparison a judge can actually hold
 * in view, and it keeps every call the same shape. An odd table can't be all pairs, so exactly
 * one group of three absorbs the odd card out - never more than one, and never more than three
 * in a group.
 *
 *   2 -> [2]      4 -> [2,2]      6 -> [2,2,2]      10 -> [2,2,2,2,2]
 *   3 -> [3]      5 -> [3,2]      7 -> [3,2,2]       9 -> [3,2,2,2]
 *
 * Returns an empty plan below two cards, since there is nothing to compare.
 */
export function planJudgeBatches(cardCount: number): number[] {
  if (cardCount < 2) return [];
  if (cardCount % 2 === 0) return Array(cardCount / 2).fill(2);
  return [MAX_CARDS_PER_JUDGE, ...Array((cardCount - MAX_CARDS_PER_JUDGE) / 2).fill(2)];
}

/** Splits `items` into consecutive groups following `planJudgeBatches`. */
export function splitIntoJudgeBatches<T>(items: T[]): T[][] {
  const batches: T[][] = [];
  let offset = 0;
  for (const size of planJudgeBatches(items.length)) {
    batches.push(items.slice(offset, offset + size));
    offset += size;
  }
  return batches;
}
