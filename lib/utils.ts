import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number as USD currency with proper accounting format.
 * Negative values are displayed with the minus sign before the dollar sign.
 * Examples: $1,234.56, -$1,234.56
 */
export function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount)
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  
  if (amount < 0) {
    return `-$${formatted}`
  }
  return `$${formatted}`
}

