"use client";

import PixelBlast from "@/components/PixelBlast";
import { useInView } from "@/hooks/useInView";
import { GlitchText } from "../GlitchText";
import { Navbar } from "./NavBar";

export function HeroSection() {
  const { ref: contentRef, isInView } = useInView({ threshold: 0 });

  return (
    <header className="relative min-h-screen flex flex-col overflow-hidden bg-[#111]">
      <PixelBlast
        variant="square"
        pixelSize={4}
        color="#c2202d"
        patternScale={2}
        patternDensity={1}
        enableRipples
        rippleSpeed={0.3}
        rippleThickness={0.1}
        rippleIntensityScale={1}
        speed={0.5}
        transparent
        edgeFade={0.25}
      />

      <Navbar />

      {/* Hero Content */}
      <div
        ref={contentRef}
        className={`relative z-10 grow flex items-center pointer-events-none px-6 max-w-400 mx-auto w-full pb-20 reveal ${isInView ? "active" : ""}`}
        style={{ transitionDelay: "0.5s" }}
      >
        <h1 className="text-[8rem] leading-[0.9] font-bold tracking-tighter">
          <span className="block text-covet-green animate-float">
            <GlitchText text="Crafting" />
          </span>
          <span className="block text-white animate-float-delayed">
            Experiences
          </span>
        </h1>
      </div>
    </header>
  );
}
