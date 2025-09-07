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
  const [language, setLanguage] = useState<string>('English');

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
              <CardTitle className="text-3xl">Game Setup</CardTitle>
              <CardDescription>Choose your challenge level to begin.</CardDescription>
             </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-lg">Difficulty</Label>
              <Select onValueChange={(value: GameDifficulty) => setDifficulty(value)} defaultValue={difficulty}>
                <SelectTrigger id="difficulty" className="w-full text-lg h-12">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy" className="text-lg">Easy</SelectItem>
                  <SelectItem value="medium" className="text-lg">Medium</SelectItem>
                  <SelectItem value="hard" className="text-lg">Hard</SelectItem>
                </SelectContent>
              </Select>
               <p className="text-sm text-muted-foreground pt-1">The difficulty determines the number and types of categories on the floor.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="language" className="text-lg flex items-center gap-2"><Languages size={20} /> Language</Label>
              <Select onValueChange={(value: string) => setLanguage(value)} defaultValue={language}>
                <SelectTrigger id="language" className="w-full text-lg h-12">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English" className="text-lg">English</SelectItem>
                  <SelectItem value="Portuguese" className="text-lg">Português</SelectItem>
                  <SelectItem value="Spanish" className="text-lg">Español</SelectItem>
                  <SelectItem value="French" className="text-lg">Français</SelectItem>
                  <SelectItem value="German" className="text-lg">Deutsch</SelectItem>
                </SelectContent>
              </Select>
               <p className="text-sm text-muted-foreground pt-1">The game content will be generated in the selected language.</p>
            </div>
            <Button type="submit" className="w-full" size="lg">
              Start Game
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
