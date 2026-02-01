"use client";

import Link from "next/link";
import { useState } from "react";
import { Activity, LogOut, Settings, User, Menu, X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MainNav() {
    const { data: session } = authClient.useSession();
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    if (pathname === "/" || pathname.startsWith("/auth") || pathname.startsWith("/u/")) return null;

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/auth/sign-in");
                },
            },
        });
    };

    const userInitial = session?.user?.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase() || "DM";

    const navItems = [
        { name: "Dashboard", href: "/dashboard" },
        { name: "Leaderboard", href: "/leaderboard" },
        { name: "Blog", href: "/blog" },
        { name: "Docs", href: "/docs" },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/20">
            <div className="flex h-16 items-center px-4 md:px-8 max-w-7xl mx-auto">
                <div className="flex items-center flex-1">
                    <button
                        className="md:hidden mr-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>

                    <Link href="/" className="flex items-center space-x-2 mr-8 group transition-all">
                        <div className="bg-primary p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-300 shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]">
                            <Activity className="h-5 w-5 text-black" />
                        </div>
                        <span className="text-xl font-black tracking-tighter group-hover:text-primary transition-colors">DevMeter</span>
                    </Link>

                    <nav className="hidden md:flex items-center space-x-1 text-sm font-medium">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "px-4 py-2 rounded-full transition-all duration-300 relative group",
                                        isActive
                                            ? "text-primary bg-primary/5 font-bold"
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                >
                                    {item.name}
                                    {isActive && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center space-x-4">
                    {session ? (
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-mono text-muted-foreground hidden lg:inline-block border border-white/5 px-2 py-1 rounded bg-white/5 uppercase tracking-tighter">
                                {session.user.name?.split(' ')[0]}
                            </span>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="relative h-9 w-9 rounded-xl p-0 hover:bg-white/5 transition-colors border border-white/5 overflow-hidden flex items-center justify-center">
                                        <Avatar className="h-8 w-8 rounded-lg">
                                            <AvatarImage src={session.user.image || ""} alt={session.user.name} />
                                            <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">{userInitial}</AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 mt-2 bg-black/95 border-white/10 backdrop-blur-xl rounded-2xl p-2" align="end" forceMount>
                                    <DropdownMenuLabel className="font-normal px-2 pb-2">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-bold leading-none">{session.user.name}</p>
                                            <p className="text-[10px] font-mono leading-none text-muted-foreground uppercase opacity-70">
                                                {session.user.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <DropdownMenuItem className="rounded-xl cursor-pointer focus:bg-white/5 py-2.5" asChild>
                                        <Link href="/profile">
                                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium text-sm">Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="rounded-xl cursor-pointer focus:bg-white/5 py-2.5" asChild>
                                        <Link href="/settings">
                                            <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium text-sm">Settings</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-white/5" />
                                    <DropdownMenuItem onClick={handleSignOut} className="rounded-xl cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5 py-2.5">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span className="font-medium text-sm">Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ) : (
                        <Button variant="outline" size="sm" asChild className="rounded-full px-4 md:px-6 border-white/10 hover:bg-white/5 font-bold transition-all">
                            <Link href="/auth/sign-in">Sign In</Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-white/5 bg-black/80 backdrop-blur-2xl animate-in slide-in-from-top duration-300 overflow-hidden">
                    <nav className="flex flex-col p-4 space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={cn(
                                        "px-4 py-3 rounded-xl transition-all flex items-center justify-between",
                                        isActive
                                            ? "text-primary bg-primary/10 font-black"
                                            : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                    )}
                                >
                                    {item.name}
                                    {isActive && <Activity className="h-4 w-4" />}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </header>
    );
}
