'use client';

import { useState, useCallback } from 'react';
import { generateFloor as generateFloorAction, generateQuestion as generateQuestionAction } from '@/lib/actions';
import type { GameDifficulty, Player, Territory, Question, DuelState, TileData, SinglePlayerGameState } from '@/lib/types';
import { getGridSize } from '@/lib/grid';
import { GameSetup } from '@/components/game-setup';
import { GameBoard } from '@/components/game-board';
import { Scoreboard } from '@/components/scoreboard';
import { QuestionModal } from '@/components/question-modal';
import { GameOverDialog } from '@/components/game-over-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAudio } from '@/hooks/use-audio';
import { Progress } from '@/components/ui/progress';
import { useLoadingState } from '@/hooks/use-loading-state';
import { useGameState } from '@/hooks/use-game-state';
import { useAI } from '@/hooks/use-ai';

const uiTranslations: Record<string, Record<string, string>> = {
  generatingBattlefield: {
    Portuguese: 'A gerar o seu campo de batalha...',
    English: 'Generating your battlefield...',
    Spanish: 'Generando tu campo de batalla...',
    French: "Génération de votre champ de bataille...",
    German: 'Dein Schlachtfeld wird generiert...',
  },
  preparingYourChallenge: {
    Portuguese: 'A preparar o seu desafio...',
    English: 'Preparing your challenge...',
    Spanish: 'Preparando tu desafío...',
    French: "Préparation de votre défi...",
    German: 'Deine Herausforderung wird vorbereitet...',
  },
  aiThinking: {
    Portuguese: 'A IA está a pensar...',
    English: 'The AI is thinking...',
    Spanish: 'La IA está pensando...',
    French: "L'IA réfléchit...",
    German: 'Die KI denkt nach...',
  },
  exitConfirmTitle: {
    Portuguese: 'Sair do jogo?',
    English: 'Exit game?',
    Spanish: '¿Salir del juego?',
    French: 'Quitter le jeu ?',
    German: 'Spiel verlassen?',
  },
  exitConfirmDesc: {
    Portuguese: 'Tem a certeza que quer sair? O progresso atual será perdido.',
    English: 'Are you sure you want to exit? Current progress will be lost.',
    Spanish: '¿Estás seguro de que quieres salir? Se perderá el progreso actual.',
    French: 'Êtes-vous sûr de vouloir quitter ? La progression actuelle sera perdue.',
    German: 'Möchtest du wirklich verlassen? Der aktuelle Fortschritt geht verloren.',
  },
  backToMenu: {
    Portuguese: 'Voltar ao Menu',
    English: 'Back to Menu',
    Spanish: 'Volver al Menú',
    French: 'Retour au Menu',
    German: 'Zum Menü zurück',
  },
  enableSound: {
    Portuguese: 'Ativar som',
    English: 'Enable sound',
    Spanish: 'Activar sonido',
    French: 'Activer le son',
    German: 'Ton aktivieren',
  },
  disableSound: {
    Portuguese: 'Desativar som',
    English: 'Disable sound',
    Spanish: 'Desactivar sonido',
    French: 'Désactiver le son',
    German: 'Ton deaktivieren',
  },
};

function t(key: keyof typeof uiTranslations, lang: string, params?: Record<string, string | number>): string {
  const translations = uiTranslations[key];
  if (!translations) return key;
  let message = translations[lang as keyof typeof translations] || translations.Portuguese;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      message = message.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    });
  }
  return message;
}

