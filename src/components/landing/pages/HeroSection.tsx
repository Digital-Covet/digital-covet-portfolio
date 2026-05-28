"use client";

import { useRef } from "react";
import { useInView } from "@/hooks/useInView";
import { useParallax } from "@/hooks/useParallax";
import { GlitchText } from "../GlitchText";
import { Navbar } from "./NavBar";

export function HeroSection() {
  const bgRef = useRef<HTMLImageElement>(null);
  const { ref: contentRef, isInView } = useInView({ threshold: 0 });

  useParallax(bgRef, { speed: -0.5 });

  return (
    <header className="relative min-h-screen flex flex-col overflow-hidden bg-[#111]">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          ref={bgRef}
          alt="Textured Background"
          className="parallax-bg w-full h-full object-cover opacity-60 scale-110 transition-transform duration-75 ease-linear"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDC-0E8GC8KP5R0G0PKHPO8xj9-uXQi2Rkvk1TK_KHZAhr7Q14-mmsqu3LTIL-6yX7BTxQ2dthYFV_jnDGMaAg7CbarTBKa_XSxUcWeptTOFy3N2GirwgoEAi8dHO4cvB5Fp3yykzNwLg8Q6RW1xIkD0hB6q83DXb8a3csKRj2dI7dKoG1p07cyTy3-vd_tmzm7dDLKI6XJ3kdLvbt5C7uYQH_jeCQvcQ1oWxHGLDKltSpNn2s_NsDGh5NThkyXFuv9v4uhfhM-qm6F"
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-[#111] opacity-80"></div>
      </div>

      <Navbar />

      {/* Hero Content */}
      <div
        ref={contentRef}
        className={`relative z-10 grow flex items-center px-6 max-w-400 mx-auto w-full pb-20 reveal ${isInView ? "active" : ""}`}
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
