"use client";

import Link from "next/link";
import LogoWhite from "@/assets/logo-white";
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
      <div className="max-w-400 mx-auto flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-4 mb-8">
        <Link
          className="text-2xl font-semibold tracking-wide uppercase"
          href="/"
        >
          <LogoWhite className="h-10 w-auto" />
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
        <p>Copyright © {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
