import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const SIZES = {
  sm: { box: 'w-8 h-8', img: 32 },
  md: { box: 'w-10 h-10 md:w-12 md:h-12', img: 48 },
  lg: { box: 'w-14 h-14 md:w-16 md:h-16', img: 64 },
} as const

export function LoadingDots({ className, size = 'md', label = 'Loading' }: Props) {
  const dim = SIZES[size]
  return (
    <div
      className={cn('inline-flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-label={label}
    >
      <div className={cn('relative shrink-0', dim.box)}>
        <Image
          src="/loading-dots-blue.gif"
          alt=""
          width={dim.img}
          height={dim.img}
          unoptimized
          className="object-contain w-full h-full"
        />
      </div>
      {label && size !== 'sm' && (
        <span className="text-text-tertiary text-sm">{label}</span>
      )}
    </div>
  )
}

export function LoadingDotsCentered(props: Omit<Props, 'className'> & { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-16', props.className)}>
      <LoadingDots {...props} />
    </div>
  )
}
