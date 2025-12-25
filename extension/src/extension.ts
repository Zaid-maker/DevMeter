import * as vscode from 'vscode';
import axios from 'axios';

let lastHeartbeat: number = 0;
const HEARTBEAT_INTERVAL = 120000; // 2 minutes

export function activate(context: vscode.ExtensionContext) {
    console.log('DevMeter is now active!');

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

async function sendHeartbeat(document: vscode.TextDocument, isSave: boolean) {
    const now = Date.now();
    if (!isSave && now - lastHeartbeat < HEARTBEAT_INTERVAL) {
        return;
    }

    const config = vscode.workspace.getConfiguration('devmeter');
    const apiKey = config.get<string>('apiKey');
    const apiUrl = config.get<string>('apiUrl');

    if (!apiKey) {
        return;
    }

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
        await axios.post(`${apiUrl}/heartbeat`, payload, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        lastHeartbeat = now;
        console.log(`[DevMeter] Heartbeat sent for ${file}`);
    } catch (error: any) {
        console.error(`[DevMeter] Failed to send heartbeat: ${error.message}`);
    }
}

export function deactivate() { }
