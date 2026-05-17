/**
 * Executes an array of async functions with controlled concurrency.
 *
 * @param tasks - Array of functions that return promises
 * @param concurrency - Maximum number of concurrent operations (default: 5)
 * @returns Array of settled results (fulfilled or rejected)
 */
export async function runWithConcurrencyLimit<T>(
  tasks: Array<() => Promise<T>>,
  concurrency = 5,
): Promise<Array<PromiseSettledResult<T>>> {
  const results: Array<PromiseSettledResult<T>> = [];
  const executing: Promise<void>[] = [];

  for (const [index, task] of tasks.entries()) {
    const promise = task()
      .then((value) => {
        results[index] = { status: "fulfilled", value };
      })
      .catch((reason) => {
        results[index] = { status: "rejected", reason };
      });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove completed promises
      executing.splice(executing.indexOf(promise), 1);
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Splits an array into chunks of specified size.
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}
