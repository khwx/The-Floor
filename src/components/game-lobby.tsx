'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { createGameSession, joinGameSession } from '@/lib/actions';
import { useFormState, useFormStatus } from 'react-dom';
import { Gamepad2, Loader2, Play, Users } from 'lucide-react';
import type { GameDifficulty } from '@/lib/types';

function SubmitButton({ text, loadingText }: { text: string; loadingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          {loadingText}
        </>
      ) : (
        text
      )}
    </Button>
  );
}

export function GameLobby() {
    const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
    const [language, setLanguage] = useState('Portuguese');
    const [joinGameError, joinGameAction] = useFormState(joinGameSession, undefined);

  return (
    <div className="space-y-6">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><Users className="text-primary"/> Criar Jogo Multijogador</CardTitle>
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
                    <SubmitButton text="Criar Jogo" loadingText="A criar..." />
                </form>
            </CardContent>
        </Card>
        
        <div className="relative">
            <Separator />
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
                <span className="bg-background px-2 text-sm text-muted-foreground">OU</span>
            </div>
        </div>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><Play className="text-accent" /> Entrar num Jogo</CardTitle>
                <CardDescription>Tem um código de jogo? Insira-o abaixo para se juntar.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={joinGameAction} className="space-y-4">
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
                     {joinGameError?.error && (
                        <p className="text-sm font-medium text-destructive">{joinGameError.error}</p>
                    )}
                    <SubmitButton text="Entrar no Jogo" loadingText="A entrar..." />
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
