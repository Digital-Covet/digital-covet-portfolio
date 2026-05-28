"use client";

import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useInView } from "@/hooks/useInView";
import { useParallax } from "@/hooks/useParallax";

export function CTASection() {
  const { ref, isInView } = useInView();
  const starRef = useRef<HTMLDivElement>(null);

  useParallax(starRef, { speed: 2 });

  return (
    <section
      ref={ref}
      className={`bg-covet-green px-6 py-24 relative reveal ${isInView ? "active" : ""}`}
    >
      <div
        ref={starRef}
        className="absolute right-12 top-12 text-4xl text-black"
      >
        ✺
      </div>

      <div className="max-w-400 mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <span className="border border-black rounded-full px-4 py-1 text-sm font-medium mb-6 inline-block">
            CTA
          </span>
          <h2 className="text-6xl md:text-8xl font-bold tracking-tighter text-black">
            Ready to dominate?
          </h2>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="#" />}
          className="bg-black text-white px-10 py-5 text-sm font-bold uppercase hover:bg-gray-800 transition-colors whitespace-nowrap"
        >
          Visit Main Site
        </Button>
      </div>
    </section>
  );
}
