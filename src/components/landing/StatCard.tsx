"use client";

import { useCountUp } from "@/hooks/useCountUp";
import { useInView } from "@/hooks/useInView";
import type { Stat } from "@/types/landing";

interface StatCardProps {
  stat: Stat;
}

export function StatCard({ stat }: StatCardProps) {
  const { ref, isInView } = useInView({ threshold: 0.5 });
  const count = useCountUp({ target: stat.target, isInView });

  const isCenter =
    stat.colSpan.includes("col-span-12") &&
    !stat.colSpan.includes("md:col-span-5") &&
    !stat.colSpan.includes("md:col-span-7");

  return (
    <div
      ref={ref}
      className={`${stat.colSpan} ${stat.marginTop || ""} reveal ${isInView ? "active" : ""} ${isCenter ? "flex justify-center" : ""}`}
      style={{ transitionDelay: `${stat.delay}s` }}
    >
      <div
        className={`flex flex-col ${
          stat.colSpan.includes("md:col-span-5")
            ? "items-end md:items-start"
            : isCenter
              ? "items-center"
              : ""
        }`}
      >
        <span
          className={`${stat.customClass} ${stat.textColor} font-bold leading-[0.7] tracking-tighter`}
        >
          {count}+
        </span>
        <div
          className={`mt-4 ${
            stat.colSpan.includes("md:col-span-5")
              ? "pr-4 md:pr-0 md:pl-4 text-right md:text-left border-r-4 md:border-r-0 md:border-l-4"
              : isCenter
                ? "text-center"
                : "pl-4 border-l-4"
          } ${stat.borderColor}`}
        >
          {stat.label.map((line, index) => (
            <span
              key={index}
              className="block text-xs font-bold uppercase tracking-[0.3em]"
            >
              {line}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
