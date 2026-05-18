import type { Readable } from "node:stream";

/**
 * Adapts a Node.js Readable stream to a web ReadableStream<Uint8Array>.
 *
 * IMPORTANT: Do NOT pass an AWS SDK v3 `Body` here. SDK v3 Body implements
 * the web ReadableStream interface, not the Node.js EventEmitter interface.
 * Calling `.on()` on it is a no-op, producing a permanently stalled stream.
 * Use `body.transformToWebStream()` directly for SDK v3 responses.
 */
export function nodeStreamToWebStream(
  nodeStream: Readable,
): ReadableStream<Uint8Array> {
  // Guard: detect if caller accidentally passed a web ReadableStream
  if (
    typeof (nodeStream as unknown as ReadableStream).getReader === "function"
  ) {
    throw new TypeError(
      "nodeStreamToWebStream received a web ReadableStream, not a Node.js Readable. " +
        "For AWS SDK v3 Body, use body.transformToWebStream() instead.",
    );
  }

  let streamCancelled = false;
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;

  const cleanup = () => {
    nodeStream.off("data", onData);
    nodeStream.off("end", onEnd);
    nodeStream.off("error", onError);
    nodeStream.off("close", onClose);
  };

  const onData = (chunk: Buffer | Uint8Array) => {
    if (streamCancelled || !controllerRef) return;
    const uint8Chunk =
      chunk instanceof Buffer
        ? new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
        : chunk;
    controllerRef.enqueue(uint8Chunk);
    if (controllerRef.desiredSize !== null && controllerRef.desiredSize <= 0) {
      nodeStream.pause();
    }
  };

  const onEnd = () => {
    if (streamCancelled || !controllerRef) return;
    cleanup();
    controllerRef.close();
    controllerRef = null;
  };

  const onClose = () => {
    if (streamCancelled || !controllerRef) return;
    cleanup();
    controllerRef.close();
    controllerRef = null;
  };

  const onError = (error: unknown) => {
    if (streamCancelled || !controllerRef) return;
    cleanup();
    controllerRef.error(error);
    controllerRef = null;
  };

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
      nodeStream.on("data", onData);
      nodeStream.on("end", onEnd);
      nodeStream.on("close", onClose);
      nodeStream.on("error", onError);
    },
    pull() {
      if (!streamCancelled) {
        nodeStream.resume();
      }
    },
    cancel() {
      streamCancelled = true;
      cleanup();
      nodeStream.destroy();
    },
  });
}
