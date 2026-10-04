'use server';

import { generateThemedFloor } from '@/ai/flows/generate-themed-floor';
import { generateQuestion as generateSingleQuestionFlow, type GenerateQuestionOutput } from '@/ai/flows/generate-question';
import { generateMultipleQuestions as generateMultipleQuestionsFlow } from '@/ai/flows/generate-multiple-questions';
import type { GameDifficulty, Territory, Question, GameState, PlayerRole, TileData, Team, GameMode, TeamId } from './types';
import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { saveGameToHistory, isSupabaseConfigured } from './supabase';

// Caracteres sem ambiguidade (sem 0/O, 1/I/L)
const GAME_ID_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const GAME_ID_LENGTH = 8;
const MAX_RETRIES = 5;
const TOKEN_BYTES = 16;

function generateSecureGameId(): string {
  const array = new Uint8Array(GAME_ID_LENGTH);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array, (byte) => GAME_ID_CHARS[byte % GAME_ID_CHARS.length]).join('');
}

function generateSessionToken(): string {
  const array = new Uint8Array(TOKEN_BYTES);
  globalThis.crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function validatePlayerToken(gameId: string, player: PlayerRole, token: string): Promise<boolean> {
  try {
    const gameDocRef = doc(db, 'games', gameId);
    const gameDoc = await getDoc(gameDocRef);
    if (!gameDoc.exists()) return false;
    
    const gameState = gameDoc.data() as GameState;
    const playerTokenKey = `playerTokens.${player}`;
    return gameState[playerTokenKey as keyof GameState] === token;
  } catch {
    return false;
  }
}

export async function generateFloor(
  difficulty: GameDifficulty,
  language: string,
  categories?: string[]
): Promise<{ territories: Territory[] } | { error: string }> {
  try {
    const result = await generateThemedFloor({ difficulty, language, categories });
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
    let questionResults: GenerateQuestionOutput[];

    if (count > 1) {
      const result = await generateMultipleQuestionsFlow({ theme, language, count });
      questionResults = result.questions;
    } else {
      const result = await generateSingleQuestionFlow({ theme, language });
      questionResults = [result];
    }
    
    if (!questionResults || questionResults.length === 0) {
      return { error: 'AI failed to generate questions.' };
    }

    const questionsWithImages = await Promise.all(questionResults.map(async (result) => {
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
    // Adicionado safesearch=true para garantir imagens apropriadas
    const response = await fetch(`https://pixabay.com/api/?key=${accessKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&per_page=5&safesearch=true`);

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

export type ActionResult = { success: true; gameId: string; token?: string } | { success: false; error: string };

export async function createGameSession(formData: FormData): Promise<ActionResult> {
  const difficulty = formData.get('difficulty') as GameDifficulty;
  const language = formData.get('language') as string;
  const gameMode = (formData.get('gameMode') as GameMode) || '1v1';
  
  if (!difficulty || !language) {
      return { success: false, error: 'Dificuldade e idioma são obrigatórios.' };
  }

  // Gera ID único com collision check (até MAX_RETRIES tentativas)
  let gameId: string;
  let attempts = 0;
  do {
    gameId = generateSecureGameId();
    const existing = await getDoc(doc(db, 'games', gameId));
    if (!existing.exists()) break;
    attempts++;
  } while (attempts < MAX_RETRIES);

  if (attempts >= MAX_RETRIES) {
    return { success: false, error: 'Não foi possível gerar um código único. Tente novamente.' };
  }

  // Generate session token for player1 (creator)
  const player1Token = generateSessionToken();

  // Define teams based on game mode
  const teams: Team[] = gameMode === 'team' ? [
    { id: 'team1', name: 'Equipa 1', members: ['player1', 'player3'] },
    { id: 'team2', name: 'Equipa 2', members: ['player2', 'player4'] }
  ] : [];

  const initialGameState: GameState = {
    gameId,
    gameMode,
    difficulty,
    language,
    status: 'waiting',
    scores: { player1: 0, player2: 0, player3: 0, player4: 0 },
    turn: 'player1',
    players: {
      player1: 'player1_id',
      player2: null,
      player3: null,
      player4: null
    },
    playerTokens: {
      player1: player1Token,
      player2: null,
      player3: null,
      player4: null
    },
    teams,
    board: [],
    activeQuestion: null,
    duelState: null,
  };

  try {
    await setDoc(doc(db, 'games', gameId), initialGameState);
    // Return gameId and token for the creator
    return { success: true, gameId, token: player1Token };
  } catch (error) {
    console.error("Failed to create game session in Firestore:", error);
    const errorMessage = error instanceof Error ? error.message : 'Could not create game in database.';
    return { success: false, error: errorMessage };
  }
}

export async function joinGameSession(formData: FormData): Promise<ActionResult> {
    const gameId = (formData.get('gameId') as string)?.toUpperCase();
    const playerSlot = formData.get('playerSlot') as PlayerRole | null;

    if (!gameId || gameId.length < 6 || gameId.length > 8) {
        return { success: false, error: 'Código de jogo inválido.' };
    }

    const gameDocRef = doc(db, 'games', gameId);
    
    try {
      const gameDoc = await getDoc(gameDocRef);

      if (!gameDoc.exists()) {
          return { success: false, error: 'Jogo não encontrado.' };
      }

      const gameState = gameDoc.data() as GameState;
      const isTeamMode = gameState.gameMode === 'team';
      const maxPlayers = isTeamMode ? 4 : 2;

      // Find the first available slot or use the specified one
      let targetSlot: PlayerRole | null = null;
      if (playerSlot && !gameState.players[playerSlot]) {
        targetSlot = playerSlot;
      } else {
        for (let i = 1; i <= maxPlayers; i++) {
          const slot = `player${i}` as PlayerRole;
          if (!gameState.players[slot]) {
            targetSlot = slot;
            break;
          }
        }
      }

      if (!targetSlot) {
          return { success: false, error: 'Este jogo já está cheio.' };
      }

      // Generate session token for the joining player
      const playerToken = generateSessionToken();
      
      // Marca o jogador como a entrar e status generating se for o último jogador
      const allSlotsFilled = Object.values(gameState.players).slice(0, maxPlayers).every(p => p !== null);
      const willBeLastPlayer = allSlotsFilled || (targetSlot === `player${maxPlayers}` as PlayerRole && Object.values(gameState.players).slice(0, maxPlayers - 1).every(p => p !== null));
      
      await updateDoc(gameDocRef, {
        [`players.${targetSlot}`]: `${targetSlot}_id_joining`,
        [`playerTokens.${targetSlot}`]: playerToken,
        'status': willBeLastPlayer ? 'generating' : 'waiting'
      });

      // Se não for o último jogador, apenas retorna sucesso
      if (!willBeLastPlayer) {
        return { success: true, gameId, token: playerToken };
      }

      // Gera o floor e cria o board ANTES de responder (await, não fire-and-forget)
      const floorResult = await generateFloor(gameState.difficulty, gameState.language);
      
      if ('error' in floorResult) {
        await updateDoc(gameDocRef, { status: 'error', errorMessage: floorResult.error });
        return { success: false, error: `Falha ao gerar tabuleiro: ${floorResult.error}` };
      }

      const initialBoard: TileData[] = floorResult.territories.map((t, i) => ({
        id: i,
        theme: t.theme,
        owner: 'unowned'
      }));
      
      if (isTeamMode) {
        // Team mode: 4 corners for 4 players
        const boardSize = initialBoard.length;
        const gridSize = Math.sqrt(boardSize);
        initialBoard[0].owner = 'player1';                    // Top-left
        initialBoard[gridSize - 1].owner = 'player2';         // Top-right
        initialBoard[boardSize - gridSize].owner = 'player3'; // Bottom-left
        initialBoard[boardSize - 1].owner = 'player4';        // Bottom-right
      } else {
        // 1v1 mode: opposite corners
        initialBoard[0].owner = 'player1';
        initialBoard[initialBoard.length - 1].owner = 'player2';
      }

      // Calculate initial scores
      const initialScores = {
        player1: initialBoard.filter(t => t.owner === 'player1').length,
        player2: initialBoard.filter(t => t.owner === 'player2').length,
        player3: initialBoard.filter(t => t.owner === 'player3').length,
        player4: initialBoard.filter(t => t.owner === 'player4').length,
      };

      await updateDoc(gameDocRef, {
        board: initialBoard,
        scores: initialScores,
        status: 'playing',
        [`players.${targetSlot}`]: `${targetSlot}_id`,
      });

      return { success: true, gameId, token: playerToken };
      
    } catch (error) {
       console.error("Failed to join game session in Firestore:", error);
       const errorMessage = error instanceof Error ? error.message : 'Could not join game in database.';
       await updateDoc(gameDocRef, { status: 'error', errorMessage });
       return { success: false, error: errorMessage };
    }
}

export async function handleTileClick(gameId: string, tileId: number, player: PlayerRole, token: string) {
  try {
    // Validate session token
    const isValid = await validatePlayerToken(gameId, player, token);
    if (!isValid) {
      return { error: 'Sessão inválida ou expirada.' };
    }

    // 1. Primeiro lê o jogo (fora da transação) para validar turno e obter tema
    const gameDocRef = doc(db, 'games', gameId);
    const gameDoc = await getDoc(gameDocRef);

    if (!gameDoc.exists()) throw new Error("Jogo não encontrado");
    const gameState = gameDoc.data() as GameState;

    if (gameState.status !== 'playing' || gameState.turn !== player) {
      throw new Error("Não é a sua vez de jogar ou o jogo não está ativo.");
    }
    
    const tile = gameState.board.find(t => t.id === tileId);
    if (!tile) throw new Error("Casa não encontrada");
    
    const isDuel = tile.owner !== 'unowned' && tile.owner !== player;
    const questionTheme = tile.theme;

    let questionCount = 1;
    if (isDuel) {
      // In team mode, duel is against the owner of the tile
      // The territory count is based on the owner's territories of that theme
      const opponent = tile.owner as PlayerRole;
      const territoryCount = gameState.board.filter(t => t.owner === opponent && t.theme === questionTheme).length;
      questionCount = Math.max(1, territoryCount);
    }

    // 2. Gera perguntas + busca imagens FORA da transação (evita timeout)
    const questions = await generateQuestionsWithImages(questionTheme, gameState.language, questionCount);
    if ('error' in questions) {
      throw new Error(questions.error);
    }

    // 3. Atualiza o jogo dentro da transação (apenas escrita, sem chamadas de rede)
    await runTransaction(db, async (transaction) => {
      const freshDoc = await transaction.get(gameDocRef);
      if (!freshDoc.exists()) throw new Error("Jogo não encontrado");
      const freshState = freshDoc.data() as GameState;
      
      if (freshState.status !== 'playing' || freshState.turn !== player) {
        throw new Error("Estado do jogo mudou. Tente novamente.");
      }

      if (isDuel) {
        transaction.update(gameDocRef, {
          duelState: {
            challenger: player,
            tile: tile,
            questions: questions,
            activeQuestionIndex: 0,
            answers: {},
            scores: { player1: 0, player2: 0, player3: 0, player4: 0 },
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
    await updateDoc(doc(db, 'games', gameId), { status: 'playing' });
    if (e instanceof Error) return { error: e.message };
    return { error: "An unknown error occurred." };
  }
}

export async function submitAnswer(gameId: string, player: PlayerRole, tileId: number, isCorrect: boolean, token: string) {
    try {
        // Validate session token
        const isValid = await validatePlayerToken(gameId, player, token);
        if (!isValid) {
            return { error: 'Sessão inválida ou expirada.' };
        }

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
                
                // In team mode, the opponent is the tile owner (who is being challenged)
                const opponent = duelState.tile.owner as PlayerRole;
                if(newDuelState.answers[activeQuestionIndex][opponent] !== undefined) {
                    const playerAnswer = newDuelState.answers[activeQuestionIndex][player];
                    const opponentAnswer = newDuelState.answers[activeQuestionIndex][opponent];

                    if (playerAnswer && !opponentAnswer) {
                       newDuelState.scores[player]++;
                    } else if (!playerAnswer && opponentAnswer) {
                       newDuelState.scores[opponent]++;
                    }
                    
                    if (activeQuestionIndex + 1 < questions.length) {
                        newDuelState.activeQuestionIndex++;
                    } else {
                        const challengerWon = newDuelState.scores[duelState.challenger] > newDuelState.scores[opponent];
                        transaction.update(gameDocRef, await checkEndGame(gameState, duelState.challenger, duelState.tile.id, challengerWon));
                        return;
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
    // In team mode, the "loser" is the owner of the conquered tile
    const loserOfTurn = conqueredTile.owner as PlayerRole;
    
    const isDuelWin = conqueredTile.owner !== 'unowned' && conqueredTile.owner !== winnerOfTurn;

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
    player3: newBoard.filter(t => t.owner === 'player3').length,
    player4: newBoard.filter(t => t.owner === 'player4').length,
  };

  // Determine winner based on game mode
  let winner: PlayerRole | TeamId | 'draw' | null = null;
  let status: GameState['status'] = 'playing';

  const allPlayers = ['player1', 'player2', 'player3', 'player4'] as PlayerRole[];
  const activePlayers = gameState.gameMode === 'team' ? allPlayers : ['player1', 'player2'] as PlayerRole[];
  const playerScores = activePlayers.map(p => newScores[p]);
  const totalTiles = newBoard.length;
  const occupiedTiles = playerScores.reduce((a, b) => a + b, 0);
  
  // Check if game is over: one player/team has 0 tiles or board is full
  const hasZeroTiles = playerScores.some(s => s === 0);
  const boardFull = occupiedTiles === totalTiles;
  
  if (hasZeroTiles || boardFull) {
    if (gameState.gameMode === 'team') {
      const team1Score = newScores.player1 + newScores.player3;
      const team2Score = newScores.player2 + newScores.player4;
      if (team1Score > team2Score) winner = 'team1';
      else if (team2Score > team1Score) winner = 'team2';
      else winner = 'draw';
    } else {
      if (newScores.player1 > newScores.player2) winner = 'player1';
      else if (newScores.player2 > newScores.player1) winner = 'player2';
      else winner = 'draw';
    }
    status = 'finished';
  }
  
  // Se o jogo terminou, salva no histórico Supabase (fire-and-forget, não bloqueia)
  if (status === 'finished' && isSupabaseConfigured()) {
    saveGameToHistory({
      gameId: gameState.gameId,
      winner,
      difficulty: gameState.difficulty,
      language: gameState.language,
      scores: newScores,
      board: newBoard,
    }).catch(console.error);
  }
  
  // Next turn logic: if tile was conquered, same player plays again; otherwise next player in order
  let nextTurn: PlayerRole;
  if (tileWasConquered) {
    nextTurn = winnerOfTurn;
  } else {
    // Find next player in turn order who is still in the game
    const turnOrder: PlayerRole[] = gameState.gameMode === 'team' 
      ? ['player1', 'player2', 'player3', 'player4'] 
      : ['player1', 'player2'];
    
    const currentIndex = turnOrder.indexOf(gameState.turn);
    let nextIndex = (currentIndex + 1) % turnOrder.length;
    // Skip players with 0 tiles (eliminated)
    for (let i = 0; i < turnOrder.length; i++) {
      const candidate = turnOrder[nextIndex];
      if (newScores[candidate] > 0 || gameState.gameMode === 'team') {
        nextTurn = candidate;
        break;
      }
      nextIndex = (nextIndex + 1) % turnOrder.length;
    }
    nextTurn = turnOrder[nextIndex];
  }

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

export async function endDuelForPlayer(gameId: string, player: PlayerRole, token: string) {
    try {
        // Validate session token
        const isValid = await validatePlayerToken(gameId, player, token);
        if (!isValid) {
            return;
        }

        await runTransaction(db, async (transaction) => {
            const gameDocRef = doc(db, 'games', gameId);
            const gameDoc = await transaction.get(gameDocRef);
            if (!gameDoc.exists()) throw new Error("Game not found");
            let gameState = gameDoc.data() as GameState;

            if (gameState.status !== 'duel' || !gameState.duelState) return;
            
            const challengerWon = gameState.duelState.challenger !== player;
            transaction.update(gameDocRef, await checkEndGame(gameState, gameState.duelState.challenger, gameState.duelState.tile.id, challengerWon));
        });
    } catch(e) {
        console.error(e);
    }
}