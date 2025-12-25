import Link from "next/link";
import { Activity } from "lucide-react";

export function MainNav() {
    return (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center px-8">
                <div className="flex items-center space-x-2 mr-6">
                    <Activity className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold">DevMeter</span>
                </div>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                    <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">Dashboard</Link>
                    <Link href="/projects" className="transition-colors hover:text-foreground/80 text-muted-foreground">Projects</Link>
                    <Link href="/goals" className="transition-colors hover:text-foreground/80 text-muted-foreground">Goals</Link>
                    <Link href="/leaderboard" className="transition-colors hover:text-foreground/80 text-muted-foreground">Leaderboard</Link>
                </nav>
                <div className="ml-auto flex items-center space-x-4">
                    <div className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center">
                        <span className="text-xs font-bold">JD</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
