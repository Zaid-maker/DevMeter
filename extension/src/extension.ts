import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import axios from 'axios';

let statusBarItem: vscode.StatusBarItem;
let refreshInterval: NodeJS.Timeout | undefined;
let terminalPulseInterval: NodeJS.Timeout | undefined;
let outputChannel: vscode.OutputChannel;

const IS_MAINTENANCE_MODE = false;
const MAINTENANCE_MESSAGE = "We're currently performing some scheduled maintenance to improve DevMeter. Coding activity tracking is temporarily paused and will resume shortly. We appreciate your patience!";

// --- Rate limiting: per-source tracking ---
let lastHeartbeatBySource: Record<string, number> = {};
const HEARTBEAT_INTERVAL = 120000; // 2 minutes
let isProcessing: boolean = false;

// --- Deduplication: track files recently sent via editor events ---
const recentEditorFiles = new Map<string, number>(); // filePath -> timestamp
const DEDUP_WINDOW_MS = 3000; // 3 seconds

// --- Terminal tracking ---
let activeTerminalName: string | undefined;
let isClaudeCodeRunning: boolean = false;
let claudeProcessCheckCache: { result: boolean; timestamp: number } | undefined;

// --- Machine identification ---
let cachedMachineName: string | undefined;

// --- Editor identification ---
let detectedEditorName: string | undefined;

/**
 * Detect the editor/IDE name from the VS Code API.
 * Maps vscode.env.appName to a short identifier for heartbeats.
 * Supports: VS Code, code-server, Cursor, Windsurf, VSCodium, Theia, etc.
 */
function getEditorName(): string {
    if (detectedEditorName) return detectedEditorName;

    const appName = (vscode.env.appName || '').toLowerCase();
    const appHost = (vscode.env.appHost || '').toLowerCase();

    // code-server / remote web IDE
    if (appHost === 'web' || appName.includes('code-server') || appName.includes('code - oss')) {
        detectedEditorName = 'code-server';
    }
    // Cursor
    else if (appName.includes('cursor')) {
        detectedEditorName = 'cursor';
    }
    // Windsurf
    else if (appName.includes('windsurf')) {
        detectedEditorName = 'windsurf';
    }
    // VSCodium
    else if (appName.includes('vscodium')) {
        detectedEditorName = 'vscodium';
    }
    // Theia IDE
    else if (appName.includes('theia')) {
        detectedEditorName = 'theia';
    }
    // Gitpod
    else if (appName.includes('gitpod')) {
        detectedEditorName = 'gitpod';
    }
    // Default: VS Code
    else {
        detectedEditorName = 'vscode';
    }

    return detectedEditorName;
}

// --- File extension to language mapping ---
const EXT_TO_LANGUAGE: Record<string, string> = {
    '.ts': 'typescript', '.tsx': 'typescriptreact', '.js': 'javascript', '.jsx': 'javascriptreact',
    '.py': 'python', '.rs': 'rust', '.go': 'go', '.java': 'java',
    '.c': 'c', '.cpp': 'cpp', '.cc': 'cpp', '.cxx': 'cpp', '.h': 'c', '.hpp': 'cpp',
    '.cs': 'csharp', '.php': 'php', '.rb': 'ruby', '.swift': 'swift',
    '.kt': 'kotlin', '.kts': 'kotlin', '.dart': 'dart', '.ex': 'elixir', '.exs': 'elixir',
    '.hs': 'haskell', '.lua': 'lua', '.r': 'r', '.scala': 'scala',
    '.sh': 'shellscript', '.bash': 'shellscript', '.zsh': 'shellscript', '.fish': 'shellscript',
    '.sql': 'sql', '.zig': 'zig', '.vue': 'vue', '.svelte': 'svelte',
    '.html': 'html', '.htm': 'html', '.css': 'css', '.scss': 'scss', '.sass': 'sass', '.less': 'less',
    '.json': 'json', '.jsonc': 'jsonc', '.yaml': 'yaml', '.yml': 'yaml', '.toml': 'toml',
    '.xml': 'xml', '.md': 'markdown', '.mdx': 'markdown',
    '.dockerfile': 'dockerfile', '.prisma': 'prisma', '.graphql': 'graphql', '.gql': 'graphql',
    '.env': 'dotenv', '.ini': 'ini', '.cfg': 'ini', '.conf': 'ini',
};

