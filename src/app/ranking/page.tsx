import { getRanking } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Trophy, ArrowLeft, RefreshCw, Crown, Gamepad2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns/format';
import { pt } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

async function RankingPage() {
  const ranking = await getRanking(50);

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gradient-to-br from-background to-secondary">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-foreground/60 hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-2">
                <Trophy className="h-8 w-8" />
                Ranking
              </h1>
              <p className="text-muted-foreground mt-1">Os melhores jogadores do Tile Takeover</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {ranking.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Nenhum jogo registado ainda</h2>
            <p className="text-muted-foreground mb-6">Seja o primeiro a jogar e aparecer no ranking!</p>
            <Link href="/play">
              <Button size="lg" className="gap-2">
                <Gamepad2 className="h-4 w-4" />
                Jogar Agora
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4 px-4 py-3 text-sm font-medium text-muted-foreground border-b border-border">
              <span>Pos.</span>
              <span>Jogador / Modo</span>
              <span>Score</span>
              <span>Dificuldade</span>
              <span>Data</span>
            </div>
            {ranking.map((game, index) => {
              const winnerKey = game.winner;
              const winnerScore = game.scores ? game.scores[winnerKey || ''] : 0;
              const isTop3 = index < 3;
              
              return (
                <div
                  key={game.id}
                  className={`grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-4 px-4 py-3 items-center border-b border-border/50 transition-colors hover:bg-accent/30 ${
                    isTop3 ? 'bg-yellow-500/10' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {index === 0 && <Crown className="h-5 w-5 text-yellow-500" />}
                    {index === 1 && <Trophy className="h-5 w-5 text-gray-400" />}
                    {index === 2 && <Trophy className="h-5 w-5 text-amber-700" />}
                    <span className={`font-bold ${isTop3 ? 'text-lg' : ''}`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">
                      {winnerKey === 'player' ? 'Jogador' : winnerKey === 'ai' ? 'IA' : winnerKey === 'team1' ? 'Equipa 1' : winnerKey === 'team2' ? 'Equipa 2' : 'Empate'}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{game.game_mode || 'singleplayer'}</span>
                  </div>
                  <div className="font-semibold text-lg text-primary">
                    {winnerScore}
                  </div>
                  <div className="capitalize">{game.difficulty || '-'}</div>
                  <div className="text-sm text-muted-foreground">
                    {game.created_at ? format(new Date(game.created_at), 'dd/MM/yyyy HH:mm', { locale: pt }) : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>O ranking mostra os jogos terminados ordenados por data.</p>
          <p className="mt-1">Jogue mais para subir na tabela!</p>
        </div>
      </div>
    </main>
  );
}

export default RankingPage;