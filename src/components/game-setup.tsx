'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { GameDifficulty, Player } from '@/lib/types';
import { Languages, SlidersHorizontal, UserSquare, Bot, User, Layers, CheckSquare, Square } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { allCategories } from '@/lib/categories';
import { cn } from '@/lib/utils';

type GameSetupProps = {
  onStart: (difficulty: GameDifficulty, language: string, startingPlayer: Player, categories?: string[]) => void;
  lastDifficulty?: GameDifficulty;
  lastLanguage?: string;
  mode?: 'singleplayer' | 'multiplayer';
};

export function GameSetup({ onStart, lastDifficulty, lastLanguage, mode = 'singleplayer' }: GameSetupProps) {
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [language, setLanguage] = useState<string>('Portuguese');
  const [startingPlayer, setStartingPlayer] = useState<Player>('player');
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    const storageSuffix = mode === 'multiplayer' ? '-multiplayer' : '';
    const savedDifficulty = localStorage.getItem(`tile-takeover-difficulty${storageSuffix}`) as GameDifficulty;
    const savedLanguage = localStorage.getItem(`tile-takeover-language${storageSuffix}`);

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
  }, [lastDifficulty, lastLanguage, mode]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedCategories(new Set(allCategories));
  const clearAll = () => setSelectedCategories(new Set());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startPlayerForMode = mode === 'multiplayer' ? 'player1' : startingPlayer;
    // Se nenhuma categorias selecionada, usa todas (comportamento default)
    const categories = selectedCategories.size > 0 ? Array.from(selectedCategories) : undefined;
    onStart(difficulty, language, startPlayerForMode, categories);
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
            {mode === 'singleplayer' && (
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
            )}
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
            <div className="space-y-2">
              <Label className="text-lg flex items-center gap-2">
                <Layers size={20} /> Categorias do Tabuleiro
                <span className="text-sm font-normal text-muted-foreground">
                  ({selectedCategories.size > 0 ? `${selectedCategories.size} selecionadas` : 'Todas (106)'})
                </span>
              </Label>
              <CardDescription>Escolha as categorias que quer no tabuleiro. Se não escolher nenhuma, são usadas todas.</CardDescription>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs"
                  onClick={selectAll}
                >
                  <CheckSquare className="h-3.5 w-3.5" /> Todas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs"
                  onClick={clearAll}
                >
                  <Square className="h-3.5 w-3.5" /> Limpar
                </Button>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-md border border-border p-2 space-y-1 bg-background/50">
                {allCategories.map((category) => {
                  const isSelected = selectedCategories.has(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className={cn(
                        'w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
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
