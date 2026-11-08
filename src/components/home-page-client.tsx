'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Gamepad2, Trophy } from "lucide-react";
import { GameLobby } from "@/components/game-lobby";

const uiTranslations: Record<string, Record<string, string>> = {
  title: {
    Portuguese: 'Tile Takeover',
    English: 'Tile Takeover',
    Spanish: 'Tile Takeover',
    French: 'Tile Takeover',
    German: 'Tile Takeover',
  },
  subtitle: {
    Portuguese: 'Um jogo de trivia estratégico para conquistar o tabuleiro. Desafie os seus conhecimentos, reclame o seu território.',
    English: 'A strategic trivia game to conquer the board. Challenge your knowledge and claim your territory.',
    Spanish: 'Un juego estratégico de trivia para conquistar el tablero. Desafía tus conocimientos y reclama tu territorio.',
    French: 'Un jeu stratégique de quiz pour conquérir le plateau. Défiez vos connaissances et revendiquez votre território.',
    German: 'Ein strategisches Trivia-Spiel, um das Brett zu erobern. Fordern Sie Ihr Wissen heraus und beanspruchen Sie Ihr Territorium.',
  },
  playSolo: {
    Portuguese: 'Jogar Sozinho (vs. IA)',
    English: 'Play Alone (vs. AI)',
    Spanish: 'Jugar Solo (vs. IA)',
    French: 'Jouer Solo (vs. IA)',
    German: 'Allein spielen (vs. KI)',
  },
  playTeam: {
    Portuguese: 'Jogar em Equipa',
    English: 'Play in Teams',
    Spanish: 'Jugar en Equipo',
    French: 'Jouer en équipe',
    German: 'Im Team spielen',
  },
  or: {
    Portuguese: 'OU',
    English: 'OR',
    Spanish: 'O',
    French: 'OU',
    German: 'ODER',
  },
  ranking: {
    Portuguese: 'Ver Ranking',
    English: 'View Ranking',
    Spanish: 'Ver Ranking',
    French: 'Voir le classement',
    German: 'Rangliste anzeigen',
  },
  inspired: {
    Portuguese: 'Inspirado no programa de TV "The Floor".',
    English: 'Inspired by the TV show "The Floor".',
    Spanish: 'Inspirado en el programa de TV "The Floor".',
    French: 'Inspiré de l\'émission de TV "The Floor".',
    German: ' inspiriert von der TV-Show "The Floor".',
  },
};

function t(key: keyof typeof uiTranslations, lang: string): string {
  const translations = uiTranslations[key];
  if (!translations) return key;
  const translation = translations[lang as keyof typeof translations];
  if (translation) return translation;
  return translations.Portuguese || key;
}

export function HomePageClient() {
  const [language, setLanguage] = useState<'Portuguese' | 'English' | 'Spanish' | 'French' | 'German'>('Portuguese');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-background to-secondary">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold tracking-tight text-primary drop-shadow-md">
          {t('title', language)}
        </h1>
        <p className="mt-4 text-xl text-foreground/80 max-w-2xl mx-auto">
          {t('subtitle', language)}
        </p>
      </div>

      <div className="w-full max-w-md mx-auto space-y-6">
        <Link href="/play" passHref>
          <Button variant="secondary" className="w-full" size="lg">
            <Gamepad2 className="mr-2 h-5 w-5" />
            {t('playSolo', language)}
          </Button>
        </Link>
        
        <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center">
                <span className="bg-background px-2 text-sm text-muted-foreground">{t('or', language)}</span>
            </div>
        </div>

        <Link href="/play/multiplayer" passHref>
            <Button className="w-full" size="lg">
                <Gamepad2 className="mr-2 h-5 w-5" />
                {t('playTeam', language)}
            </Button>
        </Link>

        <Link href="/ranking" passHref>
            <Button variant="outline" className="w-full" size="lg">
                <Trophy className="mr-2 h-5 w-5" />
                {t('ranking', language)}
            </Button>
        </Link>
      </div>


     <footer className="mt-16 text-center text-muted-foreground text-sm">
      <p>{t('inspired', language)}</p>
</footer>
    </main>
  );
}