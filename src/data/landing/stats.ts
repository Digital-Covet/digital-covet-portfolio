import type { Stat } from "@/types/landing";

export const stats: Stat[] = [
  {
    target: 9,
    label: ["Years of", "Experiences"],
    textColor: "text-covet-green",
    borderColor: "border-covet-green",
    colSpan: "col-span-12 md:col-span-7",
    customClass: "text-[15rem] lg:text-[22rem] mix-blend-overlay",
    delay: 0,
  },
  {
    target: 108,
    label: ["Projects with", "Happy Clients"],
    textColor: "text-white",
    borderColor: "border-white",
    colSpan: "col-span-12 md:col-span-5",
    customClass: "text-[12rem] lg:text-[16rem] mix-blend-difference",
    delay: 0.2,
    marginTop: "md:mt-32",
  },
  {
    target: 11,
    label: ["Industry", "Served"],
    textColor: "text-white/20",
    borderColor: "border-white",
    colSpan: "col-span-12",
    customClass: "text-[12rem] lg:text-[16rem] mix-blend-screen",
    delay: 0.4,
    marginTop: "mt-20 md:-mt-16",
  },
];
