'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createGameSession, joinGameSession } from '@/lib/actions';
import { Loader2, Play, Users, XCircle, UserPlus } from 'lucide-react';
import type { GameDifficulty, GameMode } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

function CreateGameForm() {
    const router = useRouter();
    const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
    const [language, setLanguage] = useState('Portuguese');
    const [gameMode, setGameMode] = useState<GameMode>('1v1');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uiTranslations: Record<string, Record<string, string>> = {
      createGame: {
        Portuguese: 'Criar Jogo',
        English: 'Create Game',
        Spanish: 'Crear Juego',
        French: 'Créer un jeu',
        German: 'Spiel erstellen',
      },
      gameMode: {
        Portuguese: 'Modo de Jogo',
        English: 'Game Mode',
        Spanish: 'Modo de Jogo',
        French: 'Mode de jeu',
        German: 'Spielmodus',
      },
      difficulty: {
        Portuguese: 'Dificuldade',
        English: 'Difficulty',
        Spanish: 'Dificultad',
        French: 'Difficulté',
        German: 'Schwierigkeit',
      },
      language: {
        Portuguese: 'Idioma',
        English: 'Language',
        Spanish: 'Idioma',
        French: 'Langue',
        German: 'Sprache',
      },
      create: {
        Portuguese: 'Criar Jogo',
        English: 'Create',
        Spanish: 'Crear',
        French: 'Créer',
        German: 'Erstellen',
      },
      creating: {
        Portuguese: 'A criar...',
        English: 'Creating...',
        Spanish: 'Creando...',
        French: 'En cours de création...',
        German: 'Erstellen...',
      },
      joinGame: {
        Portuguese: 'Entrar no Jogo',
        English: 'Join Game',
        Spanish: 'Unirse al Juego',
        French: 'Rejoindre le jeu',
        German: 'Spiel beitreten',
      },
      joining: {
        Portuguese: 'A entrar...',
        English: 'Joining...',
        Spanish: 'Uniendo...',
        French: 'Rejoint en cours...',
        German: 'Beitreten...',
      },
      gameIdLabel: {
        Portuguese: 'Código do Jogo',
        English: 'Game Code',
        Spanish: 'Código del Juego',
        French: 'Code du jeu',
        German: 'Spielcode',
      },
      errorCreate: {
        Portuguese: 'Erro ao Criar Jogo',
        English: 'Error creating game',
        Spanish: 'Error ao criar o jogo',
        French: 'Erreur lors de la création du jogo',
        German: 'Fehler beim Spiel erstellen',
      },
      errorJoin: {
        Portuguese: 'Erro ao Entrar no Jogo',
        English: 'Error joining game',
        Spanish: 'Error al unirse al juego',
        French: 'Erreur lors du rejoint',
        German: 'Fehler beim Beitritt',
      },
    };

    function translate(key: keyof typeof uiTranslations, lang: string): string {
      const messages: Record<string, string> = uiTranslations[key as keyof Record<string, Record<string, string>>];
      if (!messages) return key;
      const translation: string = messages[lang] || messages.Portuguese;
      return translation;
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPending(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        formData.set('gameMode', gameMode);
        const result = await createGameSession(formData);

        if (result.success) {
            sessionStorage.setItem(`tile-takeover-player-role-${result.gameId}`, 'player1');
            if (result.token) {
                sessionStorage.setItem(`tile-takeover-player-token-${result.gameId}`, result.token);
            }
            router.push(`/play/multiplayer/${result.gameId}`);
        } else {
            setError(result.error || 'Ocorreu um erro desconhecido.');
            setPending(false);
        }
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><Users className="text-primary"/> {translate('create', language)}</CardTitle>
                <CardDescription>{translate('language', language)} para escolher o idioma do jogo.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>{translate('errorCreate', language)}</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="gameMode-create">{translate('gameMode', language)}</Label>
                        <Select name="gameMode" onValueChange={(value: GameMode) => setGameMode(value)} value={gameMode} required>
                            <SelectTrigger id="gameMode-create">
                                <SelectValue placeholder={translate('create', language)} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1v1">{translate('create', language)} 1v1 (2 Jogadores)</SelectItem>
                                <SelectItem value="team">{translate('create', language)} Equipas (4 Jogadores - 2v2)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="difficulty-create">{translate('difficulty', language)}</Label>
                        <Select name="difficulty" onValueChange={(value: GameDifficulty) => setDifficulty(value)} value={difficulty} required>
                            <SelectTrigger id="difficulty-create">
                                <SelectValue placeholder={translate('difficulty', language)} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">{translate('create', language)} Fácil (2x2)</SelectItem>
                                <SelectItem value="medium">{translate('create', language)} Médio (3x3)</SelectItem>
                                <SelectItem value="hard">{translate('create', language)} Difícil (4x4)</SelectItem>
                                <SelectItem value="epic">{translate('create', language)} Épico (5x5)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="language-create">{translate('language', language)}</Label>
                        <Select name="language" onValueChange={(value: string) => setLanguage(value)} value={language} required>
                            <SelectTrigger id="language-create">
                                <SelectValue placeholder={translate('language', language)} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Portuguese">Português</SelectItem>
                                <SelectItem value="English">English</SelectItem>
                                <SelectItem value="Spanish">Español</SelectItem>
                                <SelectItem value="French">Français</SelectItem>
                                <SelectItem value="German">Deutsch</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <Button type="submit" className="w-full" size="lg" disabled={pending}>
                        {pending ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {translate('creating', language)}
                        </>
                        ) : (
                        <>
                            <Users className="mr-2 h-5 w-5"/>
                            {translate('create', language)}
                        </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function JoinGameForm() {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [language, setLanguage] = useState('Portuguese');
    const [error, setError] = useState<string | null>(null);

    const uiTranslations: Record<string, Record<string, string>> = {
      createGame: {
        Portuguese: 'Criar Jogo',
        English: 'Create Game',
        Spanish: 'Crear Juego',
        French: 'Créer un jogo',
        German: 'Spiel erstellen',
      },
      gameMode: {
        Portuguese: 'Modo de Jogo',
        English: 'Game Mode',
        Spanish: 'Modo de Jogo',
        French: 'Mode de jeu',
        German: 'Spielmodus',
      },
      difficulty: {
        Portuguese: 'Dificuldade',
        English: 'Difficulty',
        Spanish: 'Dificultad',
        French: 'Difficulté',
        German: 'Schwierigkeit',
      },
      language: {
        Portuguese: 'Idioma',
        English: 'Language',
        Spanish: 'Idioma',
        French: 'Langue',
        German: 'Sprache',
      },
      create: {
        Portuguese: 'Criar Jogo',
        English: 'Create',
        Spanish: 'Crear',
        French: 'Créer',
        German: 'Erstellen',
      },
      creating: {
        Portuguese: 'A criar...',
        English: 'Creating...',
        Spanish: 'Creando...',
        French: 'En cours de création...',
        German: 'Erstellen...',
      },
      joinGame: {
        Portuguese: 'Entrar no Jogo',
        English: 'Join Game',
        Spanish: 'Unirse al Juego',
        French: 'Rejoindre le jeu',
        German: 'Spiel beitreten',
      },
      joining: {
        Portuguese: 'A entrar...',
        English: 'Joining...',
        Spanish: 'Uniendo...',
        French: 'Rejoint en cours...',
        German: 'Beitreten...',
      },
      gameIdLabel: {
        Portuguese: 'Código do Jogo',
        English: 'Game Code',
        Spanish: 'Código del Juego',
        French: 'Code du jeu',
        German: 'Spielcode',
      },
      errorCreate: {
        Portuguese: 'Erro ao Criar Jogo',
        English: 'Error creating game',
        Spanish: 'Error ao criar o jogo',
        French: 'Erreur lors de la création du jogo',
        German: 'Fehler beim Spiel erstellen',
      },
      errorJoin: {
        Portuguese: 'Erro ao Entrar no Jogo',
        English: 'Error joining game',
        Spanish: 'Error al unirse al juego',
        French: 'Erreur lors du rejoint',
        German: 'Fehler beim Beitritt',
      },
    };

    function translate(key: keyof typeof uiTranslations, lang: string): string {
      const messages: Record<string, string> = uiTranslations[key as keyof Record<string, Record<string, string>>];
      if (!messages) return key;
      const translation: string = messages[lang] || messages.Portuguese;
      return translation;
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        
        const formData = new FormData(event.currentTarget);
        const result = await joinGameSession(formData);

        if (result.success) {
            // The player slot is determined server-side, but we store a default
            // The actual slot will be determined by the server
            sessionStorage.setItem(`tile-takeover-player-role-${result.gameId}`, 'player2');
            if (result.token) {
                sessionStorage.setItem(`tile-takeover-player-token-${result.gameId}`, result.token);
            }
            router.push(`/play/multiplayer/${result.gameId}`);
        } else {
            setError(result.error || 'Ocorreu um erro desconhecido.');
            setPending(false);
        }
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><Play className="text-accent" /> {translate('joinGame', language)}</CardTitle>
                <CardDescription>{translate('language', language)} para escolher o idioma do jogo.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                     {error && (
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>{translate('errorJoin', language)}</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="gameId">{translate('gameIdLabel', language)}</Label>
                        <Input
                            id="gameId"
                            name="gameId"
                            placeholder="ABCDEFGH"
                            maxLength={8}
                            required
                            className="text-center tracking-[0.5em] uppercase text-lg font-bold"
                        />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={pending}>
                        {pending ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {translate('joining', language)}
                        </>
                        ) : (
                        <>
                            <Play className="mr-2 h-5 w-5"/>
                            {translate('joinGame', language)}
                        </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export function GameLobby() {
  return (
    <div className="space-y-6">
      <CreateGameForm />        
      <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center">
              <span>OR</span>
          </div>
      </div>

      <JoinGameForm />
    </div>
  );
}