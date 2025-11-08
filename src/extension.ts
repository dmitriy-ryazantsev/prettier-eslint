import * as vscode from 'vscode';
import { formatDocument } from './formatter';

export function activate(context: vscode.ExtensionContext) {
    console.log('Prettier-ESLint extension is now active');

    // Register format command
    let formatCommand = vscode.commands.registerCommand(
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

    // Register format on save
    let formatOnSaveDisposable = vscode.workspace.onWillSaveTextDocument(
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
                event.waitUntil(
                    formatDocument(document).catch((error) => {
                        console.error('Format on save failed:', error);
                        return Promise.resolve();
                    })
                );
            }
        }
    );

    context.subscriptions.push(formatOnSaveDisposable);
}

export function deactivate() {}
