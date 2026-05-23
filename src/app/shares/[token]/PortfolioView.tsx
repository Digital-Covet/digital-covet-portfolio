// src/app/shares/[token]/PortfolioView.tsx
"use client";

import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  CaretLeftIcon,
  CaretRightIcon,
  FileArrowDownIcon,
  XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type {
  SerializedMetric,
  SerializedStudy,
  ShareContent,
} from "./_actions";

interface Attachment {
  name: string;
  url: string;
}

// ── Portfolio grid ────────────────────────────────────────────────────────────

export function PortfolioView({ content }: { content: ShareContent }) {
  const [selected, setSelected] = useState<SerializedStudy | null>(null);

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
    <main className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.studies.map((s: SerializedStudy, index: number) => (
            <Button
              key={s.id}
              variant="ghost"
              onClick={() => setSelected(s)}
              className="group flex w-full flex-col items-stretch overflow-hidden border bg-card text-left transition-shadow hover:shadow-lg"
            >
              {s.heroImageUrl ? (
                // ── LCP FIX ──────────────────────────────────────────────────
                // 1. next/image replaces <img> — generates a srcset, respects
                //    the preload scanner, and can emit a <link rel="preload">.
                // 2. priority={index === 0} adds fetchpriority="high" and
                //    injects a <link rel="preload"> in <head> for the first
                //    card — the element Lighthouse measured as the LCP target.
                //    This directly fixes the "fetchpriority=high should be
                //    applied" and "Request is discoverable in initial document"
                //    failures from the Lighthouse report.
                // 3. loading="lazy" is intentionally ABSENT from index 0.
                //    It is the default (lazy) for index > 0.
                // ─────────────────────────────────────────────────────────────
                <div className="relative aspect-[3/2] w-full overflow-hidden">
                  <Image
                    src={s.heroImageUrl}
                    alt={s.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                    priority={index === 0}
                  />
                </div>
              ) : (
                <div className="aspect-[3/2] w-full bg-muted" />
              )}
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {s.keyBusinesses.map((kb) => (
                    <Badge key={kb.name} variant="secondary">
                      {kb.name}
                    </Badge>
                  ))}
                  {s.client?.name && <span>· {s.client.name}</span>}
                </div>
                <h2 className="mt-2 font-semibold">{s.title}</h2>
                {s.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {s.description}
                  </p>
                )}
              </div>
            </Button>
          ))}
        </div>

        {content.studies.length === 0 && (
          <div className="border border-dashed py-16 text-center text-sm text-muted-foreground">
            No case studies match this share.
          </div>
        )}
      </div>
    </main>
  );
}

// ── Case study detail ─────────────────────────────────────────────────────────

function CaseStudyDetail({
  study,
  metrics,
  onBack,
}: {
  study: SerializedStudy;
  metrics: SerializedMetric[];
  onBack: () => void;
}) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const attachments = (study.attachmentUrls as Attachment[] | null) ?? [];

  useEffect(() => {
    if (galleryIndex === null || !study.galleryUrls) return;
    const urls = study.galleryUrls;
    const current = galleryIndex;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft")
        setGalleryIndex((current - 1 + urls.length) % urls.length);
      else if (e.key === "ArrowRight")
        setGalleryIndex((current + 1) % urls.length);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [galleryIndex, study.galleryUrls]);

  return (
    <main className="min-h-screen bg-background">
      {/* Sticky nav */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center px-6 py-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeftIcon size={16} className="mr-2" /> Back to portfolio
          </Button>
        </div>
      </div>

      {/* Hero — this is NOT the LCP target (the grid card was), so no priority */}
      {study.heroImageUrl && (
        <div className="relative aspect-video w-full md:aspect-[21/9]">
          <Image
            src={study.heroImageUrl}
            alt={study.title}
            fill
            sizes="100vw"
            className="object-cover"
          // No priority here — this renders after a user interaction (click),
          // so it is never the initial LCP element.
          />
        </div>
      )}

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {study.keyBusinesses.map((kb) => (
            <Badge key={kb.name} variant="secondary">
              {kb.name}
            </Badge>
          ))}
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
          <div className="[&_ul]:list-disc [&_ol]:list-decimal [&_li]:marker:text-foreground [&_ul]:ps-6 [&_ol]:ps-6 mt-6 share-markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {study.description}
            </ReactMarkdown>
          </div>
        )}

        {/* Metrics */}
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

        {/* Narrative sections */}
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

        {/* Video */}
        {study.videoEmbedUrl && (
          <div className="mt-10 aspect-video overflow-hidden border">
            <iframe
              src={toEmbed(study.videoEmbedUrl)}
              className="h-full w-full"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Video"
            />
          </div>
        )}

        {/* Gallery */}
        {study.galleryUrls && study.galleryUrls.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Gallery
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {study.galleryUrls.map((u: string, i: number) => (
                <Button
                  key={i}
                  variant="ghost"
                  onClick={() => setGalleryIndex(i)}
                  className="flex w-full cursor-zoom-in overflow-hidden rounded-lg border transition-shadow hover:shadow-lg"
                >
                  {/* Gallery thumbnails: lazy is correct — below the fold */}
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src={u}
                      alt={`Gallery image ${i + 1}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    // loading="lazy" is the default — intentionally kept
                    />
                  </div>
                </Button>
              ))}
            </div>

            <Dialog
              open={galleryIndex !== null}
              onOpenChange={(open) => {
                if (!open) setGalleryIndex(null);
              }}
            >
              <DialogContent
                showCloseButton={false}
                className="max-w-[95vw] border-0 bg-black/40 p-0 text-white sm:max-w-[95vw]"
              >
                {galleryIndex !== null && (
                  <div className="relative flex items-center justify-center">
                    {/* Lightbox: unoptimized is fine — user-triggered, not LCP */}
                    <img
                      src={study.galleryUrls[galleryIndex]}
                      alt={`Gallery ${galleryIndex + 1}`}
                      className="max-h-[90vh] max-w-full object-contain"
                    />
                    {study.galleryUrls.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGalleryIndex(
                              (galleryIndex - 1 + study.galleryUrls.length) %
                              study.galleryUrls.length,
                            );
                          }}
                          className="absolute left-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        >
                          <CaretLeftIcon size={20} />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGalleryIndex(
                              (galleryIndex + 1) % study.galleryUrls.length,
                            );
                          }}
                          className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        >
                          <CaretRightIcon size={20} />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => setGalleryIndex(null)}
                      className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                    >
                      <XIcon size={16} />
                    </Button>
                    {study.galleryUrls.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                        {galleryIndex + 1} / {study.galleryUrls.length}
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Testimonial */}
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

        {/* Downloads */}
        {attachments.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Downloads
            </h2>
            <div className="mt-4 space-y-2">
              {attachments.map((a: Attachment, i: number) => (
                <Link
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
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ContentSection({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="[&_ul]:list-disc [&_ol]:list-decimal [&_li]:marker:text-foreground [&_ul]:ps-6 [&_ol]:ps-6 mt-2 share-markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {body}
        </ReactMarkdown>
      </div>
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
    if (u.hostname === "youtu.be")
      return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("vimeo.com"))
      return `https://player.vimeo.com/video${u.pathname}`;
  } catch { }
  return url;
}
