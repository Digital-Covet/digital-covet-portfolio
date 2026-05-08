import { z } from "zod";
import { urlSchema } from "@/schemas/primitives/url";
import { uuidSchema } from "@/schemas/primitives/uuid";

export const clientInputSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().trim().min(1).max(200),
  logoUrl: urlSchema.nullable().optional(),
});

export type ClientInput = z.infer<typeof clientInputSchema>;
