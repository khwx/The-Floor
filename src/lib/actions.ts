'use server';

import { redirect } from 'next/navigation';
import { generateThemedFloor } from '@/ai/flows/generate-themed-floor';
import { generateQuestion as generateQuestionFlow } from '@/ai/flows/generate-question';
import type { GameDifficulty, Territory, Question, GameState, PlayerRole, TileData } from './types';
import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, runTransaction, writeBatch } from 'firebase/firestore';

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

async function generateQuestionsWithImages(
  theme: string,
  language: string,
  count: number = 1
): Promise<Question[] | { error: string }> {
  try {
    const questionPromises = Array.from({ length: count }, () => generateQuestionFlow({ theme, language }));
    const results = await Promise.all(questionPromises);

    const questionsWithImages = await Promise.all(results.map(async (result) => {
      const imageResult = await getImageForQuery(result.imageQuery);
      let imageUrl: string | undefined = undefined;
      if ('url' in imageResult) {
        imageUrl = imageResult.url;
      } else {
        console.warn(`Could not fetch image for "${result.imageQuery}": ${imageResult.error}`);
      }
      return { ...result, imageUrl };
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

export { generateQuestionsWithImages as generateQuestion }

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
  const lobbyUrl = '/play/multiplayer';
  
  if (!difficulty || !language) {
      redirect(`${lobbyUrl}?error=Dificuldade+e+idioma+são+obrigatórios.`);
  }

  const gameId = generateGameId();
  
  const initialGameState: GameState = {
    gameId,
    difficulty,
    language,
    status: 'waiting',
    scores: { player1: 0, player2: 0 },
    turn: 'player1',
    players: {
      player1: 'player1_id', // This would be the actual user ID
      player2: null
    },
    board: [],
    activeQuestion: null,
    duelState: null,
  };

  try {
    await setDoc(doc(db, 'games', gameId), initialGameState);
  } catch (error) {
    console.error("Failed to create game session in Firestore:", error);
    const errorMessage = error instanceof Error ? error.message : 'Could not create game in database.';
    redirect(`${lobbyUrl}?error=${encodeURIComponent(errorMessage)}`);
  }
  
  // Set role in session storage on client-side after redirection
  redirect(`/play/multiplayer/${gameId}?role=player1`);
}

export async function joinGameSession(formData: FormData) {
    const gameId = (formData.get('gameId') as string)?.toUpperCase();
    const lobbyUrl = '/play/multiplayer';

    if (!gameId || gameId.length !== 6) {
        redirect(`${lobbyUrl}?error=${encodeURIComponent('Código de jogo inválido.')}`);
    }

    const gameDocRef = doc(db, 'games', gameId);
    
    try {
      const gameDoc = await getDoc(gameDocRef);

      if (!gameDoc.exists()) {
          redirect(`${lobbyUrl}?error=${encodeURIComponent('Jogo não encontrado.')}`);
      }

      const gameState = gameDoc.data() as GameState;

      if (gameState.players.player2) {
          redirect(`${lobbyUrl}?error=${encodeURIComponent('Este jogo já está cheio.')}`);
      }
      if (gameState.status !== 'waiting') {
        redirect(`${lobbyUrl}?error=${encodeURIComponent('Este jogo já começou ou terminou.')}`);
      }
      
      // Reserve the spot
      await updateDoc(gameDocRef, {
        'players.player2': 'player2_id_joining', // Placeholder to prevent race conditions
        'status': 'generating'
      });

      // Generate the floor in the background
      generateFloor(gameState.difficulty, gameState.language).then(async floorResult => {
          if('error' in floorResult) {
            console.error(`Failed to generate floor for game ${gameId}: ${floorResult.error}`);
            await updateDoc(gameDocRef, { status: 'error', errorMessage: floorResult.error });
            return;
          }

          const initialBoard: TileData[] = floorResult.territories.map((t, i) => ({
            id: i,
            theme: t.theme,
            owner: 'unowned'
          }));
          
          initialBoard[0].owner = 'player1';
          initialBoard[initialBoard.length - 1].owner = 'player2';

          await updateDoc(gameDocRef, {
            board: initialBoard,
            scores: { player1: 1, player2: 1 },
            status: 'playing',
            'players.player2': 'player2_id', // Finalize player 2 join
          });
      }).catch(async (e) => {
          console.error("Error during board generation promise:", e);
          const errorMsg = e instanceof Error ? e.message : "Failed to generate board";
           await updateDoc(gameDocRef, { status: 'error', errorMessage: errorMsg });
      });
      
    } catch (error) {
       console.error("Failed to join game session in Firestore:", error);
       const errorMessage = error instanceof Error ? error.message : 'Could not join game in database.';
       redirect(`${lobbyUrl}?error=${encodeURIComponent(errorMessage)}`);
    }
    
    // Set role in session storage on client-side after redirection
    redirect(`/play/multiplayer/${gameId}?role=player2`);
}


export async function handleTileClick(gameId: string, tileId: number, player: PlayerRole) {
  try {
    await runTransaction(db, async (transaction) => {
      const gameDocRef = doc(db, 'games', gameId);
      const gameDoc = await transaction.get(gameDocRef);

      if (!gameDoc.exists()) throw new Error("Jogo não encontrado");
      const gameState = gameDoc.data() as GameState;

      if (gameState.status !== 'playing' || gameState.turn !== player) {
        throw new Error("Não é a sua vez de jogar ou o jogo não está ativo.");
      }
      
      const tile = gameState.board.find(t => t.id === tileId);
      if (!tile) throw new Error("Casa não encontrada");
      
      const isDuel = tile.owner !== 'unowned' && tile.owner !== player;
      const questionTheme = tile.theme;

      transaction.update(gameDocRef, { status: 'processing' });

      let questionCount = 1;
      if (isDuel) {
        const opponent = player === 'player1' ? 'player2' : 'player1';
        const territoryCount = gameState.board.filter(t => t.owner === opponent && t.theme === questionTheme).length;
        questionCount = Math.max(1, territoryCount);
      }

      const questions = await generateQuestionsWithImages(questionTheme, gameState.language, questionCount);
      if ('error' in questions) {
        throw new Error(questions.error);
      }

      if (isDuel) {
        transaction.update(gameDocRef, {
          duelState: {
            challenger: player,
            tile: tile,
            questions: questions,
            activeQuestionIndex: 0,
            answers: {},
            scores: { player1: 0, player2: 0 },
            timeRemaining: 15 * questions.length,
          },
          status: 'duel',
          activeQuestion: null,
        });
      } else {
        transaction.update(gameDocRef, {
          activeQuestion: {
            challenger: player,
            tile: tile,
            question: questions[0],
          },
          status: 'question',
          duelState: null,
        });
      }
    });
  } catch(e) {
    console.error(e);
    // If transaction fails, revert status back to 'playing'
    await updateDoc(doc(db, 'games', gameId), { status: 'playing' });
    if (e instanceof Error) return { error: e.message };
    return { error: "An unknown error occurred." };
  }
}

export async function submitAnswer(gameId: string, player: PlayerRole, tileId: number, isCorrect: boolean) {
    try {
        await runTransaction(db, async (transaction) => {
            const gameDocRef = doc(db, 'games', gameId);
            const gameDoc = await transaction.get(gameDocRef);
            if (!gameDoc.exists()) throw new Error("Game not found");
            
            let gameState = gameDoc.data() as GameState;
            const { status, activeQuestion, duelState } = gameState;

            if (status === 'question' && activeQuestion) {
                if(activeQuestion.challenger !== player) throw new Error("Not your turn to answer.");
                
                transaction.update(gameDocRef, await checkEndGame(gameState, player, tileId, isCorrect));

            } else if (status === 'duel' && duelState) {
                const { activeQuestionIndex, answers, questions } = duelState;
                const currentAnswers = answers[activeQuestionIndex] || {};

                if(currentAnswers[player] !== undefined) throw new Error("You have already answered.");

                const newDuelState = { ...duelState };
                newDuelState.answers[activeQuestionIndex] = { ...currentAnswers, [player]: isCorrect };
                
                // Check if both players have answered
                const opponent = player === 'player1' ? 'player2' : 'player1';
                if(newDuelState.answers[activeQuestionIndex][opponent] !== undefined) {
                    // Both answered, determine winner of the round
                    const playerAnswer = newDuelState.answers[activeQuestionIndex][player];
                    const opponentAnswer = newDuelState.answers[activeQuestionIndex][opponent];

                    if (playerAnswer && !opponentAnswer) {
                       newDuelState.scores[player]++;
                    } else if (!playerAnswer && opponentAnswer) {
                       newDuelState.scores[opponent]++;
                    }
                    
                    // Move to next question or end duel
                    if (activeQuestionIndex + 1 < questions.length) {
                        newDuelState.activeQuestionIndex++;
                    } else {
                        // End of duel
                        const challengerWon = newDuelState.scores[duelState.challenger] > newDuelState.scores[duelState.challenger === 'player1' ? 'player2' : 'player1'];
                        transaction.update(gameDocRef, await checkEndGame(gameState, duelState.challenger, duelState.tile.id, challengerWon));
                        return; // Exit transaction
                    }
                }
                transaction.update(gameDocRef, { duelState: newDuelState });
            } else {
                throw new Error("No active question or duel to answer.");
            }
        });
    } catch(e) {
        console.error(e);
        if (e instanceof Error) return { error: e.message };
        return { error: "An unknown error occurred while submitting answer." };
    }
}

async function checkEndGame(gameState: GameState, winnerOfTurn: PlayerRole, conqueredTileId: number, wasTurnSuccessful: boolean): Promise<Partial<GameState>> {
  let newBoard = [...gameState.board];
  let tileWasConquered = false;
  const conqueredTile = newBoard.find(t => t.id === conqueredTileId);

  if (wasTurnSuccessful && conqueredTile) {
    const loserOfTurn = winnerOfTurn === 'player1' ? 'player2' : 'player1';
      
    const isDuelWin = conqueredTile.owner === loserOfTurn;

    if (isDuelWin) {
        tileWasConquered = true;
        const conqueredTheme = conqueredTile.theme;
        newBoard = newBoard.map(t => {
          if (t.owner === loserOfTurn && t.theme === conqueredTheme) {
            return { ...t, owner: winnerOfTurn };
          }
          return t;
        });
    } else if (conqueredTile.owner === 'unowned') {
        tileWasConquered = true;
        newBoard = newBoard.map(t =>
          t.id === conqueredTile.id ? { ...t, owner: winnerOfTurn } : t
        );
    }
  }

  const newScores = {
    player1: newBoard.filter(t => t.owner === 'player1').length,
    player2: newBoard.filter(t => t.owner === 'player2').length,
  };

  let winner: PlayerRole | 'draw' | null = null;
  let status: GameState['status'] = 'playing';

  if (newScores.player1 === 0 || newScores.player2 === 0 || newScores.player1 + newScores.player2 === newBoard.length) {
      if (newScores.player1 > newScores.player2) winner = 'player1';
      else if (newScores.player2 > newScores.player1) winner = 'player2';
      else winner = 'draw';
      status = 'finished';
  }
  
  const nextTurn = tileWasConquered ? winnerOfTurn : (gameState.turn === 'player1' ? 'player2' : 'player1');

  return {
    board: newBoard,
    scores: newScores,
    turn: nextTurn,
    winner: winner,
    status: status,
    activeQuestion: null,
    duelState: null,
  };
}

// In case a player closes the modal or times out on their turn
export async function endDuelForPlayer(gameId: string, player: PlayerRole) {
    try {
        await runTransaction(db, async (transaction) => {
            const gameDocRef = doc(db, 'games', gameId);
            const gameDoc = await transaction.get(gameDocRef);
            if (!gameDoc.exists()) throw new Error("Game not found");
            let gameState = gameDoc.data() as GameState;

            if (gameState.status !== 'duel' || !gameState.duelState) return;
            
            // The player who closes the modal loses the duel
            const challengerWon = gameState.duelState.challenger !== player;
            transaction.update(gameDocRef, await checkEndGame(gameState, gameState.duelState.challenger, gameState.duelState.tile.id, challengerWon));
        });
    } catch(e) {
        console.error(e);
    }
}
