"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import CollaborativeTeamwork from "@/assets/collaboration-teamwork";

export function About() {
  return (
    <section
      id="about"
      className="max-w-360 mx-auto px-6 md:px-16 py-28 font-heading"
    >
      <div className="flex flex-col md:flex-row gap-16 items-center">
        <div className="flex-1 image-wrapper h-105 md:h-155">
          <CollaborativeTeamwork />
        </div>
        <div className="flex-1 space-y-8 fade-up">
          <div>
            <span className="text-primary uppercase tracking-widest text-sm font-medium">
              The Agency
            </span>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tighter mt-3">
              Elite Craftsmanship.
            </h2>
          </div>

          <p className="text-xl text-foreground/80 leading-relaxed">
            We don&apos;t just build websites; we architect digital flagships.
            Our methodology relies on a rigorous 3-column structural grid,
            minimalist-modern aesthetics, and high-contrast accents.
          </p>

          <blockquote className="pl-6 border-l-4 border-primary italic text-foreground/70">
            Digital Covet is the parent agency behind this portfolio platform,
            demonstrating the very capabilities we offer to our elite clientele.
          </blockquote>

          <Link
            href="https://digitalcovet.com/"
            className="inline-flex items-center gap-2 border border-foreground px-8 py-4 hover:bg-foreground hover:text-background transition-all font-medium text-sm uppercase tracking-widest"
          >
            View Parent Agency <ArrowUpRightIcon size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
