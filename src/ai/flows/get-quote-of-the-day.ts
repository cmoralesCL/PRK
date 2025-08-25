'use server';
/**
 * @fileOverview AI-powered tool to generate a short, motivational quote.
 *
 * - getQuoteOfTheDay - A function that returns a motivational quote.
 * - QuoteOfTheDayOutput - The return type for the getQuoteOfTheDay function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuoteOfTheDayOutputSchema = z.object({
  quote: z.string().describe('A short, motivational quote. It should be concise and impactful.'),
  author: z.string().describe('The author of the quote. If unknown, can be "Anónimo".'),
});
export type QuoteOfTheDayOutput = z.infer<
  typeof QuoteOfTheDayOutputSchema
>;

export async function getQuoteOfTheDay(): Promise<QuoteOfTheDayOutput> {
  return getQuoteOfTheDayFlow();
}

const prompt = ai.definePrompt({
  name: 'getQuoteOfTheDayPrompt',
  output: {schema: QuoteOfTheDayOutputSchema},
  prompt: `You are a helpful assistant that provides inspirational quotes. 
  
  Please provide a short, powerful, and motivational quote that can inspire someone for their day. The quote should be in Spanish.
  `,
});

const getQuoteOfTheDayFlow = ai.defineFlow(
  {
    name: 'getQuoteOfTheDayFlow',
    outputSchema: QuoteOfTheDayOutputSchema,
  },
  async () => {
    const {output} = await prompt({});
    return output!;
  }
);
