'use server';

/**
 * @fileOverview AI flow to generate a trivia question for the game.
 *
 * - generateQuestion - A function that generates a trivia question.
 * - GenerateQuestionInput - The input type for the generateQuestion function.
 * - GenerateQuestionOutput - The return type for the generateQuestion function.
 */

import {ai, model} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuestionInputSchema = z.object({
  theme: z.string().describe('The theme of the trivia question.'),
  language: z.string().describe('The language for the trivia question.'),
});
export type GenerateQuestionInput = z.infer<typeof GenerateQuestionInputSchema>;

const GenerateQuestionOutputSchema = z.object({
  question: z.string().describe('The trivia question.'),
  options: z.array(z.string()).describe('An array of 4 multiple-choice options.'),
  answer: z.string().describe('The correct answer from the options.'),
  imageQuery: z.string().describe('A one or two-word search query for a relevant image for the question. For example, "Eiffel Tower" or "Albert Einstein".'),
});
export type GenerateQuestionOutput = z.infer<typeof GenerateQuestionOutputSchema>;

export async function generateQuestion(
  input: GenerateQuestionInput
): Promise<GenerateQuestionOutput> {
  return generateQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuestionPrompt',
  input: {schema: GenerateQuestionInputSchema},
  output: {schema: GenerateQuestionOutputSchema},
  prompt: `You are a trivia master. Generate a multiple-choice question for a trivia game in the specified language.

Language: {{{language}}}
Theme: {{{theme}}}

Generate a challenging but fair multiple-choice question about the given theme in the specified language.
Provide 4 distinct options, with one of them being the correct answer.
Also provide a one or two-word search query for a relevant background image for the question.
Ensure the question, options, answer, and imageQuery are all populated in the output.
`,
});

const generateQuestionFlow = ai.defineFlow(
  {
    name: 'generateQuestionFlow',
    inputSchema: GenerateQuestionInputSchema,
    outputSchema: GenerateQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, {model});
    return output!;
  }
);
