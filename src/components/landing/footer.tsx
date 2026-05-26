import Link from "next/link";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-background border-t border-border py-16">
      <div className="max-w-360 mx-auto px-6 md:px-16 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-2xl font-bold tracking-tight">Digital Covet</div>

        <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm uppercase tracking-widest text-foreground/70">
          <Link
            href="#services"
            className="hover:text-primary transition-colors"
          >
            Services
          </Link>
          <Link href="#about" className="hover:text-primary transition-colors">
            About
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            Privacy Policy
          </Link>
        </div>

        <div className="text-sm text-foreground/50">
          © {year} Digital Covet. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
