const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

export function generateRoomSlug(length = 10): string {
  let out = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
