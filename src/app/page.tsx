import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gamepad2, Users } from "lucide-react";
import Link from "next/link";

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Gamepad2 className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">Um Jogador</CardTitle>
                <CardDescription>Desafie a IA e conquiste o tabuleiro.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Teste os seus conhecimentos numa batalha de um contra um. Consegue ser mais esperto que a máquina e dominar o tabuleiro?
            </p>
            <Link href="/play" passHref>
              <Button className="w-full" size="lg">
                Jogar Agora
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-dashed opacity-60 cursor-not-allowed">
           <CardHeader>
            <div className="flex items-center gap-4">
              <Users className="w-10 h-10 text-muted-foreground" />
              <div>
                <CardTitle className="text-2xl text-muted-foreground">Jogo em Equipa</CardTitle>
                <CardDescription>Reúna a sua equipa para a vitória.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
             <p className="mb-4 text-muted-foreground">
              Junte-se a amigos e compita contra equipas controladas pela IA. A coordenação é a chave para dominar o tabuleiro.
            </p>
            <Button className="w-full" size="lg" disabled>
              Brevemente
            </Button>
          </CardContent>
        </Card>
      </div>
       <footer className="mt-16 text-center text-muted-foreground text-sm">
        <p>Inspirado no programa de TV "The Floor".</p>
      </footer>
    </main>
  );
}
