import { clsx, type ClassValue } from 'clsx'
import { useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function findDifference(arr1: string[], arr2: string[]) {
  const set1 = new Set(arr1)
  const set2 = new Set(arr2)

  const removed = arr1.filter((item) => !set2.has(item))
  const added = arr2.filter((item) => !set1.has(item))

  return [...removed, ...added]
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false; // на сервере, например для SSR
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQueryList.addEventListener("change", listener);
    return () => mediaQueryList.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
