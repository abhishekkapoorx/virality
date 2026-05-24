import { z } from "zod";

export const OnboardingAnswersSchema = z.object({
  industry: z.string().min(1),
  icps: z.array(z.string()).min(1),
  topics: z.string().optional(),
  writingStyle: z.string().optional(),
  brandVoice: z.string().optional(),
  personalizationNotes: z.string().optional()
});

export type OnboardingAnswers = z.infer<typeof OnboardingAnswersSchema>;

export const OnboardingAnswersDraftSchema = z.object({
  industry: z.string().trim().optional(),
  icps: z.array(z.string().trim()).optional(),
  topics: z.string().trim().optional(),
  writingStyle: z.string().trim().optional(),
  brandVoice: z.string().trim().optional(),
  personalizationNotes: z.string().trim().optional()
});

export type OnboardingAnswersDraft = z.infer<typeof OnboardingAnswersDraftSchema>;

export const SetupProfileSchema = z.object({
  industry: z.string().min(1),
  icps: z.array(z.string()).min(1),
  writingStyle: z.string().optional(),
  brandVoice: z.string().optional(),
  personalizationNotes: z.string().optional(),
  postConstraints: z.record(z.any()).optional(),
  exampleAngles: z.array(z.string()).optional()
});

export type SetupProfile = z.infer<typeof SetupProfileSchema>;

export const SetupGenerationResponseSchema = z.object({
  profile: SetupProfileSchema,
  version: z.number().int().positive()
});

export type SetupGenerationResponse = z.infer<typeof SetupGenerationResponseSchema>;
