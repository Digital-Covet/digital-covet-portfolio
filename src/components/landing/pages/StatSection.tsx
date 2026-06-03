import Image from "next/image";
import { stats } from "@/data/landing/stats";
import { StatCard } from "../StatCard";

export function StatsSection() {
  return (
    <section className="relative bg-black text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          width={512}
          height={512}
          alt="Atmospheric Creative Studio"
          className="w-full h-full object-cover filter grayscale opacity-50 contrast-150"
          src="/stats-cover.webp"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black"></div>
      </div>

      <div className="relative z-10 max-w-400 mx-auto px-6 py-40 min-h-screen flex flex-col justify-center">
        <div className="grid grid-cols-12 gap-0 relative">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>
      </div>
    </section>
  );
}
