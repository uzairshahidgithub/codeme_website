import { z } from 'zod'

export const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  )

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
  recaptchaToken: z.string().min(1, 'Please complete the reCAPTCHA'),
})

export const signupStep1Schema = z.object({
  email: z.string().email(),
  password: passwordSchema,
})

export const signupStep2Schema = z.object({
  dob: z.object({
    dd: z
      .string()
      .regex(/^\d{1,2}$/)
      .refine((v) => +v >= 1 && +v <= 31, 'Invalid day'),
    mm: z
      .string()
      .regex(/^\d{1,2}$/)
      .refine((v) => +v >= 1 && +v <= 12, 'Invalid month'),
    yyyy: z
      .string()
      .regex(/^\d{4}$/)
      .refine(
        (v) => +v >= 1900 && +v <= new Date().getFullYear() - 13,
        'You must be at least 13 years old',
      ),
  }),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be 20 characters or fewer')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username may only contain letters, numbers, and underscores',
    ),
  gender: z.string().min(1, 'Please select a gender'),
})

export const signupStep3Schema = z.object({
  domain: z.string().min(1, 'Please enter your career domain'),
  status: z.string().min(1, 'Please select your current status'),
})

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be exactly 6 digits')
    .regex(/^\d+$/, 'Code must be numeric only'),
  recaptchaToken: z.string().min(1, 'Please complete the reCAPTCHA'),
})

export const signupPayloadSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  dob: z.string().datetime(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  gender: z.string().min(1),
  domain: z.string().min(1),
  status: z.string().min(1),
})
