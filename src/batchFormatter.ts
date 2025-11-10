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

// Maximum number of files to format in parallel
const MAX_CONCURRENT_FORMATS = 5;

/**
 * Format only changed (dirty) files in the workspace
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

    // Find only changed (dirty) files
    const files = getChangedFiles();
    
    if (files.length === 0) {
        vscode.window.showInformationMessage('No changed files found to format');

        return;
    }

    // Ask for confirmation
    const confirmation = await vscode.window.showWarningMessage(
        `Format ${files.length} changed file(s)?`,
        { modal: true },
        'Yes',
        'No'
    );

    if (confirmation !== 'Yes') {
        return;
    }

    // Format files with progress and parallel processing
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Formatting files',
            cancellable: false
        },
        async (progress) => {
            let successCount = 0;
            let errorCount = 0;
            let processedCount = 0;

            // Process files in batches for parallel execution
            await processBatch(files, MAX_CONCURRENT_FORMATS, async (file) => {
                try {
                    const document = await vscode.workspace.openTextDocument(file);
                    await formatDocument(document);
                    await document.save();
                    successCount++;
                } catch (error) {
                    console.error(`Failed to format ${file.fsPath}:`, error);
                    errorCount++;
                } finally {
                    processedCount++;
                    progress.report({
                        message: `${processedCount}/${files.length}: ${path.basename(file.fsPath)}`,
                        increment: (100 / files.length)
                    });
                }
            });

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
 * Process items in parallel batches with concurrency control
 */
async function processBatch<T>(
    items: T[],
    concurrency: number,
    processor: (item: T) => Promise<void>
): Promise<void> {
    const executing: Promise<void>[] = [];
    
    for (const item of items) {
        const promise = processor(item).then(() => {
            executing.splice(executing.indexOf(promise), 1);
        });
        
        executing.push(promise);
        
        if (executing.length >= concurrency) {
            await Promise.race(executing);
        }
    }
    
    await Promise.all(executing);
}

/**
 * Get only changed (dirty) files that have unsaved changes
 */
function getChangedFiles(): vscode.Uri[] {
    const changedFiles: vscode.Uri[] = [];
    
    // Get all text documents that have unsaved changes
    for (const document of vscode.workspace.textDocuments) {
        // Skip if document is not dirty (no unsaved changes)
        if (!document.isDirty) {
            continue;
        }
        
        // Skip untitled documents
        if (document.uri.scheme !== 'file') {
            continue;
        }
        
        // Check if file has a supported extension
        const ext = path.extname(document.fileName);

        if (SUPPORTED_EXTENSIONS.includes(ext)) {
            changedFiles.push(document.uri);
        }
    }
    
    return changedFiles;
}
