import type { Metadata } from 'next'
import { Poppins, Instrument_Serif } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { DevThemeProvider } from '@/components/providers/DevThemeProvider'

// Inline theme-init script: runs before hydration to avoid FOUC.
const themeInitScript = `try {
  var isMobile = window.innerWidth < 1024;
  var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark = systemDark;
  if (!isMobile) {
    var saved = localStorage.getItem('codemo.theme.override');
    if (saved) {
      var state = JSON.parse(saved).state;
      var override = state && state.override;
      if (override === 'dark') isDark = true;
      else if (override === 'light') isDark = false;
    }
  }
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('light', !isDark);
} catch (e) {}`

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

// Editorial display serif used for the rotating hero quote.
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Codemo — Your Collaborative Tech Community',
  description:
    'Codemo is a collaborative coding community platform for developers to learn, share, and build together.',
  icons: { icon: '/icons/Blue.png' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${instrumentSerif.variable} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <DevThemeProvider />
        <AuthProvider>
          <QueryProvider>{children}</QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
