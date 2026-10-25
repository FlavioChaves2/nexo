import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Códigos de 6 dígitos que mudam a cada 30 s (RFC 6238), compatíveis com
// Google Authenticator, Microsoft Authenticator, Authy etc.

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer) {
  let bits = 0, value = 0, out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(s: string) {
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const c of s.replace(/=+$/, "").toUpperCase()) {
    const i = ALPHABET.indexOf(c);
    if (i < 0) continue;
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export const newTotpSecret = () => base32Encode(randomBytes(20));

function code(secret: string, counter: number) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const h = createHmac("sha1", base32Decode(secret)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  return ((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).toString().padStart(6, "0");
}

/** Aceita o código atual e o vizinho (±30 s) para tolerar relógio atrasado. */
export function verifyTotp(secret: string, input: string) {
  const clean = input.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const now = Math.floor(Date.now() / 30_000);
  return [-1, 0, 1].some((d) => timingSafeEqual(Buffer.from(code(secret, now + d)), Buffer.from(clean)));
}

export const totpUri = (secret: string, account: string) =>
  `otpauth://totp/Nexo:${encodeURIComponent(account)}?secret=${secret}&issuer=Nexo&digits=6&period=30`;
