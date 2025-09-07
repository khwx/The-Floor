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
          A strategic trivia game to conquer the floor. Challenge your knowledge, claim your territory.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="hover:shadow-primary/20 hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Gamepad2 className="w-10 h-10 text-primary" />
              <div>
                <CardTitle className="text-2xl">Single Player</CardTitle>
                <CardDescription>Challenge the AI and conquer the board.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Test your wits in a one-on-one battle of knowledge. Can you outsmart the machine and claim the entire floor?
            </p>
            <Link href="/play" passHref>
              <Button className="w-full" size="lg">
                Play Now
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-dashed opacity-60 cursor-not-allowed">
           <CardHeader>
            <div className="flex items-center gap-4">
              <Users className="w-10 h-10 text-muted-foreground" />
              <div>
                <CardTitle className="text-2xl text-muted-foreground">Team Play</CardTitle>
                <CardDescription>Assemble your team for victory.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
             <p className="mb-4 text-muted-foreground">
              Team up with friends and compete against AI-controlled teams. Coordination is key to dominating the floor.
            </p>
            <Button className="w-full" size="lg" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
       <footer className="mt-16 text-center text-muted-foreground text-sm">
        <p>Inspired by the game show "The Floor".</p>
      </footer>
    </main>
  );
}
