import { z } from 'zod';

export const addChannelSchema = z.object({
  telegramId: z.number().optional(),
  username: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  categoryId: z.number().int().positive().optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(50).optional(),
  imageUrl: z.string().url().optional(),
});

export const expertRatingSchema = z.object({
  channelId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const moderationSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['approved', 'rejected']),
  reviewedBy: z.string().max(100).optional(),
});

export const channelQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.coerce.number().int().optional(),
  country: z.string().max(100).optional(),
  language: z.string().max(50).optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(['total_score', 'subscribers', 'engagement', 'growth', 'created_at']).default('total_score'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type AddChannelInput = z.infer<typeof addChannelSchema>;
export type ExpertRatingInput = z.infer<typeof expertRatingSchema>;
export type ChannelQuery = z.infer<typeof channelQuerySchema>;
