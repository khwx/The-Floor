'use server';

/**
 * @fileOverview AI flow to generate a themed floor division for the game.
 *
 * - generateThemedFloor - A function that generates the themed floor division.
 * - GenerateThemedFloorInput - The input type for the generateThemedFloor function.
 * - GenerateThemedFloorOutput - The return type for the generateThemedFloor function.
 */

import {ai, model} from '@/ai/genkit';
import {z} from 'genkit';

const difficulties = ['easy', 'medium', 'hard'] as const;

const GenerateThemedFloorInputSchema = z.object({
  difficulty: z
    .enum(difficulties)
    .describe('The difficulty level of the floor division.'),
});
export type GenerateThemedFloorInput = z.infer<typeof GenerateThemedFloorInputSchema>;

const GenerateThemedFloorOutputSchema = z.object({
  floorDivision: z
    .string()
    .describe(
      'A JSON string representing the floor division with themes and territory assignments.'
    ),
});
export type GenerateThemedFloorOutput = z.infer<typeof GenerateThemedFloorOutputSchema>;

export async function generateThemedFloor(
  input: GenerateThemedFloorInput
): Promise<GenerateThemedFloorOutput> {
  return generateThemedFloorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateThemedFloorPrompt',
  input: {schema: GenerateThemedFloorInputSchema},
  output: {schema: GenerateThemedFloorOutputSchema},
  prompt: `You are a game designer creating themed floors for a trivia game. The floor is divided into territories, each with a theme.

Difficulty: {{{difficulty}}}

Generate a valid, parsable JSON string for the floor division. The JSON must have a "territories" key, which is an array of objects, each with a "theme" string.

Follow these rules based on the difficulty:
- easy: Use only "animals" and "general trivia" themes. Generate 4 territories.
- medium: Use only "animals", "general trivia", and "historical landmarks" themes. Generate 9 territories.
- hard: You can use any theme, including "science", "technology", "movies", etc. Generate 16 territories.

Example for 'easy' difficulty:
{
  "territories": [
    { "theme": "animals" },
    { "theme": "general trivia" },
    { "theme": "animals" },
    { "theme": "general trivia" }
  ]
}

Now, generate the floor division for the specified difficulty.
`,
  config: {
    model,
  }
});

const generateThemedFloorFlow = ai.defineFlow(
  {
    name: 'generateThemedFloorFlow',
    inputSchema: GenerateThemedFloorInputSchema,
    outputSchema: GenerateThemedFloorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
