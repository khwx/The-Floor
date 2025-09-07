'use server';

import { generateThemedFloor } from '@/ai/flows/generate-themed-floor';
import { generateQuestion as generateQuestionFlow } from '@/ai/flows/generate-question';
import type { GameDifficulty, Territory, Question } from './types';

export async function generateFloor(
  difficulty: GameDifficulty,
  language: string
): Promise<{ territories: Territory[] } | { error: string }> {
  try {
    const result = await generateThemedFloor({ difficulty, language });
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

export async function generateQuestion(
  theme: string,
  language: string
): Promise<Question | { error: string }> {
  try {
    const result = await generateQuestionFlow({ theme, language });
    const imageResult = await getImageForQuery(result.imageQuery);

    if ('error' in imageResult) {
      // Don't block the question if image fails, just return without it
      console.warn(`Could not fetch image for "${result.imageQuery}": ${imageResult.error}`);
      return result;
    }
    
    return { ...result, imageUrl: imageResult.url };
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      return { error: `An unexpected error occurred: ${e.message}` };
    }
    return { error: 'An unexpected error occurred.' };
  }
}

export async function getImageForQuery(query: string): Promise<{ url: string } | { error: string }> {
  const accessKey = process.env.PIXABAY_API_KEY;
  if (!accessKey) {
    return { error: 'Pixabay API key is not configured.' };
  }

  try {
    const response = await fetch(`https://pixabay.com/api/?key=${accessKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=3`);

    if (!response.ok) {
      const errorData = await response.text();
      return { error: `Pixabay API error: ${errorData || response.statusText}` };
    }

    const data = await response.json();
    if (data.hits && data.hits.length > 0) {
      return { url: data.hits[0].webformatURL };
    } else {
      return { error: 'No images found for this query on Pixabay.' };
    }
  } catch (e) {
     if (e instanceof Error) {
        return { error: `An unexpected error occurred while fetching image: ${e.message}` };
    }
    return { error: 'An unexpected error occurred while fetching image.' };
  }
}
