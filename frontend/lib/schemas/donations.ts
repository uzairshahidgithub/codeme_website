import { z } from 'zod'

export const DonationStatusSchema = z.enum(['pending', 'verified', 'rejected'])
export type DonationStatus = z.infer<typeof DonationStatusSchema>

export const PaymentMethodSchema = z.enum(['jazzcash', 'easypaisa', 'bank', 'other']).nullable()
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>

export const DonationIntentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  amount: z.number(),
  currency: z.string(),
  ocr_text: z.string().nullable(),
  transaction_id: z.string().nullable(),
  extracted_amount: z.number().nullable(),
  payment_method: PaymentMethodSchema,
  status: DonationStatusSchema,
  admin_notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type DonationIntentRow = z.infer<typeof DonationIntentSchema>

export const UpdateDonationSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().min(100).max(5000),
  currency: z.string().min(1).max(8),
  transaction_id: z.string().max(120).nullable().optional(),
  extracted_amount: z.number().nullable().optional(),
  payment_method: PaymentMethodSchema.optional(),
  status: DonationStatusSchema,
  admin_notes: z.string().max(2000).nullable().optional(),
  ocr_text: z.string().max(10000).nullable().optional(),
})

export type UpdateDonationInput = z.infer<typeof UpdateDonationSchema>

export interface OcrExtractResult {
  text: string
  transaction_id: string | null
  extracted_amount: number | null
  payment_method: PaymentMethod
}
