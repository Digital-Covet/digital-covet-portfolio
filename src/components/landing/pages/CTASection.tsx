"use client";

import Link from "next/link";
import { useRef } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";
import { useParallax } from "@/hooks/useParallax";

export function CTASection() {
  const { ref, isInView } = useInView();
  const starRef = useRef<HTMLDivElement>(null);

  useParallax(starRef, { speed: 2 });

  return (
    <section
      ref={ref}
      className={`bg-covet-green text-white px-6 py-24 relative reveal ${isInView ? "active" : ""}`}
    >
      <div ref={starRef} className="absolute right-12 top-12 text-4xl">
        ✺
      </div>

      <div className="max-w-400 mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <span className="border border-white rounded-full px-4 py-1 text-sm font-medium mb-6 inline-block">
            CTA
          </span>
          <h2 className="text-6xl md:text-8xl font-bold tracking-tighter">
            Ready to dominate?
          </h2>
        </div>

        <Link
          href="#"
          className={cn(
            buttonVariants({ variant: "secondary" }),
            "bg-black text-white px-10 py-5 text-sm font-bold uppercase hover:bg-white hover:text-primary transition-colors whitespace-nowrap",
          )}
        >
          Visit Main Site
        </Link>
      </div>
    </section>
  );
}
