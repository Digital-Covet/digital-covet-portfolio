import crypto from "node:crypto";
import { promisify } from "node:util";

const pbkdf2 = promisify(crypto.pbkdf2);

const ITERATIONS = 100_000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [salt, hash] = storedHash.split(":");

  if (!salt || !hash) return false;

  const verifyHash = await pbkdf2(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST,
  );

  const hashBuffer = Buffer.from(hash, "hex");

  if (hashBuffer.length !== verifyHash.length) return false;

  return crypto.timingSafeEqual(hashBuffer, verifyHash);
}

export function generateToken(length: number = 24): string {
  return crypto.randomBytes(length).toString("hex");
}
