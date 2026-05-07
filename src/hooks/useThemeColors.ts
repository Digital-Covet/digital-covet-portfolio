"use client";

import { useCallback, useEffect, useState } from "react";

export interface ThemeColors {
  primary: string;
  popover: string;
  border: string;
}

function readCssVariable(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  if (!val) return fallback;

  if (val.startsWith("#") || val.startsWith("rgb") || val.startsWith("hsl")) {
    return val;
  }

  if (val.includes(" ")) {
    const parts = val.split(/\s+/);
    if (parts.length >= 3) {
      return `hsl(${parts[0]}, ${parts[1]}, ${parts[2]})`;
    }
  }
  return `hsl(${val})`;
}

function readThemeColors(): ThemeColors {
  return {
    primary: readCssVariable("--primary", "#000"),
    popover: readCssVariable("--popover", "#fff"),
    border: readCssVariable("--border", "#ccc"),
  };
}

export function useThemeColors(watchClass = false): ThemeColors {
  const [colors, setColors] = useState<ThemeColors>(readThemeColors);

  const refresh = useCallback(() => {
    setColors((prev) => {
      const next = readThemeColors();
      if (
        prev.primary === next.primary &&
        prev.popover === next.popover &&
        prev.border === next.border
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", refresh);

    let observer: MutationObserver | undefined;
    if (watchClass) {
      observer = new MutationObserver(refresh);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    return () => {
      mq.removeEventListener("change", refresh);
      observer?.disconnect();
    };
  }, [refresh, watchClass]);

  return colors;
}
