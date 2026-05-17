/**
 * Computes a fast, non-cryptographic hash of any JSON-serializable value.
 * Uses FNV-1a algorithm for speed.
 *
 *  Not suitable for security purposes — only for change detection.
 */
export function fastHash(value: unknown): string {
  const str = JSON.stringify(value);
  let hash = 2166136261; // FNV offset basis

  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }

  return (hash >>> 0).toString(36); // Convert to base36 string
}

/**
 * Performs shallow equality check for simple objects.
 */
export function shallowEqual<T extends Record<string, unknown>>(
  a: T,
  b: T,
): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (a[key] !== b[key]) return false;
  }

  return true;
}
