"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
    Key,
    Plus,
    Copy,
    RefreshCw,
    User,
    Mail,
    ShieldCheck,
    Settings,
    Bell,
    Lock,
    Trash2,
    Eye,
    EyeOff
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

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
    const [showKeyId, setShowKeyId] = useState<string | null>(null);

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
                body: JSON.stringify({ name: `Key ${new Date().toLocaleDateString()}` }),
            });
            if (res.ok) {
                const newKey = await res.json();
                setKeys([newKey, ...keys]);
            }
        } finally {
            setGenerating(false);
        }
    }

    async function revokeKey(id: string) {
        if (!confirm("Are you sure you want to revoke this API key?")) return;
        try {
            const res = await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setKeys(keys.filter(k => k.id !== id));
            }
        } catch (error) {
            console.error("Failed to revoke key:", error);
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("API Key copied to clipboard!");
    };

    if (!session) return null;

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">Manage your account, security, and developer preferences.</p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="keys">API Keys</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Public Profile</CardTitle>
                            <CardDescription>How others see you on the leaderboard.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center space-x-4 pb-4">
                                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold">
                                    {session.user.name?.[0].toUpperCase()}
                                </div>
                                <div>
                                    <Button variant="outline" size="sm">Change Avatar</Button>
                                    <p className="text-xs text-muted-foreground mt-2">JPG, GIF or PNG. Max size of 800K</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input id="name" defaultValue={session.user.name} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" defaultValue={session.user.email} disabled />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t px-6 py-4">
                            <Button size="sm">Save Changes</Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>Configure how you receive alerts and updates.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Weekly Summary</Label>
                                    <p className="text-sm text-muted-foreground">Get a report of your coding activity every Monday.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Goal Achievements</Label>
                                    <p className="text-sm text-muted-foreground">Notify me when I reach my coding goals.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="keys" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>API Keys</CardTitle>
                                <CardDescription>Use these keys to authenticate the DevMeter VS Code extension.</CardDescription>
                            </div>
                            <Button onClick={generateKey} disabled={generating} size="sm">
                                {generating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                Generate Key
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}
                                </div>
                            ) : keys.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                                    <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                                        <Key className="h-6 w-6 opacity-50" />
                                    </div>
                                    <h3 className="text-lg font-medium">No API keys yet</h3>
                                    <p className="text-sm mb-4">Generate a key to start tracking your coding time.</p>
                                    <Button onClick={generateKey} variant="outline" size="sm">Create your first key</Button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {keys.map(apiKey => (
                                        <div key={apiKey.id} className="group relative flex flex-col space-y-2 p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-semibold">{apiKey.name}</span>
                                                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 hover:bg-green-500/10 border-none">Active</Badge>
                                                </div>
                                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(apiKey.key)}>
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => revokeKey(apiKey.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-md font-mono text-sm overflow-hidden group/key">
                                                <span className="flex-1 truncate">
                                                    {showKeyId === apiKey.id ? apiKey.key : `${apiKey.key.substring(0, 12)}**************************`}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => setShowKeyId(showKeyId === apiKey.id ? null : apiKey.id)}
                                                >
                                                    {showKeyId === apiKey.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                                Created on {new Date(apiKey.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t px-6 py-3 rounded-b-xl">
                            <div className="flex items-start space-x-2">
                                <ShieldCheck className="mt-0.5 h-4 w-4 text-green-500" />
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-foreground">Security Recommendation</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        Each IDE should have its own unique key. Never share your API keys or commit them to version control.
                                    </p>
                                </div>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Security</CardTitle>
                            <CardDescription>Manage your password and security sessions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label>Two-Factor Authentication</Label>
                                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                                </div>
                                <Button variant="outline" size="sm">Enable</Button>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label>Active Sessions</Label>
                                    <p className="text-sm text-muted-foreground">You are currently logged in from 1 device.</p>
                                </div>
                                <Button variant="ghost" size="sm" className="text-destructive">Log out all devices</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>Permanently delete your account and all associated data.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Once you delete your account, there is no going back. This will permanently remove your coding history,
                                API keys, and all tracked metrics.
                            </p>
                            <Button variant="destructive" size="sm">Delete Account</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
