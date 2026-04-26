import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { DevThemeProvider } from '@/components/providers/DevThemeProvider'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
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
    <html lang="en" className={`${poppins.variable} dark`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const STORE_KEY = 'codemo.theme';
                let saved = localStorage.getItem(STORE_KEY);
                let isDark = true; // default matches SSR

                if (saved) {
                  // User has an explicit saved preference
                  const state = JSON.parse(saved).state;
                  if (state && typeof state.isDark === 'boolean') {
                    isDark = state.isDark;
                  }
                } else {
                  // No saved preference — use device system preference
                  isDark = !(window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches);
                  // Persist it so Zustand rehydrates with the correct value
                  localStorage.setItem(STORE_KEY, JSON.stringify({ state: { isDark }, version: 0 }));
                }

                document.documentElement.classList.toggle('dark', isDark);
                document.documentElement.classList.toggle('light', !isDark);
              } catch (e) {}
            `,
          }}
        />
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
