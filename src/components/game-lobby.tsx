'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createGameSession, joinGameSession } from '@/lib/actions';
import { Loader2, Play, Users, XCircle } from 'lucide-react';
import type { GameDifficulty } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

function SubmitButton({ pendingText, children }: { pendingText: string; children: React.ReactNode }) {
  const { pending } = useFormStatus();
  
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

function CreateGameForm() {
    const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
    const [language, setLanguage] = useState('Portuguese');

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><Users className="text-primary"/> Criar Jogo</CardTitle>
                <CardDescription>Crie uma nova sala de jogo e convide um amigo para jogar.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={createGameSession} className="space-y-4">
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
                    <SubmitButton pendingText="A criar...">
                        <Users className="mr-2 h-5 w-5"/>
                        Criar Jogo
                    </SubmitButton>
                </form>
            </CardContent>
        </Card>
    );
}

function JoinGameForm({ error }: { error: string | null }) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><Play className="text-accent" /> Entrar num Jogo</CardTitle>
                <CardDescription>Tem um código de jogo? Insira-o abaixo para se juntar.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={joinGameSession} className="space-y-4">
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
                    <SubmitButton pendingText="A entrar...">
                        <Play className="mr-2 h-5 w-5"/>
                        Entrar no Jogo
                    </SubmitButton>
                </form>
            </CardContent>
        </Card>
    );
}

function GameLobbyInternal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  useEffect(() => {
    // This effect handles setting the player role in sessionStorage
    // after a redirect from create/join actions.
    const url = new URL(window.location.href);
    const role = url.searchParams.get('role');
    const gameId = url.pathname.split('/').pop();

    if (role && gameId) {
      // The role param exists, so we are coming from a successful create/join.
      // Set the role in session storage.
      sessionStorage.setItem(`tile-takeover-player-role-${gameId}`, role);

      // Clean up the URL by removing the role search param.
      // This prevents the logic from re-running on refresh.
      url.searchParams.delete('role');
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [router, searchParams]);

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

      <JoinGameForm error={error} />
    </div>
  );
}


export function GameLobby() {
    return (
        <Suspense fallback={<div>A carregar lobby...</div>}>
            <GameLobbyInternal />
        </Suspense>
    )
}
