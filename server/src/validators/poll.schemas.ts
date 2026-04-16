import { z } from 'zod';

export const voteSchema = z.object({
  optionId: z.string().min(1),
});
