"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Terminal, Zap, Key, Activity, Download, Settings, Shield, BookOpen, Rocket, Copy, Check, ExternalLink, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DocsPage() {
  const [extensionVersion, setExtensionVersion] = useState<string>("latest");
  const [isLoadingVersion, setIsLoadingVersion] = useState(true);
  const [copiedText, setCopiedText] = useState<string>("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedText(""), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    // Fetch extension version from VS Code Marketplace API
    const fetchExtensionVersion = async () => {
      try {
        setIsLoadingVersion(true);
        const response = await fetch(
          "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json;api-version=3.0-preview.1",
            },
            body: JSON.stringify({
              filters: [
                {
                  criteria: [
                    {
                      filterType: 7,
                      value: "DevMitrza.devmeter",
                    },
                  ],
                },
              ],
              flags: 914,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const extension = data.results?.[0]?.extensions?.[0];
          if (extension?.versions?.[0]?.version) {
            setExtensionVersion(extension.versions[0].version);
          }
        }
      } catch (error) {
        console.error("Failed to fetch extension version:", error);
      } finally {
        setIsLoadingVersion(false);
      }
    };

    fetchExtensionVersion();
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg">
              <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-black" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Documentation</h1>
                <Badge variant="outline" className="text-xs font-mono">
                  v{extensionVersion}
                </Badge>
              </div>
              <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
                Everything you need to get started with DevMeter
              </p>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="getting-started" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto gap-1">
            <TabsTrigger value="getting-started" className="text-xs md:text-sm">Getting Started</TabsTrigger>
            <TabsTrigger value="extension" className="text-xs md:text-sm">Extension</TabsTrigger>
            <TabsTrigger value="api" className="text-xs md:text-sm">API</TabsTrigger>
            <TabsTrigger value="faq" className="text-xs md:text-sm">FAQ</TabsTrigger>
          </TabsList>

          {/* Getting Started */}
          <TabsContent value="getting-started" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" />
                  Quick Start
                </CardTitle>
                <CardDescription>
                  Get up and running with DevMeter in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-black text-xs md:text-sm font-bold flex-shrink-0">1</span>
                      Create an Account
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground ml-8">
                      Sign up for a free DevMeter account to start tracking your coding activity.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-black text-xs md:text-sm font-bold flex-shrink-0">2</span>
                      Install the VS Code Extension
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground ml-8 mb-3">
                      Download and install the DevMeter extension from the VS Code marketplace.
                    </p>
                    <div className="ml-8 space-y-3">
                      <div>
                        <p className="text-xs md:text-sm font-medium mb-2">Option 1: VS Code Extensions</p>
                        <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm text-muted-foreground">
                          <li>Open VS Code</li>
                          <li>Press <code className="bg-muted px-1 rounded">Ctrl+Shift+X</code> (or <code className="bg-muted px-1 rounded">Cmd+Shift+X</code> on Mac)</li>
                          <li>Search for "DevMeter"</li>
                          <li>Click Install</li>
                        </ol>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium mb-2">Option 2: Marketplace</p>
                        <a 
                          href="https://marketplace.visualstudio.com/items?itemName=DevMitrza.devmeter" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 text-primary hover:underline text-xs md:text-sm"
                        >
                          Visit VS Code Marketplace
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm font-medium mb-2">Option 3: Command Line</p>
                        <div className="p-3 md:p-4 bg-muted/50 rounded-lg border border-white/5 overflow-x-auto relative group">
                          <code className="text-xs md:text-sm whitespace-nowrap">
                            code --install-extension DevMitrza.devmeter@{extensionVersion}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-2 top-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(`code --install-extension DevMitrza.devmeter@${extensionVersion}`, "install-cmd-1")}
                          >
                            {copiedText === "install-cmd-1" ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-black text-xs md:text-sm font-bold flex-shrink-0">3</span>
                      Connect Your API Key
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground ml-8">
                      Generate an API key from your dashboard and connect it to the extension.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-base md:text-lg font-semibold flex items-center gap-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-black text-xs md:text-sm font-bold flex-shrink-0">4</span>
                      Start Coding
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground ml-8">
                      That's it! DevMeter will automatically track your coding activity in the background.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What Gets Tracked?</CardTitle>
                <CardDescription>
                  DevMeter captures comprehensive metrics about your coding activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-lg border border-white/5 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Activity className="h-4 w-4 text-primary flex-shrink-0" />
                      </div>
                      <span className="font-medium text-sm md:text-base">Active Coding Time</span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Track actual time spent writing code
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-white/5 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Code className="h-4 w-4 text-primary flex-shrink-0" />
                      </div>
                      <span className="font-medium text-sm md:text-base">Languages & Frameworks</span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      See which languages you use most
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-white/5 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Terminal className="h-4 w-4 text-primary flex-shrink-0" />
                      </div>
                      <span className="font-medium text-sm md:text-base">Projects & Files</span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      Monitor activity across projects
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-white/5 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 rounded-md bg-primary/10">
                        <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                      </div>
                      <span className="font-medium text-sm md:text-base">Daily Statistics</span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      View trends and productivity patterns
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Extension */}
          <TabsContent value="extension" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Extension Setup
                </CardTitle>
                <CardDescription>
                  Configure the DevMeter VS Code extension
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Installation</h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-4">
                      Choose your preferred installation method:
                    </p>
                    
                    <div className="space-y-4">
                      <div className="p-3 md:p-4 bg-muted/50 rounded-lg border border-white/5">
                        <h4 className="text-sm md:text-base font-medium mb-2">Method 1: VS Code Extensions (Recommended)</h4>
                        <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm text-muted-foreground">
                          <li>Open Visual Studio Code</li>
                          <li>Open Extensions view (<code className="bg-muted px-1 rounded">Ctrl+Shift+X</code> or <code className="bg-muted px-1 rounded">Cmd+Shift+X</code>)</li>
                          <li>Search for "DevMeter"</li>
                          <li>Click the Install button</li>
                        </ol>
                      </div>

                      <div className="p-3 md:p-4 bg-muted/50 rounded-lg border border-white/5">
                        <h4 className="text-sm md:text-base font-medium mb-2">Method 2: VS Code Marketplace</h4>
                        <p className="text-xs md:text-sm text-muted-foreground mb-2">
                          Install directly from the web:
                        </p>
                        <a 
                          href="https://marketplace.visualstudio.com/items?itemName=DevMitrza.devmeter" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-2 text-xs md:text-sm text-primary hover:underline font-medium"
                        >
                          Open in Marketplace →
                        </a>
                      </div>

                      <div className="p-3 md:p-4 bg-muted/50 rounded-lg border border-white/5">
                        <h4 className="text-sm md:text-base font-medium mb-2">Method 3: Command Line</h4>
                        <p className="text-xs md:text-sm text-muted-foreground mb-2">
                          Run this command in your terminal:
                        </p>
                        <div className="p-3 bg-background rounded border border-white/5 overflow-x-auto relative group">
                          <code className="text-xs md:text-sm whitespace-nowrap">
                            code --install-extension DevMitrza.devmeter@{extensionVersion}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute right-2 top-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(`code --install-extension DevMitrza.devmeter@${extensionVersion}`, "install-cmd-ext")}
                          >
                            {copiedText === "install-cmd-ext" ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Configuration</h3>
                    <p className="text-sm md:text-base text-muted-foreground mb-4">
                      After installation, configure your API key:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm md:text-base text-muted-foreground">
                      <li>Open VS Code Settings (Ctrl/Cmd + ,)</li>
                      <li>Search for "DevMeter"</li>
                      <li>Enter your API key from the dashboard</li>
                      <li>Save and restart VS Code</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Extension Settings</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded border border-white/5 overflow-x-auto hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <Key className="h-3 w-3 text-primary" />
                          <code className="text-xs md:text-sm font-mono whitespace-nowrap font-semibold">devmeter.apiKey</code>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground">Your DevMeter API key</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded border border-white/5 overflow-x-auto hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <Activity className="h-3 w-3 text-primary" />
                          <code className="text-xs md:text-sm font-mono whitespace-nowrap font-semibold">devmeter.heartbeatInterval</code>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground">Time between heartbeats (default: 30s)</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded border border-white/5 overflow-x-auto hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <Settings className="h-3 w-3 text-primary" />
                          <code className="text-xs md:text-sm font-mono whitespace-nowrap font-semibold">devmeter.excludeProjects</code>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground">Projects to exclude from tracking</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Privacy & Data</CardTitle>
                <CardDescription>
                  What data is collected and how it's used
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm md:text-base font-medium mb-1">Code Content</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      DevMeter NEVER reads or stores your actual code. We only track metadata like file names, languages, and time spent.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm md:text-base font-medium mb-1">Local Processing</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      All data processing happens locally on your machine before being sent to our servers.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm md:text-base font-medium mb-1">Secure Transfer</h4>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      All data is encrypted in transit using industry-standard TLS encryption.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  API Keys
                </CardTitle>
                <CardDescription>
                  Manage your API keys for authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-base md:text-lg font-semibold mb-2">Creating an API Key</h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm md:text-base text-muted-foreground">
                    <li>Navigate to your Dashboard</li>
                    <li>Click the "Generate API Key" button</li>
                    <li>Give your key a descriptive name</li>
                    <li>Copy the key immediately (it won't be shown again)</li>
                    <li>Configure your extension with the new key</li>
                  </ol>
                </div>
                <div className="p-3 md:p-4 bg-muted/50 rounded-lg border border-white/5">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    <strong>Important:</strong> Keep your API key secure and never share it publicly. If compromised, delete it immediately and generate a new one.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>
                  Available endpoints for programmatic access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded border border-white/5">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">POST</Badge>
                      <code className="text-xs md:text-sm break-all">/api/heartbeat</code>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">Send coding activity heartbeat</p>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded border border-white/5">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">GET</Badge>
                      <code className="text-xs md:text-sm break-all">/api/stats</code>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">Retrieve your coding statistics</p>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded border border-white/5">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">GET</Badge>
                      <code className="text-xs md:text-sm break-all">/api/user</code>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">Get user information</p>
                  </div>
                  
                  <div className="p-3 bg-muted/50 rounded border border-white/5">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-xs">GET</Badge>
                      <code className="text-xs md:text-sm break-all">/api/leaderboard</code>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">View global leaderboard rankings</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-base md:text-lg font-semibold mb-2">Authentication</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-3">
                    All API requests require authentication via API key:
                  </p>
                  <div className="p-3 md:p-4 bg-muted/50 rounded-lg border border-white/5 overflow-x-auto relative group">
                    <code className="text-xs md:text-sm whitespace-nowrap">Authorization: Bearer YOUR_API_KEY</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute right-2 top-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard("Authorization: Bearer YOUR_API_KEY", "auth-header")}
                    >
                      {copiedText === "auth-header" ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Common questions and answers about DevMeter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">How accurate is the time tracking?</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      DevMeter tracks active coding time by detecting when you're actively editing files. Idle time (when you're not typing) is automatically excluded after 5 minutes of inactivity.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Does DevMeter work offline?</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Yes! The extension continues tracking locally when you're offline. Data is automatically synced when your connection is restored.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Can I exclude certain projects from tracking?</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Yes, you can configure excluded projects in the extension settings. Just add project names or paths to the exclusion list.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Is my code visible to others?</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      No. DevMeter never reads or stores your actual code content. We only track metadata like file names, languages, and activity timestamps. Your code remains completely private.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">How is the leaderboard calculated?</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      The leaderboard ranks users based on total coding time over the selected period. You can view daily, weekly, or all-time rankings.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Can I delete my data?</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Yes, you can delete your account and all associated data at any time from the Settings page. This action is permanent and cannot be undone.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Which IDEs are supported?</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Currently, DevMeter supports Visual Studio Code. Support for additional IDEs is planned for future releases.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-base md:text-lg font-semibold mb-2">Is DevMeter free?</h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Yes, DevMeter is completely free to use with no limitations on features or tracking time.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Still have questions?</CardTitle>
                <CardDescription>
                  We're here to help!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm md:text-base text-muted-foreground mb-4">
                  If you couldn't find the answer you're looking for, feel free to reach out:
                </p>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <code className="text-primary break-all">support@devmeter.io</code>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
                    <span className="text-muted-foreground">GitHub:</span>
                    <code className="text-primary break-all">github.com/devmeter/devmeter</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-8 right-8 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
