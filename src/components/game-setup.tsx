'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { GameDifficulty } from '@/lib/types';
import { SlidersHorizontal } from 'lucide-react';

type GameSetupProps = {
  onStart: (difficulty: GameDifficulty) => void;
};

export function GameSetup({ onStart }: GameSetupProps) {
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(difficulty);
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
            <Button type="submit" className="w-full" size="lg">
              Start Game
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
