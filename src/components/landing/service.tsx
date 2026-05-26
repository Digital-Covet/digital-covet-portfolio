"use client";

import type { Icon } from "@phosphor-icons/react";
import { CodeIcon, PenNibIcon, StrategyIcon } from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";

interface Service {
  icon: Icon;
  title: string;
  description: string;
}

const services: Service[] = [
  {
    icon: PenNibIcon,
    title: "Product Design",
    description:
      "High-fidelity UI/UX that scales with your ambition. We build intuitive, conversion-focused interfaces that command attention.",
  },
  {
    icon: StrategyIcon,
    title: "Brand Strategy",
    description:
      "Defining the visual and narrative core of your identity. We position luxury and tech brands for undeniable market dominance.",
  },
  {
    icon: CodeIcon,
    title: "Development",
    description:
      "Bespoke React & Next.js engineering built for performance. Clean architecture powering seamless digital experiences.",
  },
];
export function Services() {
  return (
    <section id="services" className="bg-muted py-36 font-heading">
      <div className="max-w-360 mx-auto px-6 md:px-16">
        <div className="text-center mb-16">
          <span className="inline-block bg-card border border-border px-5 py-2 text-xs uppercase tracking-widest mb-4">
            Our Expertise
          </span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
            Disciplines of Craft
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <Card
                key={service.title}
                className="p-10 border border-border group hover:border-primary transition-all duration-300 fade-up h-full gap-0"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 bg-muted flex items-center justify-center mb-8 group-hover:bg-primary/10 transition-colors">
                  <IconComponent className="text-3xl text-primary" />
                </div>

                <CardTitle className="text-2xl font-semibold mb-4 group-hover:text-primary transition-colors px-0">
                  {service.title}
                </CardTitle>

                <CardContent className="px-0 grow text-base">
                  <p className="text-foreground/70 leading-relaxed">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
