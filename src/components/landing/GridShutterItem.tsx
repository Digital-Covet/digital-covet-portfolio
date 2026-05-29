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
      className={`grid-shutter ${item.colSpan} ${item.rowSpan} cursor-pointer stagger-item border border-white/10 bg-[#1A1A1A]`}
      style={{ transitionDelay: `${item.delay}s` }}
    >
      <img
        alt={item.category}
        className="w-full h-full object-cover filter grayscale"
        src={item.image}
      />
      <div className={`absolute top-0 left-0 ${paddingClass} z-20`}>
        <span className="bg-covet-green text-white px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
          {item.category}
        </span>
      </div>
      <div className={`absolute bottom-0 left-0 w-full ${paddingClass} z-20`}>
        <div
          className={`overlay-text ${titleClass} font-bold text-white uppercase tracking-tighter`}
        >
          {item.title}
        </div>
      </div>
    </div>
  );
}
