import * as vscode from 'vscode';
import { formatDocument, clearCaches } from './formatter';
import { formatWorkspace } from './batchFormatter';

// Debounce map for format on save per document
const formatDebounceMap = new Map<string, NodeJS.Timeout>();
const DEBOUNCE_DELAY = 300; // milliseconds

export function activate(context: vscode.ExtensionContext) {
    console.log('Prettier-ESLint extension is now active');

    // Register format command
    const formatCommand = vscode.commands.registerCommand(
        'prettier-eslint.format',
        async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor found');
                return;
            }

            try {
                await formatDocument(editor.document);
                vscode.window.showInformationMessage('Document formatted successfully');
            } catch (error) {
                vscode.window.showErrorMessage(`Formatting failed: ${error}`);
            }
        }
    );

    context.subscriptions.push(formatCommand);

    // Register format workspace command
    const formatWorkspaceCommand = vscode.commands.registerCommand(
        'prettier-eslint.formatWorkspace',
        async () => {
            try {
                await formatWorkspace();
            } catch (error) {
                vscode.window.showErrorMessage(`Workspace formatting failed: ${error}`);
            }
        }
    );

    context.subscriptions.push(formatWorkspaceCommand);

    // Watch for config file changes and clear caches
    const configWatcher = vscode.workspace.createFileSystemWatcher(
        '**/{.prettierrc*,.eslintrc*,eslint.config.*,prettier.config.*}',
        false,
        false,
        false
    );

    configWatcher.onDidChange(() => {
        console.log('Config file changed, clearing caches');
        clearCaches();
    });

    configWatcher.onDidCreate(() => {
        console.log('Config file created, clearing caches');
        clearCaches();
    });

    configWatcher.onDidDelete(() => {
        console.log('Config file deleted, clearing caches');
        clearCaches();
    });

    context.subscriptions.push(configWatcher);

    // Register format on save with debouncing
    const formatOnSaveDisposable = vscode.workspace.onWillSaveTextDocument(
        async (event) => {
            const config = vscode.workspace.getConfiguration('prettier-eslint');
            const formatOnSave = config.get<boolean>('formatOnSave', false);
            const enabled = config.get<boolean>('enable', true);

            if (!enabled || !formatOnSave) {
                return;
            }

            const document = event.document;
            const supportedLanguages = [
                'javascript',
                'typescript',
                'javascriptreact',
                'typescriptreact',
                'json',
                'jsonc'
            ];

            if (supportedLanguages.includes(document.languageId)) {
                const documentKey = document.uri.toString();
                
                // Clear existing debounce timer
                const existingTimer = formatDebounceMap.get(documentKey);
                if (existingTimer) {
                    clearTimeout(existingTimer);
                }

                event.waitUntil(
                    new Promise<void>((resolve) => {
                        const timer = setTimeout(async () => {
                            formatDebounceMap.delete(documentKey);
                            try {
                                await formatDocument(document);
                            } catch (error) {
                                console.error('Format on save failed:', error);
                            }
                            resolve();
                        }, DEBOUNCE_DELAY);
                        
                        formatDebounceMap.set(documentKey, timer);
                    })
                );
            }
        }
    );

    context.subscriptions.push(formatOnSaveDisposable);
}

export function deactivate() {
    // Clear all debounce timers
    formatDebounceMap.forEach(timer => clearTimeout(timer));
    formatDebounceMap.clear();
    
    // Clear all caches
    clearCaches();
}
