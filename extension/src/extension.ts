// DevMeter Extension - Automated coding time tracker
// Triggering pre-release build v1.3.10 compatible format
// Revised versioning scheme: Even minor = Stable, Odd minor = Pre-release
// Triggering auto-bump verification v0.2.0 PR-strategy final
// Open VSX namespace claimed — triggering v0.2.6 via auto-bump pipeline (v3 target fixing)
import * as vscode from 'vscode';
import axios from 'axios';
import * as path from 'path';
import * as os from 'os';
import * as semver from 'semver';

let statusBarItem: vscode.StatusBarItem;
let refreshInterval: NodeJS.Timeout | undefined;
let outputChannel: vscode.OutputChannel;
let extensionContext: vscode.ExtensionContext;

const PENDING_HEARTBEATS_KEY = 'pendingHeartbeats';
const LAST_SYNC_TIME_KEY = 'lastSyncTime';
const SYNC_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_BATCH_SIZE = 1000; // Server limit per batch
const MAX_BUFFER_SIZE = 5000; // Maximum heartbeats to keep in local buffer

interface PendingHeartbeat {
    heartbeatId?: string; // Unique ID for deduplication
    project: string;
    language: string;
    file: string;
    type: string;
    is_save: boolean;
    timestamp: number;
    editor: string;
    platform: string;
    release: string;
    arch: string;
}

const IS_MAINTENANCE_MODE = false;
const MAINTENANCE_MESSAGE = "We're currently performing some scheduled maintenance to improve DevMeter. Coding activity tracking is temporarily paused and will resume shortly. We appreciate your patience!";

function log(message: string) {
    if (outputChannel) {
        outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${message}`);
    }
    console.log(`[DevMeter] ${message}`);
}

/**
 * Generates a client-side unique ID for heartbeat deduplication.
 * Uses timestamp + random component to ensure uniqueness.
 */
function generateHeartbeatId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
}

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel("DevMeter");
    extensionContext = context;
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
            // Always flush pending heartbeats on a manual sync — covers both the
            // 24-hour sync window and the fallback buffer from connection failures.
            await flushPendingHeartbeats();
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
        const config = vscode.workspace.getConfiguration('devmeter');
        const syncWindow = config.get<boolean>('syncWindow');
        const pendingHeartbeats = extensionContext.globalState.get<PendingHeartbeat[]>(PENDING_HEARTBEATS_KEY, []);
        const pendingCount = pendingHeartbeats.length;

        const syncLabel = pendingCount > 0
            ? `$(sync) Sync Now (${pendingCount} pending heartbeats)`
            : "$(sync) Sync Now";
        const syncDescription = pendingCount > 0
            ? syncWindow
                ? "Upload buffered heartbeats to the dashboard"
                : "Upload locally saved heartbeats (recovered from connection failure)"
            : "Manually refresh your stats";

        const items = [
            { label: "$(layout) Open Private Dashboard", description: "View your personal stats", command: 'devmeter.dashboard' },
            { label: "$(person) View Public Profile", description: "View your shareable profile", command: 'devmeter.profile' },
            { label: "$(key) Update API Key", description: "Change your authentication key", command: 'devmeter.apiKey' },
            { label: syncLabel, description: syncDescription, command: 'devmeter.syncNow' },
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
    checkForUpdates(context);

    // On startup, check if 24-hour sync window has elapsed for pending heartbeats
    checkAndFlushSyncWindow();

    // Refresh status bar every 5 minutes
    refreshInterval = setInterval(() => {
        updateStatusBar();
        checkAndFlushSyncWindow();
    }, 5 * 60 * 1000);
}

async function checkForUpdates(context: vscode.ExtensionContext) {
    const publisherId = "DevMitrza";
    const extensionName = "devmeter";
    const extensionId = `${publisherId}.${extensionName}`;
    const extension = vscode.extensions.getExtension(extensionId);
    if (!extension) return;

    const currentVersion = extension.packageJSON.version;

    try {
        log(`Checking for updates on OpenVSX...`);
        const response = await axios.get(`https://open-vsx.org/api/${publisherId}/${extensionName}/latest`, {
            timeout: 5000
        });

        const latestVersion = response.data.version;
        if (!latestVersion) return;

        // Check if the user has already skipped this version
        const skippedVersion = context.globalState.get<string>('skippedUpdateVersion');
        if (skippedVersion === latestVersion) {
            log(`Update v${latestVersion} already skipped by user.`);
            return;
        }

        if (isOlderVersion(currentVersion, latestVersion)) {
            const message = `DevMeter update available (v${latestVersion}). You are using v${currentVersion}.`;
            const selection = await vscode.window.showInformationMessage(message, "Update", "Later");

            if (selection === "Update") {
                vscode.commands.executeCommand("workbench.extensions.search", `@id:${extensionId}`);
            } else if (selection === "Later") {
                // Save the skipped version to persistent state
                await context.globalState.update('skippedUpdateVersion', latestVersion);
                log(`User chose to skip update v${latestVersion} for now.`);
            }
        } else {
            log(`DevMeter is up to date (v${currentVersion})`);
        }
    } catch (error: any) {
        log(`Update check failed: ${error.message}`);
        // Handle gracefully, do not crash
    }
}

