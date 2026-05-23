import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shared Portfolio — Digital Covet",
  description: "A curated selection of our work, prepared just for you.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
