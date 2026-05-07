import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_PARAMS: { N: number; r: number; p: number } = { N: 65536, r: 8, p: 1 };
const KEY_LENGTH = 64;
const HASH_VERSION = "v1";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const key = scryptSync(password, salt, KEY_LENGTH, SCRYPT_PARAMS).toString(
    "hex",
  );
  return `${HASH_VERSION}:${salt}:${key}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  try {
    let salt: string;
    let expectedKey: string;
    let params = SCRYPT_PARAMS;

    if (stored.startsWith("v1:")) {
      const parts = stored.slice(3).split(":");
      if (parts.length !== 2) return false;
      [salt, expectedKey] = parts as [string, string];
    } else {
      const colonIndex = stored.indexOf(":");
      if (colonIndex === -1) return false;
      salt = stored.slice(0, colonIndex);
      expectedKey = stored.slice(colonIndex + 1);
      params = { N: 16384, r: 8, p: 1 };
    }

    if (!salt || !expectedKey) return false;

    const candidateKey = scryptSync(
      password,
      salt,
      KEY_LENGTH,
      params,
    ).toString("hex");

    const a = Buffer.from(expectedKey, "hex");
    const b = Buffer.from(candidateKey, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
