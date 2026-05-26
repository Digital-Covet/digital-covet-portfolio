"use client";

import { ArrowRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import CreativeGirl from "@/assets/creative-girl";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="max-w-360 mx-auto px-6 md:px-16 py-24 md:py-16 flex flex-col md:flex-row items-center gap-12 min-h-[85vh]">
      <div className="flex-1 max-w-3xl space-y-8 font-heading">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter  leading-[1.1]">
          Designing the Digital Future with Uncompromising{" "}
          <span className="text-primary">Precision.</span>
        </h1>

        <p className="text-xl text-foreground/80 max-w-2xl">
          We are an elite digital agency specializing in high-fidelity
          interfaces, brand strategy, and creative engineering for
          forward-thinking brands.
        </p>

        <Button
          render={<Link href="https://digitalcovet.com/" />}
          nativeButton={false}
          className="px-10 py-4 h-auto text-sm font-semibold uppercase tracking-widest gap-3 font-sans"
        >
          Start a Project
          <ArrowRightIcon />
        </Button>
      </div>

      <div className="flex-1 w-full relative h-105 md:h-155 image-wrapper">
        <CreativeGirl />
      </div>
    </section>
  );
}
