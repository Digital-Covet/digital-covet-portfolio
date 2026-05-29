"use client";

import { useRef } from "react";
import { portfolioItems } from "@/data/landing/portfolio";
import { useInView } from "@/hooks/useInView";
import { useParallax } from "@/hooks/useParallax";
import { GridShutterItem } from "../GridShutterItem";

export function SelectedWorksSection() {
  const { ref, isInView } = useInView();
  const starRef = useRef<HTMLDivElement>(null);

  useParallax(starRef, { speed: 2, rotate: true });

  return (
    <section
      id="work"
      className="max-w-400 mx-auto px-6 py-24 relative bg-black text-[#e2e2e2]"
    >
      <div
        ref={starRef}
        className="absolute right-6 top-24 text-3xl text-covet-green opacity-20"
      >
        ✳
      </div>

      <h2
        ref={ref}
        className={`text-5xl font-medium mb-16 text-center text-white reveal ${isInView ? "active" : ""}`}
      >
        Selected Works
      </h2>

      <div className={`stagger-container ${isInView ? "active" : ""}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[300px]">
          {portfolioItems.map((item) => (
            <GridShutterItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
