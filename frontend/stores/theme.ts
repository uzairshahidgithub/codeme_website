import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  isDark: boolean
  toggleTheme: () => void
}

/** Apply dark/light class to <html> immediately */
function applyClass(isDark: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.classList.toggle('light', !isDark)
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      // Safe SSR default — always dark; the inline <head> script and
      // Zustand rehydration will correct this on the client immediately.
      isDark: true,
      toggleTheme: () =>
        set((s) => {
          const next = !s.isDark
          applyClass(next)
          return { isDark: next }
        }),
    }),
    {
      name: 'codemo.theme',
      // After Zustand rehydrates from localStorage, apply the correct class.
      onRehydrateStorage: () => (state) => {
        if (!state) return
        applyClass(state.isDark)
      },
    },
  ),
)
