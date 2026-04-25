import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      firstName?: string
      title?: string | null
      level?: number
    } & DefaultSession['user']
  }
}
