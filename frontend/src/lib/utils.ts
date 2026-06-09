import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const BIRKMAN_COLORS: Record<string, { hex: string; name: string; bg: string; text: string }> = {
  red:    { hex: '#EF4444', name: '빨강', bg: 'bg-birkman-red',    text: 'text-birkman-red' },
  yellow: { hex: '#EAB308', name: '노랑', bg: 'bg-birkman-yellow', text: 'text-birkman-yellow' },
  green:  { hex: '#22C55E', name: '초록', bg: 'bg-birkman-green',  text: 'text-birkman-green' },
  blue:   { hex: '#3B82F6', name: '파랑', bg: 'bg-birkman-blue',   text: 'text-birkman-blue' },
}
