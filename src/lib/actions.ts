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
  language: string,
  count: number = 1
): Promise<Question[] | { error: string }> {
  try {
    const questionPromises = Array.from({ length: count }, () => generateQuestionFlow({ theme, language }));
    const results = await Promise.all(questionPromises);

    const questionsWithImages = await Promise.all(results.map(async (result) => {
      const imageResult = await getImageForQuery(result.imageQuery);
      if ('error' in imageResult) {
        console.warn(`Could not fetch image for "${result.imageQuery}": ${imageResult.error}`);
        return result;
      }
      return { ...result, imageUrl: imageResult.url };
    }));
    
    return questionsWithImages;

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
    // This is not a user-facing error, so we don't need a user-friendly message.
    // This case will be handled by the caller.
    return { error: 'Pixabay API key is not configured on the server.' };
  }

  try {
    // Fetch a few images to have some variety
    const response = await fetch(`https://pixabay.com/api/?key=${accessKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=5`);

    if (!response.ok) {
      // Attempt to parse the error from Pixabay, but fallback to status text.
      const errorData = await response.text();
      return { error: `Pixabay API error: ${errorData || response.statusText}` };
    }

    const data = await response.json();
    if (data.hits && data.hits.length > 0) {
      // Pick a random image from the results to avoid showing the same one every time
      const randomHit = data.hits[Math.floor(Math.random() * data.hits.length)];
      return { url: randomHit.webformatURL };
    } else {
      // If no results, try a broader search with just the first word of the query
       const firstWord = query.split(' ')[0];
       if (firstWord && firstWord.toLowerCase() !== query.toLowerCase()) {
         return getImageForQuery(firstWord); // Recursive call with a simpler query
       }
      return { error: 'No images found for this query on Pixabay.' };
    }
  } catch (e) {
     if (e instanceof Error) {
        return { error: `An unexpected error occurred while fetching image: ${e.message}` };
    }
    return { error: 'An unexpected error occurred while fetching image.' };
  }
}