function isOlderVersion(current: string, latest: string): boolean {
    try {
        if (!semver.valid(current) || !semver.valid(latest)) {
            // Fallback to basic numeric compare if not valid semver
            const c = current.split('.').map(n => parseInt(n) || 0);
            const l = latest.split('.').map(n => parseInt(n) || 0);
            for (let i = 0; i < Math.max(c.length, l.length); i++) {
                if ((l[i] || 0) > (c[i] || 0)) return true;
                if ((l[i] || 0) < (c[i] || 0)) return false;
            }
            return false;
        }
        return semver.gt(latest, current);
    } catch (e) {
        return false;
    }
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
    const syncWindow = config.get<boolean>('syncWindow');

    // Don't buffer or send heartbeats if credentials are missing
    if (!apiKey || !apiUrl) {
        return;
    }

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

    const heartbeatPayload: PendingHeartbeat = {
        heartbeatId: generateHeartbeatId(), // Generate unique ID for deduplication
        project,
        language,
        file,
        type: 'file',
        is_save: isSave,
        timestamp: now,
        editor: editorName,
        platform: os.platform(),
        release: os.release(),
        arch: os.arch()
    };

    // When the 24-hour sync window is enabled, buffer heartbeats locally
    // Only buffer if API credentials are present
    if (syncWindow && apiKey && apiUrl) {
        isProcessing = true;
        try {
            let pending = extensionContext.globalState.get<PendingHeartbeat[]>(PENDING_HEARTBEATS_KEY, []);
            pending.push(heartbeatPayload);

            // Truncate buffer to most recent entries if it exceeds MAX_BUFFER_SIZE
            if (pending.length > MAX_BUFFER_SIZE) {
                log(`Buffer size (${pending.length}) exceeds limit. Truncating to most recent ${MAX_BUFFER_SIZE} entries.`);
                pending = pending.slice(-MAX_BUFFER_SIZE);
            }

            await extensionContext.globalState.update(PENDING_HEARTBEATS_KEY, pending);
            log(`Heartbeat buffered locally (${pending.length} pending). Will sync after 24 hours.`);
            lastHeartbeat = now;
        } catch (error: any) {
            log(`Failed to buffer heartbeat locally: ${error.message}`);
        } finally {
            isProcessing = false;
        }
        return;
    }

    // Default path: send heartbeat immediately
    isProcessing = true;

    try {
        log(`Sending heartbeat for ${file} to ${apiUrl}/heartbeat`);
        await axios.post(`${apiUrl}/heartbeat`, heartbeatPayload, {
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

        // Fallback: if the failure is a server/network error (DB down, connection refused,
        // 5xx), buffer the heartbeat locally so no data is lost. Auth and bad-request
        // errors (4xx) are not retried because they will not succeed later.
        const isServerOrNetworkError = !error.response || error.response.status >= 500;
        if (isServerOrNetworkError) {
            try {
                let pending = extensionContext.globalState.get<PendingHeartbeat[]>(PENDING_HEARTBEATS_KEY, []);
                pending.push(heartbeatPayload);

                // Truncate buffer to most recent entries if it exceeds MAX_BUFFER_SIZE
                if (pending.length > MAX_BUFFER_SIZE) {
                    log(`Fallback buffer size (${pending.length}) exceeds limit. Truncating to most recent ${MAX_BUFFER_SIZE} entries.`);
                    pending = pending.slice(-MAX_BUFFER_SIZE);
                }

                await extensionContext.globalState.update(PENDING_HEARTBEATS_KEY, pending);
                log(`Heartbeat saved to local fallback buffer (${pending.length} pending). Will retry when server is reachable.`);
                lastHeartbeat = now; // Mark as handled to avoid flooding the buffer on rapid events
            } catch (bufferError: any) {
                log(`Failed to save heartbeat to local fallback buffer: ${bufferError.message}`);
            }
        }
        // Don't update lastHeartbeat for non-server errors so we can retry on next change if it's been long enough
    } finally {
        isProcessing = false;
    }
}

/**
 * Checks for locally buffered heartbeats and flushes them when appropriate:
 * - In 24-hour sync-window mode: flushes after the 24-hour window has elapsed.
 * - In fallback mode (syncWindow off): flushes immediately to retry heartbeats
 *   that were buffered due to a previous server/DB connection failure.
 */
async function checkAndFlushSyncWindow() {
    const pending = extensionContext.globalState.get<PendingHeartbeat[]>(PENDING_HEARTBEATS_KEY, []);
    if (pending.length === 0) {
        return;
    }

    const config = vscode.workspace.getConfiguration('devmeter');
    const syncWindow = config.get<boolean>('syncWindow');

    if (syncWindow) {
        // 24-hour sync window: only flush once the full window has elapsed
        const lastSyncTime = extensionContext.globalState.get<number>(LAST_SYNC_TIME_KEY, 0);
        const now = Date.now();
        if (now - lastSyncTime >= SYNC_WINDOW_MS) {
            log(`24-hour sync window elapsed. Flushing ${pending.length} buffered heartbeat(s)…`);
            await flushPendingHeartbeats();
        }
    } else {
        // Fallback mode: these heartbeats were buffered because the server was unreachable.
        // Retry immediately now that connectivity may have been restored.
        log(`Retrying ${pending.length} locally buffered heartbeat(s) from previous failures…`);
        await flushPendingHeartbeats(true);
    }
}

/**
 * Uploads all locally buffered heartbeats to the server in chunked batch requests,
 * then clears the local buffer and records the current time as the last sync time.
 * Enforces a maximum buffer size and splits large buffers into chunks to respect
 * the server's MAX_BATCH_SIZE limit.
 *
 * @param silent - When true, suppresses the success notification (used for automatic
 *   background retries so the user is not interrupted by repeated toasts).
 */
async function flushPendingHeartbeats(silent = false) {
    const config = vscode.workspace.getConfiguration('devmeter');
    const apiKey = config.get<string>('apiKey');
    const apiUrl = config.get<string>('apiUrl');

    if (!apiKey || !apiUrl) {
        return;
    }

    let pending = extensionContext.globalState.get<PendingHeartbeat[]>(PENDING_HEARTBEATS_KEY, []);
    if (pending.length === 0) {
        log('No pending heartbeats to sync.');
        return;
    }

    // Truncate buffer to most recent entries if it exceeds MAX_BUFFER_SIZE
    if (pending.length > MAX_BUFFER_SIZE) {
        log(`Buffer size (${pending.length}) exceeds limit (${MAX_BUFFER_SIZE}). Truncating to most recent entries.`);
        pending = pending.slice(-MAX_BUFFER_SIZE);
        await extensionContext.globalState.update(PENDING_HEARTBEATS_KEY, pending);
    }

    log(`Syncing ${pending.length} buffered heartbeat(s) to ${apiUrl}/heartbeat/batch in chunks of ${MAX_BATCH_SIZE}`);

    const editorName = vscode.env.appName || 'unknown';
    let totalSynced = 0;

    // Process heartbeats in chunks of MAX_BATCH_SIZE
    for (let i = 0; i < pending.length; i += MAX_BATCH_SIZE) {
        const chunk = pending.slice(i, i + MAX_BATCH_SIZE);
        log(`Processing chunk ${Math.floor(i / MAX_BATCH_SIZE) + 1}/${Math.ceil(pending.length / MAX_BATCH_SIZE)} (${chunk.length} heartbeats)`);

        try {
            await axios.post(`${apiUrl}/heartbeat/batch`, { heartbeats: chunk }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'User-Agent': `DevMeter-VSCode-Extension/${editorName}`
                },
                timeout: 30000 // Allow more time for large batches
            });

            log(`Successfully synced chunk of ${chunk.length} heartbeat(s).`);
            totalSynced += chunk.length;

            // Remove successfully sent chunk from buffer
            // Read current buffer (in case new heartbeats were added during await)
            const currentBuffer = extensionContext.globalState.get<PendingHeartbeat[]>(PENDING_HEARTBEATS_KEY, []);
            // Remove the sent chunk by filtering out items that match the chunk
            const remaining = currentBuffer.filter(hb => !chunk.some(sent =>
                sent.timestamp === hb.timestamp &&
                sent.file === hb.file &&
                sent.project === hb.project &&
                sent.is_save === hb.is_save
            ));
            await extensionContext.globalState.update(PENDING_HEARTBEATS_KEY, remaining);

        } catch (error: any) {
            log(`Failed to sync chunk: ${error.message}`);
            if (error.response) {
                log(`Response error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);

                // Handle permanent client errors (4xx except 429) by removing the chunk
                if (error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
                    log(`Permanent client error (${error.response.status}). Removing failed chunk to prevent infinite retry.`);
                    const currentBuffer = extensionContext.globalState.get<PendingHeartbeat[]>(PENDING_HEARTBEATS_KEY, []);
                    const remaining = currentBuffer.filter(hb => !chunk.some(sent =>
                        sent.timestamp === hb.timestamp &&
                        sent.file === hb.file &&
                        sent.project === hb.project &&
                        sent.is_save === hb.is_save
                    ));
                    await extensionContext.globalState.update(PENDING_HEARTBEATS_KEY, remaining);
                    continue; // Process next chunk
                }
            }

            // For 429, 5xx, or network errors: keep the chunk in storage for retry
            log(`Keeping failed chunk in buffer for later retry.`);
            break; // Stop processing remaining chunks
        }
    }

    // Update sync time if we synced anything
    if (totalSynced > 0) {
        await extensionContext.globalState.update(LAST_SYNC_TIME_KEY, Date.now());

        if (!silent) {
            vscode.window.showInformationMessage(
                `DevMeter: Synced ${totalSynced} buffered heartbeat(s) to the dashboard.`
            );
        } else {
            log(`Silently recovered ${totalSynced} heartbeat(s) from local fallback buffer.`);
        }
        updateStatusBar();
    }
}

export function deactivate() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
}