// DevMeter Extension - Automated coding time tracker
// Triggering pre-release build v1.3.10 compatible format
// Revised versioning scheme: Even minor = Stable, Odd minor = Pre-release
// Triggering auto-bump verification v0.2.0 PR-strategy final
// Open VSX namespace claimed — triggering v0.2.5 publish to both marketplaces
import * as vscode from 'vscode';
import axios from 'axios';
import * as path from 'path';
import * as os from 'os';

let statusBarItem: vscode.StatusBarItem;
let refreshInterval: NodeJS.Timeout | undefined;
let outputChannel: vscode.OutputChannel;

const IS_MAINTENANCE_MODE = false;
const MAINTENANCE_MESSAGE = "We're currently performing some scheduled maintenance to improve DevMeter. Coding activity tracking is temporarily paused and will resume shortly. We appreciate your patience!";

function log(message: string) {
    if (outputChannel) {
        outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${message}`);
    }
    console.log(`[DevMeter] ${message}`);
}

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel("DevMeter");
    log('DevMeter is now active!');

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

    // Call migration logic
    migrateObsoleteUrl(log);

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

    // Command to manually sync / refresh status
    context.subscriptions.push(vscode.commands.registerCommand('devmeter.syncNow', async () => {
        log('Manual sync triggered');
        statusBarItem.text = '$(sync~spin) DevMeter: Syncing…';
        try {
            await updateStatusBar();
            vscode.window.showInformationMessage('DevMeter: Sync complete.');
        } catch (error) {
            log(`Manual sync failed: ${error instanceof Error ? error.message : String(error)}`);
            vscode.window.showErrorMessage('DevMeter: Sync failed. Check logs for details.');
        }
    }));

    // Command to reveal the output channel for debugging
    context.subscriptions.push(vscode.commands.registerCommand('devmeter.showLogs', () => {
        outputChannel.show(true);
    }));

    // Command to show Menu
    context.subscriptions.push(vscode.commands.registerCommand('devmeter.showMenu', async () => {
        const items = [
            { label: "$(layout) Open Private Dashboard", description: "View your personal stats", command: 'devmeter.dashboard' },
            { label: "$(person) View Public Profile", description: "View your shareable profile", command: 'devmeter.profile' },
            { label: "$(key) Update API Key", description: "Change your authentication key", command: 'devmeter.apiKey' },
            { label: "$(sync) Sync Now", description: "Manually refresh your stats", command: 'devmeter.syncNow' },
            { label: "$(output) Show Logs", description: "Open the DevMeter output channel", command: 'devmeter.showLogs' },
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

    // Monitor file changes/typing
    vscode.workspace.onDidChangeTextDocument((event) => {
        sendHeartbeat(event.document, false);
    });

    vscode.workspace.onDidSaveTextDocument((document) => {
        sendHeartbeat(document, true);
    });

    // Initial check for API Key
    checkApiKey();
    updateStatusBar();

    // Refresh status bar every 5 minutes
    refreshInterval = setInterval(() => {
        updateStatusBar();
    }, 5 * 60 * 1000);
}

async function migrateObsoleteUrl(logFunc: (m: string) => void) {
    const config = vscode.workspace.getConfiguration('devmeter');
    const apiUrl = config.get<string>('apiUrl');
    const OLD_DOMAIN = "https://dev-meter.vercel.app/api";
    const NEW_API_URL = "https://devmeter-v2.zaidcode.me/api";

    if (apiUrl && apiUrl.includes(OLD_DOMAIN)) {
        logFunc(`Migrating obsolete API URL: ${apiUrl} -> ${NEW_API_URL}`);
        try {
            await config.update('apiUrl', NEW_API_URL, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(
                "DevMeter: We've automatically updated your API URL to the new domain to keep your stats syncing!",
                "Got it"
            );
        } catch (err) {
            logFunc(`Failed to migrate API URL: ${err}`);
        }
    }
}

function openInBrowser(page: string) {
    const config = vscode.workspace.getConfiguration('devmeter');
    const apiUrl = config.get<string>('apiUrl') || 'https://devmeter-v2.zaidcode.me/api';
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
        statusBarItem.backgroundColor = undefined;
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
            statusBarItem.text = '$(warning) DevMeter: Offline';
            statusBarItem.tooltip = `DevMeter could not reach the server.\n\nError: ${error.message}\n\nUse "Sync Now" to retry or "Show Logs" for details.`;
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
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

let lastHeartbeat: number = 0;
const HEARTBEAT_INTERVAL = 120000; // 2 minutes
let isProcessing: boolean = false;

async function sendHeartbeat(document: vscode.TextDocument, isSave: boolean) {
    const now = Date.now();

    if (IS_MAINTENANCE_MODE) {
        return;
    }

    // Check interval
    if (!isSave && now - lastHeartbeat < HEARTBEAT_INTERVAL) {
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
    const language = document.languageId;
    const file = document.fileName;

    // Level 2: Advanced detection using execution context (2026 standard)
    let editorName = vscode.env.appName || 'unknown';
    const execPath = process.execPath.toLowerCase();
    const uriScheme = (vscode.env.uriScheme || '').toLowerCase();

    // Check executable path for clues
    if (execPath.includes('antigravity')) {
        editorName = 'Antigravity';
    } else if (execPath.includes('cursor')) {
        editorName = 'Cursor';
    } else if (execPath.includes('windsurf')) {
        editorName = 'Windsurf';
    } else if (execPath.includes('trae')) {
        editorName = 'Trae';
    } else if (execPath.includes('vscodium')) {
        editorName = 'VSCodium';
    } else if (uriScheme.includes('antigravity')) {
        editorName = 'Antigravity';
    } else if (uriScheme.includes('cursor')) {
        editorName = 'Cursor';
    }

    const payload = {
        project,
        language,
        file,
        timestamp: now,
        is_save: isSave,
        entity: file,
        type: 'file',
        editor: editorName,
        platform: os.platform(), // More accurate platform from Node
        release: os.release(),    // OS version
        arch: os.arch()          // CPU architecture
    };

    try {
        log(`Sending heartbeat for ${file} to ${apiUrl}/heartbeat`);
        await axios.post(`${apiUrl}/heartbeat`, payload, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': `DevMeter-VSCode-Extension/${editorName}`
            },
            timeout: 5000
        });
        log(`Heartbeat sent successfully for ${file}`);
        lastHeartbeat = now; // Only update on success
        updateStatusBar(); // Refresh status bar on success
    } catch (error: any) {
        log(`Failed to send heartbeat: ${error.message}`);
        if (error.response) {
            log(`Response error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            if (error.response.status === 401 && error.response.data?.error === "User account is deleted") {
                vscode.window.showErrorMessage("DevMeter: Your account has been deleted. Please check your settings.");
            }
        }
        // Don't update lastHeartbeat so we can retry on next change if it's been long enough
    } finally {
        isProcessing = false;
    }
}

export function deactivate() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
}
