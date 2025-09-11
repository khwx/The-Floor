'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createGameSession, joinGameSession } from '@/lib/actions';
import { Loader2, Play, Users, XCircle } from 'lucide-react';
import type { GameDifficulty } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

function CreateGameForm() {
    const router = useRouter();
    const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
    const [language, setLanguage] = useState('Portuguese');
    const [pending, setPending] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPending(true);

        const formData = new FormData(event.currentTarget);
        const result = await createGameSession(formData);

        if (result.success && result.gameId) {
            router.push(`/play/multiplayer/${result.gameId}?role=player1`);
        } else {
            // In a real app, you might want to show an error toast here
            console.error(result.error);
            setPending(false);
        }
    };

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><Users className="text-primary"/> Criar Jogo</CardTitle>
                <CardDescription>Crie uma nova sala de jogo e convide um amigo para jogar.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="difficulty-create">Dificuldade</Label>
                        <Select name="difficulty" onValueChange={(value: GameDifficulty) => setDifficulty(value)} value={difficulty}>
                            <SelectTrigger id="difficulty-create">
                                <SelectValue placeholder="Selecione a dificuldade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">Fácil (2x2)</SelectItem>
                                <SelectItem value="medium">Médio (3x3)</SelectItem>
                                <SelectItem value="hard">Difícil (4x4)</SelectItem>
                                <SelectItem value="epic">Épico (5x5)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="language-create">Idioma</Label>
                        <Select name="language" onValueChange={(value: string) => setLanguage(value)} value={language}>
                            <SelectTrigger id="language-create">
                                <SelectValue placeholder="Selecione o idioma" />
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
                          A criar...
                        </>
                      ) : (
                        <>
                          <Users className="mr-2 h-5 w-5"/>
                          Criar Jogo
                        </>
                      )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function JoinGameForm({ error }: { error: string | null }) {
    const [pending, setPending] = useState(false);

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><Play className="text-accent" /> Entrar num Jogo</CardTitle>
                <CardDescription>Tem um código de jogo? Insira-o abaixo para se juntar.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={joinGameSession} className="space-y-4" onSubmit={() => setPending(true)}>
                     {error && (
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Erro</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="gameId">Código do Jogo</Label>
                        <Input
                            id="gameId"
                            name="gameId"
                            placeholder="ABCDEF"
                            maxLength={6}
                            required
                            className="text-center tracking-[0.5em] uppercase text-lg font-bold"
                        />
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={pending}>
                      {pending ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          A entrar...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5"/>
                          Entrar no Jogo
                        </>
                      )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export function GameLobby({ joinError }: { joinError: string | null }) {
  return (
    <div className="space-y-6">
      <CreateGameForm />
      
      <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center">
              <span className="bg-background px-2 text-sm text-muted-foreground">OU</span>
          </div>
      </div>

      <JoinGameForm error={joinError} />
    </div>
  );
}
