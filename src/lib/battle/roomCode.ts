// Letters only - a code that's read aloud or typed from memory is easier to get right
// without digits mixed in. I and O stay out: with no digits to confuse them for they're
// safe on paper, but they're still the two letters people most often mistype as 1 and 0.
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export const ROOM_CODE_LENGTH = 3;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase();
}
