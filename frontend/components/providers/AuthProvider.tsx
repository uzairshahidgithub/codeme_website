'use client'

// Supabase sessions are managed via @supabase/ssr cookies — no client-side
// provider wrapper is needed. This component is kept as a structural passthrough
// to avoid modifying the root layout import graph.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
