export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function err<T = never>(code: string, message: string): ActionResult<T> {
  return { ok: false, error: { code, message } };
}

export class ActionException extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ActionException";
  }
}

export async function runAction<T>(
  fn: () => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const { z } = await import("zod");
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ActionException) {
      return err(e.code, e.message);
    }
    if (e instanceof z.ZodError) {
      return err("VALIDATION", e.issues[0]?.message ?? "Validation failed");
    }
    console.error("[action error]", e);
    return err(
      "SERVER_ERROR",
      e instanceof Error ? e.message : "An unexpected error occurred",
    );
  }
}
