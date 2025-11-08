import { jest } from '@jest/globals';
import * as vscode from 'vscode';
import { formatWorkspace } from '../src/batchFormatter';
import * as formatter from '../src/formatter';

jest.mock('../src/formatter');

describe('batchFormatter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('formatWorkspace', () => {
        it('should show error when no workspace folder found', async () => {
            // Arrange
            (vscode.workspace as any).workspaceFolders = undefined;

            // Act
            await formatWorkspace();

            // Assert
            expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No workspace folder found');
        });

        it('should show warning when extension is disabled', async () => {
            // Arrange
            const mockWorkspaceFolder = {
                uri: { fsPath: '/test/workspace' },
                name: 'test',
                index: 0,
            };
            (vscode.workspace as any).workspaceFolders = [mockWorkspaceFolder];

            const mockConfig = {
                get: jest.fn((key: string, defaultValue?: any) => {
                    if (key === 'enable') return false;
                    return defaultValue;
                }),
            };
            (vscode.workspace.getConfiguration as any).mockReturnValue(mockConfig);

            // Act
            await formatWorkspace();

            // Assert
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('Prettier-ESLint is disabled');
        });

        it('should show message when no changed files found', async () => {
            // Arrange
            const mockWorkspaceFolder = {
                uri: { fsPath: '/test/workspace' },
                name: 'test',
                index: 0,
            };
            (vscode.workspace as any).workspaceFolders = [mockWorkspaceFolder];

            const mockConfig = {
                get: jest.fn((key: string, defaultValue?: any) => {
                    if (key === 'enable') return true;
                    return defaultValue;
                }),
            };
            (vscode.workspace.getConfiguration as any).mockReturnValue(mockConfig);
            (vscode.workspace as any).textDocuments = [];

            // Act
            await formatWorkspace();

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'No changed files found to format'
            );
        });
    });
});
