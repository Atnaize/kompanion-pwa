import { z } from 'zod';

export const challengeSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Challenge name is required')
      .max(100, 'Name must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    type: z.enum(['collaborative', 'competitive']),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    distanceTarget: z.string().optional(),
    elevationTarget: z.string().optional(),
    activityType: z.string().optional(),
    competitiveGoal: z.enum(['most', 'least', 'exact']),
    invitedUserIds: z.array(z.number()),
  })
  .refine(
    (data) => {
      const hasDistance = data.distanceTarget && parseFloat(data.distanceTarget) > 0;
      const hasElevation = data.elevationTarget && parseFloat(data.elevationTarget) > 0;
      return hasDistance || hasElevation;
    },
    {
      message: 'At least one goal (Distance or Elevation) must be set',
      path: ['distanceTarget'],
    }
  )
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) < new Date(data.endDate);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export type ChallengeFormData = z.infer<typeof challengeSchema>;
