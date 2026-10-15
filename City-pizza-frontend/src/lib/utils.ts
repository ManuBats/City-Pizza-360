import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Une clases condicionales (equivale a lib/utils.ts de CCA). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
