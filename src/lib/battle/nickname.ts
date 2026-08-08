/** Short enough to survive the tightest place it appears: the score-bar column labels,
 *  which are ~52px wide in a six-player match and truncate past that. */
export const NICKNAME_MAX_LENGTH = 12;

/**
 * Cleans a player-supplied nickname, returning "" for anything that isn't usable.
 *
 * Runs on the server on the way in, not just in the input: a nickname is the one piece of
 * text one player gets to put on another player's screen, so the length cap and the control
 * characters can't be left to a `maxLength` attribute anyone can bypass. Returning "" rather
 * than rejecting keeps the field optional - callers fall back to "Opponent 2".
 */
export function sanitizeNickname(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return (
    raw
      // Whitespace first, and it has to be: newlines and tabs are themselves control
      // characters, so stripping those before collapsing would delete the gap rather than
      // close it, turning "Brock\nfrom Pewter" into "Brockfrom Pewter".
      .replace(/\s+/g, " ")
      // Whatever control/format characters are left are not spacing - zero-width joiners,
      // and the bidi overrides that can visually reorder the text around them.
      .replace(/[\p{Cc}\p{Cf}]/gu, "")
      .trim()
      .slice(0, NICKNAME_MAX_LENGTH)
      // Again, because the slice can land mid-gap and leave a trailing space.
      .trim()
  );
}
