import { SharesList } from "@/components/shares/shares-list";
import { prisma } from "@/db";
import { requireRole } from "@/lib/auth.server";
import { buildCreatedByFilter } from "@/lib/rbac";
import type { SerializedShare } from "./_actions";

export default async function SharesListPage() {
  const user = await requireRole("employee");
  const rbacFilter = await buildCreatedByFilter(user);

  const shares = await prisma.shareLink.findMany({
    where: { ...rbacFilter },
    orderBy: { createdAt: "desc" },
    include: {
      createdByUser: { select: { name: true } },
      _count: { select: { shareViews: true } },
    },
  });

  const serialized: SerializedShare[] = shares.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    expiresAt: s.expiresAt?.toISOString() ?? null,
  }));

  return <SharesList initialShares={serialized} />;
}
