'use client';

import { Suspense, useEffect } from 'react';
import { GameLobby } from "@/components/game-lobby";
import { useRouter, useSearchParams } from 'next/navigation';

function MultiplayerLobby() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const joinError = searchParams.get('error');

    useEffect(() => {
        // This effect is specifically for handling the player role setting after redirection
        // from a create/join action. It should be safe here.
        const url = new URL(window.location.href);
        const role = url.searchParams.get('role');
        // A better way to get gameId from URL path like /play/multiplayer/GAMEID
        const pathParts = window.location.pathname.split('/');
        const gameId = pathParts[pathParts.length - 1];

        if (role && gameId && pathParts.includes('multiplayer')) {
            sessionStorage.setItem(`tile-takeover-player-role-${gameId}`, role);
            // Clean up URL to prevent this from running again on refresh
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('role');
            router.replace(newUrl.pathname + newUrl.search, { scroll: false });
        }
    }, [router]);

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
                <GameLobby joinError={joinError} />
            </div>
        </main>
    );
}

// Wrap with Suspense to read searchParams in a client component
export default function MultiplayerLobbyPage() {
    return (
        <Suspense fallback={<div>A carregar...</div>}>
            <MultiplayerLobby />
        </Suspense>
    );
}
