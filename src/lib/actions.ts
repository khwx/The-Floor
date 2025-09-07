'use server';

import { generateThemedFloor } from '@/ai/flows/generate-themed-floor';
import { generateQuestion as generateQuestionFlow } from '@/ai/flows/generate-question';
import type { GameDifficulty, Territory, Question, GameState } from './types';
import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { redirect } from 'next/navigation';

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
    return { error: 'Pixabay API key is not configured on the server.' };
  }

  try {
    const response = await fetch(`https://pixabay.com/api/?key=${accessKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=5`);

    if (!response.ok) {
      const errorData = await response.text();
      return { error: `Pixabay API error: ${errorData || response.statusText}` };
    }

    const data = await response.json();
    if (data.hits && data.hits.length > 0) {
      const randomHit = data.hits[Math.floor(Math.random() * data.hits.length)];
      return { url: randomHit.webformatURL };
    } else {
       const firstWord = query.split(' ')[0];
       if (firstWord && firstWord.toLowerCase() !== query.toLowerCase()) {
         return getImageForQuery(firstWord);
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

function generateGameId(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


export async function createGameSession(formData: FormData) {
  const difficulty = formData.get('difficulty') as GameDifficulty;
  const language = formData.get('language') as string;
  const gameId = generateGameId();

  const floorResult = await generateFloor(difficulty, language);
  if('error' in floorResult) {
    throw new Error(`Failed to generate floor: ${floorResult.error}`);
  }

  const initialBoard = floorResult.territories.map((t, i) => ({
    id: i,
    theme: t.theme,
    owner: 'unowned'
  }));
  
  initialBoard[0].owner = 'player1';
  initialBoard[initialBoard.length - 1].owner = 'player2';

  const initialGameState: GameState = {
    gameId,
    difficulty,
    language,
    status: 'waiting',
    board: initialBoard,
    scores: { player1: 1, player2: 1 },
    turn: 'player1',
    players: {
      player1: 'player1_id', // This would be the actual user ID
      player2: null
    }
  };

  try {
    await setDoc(doc(db, 'games', gameId), initialGameState);
  } catch (error) {
    console.error("Failed to create game session in Firestore:", error);
    if (error instanceof Error) {
       throw new Error(`Could not create game in database: ${error.message}`);
    }
    throw new Error('Could not create game in database.');
  }

  redirect(`/play/multiplayer/${gameId}`);
}

export async function joinGameSession(formData: FormData) {
    const gameId = (formData.get('gameId') as string)?.toUpperCase();

    if (!gameId || gameId.length !== 6) {
        return { error: 'Código do jogo inválido. Deve ter 6 caracteres.' };
    }

    const gameDocRef = doc(db, 'games', gameId);
    const gameDoc = await getDoc(gameDocRef);

    if (!gameDoc.exists()) {
        return { error: 'Jogo não encontrado. Verifique o código e tente novamente.' };
    }
    
    // Logic to add player2 to the game would go here
    // For now, we just redirect.
    redirect(`/play/multiplayer/${gameId}`);
}
