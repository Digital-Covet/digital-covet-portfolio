"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/db";
import {
  ActionException,
  type ActionResult,
  ok,
  runAction,
} from "@/lib/action-result";
import { requireRole } from "@/lib/auth.server";
import { deleteR2File, extractR2KeyFromProxyUrl } from "@/lib/r2";
import { type ClientInput, clientInputSchema } from "@/schemas/client";
import { uuidSchema } from "@/schemas/primitives/uuid";

export async function upsertClient(
  input: ClientInput,
): Promise<ActionResult<{ id: string; name: string }>> {
  return runAction(async () => {
    const user = await requireRole("employee");
    const data = clientInputSchema.parse(input);
    const values = {
      name: data.name,
      logoUrl: data.logoUrl ?? null,
    };
    let result: { id: string; name: string };
    if (data.id) {
      const isAdmin = user.role === "admin" || user.role === "superadmin";
      const whereClause = isAdmin
        ? { id: data.id }
        : { id: data.id, createdBy: user.id };
      const updated = await prisma.client.updateMany({
        where: whereClause,
        data: values,
      });
      if (!updated.count) {
        throw new ActionException("NOT_FOUND", "Not found");
      }
      result = { id: data.id, name: data.name };
    } else {
      result = await prisma.client.create({
        data: { ...values, createdBy: user.id },
        select: { id: true, name: true },
      });
    }
    revalidatePath("/clients");
    revalidatePath("/shares/new");
    return ok(result);
  });
}

export async function deleteClient(input: {
  id: string;
}): Promise<ActionResult<{ success: boolean }>> {
  return runAction(async () => {
    await requireRole("admin");
    const { id } = z.object({ id: uuidSchema }).parse(input);

    const caseStudyCount = await prisma.caseStudy.count({
      where: { clientId: id },
    });
    if (caseStudyCount > 0) {
      throw new ActionException(
        "CONFLICT",
        `Cannot delete: ${caseStudyCount} case study${caseStudyCount > 1 ? "ies" : "y"} reference${caseStudyCount > 1 ? "" : "s"} this client. Remove the client from them first.`,
      );
    }

    const client = await prisma.client.findUnique({
      where: { id },
      select: { logoUrl: true },
    });
    if (!client) {
      throw new ActionException("NOT_FOUND", "Not found");
    }

    if (client.logoUrl) {
      const key = extractR2KeyFromProxyUrl(client.logoUrl);
      if (key) {
        try {
          await deleteR2File(key);
        } catch (e) {
          console.error("deleteClient: R2 deletion failed:", e);
        }
      }
    }

    await prisma.client.delete({ where: { id } });
    revalidatePath("/clients");
    revalidatePath("/shares/new");
    return ok({ success: true });
  });
}
