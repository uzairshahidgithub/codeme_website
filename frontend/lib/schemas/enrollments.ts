import { z } from 'zod'

export const EnrollmentStatusSchema = z.enum(['pending', 'verified', 'cleared'])
export type EnrollmentStatus = z.infer<typeof EnrollmentStatusSchema>

export const CourseEnrollmentSchema = z.object({
  id: z.string().uuid(),
  payment_id: z.string(),
  user_id: z.string().uuid().nullable(),
  course_id: z.string(),
  course_title: z.string(),
  student_name: z.string(),
  student_email: z.string(),
  student_phone: z.string(),
  student_city: z.string(),
  amount: z.number().nullable(),
  status: EnrollmentStatusSchema,
  cleared_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type CourseEnrollmentRow = z.infer<typeof CourseEnrollmentSchema>

export const SubmitEnrollmentSchema = z.object({
  payment_id: z.string().min(1).max(80),
  course_id: z.string().min(1).max(80),
  course_title: z.string().min(1).max(200),
  student_name: z.string().min(1).max(120),
  student_email: z.string().email().max(200),
  student_phone: z.string().min(1).max(40),
  student_city: z.string().min(1).max(80),
  amount: z.number().nullable().optional(),
})

export const UpdateEnrollmentSchema = z.object({
  id: z.string().uuid(),
  status: EnrollmentStatusSchema,
  admin_notes: z.string().max(2000).nullable().optional(),
})
