'use server';

/**
 * @fileOverview AI flow to generate multiple trivia questions for a game duel.
 *
 * - generateMultipleQuestions - A function that generates a set of trivia questions.
 * - GenerateMultipleQuestionsInput - The input type for the generateMultipleQuestions function.
 * - GenerateMultipleQuestionsOutput - The return type for the generateMultipleQuestions function.
 */

import { ai, model } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateQuestionOutputSchema = z.object({
  question: z.string().describe('The trivia question.'),
  options: z.array(z.string()).describe('An array of 4 multiple-choice options.'),
  answer: z.string().describe('The correct answer from the options.'),
  imageQuery: z.string().describe('A one or two-word search query for a relevant image for the question. For example, "Eiffel Tower" or "Albert Einstein".'),
});

const GenerateMultipleQuestionsInputSchema = z.object({
  theme: z.string().describe('The theme of the trivia questions.'),
  language: z.string().describe('The language for the trivia questions.'),
  count: z.number().describe('The number of questions to generate.'),
});
export type GenerateMultipleQuestionsInput = z.infer<typeof GenerateMultipleQuestionsInputSchema>;

const GenerateMultipleQuestionsOutputSchema = z.object({
  questions: z.array(GenerateQuestionOutputSchema).describe('An array of generated trivia questions.'),
});
export type GenerateMultipleQuestionsOutput = z.infer<typeof GenerateMultipleQuestionsOutputSchema>;

export async function generateMultipleQuestions(
  input: GenerateMultipleQuestionsInput
): Promise<GenerateMultipleQuestionsOutput> {
  return generateMultipleQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMultipleQuestionsPrompt',
  input: { schema: GenerateMultipleQuestionsInputSchema },
  output: { schema: GenerateMultipleQuestionsOutputSchema },
  prompt: `You are a trivia master. Generate a set of multiple-choice questions for a trivia game in the specified language.

Language: {{{language}}}
Theme: {{{theme}}}
Number of Questions: {{{count}}}

Generate {{{count}}} challenging but fair multiple-choice questions about the given theme in the specified language.
For each question, provide 4 distinct options, with one of them being the correct answer.
Also provide a one or two-word search query for a relevant background image for each question.
Ensure the output is a valid JSON object with a "questions" array, where each element in the array conforms to the required question schema.
`,
});

const generateMultipleQuestionsFlow = ai.defineFlow(
  {
    name: 'generateMultipleQuestionsFlow',
    inputSchema: GenerateMultipleQuestionsInputSchema,
    outputSchema: GenerateMultipleQuestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input, { model });
    return output!;
  }
);
