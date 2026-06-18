import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          id={id}
          suppressHydrationWarning
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            'w-full h-[56px] rounded-xl bg-bg-input px-6 text-body text-text-primary placeholder:text-text-tertiary border border-transparent transition-colors duration-150 outline-none focus:border-accent-primary caret-accent-primary',
            error && 'border-text-error',
            className,
          )}
          {...props}
        />
        {error && (
          <p
            id={`${id}-error`}
            role="alert"
            className="mt-1.5 text-caption text-text-error"
          >
            {error}
          </p>
        )}
      </div>
    )
  },
)
Input.displayName = 'Input'
