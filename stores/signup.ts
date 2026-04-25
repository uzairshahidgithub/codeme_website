import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface SignupDraft {
  email: string
  password: string
  dob: { dd: string; mm: string; yyyy: string }
  username: string
  gender: string
  domain: string
  status: string
  confirmationCode: string
}

interface SignupStore {
  draft: SignupDraft
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  setDob: (dob: SignupDraft['dob']) => void
  setUsername: (username: string) => void
  setGender: (gender: string) => void
  setDomain: (domain: string) => void
  setStatus: (status: string) => void
  setConfirmationCode: (code: string) => void
  clearDraft: () => void
}

const emptyDraft: SignupDraft = {
  email: '',
  password: '',
  dob: { dd: '', mm: '', yyyy: '' },
  username: '',
  gender: '',
  domain: '',
  status: '',
  confirmationCode: '',
}

export const useSignupStore = create<SignupStore>()(
  persist(
    (set) => ({
      draft: emptyDraft,
      setEmail: (email) => set((s) => ({ draft: { ...s.draft, email } })),
      setPassword: (password) =>
        set((s) => ({ draft: { ...s.draft, password } })),
      setDob: (dob) => set((s) => ({ draft: { ...s.draft, dob } })),
      setUsername: (username) =>
        set((s) => ({ draft: { ...s.draft, username } })),
      setGender: (gender) => set((s) => ({ draft: { ...s.draft, gender } })),
      setDomain: (domain) => set((s) => ({ draft: { ...s.draft, domain } })),
      setStatus: (status) => set((s) => ({ draft: { ...s.draft, status } })),
      setConfirmationCode: (confirmationCode) =>
        set((s) => ({ draft: { ...s.draft, confirmationCode } })),
      clearDraft: () => set({ draft: emptyDraft }),
    }),
    {
      name: 'codemo.signup.draft',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
