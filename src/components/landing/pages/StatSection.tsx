import { stats } from "@/data/landing/stats";
import { StatCard } from "../StatCard";

export function StatsSection() {
  return (
    <section className="relative bg-black text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          alt="Atmospheric Creative Studio"
          className="w-full h-full object-cover filter grayscale opacity-50 contrast-150"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPzLLyv7ZMRZ4UpzIpSLA1layw9q4x1so97pRGo6Mu2Br_ASRgkDgU4XPZm2fv5_ySxJ6i4hQWbdWMqyDD-UuZqNldxXOB4jVufm5K1aVU5-_MPloulRlxnD3d0dVgyb4TUaQFkrqta5Z8HARnRlwZcpzU-49b_08e2NS5H_zzyR0xwO_ahRhICMj3ePeLWco4-eFLc27cbFTntpelrruOEuZZv5T0tjMrM9ac7GqWodS3AkeJdTUfySzJyC92eGJkeLZ9D2ZZXdr9"
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
