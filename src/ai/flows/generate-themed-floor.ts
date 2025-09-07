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
import { allCategories } from '@/lib/categories';

const difficulties = ['easy', 'medium', 'hard', 'epic'] as const;

const GenerateThemedFloorInputSchema = z.object({
  difficulty: z
    .enum(difficulties)
    .describe('The difficulty level of the floor division.'),
  language: z.string().describe('The language for the themes.'),
  categories: z.array(z.string()).describe('The list of available categories for themes.')
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
  input: Omit<GenerateThemedFloorInput, 'categories'>
): Promise<GenerateThemedFloorOutput> {
  return generateThemedFloorFlow({...input, categories: allCategories});
}

const prompt = ai.definePrompt({
  name: 'generateThemedFloorPrompt',
  input: {schema: GenerateThemedFloorInputSchema},
  output: {schema: GenerateThemedFloorOutputSchema},
  prompt: `You are a game designer creating themed floors for a trivia game. The floor is divided into territories, each with a theme.

Difficulty: {{{difficulty}}}
Language: {{{language}}}

Generate a valid, parsable JSON string for the floor division. The JSON must have a "territories" key, which is an array of objects, each with a "theme" string.

The themes MUST be selected from the following list of available categories:
{{#each categories}}
- {{{this}}}
{{/each}}

The number of territories depends on the difficulty:
- easy: Generate 4 territories.
- medium: Generate 9 territories.
- hard: Generate 16 territories.
- epic: Generate 25 territories.

The themes you select should be thematically diverse and appropriate for a trivia game. Ensure the generated themes are in the specified language ({{{language}}}).

Example for 'easy' difficulty with 'Portuguese' language, assuming 'Animais' and 'Cultura Geral' are in the categories list:
{
  "territories": [
    { "theme": "Animais" },
    { "theme": "Cultura Geral" },
    { "theme": "Animais" },
    { "theme": "Cultura Geral" }
  ]
}

Now, generate the floor division for the specified difficulty and language.
`,
});

const generateThemedFloorFlow = ai.defineFlow(
  {
    name: 'generateThemedFloorFlow',
    inputSchema: GenerateThemedFloorInputSchema,
    outputSchema: GenerateThemedFloorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input, {model});
    return output!;
  }
);
