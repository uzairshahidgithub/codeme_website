import { z } from 'zod'

export const CourseLevelEnum = z.enum(['beginner', 'intermediate', 'advanced'])
export const CourseStatusEnum = z.enum(['draft', 'published', 'archived'])

export type CourseLevel = z.infer<typeof CourseLevelEnum>
export type CourseStatus = z.infer<typeof CourseStatusEnum>

export const CourseSchema = z.object({
  title: z.string().min(3, 'Min 3 chars').max(120, 'Max 120 chars'),
  description: z.string().min(10, 'Min 10 chars').max(3000, 'Max 3000 chars'),
  thumbnail_url: z.string().url().optional().or(z.literal('')),
  level: CourseLevelEnum,
  instructor_name: z.string().min(2, 'Min 2 chars').max(80, 'Max 80 chars'),
  instructor_avatar_url: z.string().url().optional().or(z.literal('')),
  duration_hours: z.number().int().min(1).max(500),
  enrolled_count: z.number().int().min(0).default(0),
  category: z.string().min(2).max(40).optional().or(z.literal('')),
  tags: z.array(z.string().min(1).max(30)).max(12).default([]),
  status: CourseStatusEnum.default('draft'),
  is_featured: z.boolean().default(false),
  featured_label: z.string().max(40).optional().or(z.literal('')),
  featured_sort_order: z.number().int().min(0).max(999).default(0),
  price: z.number().min(0).default(0),
  original_price: z.number().min(0).nullable().optional(),
  rating: z.number().min(0).max(5).default(4.5),
  duration_label: z.string().max(40).optional().or(z.literal('')),
  short_description: z.string().max(300).optional().or(z.literal('')),
})

export type CourseInput = z.infer<typeof CourseSchema>

export interface CourseRow extends CourseInput {
  id: string
  created_at?: string
  updated_at?: string
}
