"use client";

import Link from "next/link";
import { useRef } from "react";
import { teamMembers } from "@/data/landing/team";
import { useInView } from "@/hooks/useInView";
import { useParallax } from "@/hooks/useParallax";

export function IntroSection() {
  const { ref, isInView } = useInView();
  const starRef = useRef<HTMLDivElement>(null);

  useParallax(starRef, { speed: 2 });

  return (
    <section className="max-w-400 mx-auto px-6 py-24 border-b border-gray-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        <div ref={ref} className={`reveal ${isInView ? "active" : ""}`}>
          <h2 className="text-5xl font-medium leading-tight mb-8">
            DIGITAL COVET
            <br />
            helps brands find their
            <br />
            voice, shape story
          </h2>

          <Link
            href="#"
            className="inline-block bg-black text-white px-8 py-4 text-sm font-semibold uppercase hover:bg-covet-green transition-colors mb-16"
          >
            Let's Get Started
          </Link>

          <div className="flex gap-8 items-start border-t border-gray-200 pt-8 mt-12 relative">
            <div ref={starRef} className="absolute right-0 top-8 text-2xl">
              ✺
            </div>

            <div className="flex items-center gap-4 w-1/3">
              <div
                className={`flex -space-x-4 stagger-container ${isInView ? "active" : ""}`}
              >
                {teamMembers.map((member, index) => (
                  <img
                    key={index}
                    alt={member.alt}
                    className="w-12 h-12 rounded-full border-2 border-white object-cover stagger-item"
                    src={member.avatar}
                    style={{ transitionDelay: `${member.delay}s` }}
                  />
                ))}
                <div
                  className="w-12 h-12 rounded-full bg-covet-green border-2 border-white text-white flex items-center justify-center text-sm font-bold stagger-item"
                  style={{ transitionDelay: "0.4s" }}
                >
                  4.9/5
                </div>
              </div>
            </div>

            <div className="w-1/3">
              <p className="text-gray-600 text-sm">
                Every detail matters... every choice tells a story We shape
                brands that not not look good.
              </p>
            </div>

            <div className="w-1/3">
              <p className="text-gray-600 text-sm">
                We believe great design starts your building it's how you
                express yourself.
              </p>
            </div>
          </div>
        </div>

        <div
          className={`relative h-150 w-full reveal ${isInView ? "active" : ""}`}
        >
          <img
            alt="Creative Workspace"
            className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_tOBzs3ns0uE_pUUIUiip3IIjQFB_ooPzejFei42aRifxd2Sr0AO_E-bAPe46kUlsABhByeZwDdUIUh6YOf--EcSKUTVISyvW7PfUF3I4i6tE8ROOZgcScX7nySXAlHWl5v9tH5UpsIvEz4SHVYSDBVJLbJgmnXnYMIFiPGotu6UVoN6AtY6v_5pfz4kTrDhQ4Z43KKjf63mMxX3cZsiF-LKGTYR3-eK3iR3XEc3vhETnFCuDFlSNd1LPg7iVNJMuu9YEQwFBCxXp"
          />
        </div>
      </div>
    </section>
  );
}
