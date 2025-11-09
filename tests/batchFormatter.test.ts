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

        it('should return when user cancels confirmation', async () => {
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
            
            const mockDocument = {
                isDirty: true,
                uri: { scheme: 'file' },
                fileName: '/test/file.js',
            };
            (vscode.workspace as any).textDocuments = [mockDocument];
            (vscode.window.showWarningMessage as any).mockResolvedValue('No');

            // Act
            await formatWorkspace();

            // Assert
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                'Format 1 changed file(s)?',
                { modal: true },
                'Yes',
                'No'
            );
            expect(vscode.window.withProgress).not.toHaveBeenCalled();
        });

        it('should format multiple files in parallel when confirmed', async () => {
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
            
            const mockDocument1 = {
                isDirty: true,
                uri: { scheme: 'file', fsPath: '/test/file1.js' },
                fileName: '/test/file1.js',
                save: jest.fn<any>().mockResolvedValue(true),
            };
            const mockDocument2 = {
                isDirty: true,
                uri: { scheme: 'file', fsPath: '/test/file2.js' },
                fileName: '/test/file2.js',
                save: jest.fn<any>().mockResolvedValue(true),
            };
            (vscode.workspace as any).textDocuments = [mockDocument1, mockDocument2];
            (vscode.workspace.openTextDocument as any)
                .mockResolvedValueOnce(mockDocument1)
                .mockResolvedValueOnce(mockDocument2);
            (vscode.window.showWarningMessage as any).mockResolvedValue('Yes');
            (formatter.formatDocument as any).mockResolvedValue(undefined);

            let progressCallback: any;
            (vscode.window.withProgress as any).mockImplementation((options: any, callback: any) => {
                progressCallback = callback;
                const progress = { report: jest.fn() };
                return callback(progress);
            });

            // Act
            await formatWorkspace();

            // Assert
            expect(vscode.window.withProgress).toHaveBeenCalled();
            expect(formatter.formatDocument).toHaveBeenCalledTimes(2);
            expect(mockDocument1.save).toHaveBeenCalled();
            expect(mockDocument2.save).toHaveBeenCalled();
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'Successfully formatted 2 file(s)'
            );
        });

        it('should handle formatting errors and show warning', async () => {
            // Arrange
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
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
            
            const mockDocument1 = {
                isDirty: true,
                uri: { scheme: 'file', fsPath: '/test/file1.js' },
                fileName: '/test/file1.js',
                save: jest.fn<any>().mockResolvedValue(true),
            };
            const mockDocument2 = {
                isDirty: true,
                uri: { scheme: 'file', fsPath: '/test/file2.js' },
                fileName: '/test/file2.js',
                save: jest.fn<any>().mockResolvedValue(true),
            };
            (vscode.workspace as any).textDocuments = [mockDocument1, mockDocument2];
            (vscode.workspace.openTextDocument as any)
                .mockResolvedValueOnce(mockDocument1)
                .mockResolvedValueOnce(mockDocument2);
            (vscode.window.showWarningMessage as any).mockResolvedValue('Yes');
            
            // Make one document fail
            (formatter.formatDocument as any)
                .mockRejectedValueOnce(new Error('Format error'))
                .mockResolvedValueOnce(undefined);

            (vscode.window.withProgress as any).mockImplementation((options: any, callback: any) => {
                const progress = { report: jest.fn() };
                return callback(progress);
            });

            // Act
            await formatWorkspace();

            // Assert
            expect(formatter.formatDocument).toHaveBeenCalledTimes(2);
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                'Formatted 1 file(s), 1 error(s). Check console for details.'
            );
            
            consoleErrorSpy.mockRestore();
        });

        it('should skip non-dirty documents', async () => {
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
            
            const mockDocument = {
                isDirty: false,
                uri: { scheme: 'file' },
                fileName: '/test/file.js',
            };
            (vscode.workspace as any).textDocuments = [mockDocument];

            // Act
            await formatWorkspace();

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'No changed files found to format'
            );
        });

        it('should skip non-file scheme documents', async () => {
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
            
            const mockDocument = {
                isDirty: true,
                uri: { scheme: 'untitled' },
                fileName: '/test/file.js',
            };
            (vscode.workspace as any).textDocuments = [mockDocument];

            // Act
            await formatWorkspace();

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'No changed files found to format'
            );
        });

        it('should skip unsupported file extensions', async () => {
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
            
            const mockDocument = {
                isDirty: true,
                uri: { scheme: 'file' },
                fileName: '/test/file.py',
            };
            (vscode.workspace as any).textDocuments = [mockDocument];

            // Act
            await formatWorkspace();

            // Assert
            expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                'No changed files found to format'
            );
        });
    });
});
