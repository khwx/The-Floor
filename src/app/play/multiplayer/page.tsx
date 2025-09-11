'use client';

import { GameLobby } from "@/components/game-lobby";

export default function MultiplayerLobbyPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-background to-secondary">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight text-primary drop-shadow-md">
                    Jogo Multijogador
                </h1>
                <p className="mt-4 text-lg text-foreground/80 max-w-2xl mx-auto">
                    Crie um novo jogo para desafiar um amigo ou junte-se a um jogo existente com um código.
                </p>
            </div>

            <div className="w-full max-w-md mx-auto">
                <GameLobby />
            </div>
        </main>
    );
}
