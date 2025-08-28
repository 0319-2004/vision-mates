import { z } from 'zod'

export const projectSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(100, 'タイトルは100文字以内で入力してください'),
  purpose: z.string().min(1, '目的は必須です').max(500, '目的は500文字以内で入力してください'),
  tags: z.array(z.string()).max(10, 'タグは10個まで設定できます'),
})

export const commentSchema = z.object({
  text: z.string().min(1, 'コメントは必須です').max(1000, 'コメントは1000文字以内で入力してください'),
})

export const progressUpdateSchema = z.object({
  text: z.string().min(1, '進捗は必須です').max(500, '進捗は500文字以内で入力してください'),
})

export const intentSchema = z.object({
  level: z.enum(['watch', 'raise', 'commit']),
}) 