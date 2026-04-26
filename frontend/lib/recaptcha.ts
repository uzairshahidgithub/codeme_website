export async function verifyRecaptcha(token: string): Promise<boolean> {
  if (!token) return false

  // In development without a secret key, skip verification
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    if (process.env.NODE_ENV === 'development') return true
    return false
  }

  const res = await fetch(
    'https://www.google.com/recaptcha/api/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    },
  )

  const data = (await res.json()) as { success: boolean; score?: number }
  return data.success
}
