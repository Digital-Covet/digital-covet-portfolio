"use client";

import {
  ArrowClockwiseIcon,
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  FileArrowDownIcon,
  LockIcon,
} from "@phosphor-icons/react";
import { use, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  SerializedMetric,
  SerializedStudy,
  ShareContent,
  ShareInfo,
} from "./_actions";
import { getShareContent, getShareInfo, unlockShare } from "./_actions";

interface Attachment {
  name: string;
  url: string;
}

export default function SharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [password, setPassword] = useState("");
  const [content, setContent] = useState<ShareContent | null>(null);
  const [selected, setSelected] = useState<SerializedStudy | null>(null);

  const [isUnlocking, startUnlockTransition] = useTransition();

  useEffect(() => {
    getShareInfo(token)
      .then(setInfo)
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (info && info.exists && info.unlocked && info.status === "ok") {
      getShareContent(token)
        .then(setContent)
        .catch(() => {});
    }
  }, [info, token]);

  function handleUnlock(e: React.SubmitEvent) {
    e.preventDefault();
    startUnlockTransition(async () => {
      try {
        await unlockShare(token, password);
        const freshInfo = await getShareInfo(token);
        setInfo(freshInfo);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to unlock");
      }
    });
  }

  if (!info) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <ArrowClockwiseIcon size={16} className="mr-2 animate-spin" />
        Loading…
      </div>
    );
  }

  if (!info.exists) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold">Link Not Found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This share link is invalid or has been removed.
          </p>
        </Card>
      </div>
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
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h1 className="text-2xl font-bold">No Longer Available</h1>
          <p className="mt-2 text-sm text-muted-foreground">{msg}</p>
        </Card>
      </div>
    );
  }

  if (!info.unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted/30 px-4">
        <Card className="w-full max-w-md p-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <LockIcon size={16} className="h-5 w-5 text-primary" />
          </div>
          <h1 className="mt-4 text-center text-2xl font-bold">{info.name}</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Enter the password you received to view this portfolio.
          </p>
          <form onSubmit={handleUnlock} className="mt-6 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="pw">Password</Label>
              <Input
                id="pw"
                type="password"
                autoFocus
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isUnlocking}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isUnlocking}>
              {isUnlocking ? "Unlocking…" : "Unlock"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <ArrowClockwiseIcon size={16} className="mr-2 animate-spin" />
        Loading portfolio…
      </div>
    );
  }

  if (selected) {
    return (
      <CaseStudyDetail
        study={selected}
        metrics={content.metrics.filter(
          (m: SerializedMetric) => m.caseStudyId === selected.id,
        )}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {}
      <div className="border-b bg-linear-to-br from-primary/5 to-transparent">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Curated Portfolio
          </div>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
            {content.name}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            A selection of our work prepared for you.
          </p>
        </div>
      </div>

      {}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.studies.map((s: SerializedStudy) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelected(s)}
              className="group overflow-hidden rounded-lg border bg-card text-left transition-shadow hover:shadow-lg"
            >
              {s.heroImageUrl ? (
                <img
                  src={s.heroImageUrl}
                  alt={s.title}
                  className="h-48 w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="h-48 w-full bg-muted" />
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {s.industry?.name && (
                    <Badge variant="secondary">{s.industry.name}</Badge>
                  )}
                  {s.client?.name && <span>· {s.client.name}</span>}
                </div>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                {s.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>

        {content.studies.length === 0 && (
          <div className="rounded-md border border-dashed py-16 text-center text-sm text-muted-foreground">
            No case studies match this share.
          </div>
        )}
      </div>
    </div>
  );
}

function CaseStudyDetail({
  study,
  metrics,
  onBack,
}: {
  study: SerializedStudy;
  metrics: SerializedMetric[];
  onBack: () => void;
}) {
  const attachments = (study.attachmentUrls as Attachment[] | null) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center px-6 py-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeftIcon size={16} className="mr-2" /> Back to portfolio
          </Button>
        </div>
      </div>

      {}
      {study.heroImageUrl && (
        <img
          src={study.heroImageUrl}
          alt=""
          className="h-72 w-full object-cover md:h-96"
        />
      )}

      {}
      <div className="mx-auto max-w-4xl px-6 py-12">
        {}
        <div className="flex items-center gap-3 text-xs">
          {study.industry?.name && (
            <Badge variant="secondary">{study.industry.name}</Badge>
          )}
          {study.client?.name && (
            <span className="text-muted-foreground">{study.client.name}</span>
          )}
          {study.projectDate && (
            <span className="text-muted-foreground">
              · {new Date(study.projectDate).getFullYear()}
            </span>
          )}
        </div>

        <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          {study.title}
        </h1>

        {study.description && (
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {study.description}
          </p>
        )}

        {}
        {metrics.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {metrics.map((m: SerializedMetric) => (
              <Card key={m.id}>
                <CardContent className="p-6">
                  <div className="text-3xl font-bold tracking-tight">
                    {m.value}
                    {m.unit ?? ""}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {m.label}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {}
        {(study.challenge || study.solution || study.results) && (
          <div className="mt-12 space-y-8">
            {study.challenge && (
              <ContentSection title="Challenge" body={study.challenge} />
            )}
            {study.solution && (
              <ContentSection title="Solution" body={study.solution} />
            )}
            {study.results && (
              <ContentSection title="Results" body={study.results} />
            )}
          </div>
        )}

        {}
        {study.videoEmbedUrl && (
          <div className="mt-10 aspect-video overflow-hidden rounded-lg border">
            <iframe
              src={toEmbed(study.videoEmbedUrl)}
              className="h-full w-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Video"
            />
          </div>
        )}

        {}
        {study.galleryUrls && study.galleryUrls.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Gallery
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {study.galleryUrls.map((u: string, i: number) => (
                <img
                  key={i}
                  src={u}
                  alt=""
                  className="rounded-lg border object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {}
        {study.testimonialQuote && (
          <blockquote className="mt-12 border-l-4 border-primary bg-muted/30 p-6">
            <p className="text-lg italic">"{study.testimonialQuote}"</p>
            {(study.testimonialAuthor || study.testimonialTitle) && (
              <footer className="mt-3 text-sm text-muted-foreground">
                — {study.testimonialAuthor}
                {study.testimonialTitle && `, ${study.testimonialTitle}`}
              </footer>
            )}
          </blockquote>
        )}

        {}
        {attachments.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Downloads
            </h2>
            <div className="mt-4 space-y-2">
              {attachments.map((a: Attachment, i: number) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-md border bg-card p-3 hover:bg-muted"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <FileArrowDownIcon size={16} className="h-4" /> {a.name}
                  </span>
                  <ArrowSquareOutIcon
                    size={16}
                    className="h-4 text-muted-foreground"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContentSection({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <p className="mt-2 whitespace-pre-wrap leading-relaxed">{body}</p>
    </div>
  );
}

function toEmbed(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      return `https://player.vimeo.com/video${u.pathname}`;
    }
  } catch {}
  return url;
}
