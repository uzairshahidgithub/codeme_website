import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeOverride = 'system' | 'light' | 'dark'

interface ThemeStore {
  override: ThemeOverride
  isDark: boolean
  setOverride: (override: ThemeOverride) => void
  toggleTheme: () => void
}

function getSystemDark(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 1024
}

function resolveIsDark(override: ThemeOverride): boolean {
  if (isMobile()) return getSystemDark()
  if (override === 'light') return false
  if (override === 'dark') return true
  return getSystemDark()
}

function applyClass(isDark: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.classList.toggle('light', !isDark)
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      override: 'system' as ThemeOverride,
      isDark: true,
      setOverride: (override) => {
        const isDark = resolveIsDark(override)
        applyClass(isDark)
        set({ override, isDark })
      },
      toggleTheme: () => {
        const { override, isDark } = get()
        // Desktop only; mobile never calls this
        const nextDark = !isDark
        const nextOverride: ThemeOverride = nextDark ? 'dark' : 'light'
        applyClass(nextDark)
        set({ override: nextOverride, isDark: nextDark })
      },
    }),
    {
      name: 'codemo.theme.override',
      partialize: (s) => ({ override: s.override }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const isDark = resolveIsDark(state.override)
        applyClass(isDark)
        state.isDark = isDark
      },
    },
  ),
)
