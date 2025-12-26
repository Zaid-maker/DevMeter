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
    statusBarItem.command = 'devmeter.apiKey';
    statusBarItem.tooltip = 'DevMeter: Click to configure';
    statusBarItem.text = '$(clock) DevMeter: ...';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Command to set API Key
    let disposable = vscode.commands.registerCommand('devmeter.apiKey', async () => {
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
    });

    context.subscriptions.push(disposable);

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

async function updateStatusBar() {
    const config = vscode.workspace.getConfiguration('devmeter');
    const apiKey = config.get<string>('apiKey');
    const apiUrl = config.get<string>('apiUrl');

    if (!apiKey || !apiUrl) {
        statusBarItem.text = '$(warning) DevMeter: Missing Config';
        return;
    }

    try {
        log(`Fetching stats from ${apiUrl}/stats?range=today`);
        const response = await axios.get(`${apiUrl}/stats?range=today`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            timeout: 5000
        });

        const { totalTime } = response.data.summary;
        statusBarItem.text = `$(clock) DevMeter: ${totalTime}`;
        log(`Stats updated: ${totalTime}`);
    } catch (error: any) {
        log(`Error fetching stats: ${error.message}`);
        if (error.response) {
            log(`Response error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
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
        type: 'file'
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
