import Link from "next/link";
import type { NavLink as NavLinkType } from "@/types/landing";

interface NavLinkProps extends NavLinkType {
  className?: string;
}

export function NavLink({
  href,
  label,
  isActive,
  className = "",
}: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`nav-link transition-colors ${
        isActive ? "text-covet-green" : "hover:text-covet-green"
      } ${className}`}
    >
      {label}
    </Link>
  );
}
