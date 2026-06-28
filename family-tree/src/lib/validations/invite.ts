import { z } from 'zod';

export const createInviteSchema = z.object({
  email: z.string().email().optional().or(z.literal('')),
});

export type CreateInviteValues = z.infer<typeof createInviteSchema>;
