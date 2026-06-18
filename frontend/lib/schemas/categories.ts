import { z } from 'zod'

export const CategoryKindEnum = z.enum(['event', 'course'])
export type CategoryKind = z.infer<typeof CategoryKindEnum>

export const CategorySchema = z.object({
  slug: z
    .string()
    .min(2, 'Min 2 chars')
    .max(40, 'Max 40 chars')
    .regex(/^[a-z0-9_-]+$/, 'Use lowercase letters, numbers, hyphens only'),
  label: z.string().min(2, 'Min 2 chars').max(60, 'Max 60 chars'),
  kind: CategoryKindEnum,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a hex colour like #3B82F6'),
  sort_order: z.number().int().min(0).default(0),
})

export type CategoryInput = z.infer<typeof CategorySchema>

export interface CategoryRow extends CategoryInput {
  id: string
  created_at?: string
  updated_at?: string
}
