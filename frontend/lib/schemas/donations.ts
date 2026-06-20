import { z } from 'zod'

export const DonationStatusSchema = z.enum(['pending', 'verified', 'rejected'])
export type DonationStatus = z.infer<typeof DonationStatusSchema>

export const PaymentMethodSchema = z.enum(['jazzcash', 'easypaisa', 'bank', 'other']).nullable()
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>

export const DonationIntentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  donor_name: z.string().nullable(),
  donor_email: z.string().nullable(),
  donor_phone: z.string().nullable(),
  donor_notes: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  transaction_id: z.string().nullable(),
  payment_method: PaymentMethodSchema,
  receipt_path: z.string().nullable(),
  status: DonationStatusSchema,
  admin_notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type DonationIntentRow = z.infer<typeof DonationIntentSchema>

export const UpdateDonationSchema = z.object({
  id: z.string().uuid(),
  donor_name: z.string().min(1).max(120),
  donor_email: z.preprocess(
    (v) => (typeof v === 'string' && !v.trim() ? null : v),
    z.string().email().max(200).nullable().optional(),
  ),
  donor_phone: z.string().max(40).nullable().optional(),
  donor_notes: z.string().max(2000).nullable().optional(),
  amount: z.number().min(100).max(5000),
  currency: z.string().min(1).max(8),
  transaction_id: z.string().min(1).max(120),
  payment_method: PaymentMethodSchema.optional(),
  status: DonationStatusSchema,
  admin_notes: z.string().max(2000).nullable().optional(),
})

export type UpdateDonationInput = z.infer<typeof UpdateDonationSchema>

export const SubmitDonationSchema = z.object({
  donor_name: z.string().min(1).max(120),
  donor_email: z.preprocess(
    (v) => (typeof v === 'string' && !v.trim() ? undefined : v),
    z.string().email().max(200).optional(),
  ),
  donor_phone: z.string().max(40).optional(),
  donor_notes: z.string().max(2000).optional(),
  amount: z.number().min(100).max(5000),
  currency: z.string().min(1).max(8).default('PKR'),
  transaction_id: z.string().min(1).max(120),
  payment_method: z.enum(['jazzcash', 'easypaisa', 'bank', 'other']),
})

export type SubmitDonationInput = z.infer<typeof SubmitDonationSchema>
