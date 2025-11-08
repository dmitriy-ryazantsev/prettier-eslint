import * as vscode from 'vscode';
import { formatDocument } from './formatter';
import * as path from 'path';

const SUPPORTED_EXTENSIONS = [
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.json',
    '.jsonc'
];

/**
 * Format all files in a workspace folder
 */
export async function formatWorkspace(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
    }

    const config = vscode.workspace.getConfiguration('prettier-eslint');
    const enabled = config.get<boolean>('enable', true);

    if (!enabled) {
        vscode.window.showWarningMessage('Prettier-ESLint is disabled');
        return;
    }

    // Find all supported files
    const files = await findSupportedFiles(workspaceFolders);
    
    if (files.length === 0) {
        vscode.window.showInformationMessage('No supported files found to format');
        return;
    }

    // Ask for confirmation
    const confirmation = await vscode.window.showWarningMessage(
        `Format ${files.length} file(s) in workspace?`,
        { modal: true },
        'Yes',
        'No'
    );

    if (confirmation !== 'Yes') {
        return;
    }

    // Format files with progress
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Formatting files',
            cancellable: false
        },
        async (progress) => {
            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                progress.report({
                    message: `${i + 1}/${files.length}: ${path.basename(file.fsPath)}`,
                    increment: (100 / files.length)
                });

                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    await formatDocument(document);
                    successCount++;
                } catch (error) {
                    console.error(`Failed to format ${file.fsPath}:`, error);
                    errorCount++;
                }
            }

            // Show summary
            if (errorCount === 0) {
                vscode.window.showInformationMessage(
                    `Successfully formatted ${successCount} file(s)`
                );
            } else {
                vscode.window.showWarningMessage(
                    `Formatted ${successCount} file(s), ${errorCount} error(s). Check console for details.`
                );
            }
        }
    );
}

/**
 * Find all supported files in workspace folders
 */
async function findSupportedFiles(
    workspaceFolders: readonly vscode.WorkspaceFolder[]
): Promise<vscode.Uri[]> {
    const files: vscode.Uri[] = [];

    for (const folder of workspaceFolders) {
        const pattern = new vscode.RelativePattern(
            folder,
            `**/*{${SUPPORTED_EXTENSIONS.join(',')}}`
        );

        const foundFiles = await vscode.workspace.findFiles(
            pattern,
            '**/node_modules/**'
        );

        files.push(...foundFiles);
    }

    return files;
}
