import { useRef, useCallback } from "react";
import { fastHash } from "@/lib/hash-utils";

type DirtyTracker<T> = {
  isDirty: (current: T) => boolean;
  markClean: (snapshot: T) => void;
  reset: () => void;
};

/**
 * Efficient dirty tracking hook using structural hashing.
 *
 * Instead of JSON.stringify, this computes a fast hash of the data structure,
 * reducing CPU/memory overhead for large forms.
 */
export function useDirtyTracking<T>(): DirtyTracker<T> {
  const lastHashRef = useRef<string | null>(null);

  const isDirty = useCallback((current: T): boolean => {
    const currentHash = fastHash(current);
    return currentHash !== lastHashRef.current;
  }, []);

  const markClean = useCallback((snapshot: T) => {
    lastHashRef.current = fastHash(snapshot);
  }, []);

  const reset = useCallback(() => {
    lastHashRef.current = null;
  }, []);

  return { isDirty, markClean, reset };
}
