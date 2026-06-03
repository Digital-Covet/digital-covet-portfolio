"use client";

import Link from "next/link";
import LogoWhite from "@/assets/logo-white";
import { buttonVariants } from "@/components/ui/button";
import { primaryNavLinks } from "@/data/landing/navigation";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";
import { NavLink } from "../NavLink";

export function Navbar() {
  const { ref, isInView } = useInView({ threshold: 0 });

  return (
    <nav
      ref={ref}
      className={`relative z-10 w-full px-6 py-8 flex justify-between items-center max-w-400 mx-auto reveal ${isInView ? "active" : ""}`}
      style={{ transitionDelay: "0.2s" }}
    >
      <Link className="text-2xl font-semibold tracking-wide uppercase" href="/">
        <LogoWhite className="h-8 w-auto" />
      </Link>

      <div className="flex gap-16 text-sm font-medium">
        <ul
          className={`flex flex-row items-center gap-6 stagger-container ${isInView ? "active" : ""}`}
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

        <div
          className={`flex items-start gap-4 ml-8 reveal ${isInView ? "active" : ""}`}
          style={{ transitionDelay: "0.4s" }}
        >
          <Link
            href="https://digitalcovet.com/contact-us"
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "bg-primary text-primary-foreground px-6 py-3 text-sm font-bold uppercase hover:bg-white hover:text-primary transition-colors",
            )}
          >
            Get in touch
          </Link>
        </div>
      </div>
    </nav>
  );
}
