"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { primaryNavLinks, secondaryNavLinks } from "@/data/landing/navigation";
import { useInView } from "@/hooks/useInView";
import { NavLink } from "../NavLink";

export function Navbar() {
  const { ref, isInView } = useInView({ threshold: 0 });

  return (
    <nav
      ref={ref}
      className={`relative z-10 w-full px-6 py-8 flex justify-between items-start max-w-400 mx-auto reveal ${isInView ? "active" : ""}`}
      style={{ transitionDelay: "0.2s" }}
    >
      <Link className="text-2xl font-semibold tracking-wide uppercase" href="#">
        DIGITAL<span className="text-covet-green">COVET</span>
      </Link>

      <div className="flex gap-16 text-sm font-medium">
        <ul
          className={`flex flex-col gap-3 stagger-container ${isInView ? "active" : ""}`}
        >
          {primaryNavLinks.map((link, index) => (
            <li
              key={link.label}
              className="stagger-item"
              style={{ transitionDelay: `${0.1 + index * 0.05}s` }}
            >
              <NavLink {...link} />
            </li>
          ))}
        </ul>

        <ul
          className={`flex flex-col gap-3 stagger-container ${isInView ? "active" : ""}`}
        >
          {secondaryNavLinks.map((link, index) => (
            <li
              key={link.label}
              className="stagger-item"
              style={{ transitionDelay: `${0.2 + index * 0.05}s` }}
            >
              <NavLink {...link} />
            </li>
          ))}
        </ul>

        <div
          className={`flex items-start gap-4 ml-8 reveal ${isInView ? "active" : ""}`}
          style={{ transitionDelay: "0.4s" }}
        >
          <div className="relative">
            <span className="absolute -top-2 -right-2 bg-covet-green text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              9
            </span>
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Bag</title>
              <path
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </div>

          <Button
            nativeButton={false}
            render={<Link href="#" />}
            className="bg-covet-green text-black px-6 py-3 text-sm font-bold uppercase hover:bg-white transition-colors"
          >
            Get in touch
          </Button>
        </div>
      </div>
    </nav>
  );
}
