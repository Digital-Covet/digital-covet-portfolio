"use client";

import {
  ArrowClockwiseIcon,
  EyeIcon,
  LinkIcon,
  PlusIcon,
  ProhibitIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type {
  SerializedShare,
  SerializedShareView,
} from "@/app/(app)/shares/actions";
import { getShareViews, revokeShare } from "@/app/(app)/shares/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getShareStatusBadge } from "@/lib/share-display";

interface SharesListProps {
  initialShares: SerializedShare[];
}

interface ViewingState {
  id: string;
  name: string;
}

export function SharesList({ initialShares }: SharesListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [viewing, setViewing] = useState<ViewingState | null>(null);
  const [viewLogs, setViewLogs] = useState<SerializedShareView[]>([]);
  const [viewLogsLoading, setViewLogsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  function handleViewLog(id: string, name: string) {
    setViewing({ id, name });
    setViewLogs([]);
    setViewLogsLoading(true);

    getShareViews(id)
      .then((data) => {
        setViewLogs(data.views);
      })
      .catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to load view logs",
        );
      })
      .finally(() => {
        setViewLogsLoading(false);
      });
  }

  function handleRevoke(id: string) {
    setRevokingId(id);

    startTransition(async () => {
      try {
        await revokeShare(id);
        toast.success("Share link revoked");
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to revoke share",
        );
      } finally {
        setRevokingId(null);
      }
    });
  }

  return (
    <div className="md:p-10">
      {}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Share Links</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated portfolio links for prospects.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/shares/new">
              <PlusIcon size={16} className="mr-2" />
              New Share
            </Link>
          }
        ></Button>
      </div>

      {}
      <div className="mt-6 grid gap-3">
        {initialShares.map((share) => (
          <ShareCard
            key={share.id}
            share={share}
            isRevoking={revokingId === share.id}
            isPendingGlobal={isPending}
            onViewLog={() => handleViewLog(share.id, share.name)}
            onRevoke={() => handleRevoke(share.id)}
          />
        ))}

        {initialShares.length === 0 && (
          <div className="border border-dashed py-12 text-center text-sm text-muted-foreground">
            No shares yet. Create your first share link to get started.
          </div>
        )}
      </div>

      {}
      <Dialog
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) setViewing(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>View Log — {viewing?.name ?? "Share"}</DialogTitle>
          </DialogHeader>

          {viewLogsLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <ArrowClockwiseIcon size={16} className="mr-2 animate-spin" />
              Loading…
            </div>
          ) : viewLogs.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No views recorded yet.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">#</th>
                    <th className="pb-2 pr-4 font-medium">Viewed At</th>
                    <th className="pb-2 font-medium">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {viewLogs.map((v, i) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="py-2 pr-4">
                        {format(new Date(v.viewedAt), "MMM d, yyyy h:mm a")}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {v.ip ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ShareCardProps {
  share: SerializedShare;
  isRevoking: boolean;
  isPendingGlobal: boolean;
  onViewLog: () => void;
  onRevoke: () => void;
}

function ShareCard({
  share,
  isRevoking,
  isPendingGlobal,
  onViewLog,
  onRevoke,
}: ShareCardProps) {
  const badge = getShareStatusBadge({
    revoked: share.revoked,
    expiresAt: share.expiresAt,
    maxViews: share.maxViews,
    viewCount: share.viewCount,
  });

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/shares/${share.token}`
      : `/shares/${share.token}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold leading-none">{share.name}</h3>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          {share.recipientName && (
            <p className="text-sm text-muted-foreground">
              For: {share.recipientName}
              {share.recipientEmail ? ` (${share.recipientEmail})` : ""}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <EyeIcon size={16} />
            {share.viewCount}
            {share.maxViews ? ` / ${share.maxViews}` : ""} views
          </span>

          <span>
            Created: {format(new Date(share.createdAt), "MMM d, yyyy")}
          </span>

          {share.expiresAt && (
            <span>
              Expires: {format(new Date(share.expiresAt), "MMM d, yyyy")}
            </span>
          )}

          {share.createdByUser && <span>By: {share.createdByUser.name}</span>}

          <button
            type="button"
            className="inline-flex items-center gap-1 text-primary hover:underline"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              toast.success("Link copied to clipboard");
            }}
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Copy link
          </button>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onViewLog}
          disabled={isPendingGlobal}
        >
          <EyeIcon size={16} className="mr-1.5" />
          View Log
        </Button>

        {!share.revoked && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onRevoke}
            disabled={isRevoking || isPendingGlobal}
          >
            {isRevoking ? (
              <ArrowClockwiseIcon size={16} className="mr-1.5 animate-spin" />
            ) : (
              <ProhibitIcon size={16} className="mr-1.5" />
            )}
            Revoke
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
