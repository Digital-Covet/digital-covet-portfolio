import Link from "next/link";

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
];
export function Navbar() {
  return (
    <nav className="bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border transition-all duration-300">
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 h-20 flex items-center justify-between">
        <Link
          href="/"
          className="font-bold text-2xl tracking-tight flex items-center gap-2 hover:scale-105 transition-transform duration-300"
        >
          Digital Covet
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-sm uppercase tracking-widest hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
