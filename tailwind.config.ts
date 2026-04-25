import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-base': 'var(--bg)',
        'bg-surface': 'var(--card-glass)',
        'bg-surface-elevated': 'var(--chip-glass)',
        'bg-input': 'var(--input-glass)',
        'accent-primary': 'var(--blue)',
        'accent-primary-hover': 'var(--blue)',
        'text-primary': 'var(--text1)',
        'text-secondary': 'var(--text2)',
        'text-tertiary': 'var(--text3)',
        'text-muted': 'var(--text3)',
        'text-link': 'var(--blue)',
        'text-error': '#FF5C5C',
        'border-subtle': 'var(--border)',
        'border-input': 'var(--border)',
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        pill: '999px',
        navbar: '48px',
      },
      boxShadow: {
        sm: '0 2px 8px rgba(0,0,0,0.3)',
        md: '0 4px 12px rgba(0,0,0,0.4)',
        lg: '0 8px 24px rgba(0,0,0,0.5)',
        'glow-blue': '0 0 24px rgba(45,127,249,0.25)',
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
      },
      fontSize: {
        'display': ['48px', { lineHeight: '56px', fontWeight: '300' }],
        'h1': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'h2': ['26px', { lineHeight: '34px', fontWeight: '600' }],
        'h3': ['22px', { lineHeight: '30px', fontWeight: '500' }],
        'body-lg': ['22px', { lineHeight: '30px', fontWeight: '400' }],
        'body': ['18px', { lineHeight: '26px', fontWeight: '400' }],
        'body-sm': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label': ['18px', { lineHeight: '24px', fontWeight: '500' }],
        'caption': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'btn': ['18px', { lineHeight: '24px', fontWeight: '500' }],
        'wordmark': ['30px', { lineHeight: '36px', fontWeight: '800' }],
        'wordmark-sm': ['28px', { lineHeight: '36px', fontWeight: '800' }],
      },
      spacing: {
        '4.5': '18px',
        '13': '52px',
        '15': '60px',
        '18': '72px',
        '22': '88px',
        '24': '96px',
      },
      transitionDuration: {
        '220': '220ms',
        '240': '240ms',
      },
      width: {
        'sidebar-expanded': '220px',
        'sidebar-collapsed': '72px',
      },
      minWidth: {
        'sidebar-expanded': '220px',
        'sidebar-collapsed': '72px',
      },
      keyframes: {
        'search-expand': {
          from: { width: '52px', opacity: '0.4' },
          to: { width: '320px', opacity: '1' },
        },
        'drop-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
      },
      animation: {
        'search-expand': 'search-expand 240ms ease-out forwards',
        'drop-down': 'drop-down 220ms ease-out forwards',
        'fade-in': 'fade-in 200ms ease-out forwards',
        'fade-out': 'fade-out 200ms ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
