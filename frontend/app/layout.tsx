import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { Poppins, Instrument_Serif, Geist_Mono, Bricolage_Grotesque, Fraunces } from 'next/font/google'
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
  var stripInjectedAttrs = function () {
    document.querySelectorAll('[fdprocessedid]').forEach(function (node) {
      node.removeAttribute('fdprocessedid');
    });
  };
  stripInjectedAttrs();
  var observer = new MutationObserver(stripInjectedAttrs);
  observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['fdprocessedid'] });
  setTimeout(function () { observer.disconnect(); stripInjectedAttrs(); }, 3000);
} catch (e) {}`

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
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

// Geist Mono — variable font; do NOT specify weight array on variable fonts.
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

// Bricolage Grotesque — variable display face used for bento headlines.
// Variable font: weight axis is continuous, no weight array needed.
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
})

// Fraunces — variable serif used for editorial accents (founder quote, etc.).
// SOFT axis turned up for a more humanist feel. Variable font: no weight array.
const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Codemo Teams',
  description:
    'Codemo is a collaborative coding community platform for developers to learn, share, and build together.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Codemo Teams',
    description: 'A collaborative coding community for developers worldwide.',
    type: 'website',
    url: 'https://codemoteams.org',
    siteName: 'Codemo Teams',
    images: [{ url: 'https://codemoteams.org/icons/codemo-logo-light.svg', width: 1200, height: 630, alt: 'Codemo Teams' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codemo Teams',
    images: ['https://codemoteams.org/icons/codemo-logo-light.svg'],
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html lang="en" className={`${poppins.variable} ${instrumentSerif.variable} ${geistMono.variable} ${bricolage.variable} ${fraunces.variable} dark`} suppressHydrationWarning>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeInitScript }} />
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
