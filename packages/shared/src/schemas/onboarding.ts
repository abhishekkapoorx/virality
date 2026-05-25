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
  topics: z.string().optional(),
  postConstraints: z.record(z.any()).optional(),
  exampleAngles: z.array(z.string()).optional(),
  detailedDocs: z.object({
    industryNarrative: z.string().min(1),
    topicLanes: z.array(z.string().min(1)).min(1),
    writingStyleGuide: z.string().min(1),
    brandVoiceGuide: z.string().min(1),
    personalizationGuide: z.string().min(1),
    icpCards: z
      .array(
        z.object({
          label: z.string().min(1),
          role: z.string().min(1),
          context: z.string().min(1),
          painPoints: z.array(z.string().min(1)).min(1),
          desiredOutcome: z.string().min(1),
          messageAngles: z.array(z.string().min(1)).min(1),
          ctaStyle: z.string().min(1)
        })
      )
      .length(3)
  })
});

export type SetupProfile = z.infer<typeof SetupProfileSchema>;
export type SetupDetailedDocs = NonNullable<SetupProfile["detailedDocs"]>;

export const SetupGenerationResponseSchema = z.object({
  profile: SetupProfileSchema,
  version: z.number().int().positive()
});

export type SetupGenerationResponse = z.infer<typeof SetupGenerationResponseSchema>;
