'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { GameDifficulty } from '@/lib/types';
import { Languages, SlidersHorizontal } from 'lucide-react';

type GameSetupProps = {
  onStart: (difficulty: GameDifficulty, language: string) => void;
};

export function GameSetup({ onStart }: GameSetupProps) {
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [language, setLanguage] = useState<string>('Portuguese');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(difficulty, language);
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
              <Select onValueChange={(value: GameDifficulty) => setDifficulty(value)} defaultValue={difficulty}>
                <SelectTrigger id="difficulty" className="w-full text-lg h-12">
                  <SelectValue placeholder="Selecione a dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy" className="text-lg">Fácil</SelectItem>
                  <SelectItem value="medium" className="text-lg">Médio</SelectItem>
                  <SelectItem value="hard" className="text-lg">Difícil</SelectItem>
                </SelectContent>
              </Select>
               <p className="text-sm text-muted-foreground pt-1">A dificuldade determina o número e os tipos de categorias no tabuleiro.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language" className="text-lg flex items-center gap-2"><Languages size={20} /> Idioma</Label>
              <Select onValueChange={(value: string) => setLanguage(value)} defaultValue={language}>
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
               <p className="text-sm text-muted-foreground pt-1">O conteúdo do jogo será gerado no idioma selecionado.</p>
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
