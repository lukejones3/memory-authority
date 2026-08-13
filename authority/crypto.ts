import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "node:crypto";

const DOMAIN = "memory-authority/v1";

export function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hmac(key: Buffer, purpose: string, value: string): string {
  return createHmac("sha256", key)
    .update(`${DOMAIN}\0${purpose}\0`)
    .update(value)
    .digest("hex");
}

export function stableId(key: Buffer, namespace: string, ...parts: string[]): string {
  return `${namespace}_${hmac(key, `id:${namespace}`, parts.join("\0")).slice(0, 32)}`;
}

export function encrypt(key: Buffer, plaintext: string, aad: string) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(`${DOMAIN}\0${aad}`));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return {
    nonce: nonce.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

export function decrypt(
  key: Buffer,
  encrypted: { nonce: string; ciphertext: string; tag: string },
  aad: string,
): string {
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(encrypted.nonce, "base64"));
  decipher.setAAD(Buffer.from(`${DOMAIN}\0${aad}`));
  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export function tokenize(text: string): string[] {
  const stopwords = new Set([
    "about", "after", "again", "also", "and", "are", "been", "before",
    "but", "can", "did", "does", "for", "from", "had", "has", "have",
    "how", "into", "its", "must", "not", "our", "that", "the", "then",
    "this", "was", "were", "what", "when", "where", "which", "why", "with",
  ]);
  return [...new Set(
    (text.toLowerCase().match(/[a-z0-9][a-z0-9_-]{1,}/g) ?? [])
      .filter(token => !stopwords.has(token)),
  )].sort();
}

export function blindTokens(key: Buffer, text: string): string[] {
  return tokenize(text).map(token => hmac(key, "lexical-token", token));
}
