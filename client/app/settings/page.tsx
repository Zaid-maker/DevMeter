"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
    Copy,
    Eye,
    EyeOff,
    Key,
    Plus,
    RefreshCw,
    ShieldCheck,
    Trash2,
    Lock
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import useSWR, { mutate } from "swr";

interface ApiKey {
    id: string;
    key: string;
    name: string;
    createdAt: string;
}

const fetcher = (url: string) => fetch(url).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch");
    return data;
});

function SettingsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const activeTab = searchParams.get("tab") || "profile";

    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", value);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const { data: session } = authClient.useSession();
    const { data: keys, isLoading, error } = useSWR<ApiKey[]>(
        session ? "/api/keys" : null,
        fetcher
    );
    const [generating, setGenerating] = useState(false);
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [showKeyId, setShowKeyId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    async function generateKey() {
        setGenerating(true);
        try {
            const res = await fetch("/api/keys", {
                method: "POST",
                body: JSON.stringify({ name: `Key ${new Date().toLocaleDateString()}` }),
            });
            const data = await res.json();

            if (res.ok) {
                mutate("/api/keys");
                toast.success("API Key generated successfully");
            } else {
                toast.error(data.error || "Failed to generate key");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        } finally {
            setGenerating(false);
        }
    }

    async function revokeKey(id: string) {
        if (!confirm("Are you sure you want to revoke this API key? This cannot be undone.")) return;
        setRevokingId(id);
        try {
            const res = await fetch(`/api/keys?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                mutate("/api/keys");
                toast.success("API Key revoked");
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to revoke key");
            }
        } catch (error) {
            toast.error("Failed to revoke key due to a network error");
        } finally {
            setRevokingId(null);
        }
    }

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard", {
                description: "You can now paste this into your extension settings."
            });
        } catch (error) {
            toast.error("Failed to copy to clipboard", {
                description: error instanceof Error ? error.message : "Please check your browser permissions or ensure you are in a secure context (HTTPS)."
            });
        }
    };

    if (!session) return null;

    const hasKey = keys && keys.length > 0;

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">Manage your account, security, and developer preferences.</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
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
                            <div className="space-y-1">
                                <CardTitle>API Key</CardTitle>
                                <CardDescription>Your personal access token for IDE extensions.</CardDescription>
                            </div>
                            <Button
                                onClick={generateKey}
                                disabled={generating || hasKey}
                                size="sm"
                                className={hasKey ? "bg-muted text-muted-foreground border-white/5 cursor-not-allowed" : ""}
                            >
                                {generating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                {hasKey ? "Key Active" : "Generate Key"}
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isLoading ? (
                                <div className="space-y-3">
                                    <div className="h-24 bg-muted animate-pulse rounded-xl" />
                                </div>
                            ) : !keys || keys.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                                    <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4">
                                        <Key className="h-6 w-6 opacity-50" />
                                    </div>
                                    <h3 className="text-lg font-medium">No active API key</h3>
                                    <p className="text-sm mb-4">Generate a key to start tracking your coding metrics.</p>
                                    <Button onClick={generateKey} variant="outline" size="sm">Generate your first key</Button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {hasKey && (
                                        <div className="bg-yellow-500/5 border border-yellow-500/20 px-4 py-3 rounded-xl flex items-start gap-3 mb-2">
                                            <Lock className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                                            <p className="text-xs text-yellow-500/80 leading-relaxed">
                                                To ensure maximum account stability, we currently limit each account to one active API key.
                                                If you need to rotate your key, please revoke the current one first.
                                            </p>
                                        </div>
                                    )}
                                    {keys?.map(apiKey => (
                                        <div key={apiKey.id} className="group relative flex flex-col space-y-3 p-5 border rounded-2xl bg-card hover:border-primary/30 transition-all shadow-sm">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                                    <span className="font-bold text-sm tracking-tight">{apiKey.name}</span>
                                                    <Badge variant="outline" className="text-[10px] uppercase font-black py-0 px-2 h-5 bg-green-500/10 text-green-500 border-green-500/20">Primary</Badge>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-white/5" onClick={() => copyToClipboard(apiKey.key)}>
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10"
                                                        onClick={() => revokeKey(apiKey.id)}
                                                        disabled={revokingId === apiKey.id}
                                                    >
                                                        {revokingId === apiKey.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3 bg-black border border-white/5 p-3 rounded-xl font-mono text-sm overflow-hidden group/key">
                                                <span className="flex-1 truncate tracking-wider">
                                                    {showKeyId === apiKey.id ? apiKey.key : `••••••••••••••••••••••••••••••••••••`}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 rounded-md hover:bg-white/10"
                                                    onClick={() => setShowKeyId(showKeyId === apiKey.id ? null : apiKey.id)}
                                                >
                                                    {showKeyId === apiKey.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between pt-1">
                                                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-widest opacity-60">
                                                    Active since {new Date(apiKey.createdAt).toLocaleString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t px-6 py-4 rounded-b-xl">
                            <div className="flex items-start space-x-3">
                                <ShieldCheck className="mt-0.5 h-5 w-5 text-green-500 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-foreground">Account Protection Active</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed max-w-lg">
                                        Your API keys are for developer access only. <strong>Never</strong> share your keys or commit them to public repositories.
                                        If you suspect a key has been compromised, revoke it immediately and generate a new one.
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
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={isDeleting}
                                onClick={() => {
                                    if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                                        setIsDeleting(true);
                                        fetch("/api/user", { method: "DELETE" })
                                            .then(async (res) => {
                                                if (res.ok) {
                                                    await authClient.signOut();
                                                    window.location.href = "/";
                                                } else {
                                                    alert("Failed to delete account. Please try again.");
                                                    setIsDeleting(false);
                                                }
                                            })
                                            .catch((err) => {
                                                console.error(err);
                                                alert("An error occurred. Please try again.");
                                                setIsDeleting(false);
                                            });
                                    }
                                }}
                            >
                                {isDeleting ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete Account"
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}
