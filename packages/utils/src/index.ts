import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatINR(amount: number | string | null | undefined): string {
  if (amount == null) return '—'
  const n = typeof amount === 'string' ? Number(amount) : amount
  if (Number.isNaN(n)) return '—'
  return inrFormatter.format(n)
}

export function generateOrderNumber(sequence: number, year: number = new Date().getFullYear()): string {
  return `AKI-${year}-${String(sequence).padStart(5, '0')}`
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function isLowStock(qtyAvailable: number, qtyReserved: number, threshold = 5): boolean {
  return qtyAvailable - qtyReserved <= threshold
}

export function isOutOfStock(qtyAvailable: number, qtyReserved: number): boolean {
  return qtyAvailable - qtyReserved <= 0
}