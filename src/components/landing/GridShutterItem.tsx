"use client";

import type { PortfolioItem } from "@/types/landing";

interface GridShutterItemProps {
  item: PortfolioItem;
}

export function GridShutterItem({ item }: GridShutterItemProps) {
  const paddingClass =
    item.rowSpan === "row-span-2" || item.colSpan.includes("col-span-2")
      ? "p-6"
      : "p-4";

  const titleClass =
    item.rowSpan === "row-span-2" || item.colSpan.includes("col-span-2")
      ? "text-3xl"
      : item.colSpan === "col-span-1" && item.rowSpan === "row-span-1"
        ? "text-xl"
        : "text-2xl";

  return (
    <div
      // Added `relative` and `overflow-hidden` to ensure the overlay and image stay contained within the grid item bounds
      className={`grid-shutter ${item.colSpan} ${item.rowSpan} relative overflow-hidden cursor-pointer stagger-item border border-white/10 bg-[#1A1A1A]`}
      style={{ transitionDelay: `${item.delay}s` }}
    >
      <img
        alt={item.category}
        className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-500"
        src={item.image}
      />

      {/* 
        NEW: Gradient Overlay
        - `absolute inset-0`: Stretches over the entire item
        - `bg-gradient-to-t`: Fades from bottom to top
        - `from-black/90 via-transparent to-transparent`: Creates a dark base exactly where the text sits, completely transparent everywhere else
        - `pointer-events-none`: Ensures it doesn't block hover events on the image
        - `z-10`: Places it above the image but beneath the text (z-20)
      */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 pointer-events-none"></div>

      <div className={`absolute top-0 left-0 ${paddingClass} z-20`}>
        <span className="bg-covet-green text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm">
          {item.category}
        </span>
      </div>

      <div className={`absolute bottom-0 left-0 w-full ${paddingClass} z-20`}>
        <div
          // Added `drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]` for an extra layer of crisp separation between the text and background
          className={`overlay-text ${titleClass} font-bold text-white uppercase tracking-tighter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`}
        >
          {item.title}
        </div>
      </div>
    </div>
  );
}
