import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { GameLobby } from "@/components/game-lobby";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-background to-secondary">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold tracking-tight text-primary drop-shadow-md">
          Tile Takeover
        </h1>
        <p className="mt-4 text-xl text-foreground/80 max-w-2xl mx-auto">
          Um jogo de trivia estratégico para conquistar o tabuleiro. Desafie os seus conhecimentos, reclame o seu território.
        </p>
      </div>

      <div className="w-full max-w-md mx-auto">
        <GameLobby />
      </div>

      <div className="mt-8 text-center w-full max-w-md mx-auto border-t pt-8">
         <Link href="/play" passHref>
            <Button variant="secondary" className="w-full" size="lg">
              <Gamepad2 className="mr-2 h-5 w-5" />
              Jogar Sozinho (vs. IA)
            </Button>
          </Link>
      </div>

       <footer className="mt-16 text-center text-muted-foreground text-sm">
        <p>Inspirado no programa de TV "The Floor".</p>
      </footer>
    </main>
  );
}
