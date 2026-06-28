import { z } from 'zod';

export const personSchema = z
  .object({
    name_en: z.string().min(1, 'Name (English) is required').max(200),
    name_ml: z.string().max(200).optional().nullable(),
    gender: z.enum(['male', 'female', 'other', 'unknown']).default('unknown'),
    birth_date: z.string().optional().nullable(),
    birth_date_approx: z.boolean().default(false),
    death_date: z.string().optional().nullable(),
    is_alive: z.boolean().default(true),
    biography_en: z.string().max(5000).optional().nullable(),
    biography_ml: z.string().max(5000).optional().nullable(),
    house_id: z.string().uuid().optional().nullable(),
    is_root: z.boolean().default(false),
    // Relationship fields — each entry is either a UUID (existing person) or "new:<name>" (inline create)
    parent_ids: z.array(z.string().min(1)).max(2).default([]),
    spouse_ids: z.array(z.string().min(1)).default([]),
    child_ids: z.array(z.string().min(1)).default([]),
  })
  .refine(
    (data) => {
      if (data.birth_date && data.death_date) {
        return new Date(data.death_date) >= new Date(data.birth_date);
      }
      return true;
    },
    { message: 'Death date must be after birth date', path: ['death_date'] }
  );

export type PersonFormValues = z.infer<typeof personSchema>;
