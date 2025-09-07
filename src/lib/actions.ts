'use server';

import { generateThemedFloor } from '@/ai/flows/generate-themed-floor';
import type { GameDifficulty, Territory } from './types';

export async function generateFloor(
  difficulty: GameDifficulty
): Promise<{ territories: Territory[] } | { error: string }> {
  try {
    const result = await generateThemedFloor({ difficulty });
    if (!result.floorDivision) {
      return { error: 'Failed to generate floor from AI.' };
    }
    const parsed = JSON.parse(result.floorDivision);
    return parsed;
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
        return { error: `An unexpected error occurred: ${e.message}` };
    }
    return { error: 'An unexpected error occurred.' };
  }
}