export default function PlayPage() {
  const [language, setLanguage] = useState('English');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const { toast } = useToast();
  const { playAudio, isMuted, toggleMute } = useAudio();

  const generateQuestions = useCallback(async (theme: string, lang: string, count: number) => {
    const result = await generateQuestionAction(theme, lang, count);
    if ('error' in result) {
      return { error: result.error };
    }
    return result;
  }, []);

  const {
    gameState,
    setGameState,
    board,
    setBoard,
    scores,
    setScores,
    turn,
    setTurn,
    activeTile,
    setActiveTile,
    activeQuestion,
    setActiveQuestion,
    duel,
    setDuel,
    winner,
    setWinner,
    aiAction,
    setAiAction,
    gridSize,
    setGridSize,
    handleTileClick,
    handleAnswer,
    handleModalClose,
    endTurn,
    endDuel,
    resetGame,
  } = useGameState({
    onGenerateQuestions: generateQuestions,
    onCheckEndGame: (newBoard: TileData[]) => {
      const playerScore = newBoard.filter(tile => tile.owner === 'player').length;
      const aiScore = newBoard.filter(tile => tile.owner === 'ai').length;

      if (playerScore === 0 || aiScore === 0 || playerScore + aiScore === newBoard.length) {
        if (playerScore > aiScore) setWinner('player');
        else if (aiScore > playerScore) setWinner('ai');
        else setWinner('draw');
        setGameState('finished');
        return true;
      }
      return false;
    },
    language,
    difficulty,
  });

  useAI({
    board,
    gridSize,
    difficulty,
    language,
    turn,
    gameState,
    generateQuestion: generateQuestionAction,
    playAudio,
    toast,
    setActiveTile,
    setActiveQuestion,
    setDuel,
    setGameState,
    setAiAction,
    setTurn,
    endTurn,
  });

  const { loadingProgress, loadingMessage } = useLoadingState({
    isLoading: gameState === 'fetching_question',
    activeTile,
    language,
  });

  const handleGameStart = useCallback(async (diff: GameDifficulty, lang: string, startPlayer: Player, categories?: string[]) => {
    setGameState('loading_board');
    setLanguage(lang);
    setDifficulty(diff);
    setTurn(startPlayer);

    localStorage.setItem('tile-takeover-difficulty', diff);
    localStorage.setItem('tile-takeover-language', lang);
    if (categories) {
      localStorage.setItem('tile-takeover-categories', JSON.stringify(categories));
    } else {
      localStorage.removeItem('tile-takeover-categories');
    }

    const result = await generateFloorAction(diff, lang, categories);
    if ('error' in result) {
      toast({
        title: 'Erro a criar o tabuleiro',
        description: result.error,
        variant: 'destructive',
      });
      setGameState('setup');
      return;
    }

    const { territories } = result;
    const { rows, cols } = getGridSize(territories.length);

    const initialBoard: TileData[] = territories.map((t: Territory, i: number) => ({
      id: i,
      theme: t.theme,
      owner: 'unowned',
    }));

    initialBoard[0].owner = 'player';
    initialBoard[initialBoard.length - 1].owner = 'ai';

    setGridSize({ rows, cols });
    setBoard(initialBoard);
    setScores({ player: 1, ai: 1 });
    setGameState(startPlayer === 'ai' ? 'ai_turn' : 'playing');
  }, [toast, setGameState, setLanguage, setDifficulty, setTurn, setGridSize, setBoard, setScores]);

  if (gameState === 'setup') {
    return <GameSetup onStart={handleGameStart} lastDifficulty={difficulty} lastLanguage={language} />;
  }

  if (gameState === 'loading_board') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">{t('generatingBattlefield', language)}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl">
        <header className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setShowExitConfirm(true)}>
              {t('backToMenu', language)}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
              title={isMuted ? t('enableSound', language) : t('disableSound', language)}
              aria-label={isMuted ? t('enableSound', language) : t('disableSound', language)}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-primary hidden sm:block">Tile Takeover</h1>
          <Scoreboard scores={scores} turn={turn} />
        </header>

        <main className="relative">
          <GameBoard
            board={board}
            gridSize={gridSize}
            onTileClick={handleTileClick}
            playerTurn={turn === 'player' && gameState === 'playing'}
            currentPlayer={'player'}
          />
          {gameState === 'fetching_question' && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg pointer-events-none p-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">{t('preparingYourChallenge', language)}</h2>
              <p className="text-lg text-muted-foreground mb-6">{loadingMessage}</p>
              <Progress value={loadingProgress} className="w-full max-w-sm" />
            </div>
          )}
          {gameState === 'ai_turn' && (
            <div className="absolute inset-0 bg-black/10 flex flex-col items-center justify-center z-10 rounded-lg pointer-events-none">
              <Loader2 className="h-10 w-10 animate-spin text-destructive" />
              <p className="mt-2 font-semibold text-destructive-foreground bg-destructive/80 px-4 py-2 rounded-md">
                {aiAction || t('aiThinking', language)}
              </p>
            </div>
          )}
        </main>
      </div>

      <QuestionModal
        isOpen={gameState === 'question' || gameState === 'duel'}
        tile={activeTile}
        question={activeQuestion}
        onAnswer={handleAnswer}
        onClose={handleModalClose}
        duel={duel}
        currentPlayer={'player'}
      />
      <GameOverDialog
        isOpen={gameState === 'finished'}
        winner={winner}
        scores={scores}
        onPlayAgain={resetGame}
      />
      <Dialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              {t('exitConfirmTitle', language)}
            </DialogTitle>
            <DialogDescription>
              {t('exitConfirmDesc', language)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExitConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => { setShowExitConfirm(false); resetGame(); }}>
              Sair e perder progresso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}