import type { Feature } from "@/types/landing";

interface FeatureCardProps {
  feature: Feature;
}

export function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <div
      className="p-10 border-b md:border-b-0 md:border-r group hover:text-white transition-all duration-500 stagger-item border-[#333] hover:bg-[#1A1A1A] last:border-r-0"
      style={{ transitionDelay: `${feature.delay}s` }}
    >
      <div className="text-xs font-bold mb-12 flex items-center gap-2">
        <span className="w-8 h-px bg-current"></span> {feature.number}
      </div>
      <h3 className="text-3xl font-bold mb-6 group-hover:text-covet-green transition-colors">
        {feature.title}
      </h3>
      <p className="group-hover:text-gray-400 transition-colors leading-relaxed text-gray-500">
        {feature.description}
      </p>
    </div>
  );
}
