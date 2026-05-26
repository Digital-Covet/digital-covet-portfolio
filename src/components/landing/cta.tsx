"use client";

import { ArrowUpRightIcon } from "@phosphor-icons/react";
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="bg-foreground text-background py-28 text-center font-heading">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-5xl md:text-7xl font-bold mb-10">
          Ready to Build the Future?
        </h2>
        <Link
          href="https://digitalcovet.com/contact-us/"
          className="btn-primary inline-flex items-center hover:transition-colors hover:bg-primary-foreground hover:text-foreground gap-3 bg-primary text-primary-foreground px-12 py-5 text-lg font-semibold uppercase tracking-widest"
        >
          Partner with Digital Covet
          <ArrowUpRightIcon size={16} />
        </Link>
      </div>
    </section>
  );
}
