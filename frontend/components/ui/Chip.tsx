import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes } from 'react'

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  label: string
}

/* ────────────────────────────────────────────────────────────
   Chip — pill button used in forms (gender, status).

   Mode-aware surface:
   - Idle uses the design-token `--text1` colour at low alpha
     so the chip reads as a quiet pill in BOTH dark and light
     mode. (Previously used `--chip-glass` which is 60 % white
     in light mode — that blended into the white-ish drawer
     surface and made the chip nearly invisible.)
   - Hover lifts the alpha and brings the text to full primary.
   - Selected paints brand blue with white text, identical in
     both modes.
   ────────────────────────────────────────────────────────── */

export function Chip({ selected = false, label, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      suppressHydrationWarning
      className={cn(
        'h-10 px-5 rounded-full text-[13.5px] font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary',
        selected
          ? 'bg-accent-primary text-white border border-transparent'
          : [
              // Mode-neutral idle surface — token-driven so it
              // reads as a quiet pill on both light and dark.
              'bg-text-primary/[0.05] hover:bg-text-primary/[0.10]',
              'text-text-secondary hover:text-text-primary',
              'border border-border-subtle',
            ].join(' '),
        className,
      )}
      {...props}
    >
      {label}
    </button>
  )
}
