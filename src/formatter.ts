import * as vscode from 'vscode';
import * as prettier from 'prettier';
import { ESLint } from 'eslint';
import * as path from 'path';

// Cache for ESLint instances per workspace
const eslintCache = new Map<string, ESLint>();

// Cache for Prettier configs per file path
const prettierConfigCache = new Map<string, prettier.Options | null>();

/**
 * Clear all caches (useful for testing and when config changes)
 */
export function clearCaches(): void {
    eslintCache.clear();
    prettierConfigCache.clear();
}

/**
 * Get or create an ESLint instance for a given workspace
 */
function getESLintInstance(cwd: string): ESLint {
    if (!eslintCache.has(cwd)) {
        eslintCache.set(cwd, new ESLint({ cwd, fix: true }));
    }

    return eslintCache.get(cwd)!;
}

export async function formatDocument(
    document: vscode.TextDocument
): Promise<void> {
    const text = document.getText();
    const filePath = document.fileName;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const cwd = workspaceFolder?.uri.fsPath || path.dirname(filePath);

    try {
        // Step 1: Format with Prettier
        let formattedText = await formatWithPrettier(text, filePath);

        // Step 2: Fix with ESLint
        formattedText = await fixWithESLint(formattedText, filePath, cwd);

        // Step 3: Apply the formatted text to the document
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
        );
        edit.replace(document.uri, fullRange, formattedText);
        await vscode.workspace.applyEdit(edit);
    } catch (error) {
        throw new Error(`Formatting failed: ${error}`);
    }
}

async function formatWithPrettier(
    text: string,
    filePath: string
): Promise<string> {
    try {
        // Check cache first
        let options = prettierConfigCache.get(filePath);

        if (options === undefined) {
            // Not in cache, resolve and cache it
            options = await prettier.resolveConfig(filePath);
            prettierConfigCache.set(filePath, options);
        }
        
        const formatted = await prettier.format(text, {
            ...options,
            filepath: filePath,
        });

        return formatted;
    } catch (error) {
        console.error('Prettier formatting error:', error);
        throw error;
    }
}

async function fixWithESLint(
    text: string,
    filePath: string,
    cwd: string
): Promise<string> {
    try {
        // Use cached ESLint instance
        const eslint = getESLintInstance(cwd);

        const results = await eslint.lintText(text, {filePath,});

        if (results.length > 0 && results[0].output !== undefined) {
            return results[0].output;
        }

        return text;
    } catch (error) {
        console.error('ESLint fix error:', error);

        // Return the text unchanged if ESLint fails
        return text;
    }
}
