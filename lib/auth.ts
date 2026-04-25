import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import Apple from 'next-auth/providers/apple'
import MicrosoftEntraId from 'next-auth/providers/microsoft-entra-id'
import { db } from './db'
import { loginSchema } from './validations/auth'
import { verifyRecaptcha } from './recaptcha'
import { loginRateLimit, checkRateLimit } from './rate-limit'
import argon2 from 'argon2'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        recaptchaToken: { label: 'reCAPTCHA', type: 'text' },
        ip: { label: 'IP', type: 'text' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password, recaptchaToken } = parsed.data
        const ip = (credentials?.ip as string) ?? 'unknown'

        // reCAPTCHA verification
        const captchaOk = await verifyRecaptcha(recaptchaToken)
        if (!captchaOk) return null

        // Rate limit by IP
        const ipLimit = await checkRateLimit(loginRateLimit, `ip:${ip}`)
        if (!ipLimit.success) return null

        // Rate limit by email
        const emailLimit = await checkRateLimit(loginRateLimit, `email:${email}`)
        if (!emailLimit.success) return null

        const user = await db.user.findUnique({ where: { email } })
        if (!user?.passwordHash) return null

        const valid = await argon2.verify(user.passwordHash, password)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(' '),
          image: user.avatarUrl,
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Apple({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    MicrosoftEntraId({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60,  // update session every 24h
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60,
      },
    },
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id
        // Fetch fresh profile data for session
        const dbUser = await db.user.findUnique({ where: { id: user.id } })
        if (dbUser) {
          session.user.name = [dbUser.firstName, dbUser.lastName]
            .filter(Boolean)
            .join(' ')
          session.user.image = dbUser.avatarUrl ?? undefined
          ;(session.user as typeof session.user & { firstName?: string }).firstName =
            dbUser.firstName
          ;(session.user as typeof session.user & { title?: string | null }).title =
            dbUser.title
          ;(session.user as typeof session.user & { level?: number }).level =
            dbUser.level
        }
      }
      return session
    },
  },
})