function log(message: string) {
    if (outputChannel) {
        outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${message}`);
    }
    console.log(`[DevMeter] ${message}`);
}

/**
 * Get the machine name: custom device name from settings, or hostname as fallback.
 */
function getMachineName(): string {
    if (cachedMachineName) return cachedMachineName;

    const config = vscode.workspace.getConfiguration('devmeter');
    const customName = config.get<string>('deviceName');

    if (customName && customName.trim().length > 0) {
        cachedMachineName = customName.trim();
    } else {
        cachedMachineName = os.hostname();
    }

    return cachedMachineName;
}

/**
 * Detect the language from a file path using extension mapping.
 */
function detectLanguageFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    // Special case: Dockerfile without extension
    const basename = path.basename(filePath).toLowerCase();
    if (basename === 'dockerfile' || basename.startsWith('dockerfile.')) return 'dockerfile';
    if (basename === 'makefile') return 'makefile';
    if (basename === 'cmakelists.txt') return 'cmake';
    return EXT_TO_LANGUAGE[ext] || 'unknown';
}

/**
 * Check if a Claude Code process is running on the system.
 * Caches result for 30 seconds to avoid excessive process lookups.
 */
function isClaudeCodeProcess(): boolean {
    const now = Date.now();
    if (claudeProcessCheckCache && (now - claudeProcessCheckCache.timestamp) < 30000) {
        return claudeProcessCheckCache.result;
    }

    let result = false;
    try {
        // Look for claude process in running processes
        const platform = process.platform;
        let cmd: string;
        if (platform === 'win32') {
            cmd = 'tasklist /FI "IMAGENAME eq claude.exe" /NH 2>NUL';
        } else {
            // Use pgrep if available, fallback to ps + grep
            cmd = 'pgrep -f "claude" 2>/dev/null || ps aux 2>/dev/null | grep -i "[c]laude" || true';
        }
        const output = execSync(cmd, { timeout: 3000, encoding: 'utf-8' });
        result = output.trim().length > 0 && !output.includes('No tasks');
    } catch {
        result = false;
    }

    claudeProcessCheckCache = { result, timestamp: now };
    isClaudeCodeRunning = result;
    return result;
}

/**
 * Determine the editor source based on current context.
 * Uses multiple heuristics to detect Claude Code:
 * 1. Terminal name contains "claude"
 * 2. Terminal name matches common Claude Code patterns (Task, docker_base, etc.)
 * 3. Claude Code process is running on the system
 *
 * Falls back to the detected editor name (vscode, cursor, code-server, etc.)
 *
 * Returns: editor name | "claude-code" | "terminal" | "external"
 */
function detectEditorSource(): string {
    const terminal = vscode.window.activeTerminal;
    if (!terminal) {
        // No active terminal, but Claude Code might still be running in background
        if (isClaudeCodeRunning || isClaudeCodeProcess()) return 'claude-code';
        return 'external';
    }

    const name = terminal.name.toLowerCase();

    // Direct match: terminal named "claude" or "Claude Code"
    if (name.includes('claude')) return 'claude-code';

    // Heuristic match: Claude Code often runs inside terminals with these names
    // when launched via VS Code integrated terminal or remote containers
    const claudeTerminalPatterns = ['task', 'docker_base', 'agent'];
    const isLikelyClaudeTerminal = claudeTerminalPatterns.some(p => name.includes(p));

    if (isLikelyClaudeTerminal && isClaudeCodeProcess()) {
        return 'claude-code';
    }

    // Any terminal with a running claude process -> claude-code
    if (isClaudeCodeProcess()) {
        return 'claude-code';
    }

    return 'terminal';
}

/**
 * Check if a file path should be ignored (non-code files, hidden dirs, etc.)
 */
function shouldIgnoreFile(filePath: string): boolean {
    const lower = filePath.toLowerCase();
    const segments = filePath.split(path.sep);

    // Ignore hidden directories and common non-code directories
    const ignoreDirs = ['node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'out', '.next', '.cache', '__pycache__', '.vscode', '.idea'];
    for (const seg of segments) {
        if (ignoreDirs.includes(seg)) return true;
    }

    // Ignore lock files and binary-like files
    const ignorePatterns = [
        'package-lock.json', 'yarn.lock', 'bun.lockb', 'pnpm-lock.yaml',
        'composer.lock', 'cargo.lock', 'gemfile.lock', 'poetry.lock',
    ];
    const basename = path.basename(lower);
    if (ignorePatterns.includes(basename)) return true;

    // Ignore files with no extension that are likely binary
    const ext = path.extname(lower);
    const binaryExts = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.zip', '.tar', '.gz', '.pdf', '.exe', '.dll', '.so', '.dylib'];
    if (binaryExts.includes(ext)) return true;

    return false;
}

/**
 * Mark a file as recently handled by editor events (for deduplication).
 */
function markEditorFile(filePath: string) {
    recentEditorFiles.set(filePath, Date.now());
    // Clean up after dedup window
    setTimeout(() => {
        recentEditorFiles.delete(filePath);
    }, DEDUP_WINDOW_MS);
}

/**
 * Check if a file was recently handled by editor events.
 */
function isRecentEditorFile(filePath: string): boolean {
    const ts = recentEditorFiles.get(filePath);
    if (!ts) return false;
    return (Date.now() - ts) < DEDUP_WINDOW_MS;
}

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel("DevMeter");
    log('DevMeter is now active!');
    log(`Editor: ${vscode.env.appName} (${getEditorName()}), Host: ${vscode.env.appHost || 'desktop'}, Remote: ${vscode.env.remoteName || 'none'}`);

    if (IS_MAINTENANCE_MODE) {
        vscode.window.showWarningMessage(MAINTENANCE_MESSAGE);
    }

    // Status Bar Item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'devmeter.showMenu';
    statusBarItem.tooltip = 'DevMeter: Click for more options';
    statusBarItem.text = '$(clock) DevMeter: ...';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Command to set API Key
    context.subscriptions.push(vscode.commands.registerCommand('devmeter.apiKey', async () => {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your DevMeter API Key',
            placeHolder: 'API Key from dashboard',
            password: true
        });

        if (apiKey) {
            await vscode.workspace.getConfiguration('devmeter').update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage('DevMeter API Key saved successfully!');
            updateStatusBar();
        }
    }));

    // Command to open Dashboard
    context.subscriptions.push(vscode.commands.registerCommand('devmeter.dashboard', () => {
        openInBrowser('dashboard');
    }));

    // Command to open Profile
    context.subscriptions.push(vscode.commands.registerCommand('devmeter.profile', () => {
        openInBrowser('profile');
    }));

    // Command to sync now (force heartbeat)
    context.subscriptions.push(vscode.commands.registerCommand('devmeter.syncNow', async () => {
        const config = vscode.workspace.getConfiguration('devmeter');
        const apiKey = config.get<string>('apiKey');
        const apiUrl = config.get<string>('apiUrl');

        if (!apiKey || !apiUrl) {
            vscode.window.showWarningMessage('DevMeter: API Key or URL not configured.');
            return;
        }

        const activeEditor = vscode.window.activeTextEditor;
        const project = vscode.workspace.name || 'Unknown Project';
        const file = activeEditor?.document.fileName || 'manual-sync';
        const language = activeEditor?.document.languageId || 'unknown';

        try {
            statusBarItem.text = '$(sync~spin) Syncing...';
            await axios.post(`${apiUrl}/heartbeat`, {
                project,
                language,
                file,
                timestamp: Date.now(),
                is_save: true,
                entity: file,
                type: 'file',
                editor: getEditorName(),
                platform: process.platform,
                machine: getMachineName(),
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'User-Agent': `DevMeter-Extension/${getEditorName()}`
                },
                timeout: 5000
            });
            log('Manual sync: heartbeat sent successfully');
            vscode.window.showInformationMessage('DevMeter: Sync completed successfully.');
            updateStatusBar();
        } catch (error: any) {
            log(`Manual sync failed: ${error.message}`);
            vscode.window.showErrorMessage(`DevMeter: Sync failed - ${error.message}`);
            updateStatusBar();
        }
    }));

    // Command to check API status
    context.subscriptions.push(vscode.commands.registerCommand('devmeter.checkStatus', async () => {
        const config = vscode.workspace.getConfiguration('devmeter');
        const apiKey = config.get<string>('apiKey');
        const apiUrl = config.get<string>('apiUrl');

        if (!apiUrl) {
            vscode.window.showWarningMessage('DevMeter: API URL not configured.');
            return;
        }

        try {
            statusBarItem.text = '$(loading~spin) Checking...';

            // 1. Check if endpoint is reachable (GET /api/heartbeat returns alive status)
            const startTime = Date.now();
            const healthRes = await axios.get(`${apiUrl}/heartbeat`, { timeout: 5000 });
            const latency = Date.now() - startTime;

            let statusMsg = `API: Online (${latency}ms)`;
            let authStatus = 'Not configured';

            // 2. If API key is set, verify it works
            if (apiKey) {
                try {
                    await axios.get(`${apiUrl}/stats?range=today`, {
                        headers: { 'Authorization': `Bearer ${apiKey}` },
                        timeout: 5000
                    });
                    authStatus = 'Valid';
                } catch (authErr: any) {
                    if (authErr.response?.status === 401) {
                        authStatus = 'Invalid API Key';
                    } else {
                        authStatus = `Error: ${authErr.message}`;
                    }
                }
            }

            log(`Status check: endpoint=${healthRes.status}, latency=${latency}ms, auth=${authStatus}`);

            const detail = [
                `Endpoint: ${apiUrl}`,
                `Status: Online`,
                `Latency: ${latency}ms`,
                `API Key: ${authStatus}`,
            ].join('\n');

            vscode.window.showInformationMessage(
                `DevMeter: API Online (${latency}ms) | Key: ${authStatus}`,
                'OK'
            );

            updateStatusBar();
        } catch (error: any) {
            log(`Status check failed: ${error.message}`);
            const reason = error.code === 'ECONNREFUSED' ? 'Connection refused'
                : error.code === 'ENOTFOUND' ? 'Host not found'
                : error.code === 'ETIMEDOUT' ? 'Timeout'
                : error.message;

            vscode.window.showErrorMessage(`DevMeter: API Offline - ${reason}`);
            statusBarItem.text = '$(error) DevMeter: Offline';
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
    }));

    // Command to show Menu
    context.subscriptions.push(vscode.commands.registerCommand('devmeter.showMenu', async () => {
        const items = [
            { label: "$(sync) Sync Now", description: "Force send a heartbeat right now", command: 'devmeter.syncNow' },
            { label: "$(pulse) Check API Status", description: "Verify endpoint is online and API key is valid", command: 'devmeter.checkStatus' },
            { label: "$(layout) Open Private Dashboard", description: "View your personal stats", command: 'devmeter.dashboard' },
            { label: "$(person) View Public Profile", description: "View your shareable profile", command: 'devmeter.profile' },
            { label: "$(key) Update API Key", description: "Change your authentication key", command: 'devmeter.apiKey' },
            { label: "$(settings) Extension Settings", description: "Configure visibility options", command: 'workbench.action.openSettings', args: '@ext:DevMitrza.devmeter' }
        ];

        const selection = await vscode.window.showQuickPick(items, {
            placeHolder: 'DevMeter: Select an action'
        });

        if (selection) {
            if (selection.command === 'workbench.action.openSettings') {
                vscode.commands.executeCommand(selection.command, selection.args);
            } else {
                vscode.commands.executeCommand(selection.command);
            }
        }
    }));

    // =============================================
    // SOURCE 1: Editor events (existing behavior)
    // =============================================
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
            markEditorFile(event.document.fileName);
            sendHeartbeat({
                file: event.document.fileName,
                language: event.document.languageId,
                isSave: false,
                editor: getEditorName(),
            });
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidSaveTextDocument((document) => {
            markEditorFile(document.fileName);
            sendHeartbeat({
                file: document.fileName,
                language: document.languageId,
                isSave: true,
                editor: getEditorName(),
            });
        })
    );

    // =============================================
    // SOURCE 2: FileSystemWatcher (external changes)
    // Catches: Claude Code, terminal, git, formatters
    // =============================================
    const watcher = vscode.workspace.createFileSystemWatcher('**/*');

    context.subscriptions.push(
        watcher.onDidChange((uri) => {
            handleExternalFileEvent(uri, false);
        })
    );

    context.subscriptions.push(
        watcher.onDidCreate((uri) => {
            handleExternalFileEvent(uri, true);
        })
    );

    context.subscriptions.push(watcher);

    // =============================================
    // SOURCE 3: Terminal activity tracking
    // =============================================
    // Track which terminal is active
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTerminal((terminal) => {
            activeTerminalName = terminal?.name;
            if (terminal) {
                log(`Active terminal changed: "${terminal.name}"`);
            }
        })
    );

    // Track terminal open/close for logging
    context.subscriptions.push(
        vscode.window.onDidOpenTerminal((terminal) => {
            log(`Terminal opened: "${terminal.name}"`);
        })
    );

    context.subscriptions.push(
        vscode.window.onDidCloseTerminal((terminal) => {
            log(`Terminal closed: "${terminal.name}"`);
            if (activeTerminalName === terminal.name) {
                activeTerminalName = undefined;
            }
        })
    );

    // Initialize active terminal
    activeTerminalName = vscode.window.activeTerminal?.name;

    // =============================================
    // SOURCE 4: Terminal activity pulse
    // Sends periodic heartbeats while a terminal is active,
    // even if no files are being modified (e.g. Claude Code reading/reasoning)
    // =============================================
    terminalPulseInterval = setInterval(() => {
        if (!vscode.window.activeTerminal) return;
        if (IS_MAINTENANCE_MODE) return;

        const editor = detectEditorSource();
        // Only pulse for terminal/claude-code activity, not "external"
        if (editor === 'external') return;

        const project = vscode.workspace.name || 'Unknown Project';
        log(`Terminal pulse [${editor}]: terminal "${vscode.window.activeTerminal.name}" is active`);

        sendHeartbeat({
            file: `[${editor}] ${project}`,
            language: 'terminal',
            isSave: false,
            editor,
        });
    }, HEARTBEAT_INTERVAL);

    // Listen for config changes to clear cached machine name
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('devmeter.deviceName')) {
                cachedMachineName = undefined;
                log(`Device name updated to: ${getMachineName()}`);
            }
        })
    );

    // Initial check for API Key
    checkApiKey();
    updateStatusBar();

    // Refresh status bar every 5 minutes
    refreshInterval = setInterval(() => {
        updateStatusBar();
    }, 5 * 60 * 1000);
}

/**
 * Handle file change/create events from FileSystemWatcher.
 * Deduplicates with editor events and detects the source.
 */
function handleExternalFileEvent(uri: vscode.Uri, isCreate: boolean) {
    const filePath = uri.fsPath;

    // Skip if recently handled by editor event (deduplication)
    if (isRecentEditorFile(filePath)) {
        return;
    }

    // Skip non-code files
    if (shouldIgnoreFile(filePath)) {
        return;
    }

    const language = detectLanguageFromPath(filePath);
    const editor = detectEditorSource();

    log(`External file ${isCreate ? 'created' : 'changed'}: ${filePath} (source: ${editor})`);

    sendHeartbeat({
        file: filePath,
        language,
        isSave: true, // external changes are always "saved" to disk
        editor,
    });
}

function openInBrowser(page: string) {
    const config = vscode.workspace.getConfiguration('devmeter');
    const apiUrl = config.get<string>('apiUrl') || 'https://devmeter.codepro.it/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    vscode.env.openExternal(vscode.Uri.parse(`${baseUrl}/${page}`));
}

async function updateStatusBar() {
    const config = vscode.workspace.getConfiguration('devmeter');
    const apiKey = config.get<string>('apiKey');
    const apiUrl = config.get<string>('apiUrl');
    const showProject = config.get<boolean>('showProject');
    const showStreak = config.get<boolean>('showStreak');

    if (IS_MAINTENANCE_MODE) {
        statusBarItem.text = '$(tools) DevMeter: Maintenance';
        statusBarItem.tooltip = MAINTENANCE_MESSAGE;
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        return;
    }

    if (!apiKey || !apiUrl) {
        statusBarItem.text = '$(warning) DevMeter: Missing Config';
        return;
    }

    try {
        const response = await axios.get(`${apiUrl}/stats?range=today`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 5000
        });

        const { totalTime, currentStreak, topProject24h } = response.data.summary;

        let statusText = `$(clock) ${totalTime}`;

        if (showStreak && currentStreak > 0) {
            statusText += ` | $(flame) ${currentStreak}d`;
        }

        if (showProject && topProject24h !== "None") {
            statusText += ` | $(project) ${topProject24h}`;
        }

        statusBarItem.text = statusText;
        statusBarItem.tooltip = new vscode.MarkdownString(
            `### DevMeter Stats Today\n\n` +
            `**Time:** ${totalTime}\n\n` +
            `**Streak:** ${currentStreak} days\n\n` +
            `**Top Project:** ${topProject24h}\n\n` +
            `---\n\n` +
            `Click for menu`
        );

    } catch (error: any) {
        log(`Error fetching stats: ${error.message}`);
        if (error.response?.status === 401 && error.response.data?.error === "User account is deleted") {
            statusBarItem.text = '$(error) DevMeter: Account Deleted';
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
            statusBarItem.tooltip = 'Your DevMeter account has been deleted. Please create a new one or restore it.';
        } else if (error.response?.status === 401) {
            statusBarItem.text = '$(key) DevMeter: Invalid API Key';
            statusBarItem.backgroundColor = undefined;
        } else {
            statusBarItem.backgroundColor = undefined;
        }
    }
}

