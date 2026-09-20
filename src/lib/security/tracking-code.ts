import { randomBytes } from "node:crypto";

// Unambiguous Base-30 alphabet (omitting 0, O, 1, I to prevent human reading errors)
const CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/**
 * Generates a cryptographically secure, high-entropy alphanumeric tracking code.
 * Format: KWFC-XXXX-XXXX (e.g. KWFC-7X9K-42M1)
 * Entropy: 30^8 = 656,100,000,000 combinations.
 */
export function generateFanCardTrackingCode(): string {
  const bytes = randomBytes(8);
  let part1 = "";
  let part2 = "";

  for (let i = 0; i < 4; i++) {
    const byte = bytes[i];
    part1 += CHARS[byte % CHARS.length];
  }

  for (let i = 4; i < 8; i++) {
    const byte = bytes[i];
    part2 += CHARS[byte % CHARS.length];
  }

  return `KWFC-${part1}-${part2}`;
}

/**
 * Generates a public request confirmation reference.
 * Format: REQ-XXXX-XXXX
 */
export function generateRequestReference(): string {
  const bytes = randomBytes(8);
  let part1 = "";
  let part2 = "";

  for (let i = 0; i < 4; i++) {
    const byte = bytes[i];
    part1 += CHARS[byte % CHARS.length];
  }

  for (let i = 4; i < 8; i++) {
    const byte = bytes[i];
    part2 += CHARS[byte % CHARS.length];
  }

  return `REQ-${part1}-${part2}`;
}

/**
 * Validates tracking code format (KWFC-XXXX-XXXX or KW-XXXX-XXXX)
 */
export function isValidTrackingCodeFormat(code: string): boolean {
  if (!code) return false;
  const cleaned = code.trim().toUpperCase();
  const kwfcRegex = /^KWFC-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
  const kwRegex = /^KW-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/;
  return kwfcRegex.test(cleaned) || kwRegex.test(cleaned);
}
