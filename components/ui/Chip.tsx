import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  label: string
}

export function Chip({ selected = false, label, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={cn(
        'h-11 px-6 rounded-pill text-body-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary',
        selected
          ? 'bg-accent-primary text-white'
          : 'bg-bg-surface-elevated text-text-tertiary hover:bg-white/10',
        className,
      )}
      {...props}
    >
      {label}
    </button>
  )
}
