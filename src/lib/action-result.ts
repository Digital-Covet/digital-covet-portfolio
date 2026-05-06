/**
 * Typed result envelope for all Server Actions.
 * Callers can discriminate on `ok` without catching untyped exceptions.
 */
export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION"
  | "SERVER_ERROR";

export type ActionError = {
  code: ActionErrorCode;
  message: string;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function err(
  code: ActionErrorCode,
  message: string,
): ActionResult<never> {
  return { ok: false, error: { code, message } };
}

/**
 * Throws a well-typed error that action wrappers can catch and classify.
 * Use this inside Server Actions for domain errors.
 */
export class ActionException extends Error {
  constructor(
    public readonly code: ActionErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ActionException";
  }
}
