"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinalCTA() {
  return (
    <section className="bg-foreground text-background py-28 text-center font-heading">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-5xl md:text-7xl font-bold mb-10">
          Ready to Build the Future?
        </h2>
        <Button
          render={<Link href="https://digitalcovet.com/contact-us/" />}
          nativeButton={false}
          className="px-12 py-5 h-auto text-lg font-semibold uppercase tracking-widest gap-3 hover:bg-primary-foreground hover:text-foreground"
        >
          Partner with Digital Covet
          <ArrowUpRightIcon size={16} />
        </Button>
      </div>
    </section>
  );
}
