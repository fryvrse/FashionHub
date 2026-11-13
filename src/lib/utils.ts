import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num || 0);
}

export function getDiscountPercent(
  basePrice: number,
  discountPrice?: number | null
): number {
  if (!discountPrice || discountPrice >= basePrice) return 0;
  return Math.round(((basePrice - discountPrice) / basePrice) * 100);
}

