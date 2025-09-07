'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { GameDifficulty, Player } from '@/lib/types';
import { Languages, SlidersHorizontal, UserSquare, Bot, User } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

type GameSetupProps = {
  onStart: (difficulty: GameDifficulty, language: string, startingPlayer: Player) => void;
  lastDifficulty?: GameDifficulty;
  lastLanguage?: string;
};

export function GameSetup({ onStart, lastDifficulty, lastLanguage }: GameSetupProps) {
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [language, setLanguage] = useState<string>('Portuguese');
  const [startingPlayer, setStartingPlayer] = useState<Player>('player');

  useEffect(() => {
    const savedDifficulty = localStorage.getItem('tile-takeover-difficulty') as GameDifficulty;
    const savedLanguage = localStorage.getItem('tile-takeover-language');

    if (savedDifficulty) {
      setDifficulty(savedDifficulty);
    } else if (lastDifficulty) {
      setDifficulty(lastDifficulty);
    }

    if (savedLanguage) {
      setLanguage(savedLanguage);
    } else if (lastLanguage) {
      setLanguage(lastLanguage);
    }
  }, [lastDifficulty, lastLanguage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(difficulty, language, startingPlayer);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-secondary">
      <Card className="w-full max-w-md shadow-2xl shadow-primary/10">
        <CardHeader>
          <div className="flex items-center gap-4">
             <SlidersHorizontal className="h-8 w-8 text-primary" />
             <div>
              <CardTitle className="text-3xl">Configuração do Jogo</CardTitle>
              <CardDescription>Escolha o seu nível de desafio para começar.</CardDescription>
             </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-lg">Dificuldade</Label>
              <Select onValueChange={(value: GameDifficulty) => setDifficulty(value)} value={difficulty}>
                <SelectTrigger id="difficulty" className="w-full text-lg h-12">
                  <SelectValue placeholder="Selecione a dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy" className="text-lg">Fácil (2x2)</SelectItem>
                  <SelectItem value="medium" className="text-lg">Médio (3x3)</SelectItem>
                  <SelectItem value="hard" className="text-lg">Difícil (4x4)</SelectItem>
                  <SelectItem value="epic" className="text-lg">Épico (5x5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label className="text-lg flex items-center gap-2"><UserSquare size={20} /> Quem Começa?</Label>
              <RadioGroup
                defaultValue={startingPlayer}
                onValueChange={(value: Player) => setStartingPlayer(value)}
                className="grid grid-cols-2 gap-4 pt-2"
              >
                <div>
                  <RadioGroupItem value="player" id="player" className="peer sr-only" />
                  <Label
                    htmlFor="player"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <User className="mb-2 h-6 w-6"/>
                    Jogador
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="ai" id="ai" className="peer sr-only" />
                  <Label
                    htmlFor="ai"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <Bot className="mb-2 h-6 w-6"/>
                    IA
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language" className="text-lg flex items-center gap-2"><Languages size={20} /> Idioma</Label>
              <Select onValueChange={(value: string) => setLanguage(value)} value={language}>
                <SelectTrigger id="language" className="w-full text-lg h-12">
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Portuguese" className="text-lg">Português</SelectItem>
                  <SelectItem value="English" className="text-lg">English</SelectItem>
                  <SelectItem value="Spanish" className="text-lg">Español</SelectItem>
                  <SelectItem value="French" className="text-lg">Français</SelectItem>
                  <SelectItem value="German" className="text-lg">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" size="lg">
              Começar Jogo
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
