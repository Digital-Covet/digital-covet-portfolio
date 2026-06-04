"use client";

import Link from "next/link";
import { useRef } from "react";
import { Footer, Navbar } from "@/components/landing/pages";
import { useParallax } from "@/hooks/useParallax";

export const NotFoundPage: React.FC = () => {
  const diamondRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useParallax(diamondRef, { speed: 0.5 });
  useParallax(dotRef, { speed: 0.3 });
  useParallax(lineRef, { speed: 0.4 });

  return (
    <div className="bg-covet-dark text-covet-light grow flex flex-col min-h-screen">
      <div className="bg-black">
        <Navbar />
      </div>

      <main className="grow flex items-center justify-center relative w-full px-6 py-24 overflow-hidden blueprint-grid">
        <div
          ref={diamondRef}
          className="absolute top-1/4 left-10 md:left-20"
          aria-hidden="true"
        >
          <div className="w-4 h-4 bg-covet-green transform rotate-45 opacity-50 blur-[1px]" />
        </div>
        <div
          ref={dotRef}
          className="absolute bottom-1/3 right-10 md:right-32 w-2 h-2 bg-white rounded-full opacity-70"
          aria-hidden="true"
        />
        <div
          ref={lineRef}
          className="absolute top-1/2 left-1/4 w-px h-32 bg-covet-green opacity-20"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-1/3 right-10 md:right-32 w-2 h-2 bg-white rounded-full opacity-70"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 left-1/4 w-px h-32 bg-covet-green opacity-20"
          aria-hidden="true"
        />

        <div className="max-w-4xl w-full flex flex-col items-center text-center z-10 space-y-12">
          <h1
            className="glitch text-[100px] md:text-[160px] font-bold tracking-tighter leading-none text-white"
            data-text="404"
          >
            404
          </h1>

          <div className="space-y-6 max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-heading uppercase text-covet-green">
              Story Lost In The Noise.
            </h2>
            <p className="text-base md:text-lg text-covet-light/70 max-w-lg mx-auto">
              The page you're looking for has been redacted. Let's get you back
              to the main narrative.
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/"
              className="inline-block bg-covet-green text-white font-bold uppercase tracking-wider text-sm px-12 py-5 border-2 border-transparent hover:bg-white hover:text-covet-dark transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-covet-green focus-visible:ring-offset-covet-dark"
            >
              Back To Base
            </Link>
          </div>

          <div
            className="w-24 h-px bg-covet-light/30 mt-16"
            aria-hidden="true"
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
