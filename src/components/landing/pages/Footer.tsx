"use client";

import Link from "next/link";
import { footerNavLinks } from "@/data/landing/navigation";
import { useInView } from "@/hooks/useInView";
import { NavLink } from "../NavLink";

export function Footer() {
  const { ref, isInView } = useInView();

  return (
    <footer
      ref={ref}
      className={`bg-black text-white px-6 py-12 reveal ${isInView ? "active" : ""}`}
    >
      <div className="max-w-400 mx-auto flex flex-col md:flex-row justify-between items-center gap-8 border-b border-gray-800 pb-12 mb-8">
        <Link
          className="text-2xl font-semibold tracking-wide uppercase"
          href="#"
        >
          DIGITAL<span className="text-covet-green">COVET</span>
        </Link>

        <ul className="flex gap-8 text-sm text-gray-400">
          {footerNavLinks.map((link) => (
            <li key={link.label}>
              <NavLink {...link} />
            </li>
          ))}
        </ul>
      </div>

      <div className="max-w-400 mx-auto flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
        <p>Digital Covet © All rights reserved.</p>
        <p>Copyright © 2024</p>
      </div>
    </footer>
  );
}
