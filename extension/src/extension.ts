import * as vscode from 'vscode';
import axios from 'axios';

let statusBarItem: vscode.StatusBarItem;
let refreshInterval: NodeJS.Timeout | undefined;
let outputChannel: vscode.OutputChannel;

function log(message: string) {
    if (outputChannel) {
        outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${message}`);
    }
    console.log(`[DevMeter] ${message}`);
}

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel("DevMeter");
    log('DevMeter is now active!');

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

    // Command to show Menu
    context.subscriptions.push(vscode.commands.registerCommand('devmeter.showMenu', async () => {
        const items = [
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

function openInBrowser(page: string) {
    const config = vscode.workspace.getConfiguration('devmeter');
    const apiUrl = config.get<string>('apiUrl') || 'https://devmeter.zaidcode.me/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    vscode.env.openExternal(vscode.Uri.parse(`${baseUrl}/${page}`));
}

async function updateStatusBar() {
    const config = vscode.workspace.getConfiguration('devmeter');
    const apiKey = config.get<string>('apiKey');
    const apiUrl = config.get<string>('apiUrl');
    const showProject = config.get<boolean>('showProject');
    const showStreak = config.get<boolean>('showStreak');

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

    const payload = {
        project,
        language,
        file,
        timestamp: now,
        is_save: isSave,
        entity: file,
        type: 'file',
        editor: 'vscode',
        platform: process.platform
    };

    try {
        log(`Sending heartbeat for ${file} to ${apiUrl}/heartbeat`);
        await axios.post(`${apiUrl}/heartbeat`, payload, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
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
