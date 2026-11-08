import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getCleanSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  try {
    return new URL(rawUrl).origin;
  } catch {
    return rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/v1\/?$/, '').replace(/\/+$/, '');
  }
}
