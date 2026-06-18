'use client'

import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef, useState } from 'react'

interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

function EyeOffIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function EyeOnIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false)

    return (
      <div className="w-full">
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? 'text' : 'password'}
            suppressHydrationWarning
            aria-describedby={error ? `${id}-error` : undefined}
            aria-invalid={error ? true : undefined}
            className={cn(
              'w-full h-[56px] rounded-xl bg-bg-input pl-6 pr-[48px] text-body text-text-primary placeholder:text-text-tertiary border border-transparent transition-colors duration-150 outline-none focus:border-accent-primary caret-accent-primary',
              error && 'border-text-error',
              className,
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            suppressHydrationWarning
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors"
          >
            {visible ? <EyeOnIcon /> : <EyeOffIcon />}
          </button>
        </div>
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
PasswordInput.displayName = 'PasswordInput'
