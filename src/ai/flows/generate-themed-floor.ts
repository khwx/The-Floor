'use server';

/**
 * @fileOverview AI flow to generate a themed floor division for the game.
 *
 * - generateThemedFloor - A function that generates the themed floor division.
 * - GenerateThemedFloorInput - The input type for the generateThemedFloor function.
 * - GenerateThemedFloorOutput - The return type for the generateThemedFloor function.
 */

import {ai} from '@/ai/genkit';
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
  prompt: `You are a game designer who generates floor divisions for a trivia game called "Tile Takeover". The floor is divided into territories, each with a theme. The themes should be visually distinct and cohesive. The difficulty should influence the complexity and variety of themes.

Difficulty: {{{difficulty}}}

Based on the difficulty, generate a JSON string that represents the floor division. The JSON string should include the following keys:

- territories: An array of territory objects.
- theme: The theme of the territory (e.g., historical landmarks, science, animals, general trivia).

Ensure that the generated JSON string is valid and parsable.

Example:
{
  "territories": [
    { "theme": "historical landmarks" },
    { "theme": "science" },
    { "theme": "animals" }
  ]
}

Ensure that the number of themes and the complexity of the floor division are appropriate for the specified difficulty level. For easy difficulty, use fewer themes and simpler divisions. For hard difficulty, use more themes and more complex divisions.

{{#if (eq difficulty 'easy')}}
Limit yourself to these themes: animals, general trivia.
{{/if}}

{{#if (eq difficulty 'medium')}}
Limit yourself to these themes: animals, general trivia, historical landmarks.
{{/if}}

{{#if (eq difficulty 'hard')}}
Use any themes.
{{/if}}`,
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
