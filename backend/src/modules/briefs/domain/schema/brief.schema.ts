import { z } from 'zod';

const userStorySchema = z.object({
  title: z.string(),
  description: z.string(),
  acceptance_criteria: z.array(z.string()).min(1),
  priority: z.enum(['high', 'medium', 'low']),
  complexity: z.enum(['low', 'medium', 'high']),
});

export const briefSchema = z.object({
  level: z.enum(['junior', 'intermediate', 'senior']),
  domain: z.string(),
  tech_focus: z.enum(['frontend', 'backend', 'fullstack']),
  stack: z.array(z.string()).min(1),
  duration: z.string(),
  brief: z.string(),
  business_problem: z.string(),
  target_users: z.string(),
  goals: z.array(z.string()).min(1),
  deliverables: z.array(z.string()).min(1),
  assessment_criteria: z.string(),
  company_size: z.enum(['Startup', 'SME', 'Large Enterprise']),
  complexity: z.enum(['low', 'medium', 'high']),
  user_stories: z.array(userStorySchema).min(3).max(3),
});

export type ProjectBrief = z.infer<typeof briefSchema>;