async function checkApiKey() {
    const config = vscode.workspace.getConfiguration('devmeter');
    const apiKey = config.get<string>('apiKey');

    if (!apiKey) {
        const result = await vscode.window.showWarningMessage(
            'DevMeter: No API Key found. Please enter your API Key to track your coding time.',
            'Enter API Key'
        );

        if (result === 'Enter API Key') {
            vscode.commands.executeCommand('devmeter.apiKey');
        }
    }
}

interface HeartbeatParams {
    file: string;
    language: string;
    isSave: boolean;
    editor: string; // "vscode" | "claude-code" | "terminal" | "external"
}

async function sendHeartbeat(params: HeartbeatParams) {
    const { file, language, isSave, editor } = params;
    const now = Date.now();

    if (IS_MAINTENANCE_MODE) {
        return;
    }

    // Per-source rate limiting: each source gets its own 2-min interval
    const sourceKey = editor;
    const lastForSource = lastHeartbeatBySource[sourceKey] || 0;
    if (!isSave && now - lastForSource < HEARTBEAT_INTERVAL) {
        return;
    }

    // Prevent simultaneous requests
    if (isProcessing) {
        return;
    }

    const config = vscode.workspace.getConfiguration('devmeter');
    const apiKey = config.get<string>('apiKey');
    const apiUrl = config.get<string>('apiUrl');

    if (!apiKey || !apiUrl) {
        return;
    }

    isProcessing = true;

    const project = vscode.workspace.name || 'Unknown Project';

    const payload = {
        project,
        language,
        file,
        timestamp: now,
        is_save: isSave,
        entity: file,
        type: 'file',
        editor,
        platform: process.platform,
        machine: getMachineName()
    };

    try {
        log(`Sending heartbeat [${editor}] for ${file} to ${apiUrl}/heartbeat`);
        await axios.post(`${apiUrl}/heartbeat`, payload, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': `DevMeter-Extension/${getEditorName()}`
            },
            timeout: 5000
        });
        log(`Heartbeat sent successfully [${editor}] for ${file}`);
        lastHeartbeatBySource[sourceKey] = now;
        updateStatusBar();
    } catch (error: any) {
        log(`Failed to send heartbeat: ${error.message}`);
        if (error.response) {
            log(`Response error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            if (error.response.status === 401 && error.response.data?.error === "User account is deleted") {
                vscode.window.showErrorMessage("DevMeter: Your account has been deleted. Please check your settings.");
            }
        }
    } finally {
        isProcessing = false;
    }
}

export function deactivate() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    if (terminalPulseInterval) {
        clearInterval(terminalPulseInterval);
    }
}
