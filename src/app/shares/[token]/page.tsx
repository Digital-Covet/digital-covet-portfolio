import { LockIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { getShareContent, getShareInfo } from "./_actions";
import { PortfolioView } from "./PortfolioView";
import { UnlockForm } from "./UnlockForm";

// Generate dynamic metadata from server-fetched data
export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const info = await getShareInfo(token);
  if (!info.exists || info.status !== "ok" || !info.unlocked) {
    return {};
  }
  // Fetch content to get the share name for the title
  // This is safe because generateMetadata runs before the page render
  // and Next.js deduplicates the underlying fetch/query via React cache
  try {
    const content = await getShareContent(token);
    return {
      title: `${content.name} — Digital Covet Portfolio`,
    };
  } catch {
    return {};
  }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // ── Round-trip #1: resolved on the SERVER before any HTML is sent ──
  const info = await getShareInfo(token);

  // ── Error states: rendered as static HTML, no JS needed ──
  if (!info.exists) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold">Link Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This share link is invalid or has been removed.
          </p>
        </Card>
      </main>
    );
  }

  if (info.status !== "ok") {
    const msg =
      info.status === "expired"
        ? "This link has expired."
        : info.status === "revoked"
          ? "This link has been revoked."
          : "View limit reached.";
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold">No Longer Available</h1>
          <p className="mt-2 text-sm text-muted-foreground">{msg}</p>
        </Card>
      </main>
    );
  }

  // ── Password gate: UnlockForm is the ONLY client boundary needed ──
  if (info.requiresPassword && !info.unlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted/30 px-4">
        <Card className="w-full max-w-md p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <LockIcon size={20} className="text-primary" />
          </div>
          <h1 className="mt-4 text-center text-2xl font-bold">{info.name}</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Enter the password you received to view this portfolio.
          </p>
          {/* Minimal client island — only the form needs interactivity */}
          <UnlockForm token={token} />
        </Card>
      </main>
    );
  }

  // ── Round-trip #2: also resolved on the SERVER ──
  // The browser will receive HTML that already contains image URLs.
  // The preload scanner can discover the LCP image immediately on parse.
  const content = await getShareContent(token);

  return <PortfolioView content={content} />;
}
