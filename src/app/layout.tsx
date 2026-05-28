import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Jost, Rubik, Sora } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const jostSans = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

const SoraSans = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});
const rubikSans = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const interSans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
export const metadata: Metadata = {
  title: "Digital Covet Portfolio",
  description:
    "Your professional digital portfolio showcasing projects and skills",
  metadataBase: new URL("https://portfolio.digitalcovet.com"),
  openGraph: {
    title: "Digital Covet Portfolio",
    description:
      "Your professional digital portfolio showcasing projects and skills",
    url: "https://portfolio.digitalcovet.com",
    siteName: "Digital Covet Portfolio",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Digital Covet Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Covet Portfolio",
    description:
      "Your professional digital portfolio showcasing projects and skills",
    images: ["/og-image.jpg"],
  },
  icons: {
    apple: "/apple-touch-icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        jetbrainsMono.variable,
        interSans.variable,
        rubikSans.variable,
        jostSans.variable,
        SoraSans.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SpeedInsights />
        <Toaster />
      </body>
    </html>
  );
}
