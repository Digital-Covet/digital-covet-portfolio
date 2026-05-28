import { type RefObject, useEffect } from "react";
import { useMousePosition } from "./useMousePosition";

interface UseParallaxOptions {
  speed?: number;
  rotate?: boolean;
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  ref: RefObject<T | null>,
  options: UseParallaxOptions = {},
) {
  const { speed = 2, rotate = false } = options;
  const { x, y } = useMousePosition();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const normalizedX = (x / window.innerWidth - 0.5) * 20;
    const normalizedY = (y / window.innerHeight - 0.5) * 20;

    const translateX = normalizedX * speed;
    const translateY = normalizedY * speed;

    if (rotate) {
      const rotation = normalizedX * normalizedY;
      element.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`;
    } else {
      element.style.transform = `translate(${translateX}px, ${translateY}px)`;
    }
  }, [x, y, speed, rotate, ref]);
}
