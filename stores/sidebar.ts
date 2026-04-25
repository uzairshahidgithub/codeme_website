import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SidebarStore {
  isExpanded: boolean
  expand: () => void
  collapse: () => void
  toggle: () => void
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isExpanded: false,
      expand: () => set({ isExpanded: true }),
      collapse: () => set({ isExpanded: false }),
      toggle: () => set((s) => ({ isExpanded: !s.isExpanded })),
    }),
    {
      name: 'codemo.sidebar.expanded',
      // Only restore on desktop; narrow viewports always start collapsed
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
          state?.collapse()
        }
      },
    },
  ),
)
