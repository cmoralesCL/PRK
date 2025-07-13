'use server';
/**
 * @fileOverview AI-powered tool to suggest related habits and tasks based on Key PRKs.
 *
 * - suggestRelatedHabitsTasks - A function that suggests habits and tasks related to Key PRKs.
 * - SuggestRelatedHabitsTasksInput - The input type for the suggestRelatedHabitsTasks function.
 * - SuggestRelatedHabitsTasksOutput - The return type for the suggestRelatedHabitsTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestRelatedHabitsTasksInputSchema = z.object({
  keyPrk: z.string().describe('The Key PRK for which to suggest related habits and tasks.'),
  userContext: z
    .string()
    .optional()
    .describe('Additional context about the user, their goals, and current habits.'),
});
export type SuggestRelatedHabitsTasksInput = z.infer<
  typeof SuggestRelatedHabitsTasksInputSchema
>;

const SuggestRelatedHabitsTasksOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested habits and tasks related to the Key PRK.'),
});
export type SuggestRelatedHabitsTasksOutput = z.infer<
  typeof SuggestRelatedHabitsTasksOutputSchema
>;

export async function suggestRelatedHabitsTasks(
  input: SuggestRelatedHabitsTasksInput
): Promise<SuggestRelatedHabitsTasksOutput> {
  return suggestRelatedHabitsTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestRelatedHabitsTasksPrompt',
  input: {schema: SuggestRelatedHabitsTasksInputSchema},
  output: {schema: SuggestRelatedHabitsTasksOutputSchema},
  prompt: `You are a personal productivity assistant. Your goal is to suggest habits and tasks that can help the user achieve their Key PRK.

  Key PRK: {{{keyPrk}}}

  {{#if userContext}}
  User Context: {{{userContext}}}
  {{/if}}

  Please suggest a list of habits and tasks that would help the user achieve this Key PRK. Provide each suggestion on a new line.
  Suggestions:
  `,
});

const suggestRelatedHabitsTasksFlow = ai.defineFlow(
  {
    name: 'suggestRelatedHabitsTasksFlow',
    inputSchema: SuggestRelatedHabitsTasksInputSchema,
    outputSchema: SuggestRelatedHabitsTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
