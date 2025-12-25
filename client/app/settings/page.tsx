"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { Key, Plus, Copy, RefreshCw, User, Mail, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface ApiKey {
    id: string;
    key: string;
    name: string;
    createdAt: string;
}

export default function SettingsPage() {
    const { data: session } = authClient.useSession();
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (session) {
            fetchKeys();
        }
    }, [session]);

    async function fetchKeys() {
        setLoading(true);
        try {
            const res = await fetch("/api/keys");
            if (res.ok) setKeys(await res.json());
        } finally {
            setLoading(false);
        }
    }

    async function generateKey() {
        setGenerating(true);
        try {
            const res = await fetch("/api/keys", {
                method: "POST",
                body: JSON.stringify({ name: `Key ${keys.length + 1}` }),
            });
            if (res.ok) {
                const newKey = await res.json();
                setKeys([newKey, ...keys]);
            }
        } finally {
            setGenerating(false);
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("API Key copied to clipboard!");
    };

    if (!session) return null;

    return (
        <div className="flex-1 space-y-6 p-8 pt-6 max-w-4xl mx-auto">
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage your account settings and API keys.</p>
            </div>

            <Separator />

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Your personal information as it appears on DevMeter.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <div className="flex items-center space-x-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <Input id="name" defaultValue={session.user.name} disabled />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <Input id="email" defaultValue={session.user.email} disabled />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>API Keys</CardTitle>
                            <CardDescription>Generate keys to authenticate your VS Code extension.</CardDescription>
                        </div>
                        <Button onClick={generateKey} disabled={generating} size="sm">
                            {generating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            New Key
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
                            </div>
                        ) : keys.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                <Key className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                <p>No API keys found. Create one to start tracking.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {keys.map(apiKey => (
                                    <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                                        <div className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                                <p className="text-sm font-medium">{apiKey.name}</p>
                                                <Badge variant="secondary" className="text-[10px] h-4">Active</Badge>
                                            </div>
                                            <p className="text-xs font-mono text-muted-foreground">
                                                {apiKey.key.substring(0, 8)}...{apiKey.key.substring(apiKey.key.length - 4)}
                                            </p>
                                        </div>
                                        <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiKey.key)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="bg-muted/50 border-t px-6 py-3 rounded-b-lg">
                        <p className="text-xs text-muted-foreground flex items-center">
                            <ShieldCheck className="mr-2 h-3 w-3 text-green-500" />
                            API keys grant full access to your coding heartbeats. Keep them private.
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
