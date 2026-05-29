"use client";

import { useRef } from "react";
import { features } from "@/data/landing/features";
import { useInView } from "@/hooks/useInView";
import { useParallax } from "@/hooks/useParallax";
import { FeatureCard } from "../FeatureCard";

export function ManifestoSection() {
  const { ref, isInView } = useInView();
  const starRef = useRef<HTMLDivElement>(null);

  useParallax(starRef, { speed: 2 });

  return (
    <section className="px-6 py-32 relative overflow-hidden bg-[#131313] text-white">
      <div className="max-w-400 mx-auto">
        <div
          ref={ref}
          className={`grid grid-cols-1 lg:grid-cols-12 gap-12 items-end mb-24 reveal ${isInView ? "active" : ""}`}
        >
          <div className="lg:col-span-8">
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase border-l-4 border-covet-green pl-4 mb-6">
              Manifesto
            </span>
            <h2 className="text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.9] tracking-tighter uppercase mb-8">
              THE <span className="text-covet-green">COVET</span> EDGE
            </h2>
            <p className="text-2xl md:text-3xl font-light leading-snug max-w-4xl text-gray-400">
              We don't just design; we define the digital landscape through raw,
              unfiltered creativity.
            </p>
          </div>
          <div className="lg:col-span-4 flex justify-end">
            <div ref={starRef} className="text-8xl text-covet-green opacity-20">
              ✺
            </div>
          </div>
        </div>

        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-0 border-t stagger-container ${isInView ? "active" : ""} border-[#333]`}
        >
          {features.map((feature) => (
            <FeatureCard key={feature.number} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
