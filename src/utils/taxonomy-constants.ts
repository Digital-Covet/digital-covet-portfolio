export const NONE_SENTINEL = "__none__" as const;
export type NoneSentinel = typeof NONE_SENTINEL;

export const PARENT_TYPES = {
  SECTORS: "sectors",
  INDUSTRIES: "industries",
} as const;
export type ParentType = (typeof PARENT_TYPES)[keyof typeof PARENT_TYPES];
