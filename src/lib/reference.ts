/**
 * Public lookup code for an appointment.
 *
 * "Mis citas" used to search by email or phone, which meant anyone could pull
 * up a stranger's appointments by guessing a digit fragment. The code below is
 * the secret instead: it is the Firestore document id, and the rules allow a
 * direct `get` but never a `list`, so knowing the code is the only way in.
 */

// No I/O/0/1 — they are the characters people misread when copying a code.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const BODY_LENGTH = 8

export function generateReference(): string {
  const bytes = new Uint8Array(BODY_LENGTH)
  crypto.getRandomValues(bytes)

  let body = ''
  for (const byte of bytes) {
    body += ALPHABET[byte % ALPHABET.length]
  }
  return `BI-${body.slice(0, 4)}-${body.slice(4)}`
}

/** Accepts what a patient actually types: spaces, lowercase, missing dashes. */
export function normalizeReference(input: string): string {
  const cleaned = input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^BI/, '')

  if (cleaned.length !== BODY_LENGTH) return ''
  if ([...cleaned].some((c) => !ALPHABET.includes(c))) return ''
  return `BI-${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
}
