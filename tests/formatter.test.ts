import { jest } from '@jest/globals';
import * as vscode from 'vscode';
import { formatDocument, clearCaches } from '../src/formatter';
import * as prettier from 'prettier';
import { ESLint } from 'eslint';

describe('formatter', () => {
    let mockDocument: any;
    let mockWorkspaceEdit: any;
    let mockRange: any;

    beforeEach(() => {
        jest.clearAllMocks();
        clearCaches(); // Clear caches before each test

        // Setup mock document
        mockDocument = {
            getText: jest.fn().mockReturnValue('const x = 1;'),
            fileName: '/test/file.js',
            uri: { fsPath: '/test/file.js' },
            positionAt: jest.fn((offset) => ({ line: 0, character: offset })),
        };

        // Setup mock workspace edit
        mockWorkspaceEdit = {
            replace: jest.fn(),
        };
        (vscode.WorkspaceEdit as any).mockImplementation(() => mockWorkspaceEdit);

        // Setup mock range
        mockRange = { start: { line: 0, character: 0 }, end: { line: 0, character: 13 } };
        (vscode.Range as any).mockImplementation(() => mockRange);
    });

    describe('formatDocument', () => {
        it('should format document with prettier and eslint when workspace folder exists', async () => {
            // Arrange
            const formattedByPrettier = 'const x = 1;\n';
            const formattedByESLint = 'const x = 1;\n';

            (vscode.workspace.getWorkspaceFolder as any).mockReturnValue({
                uri: { fsPath: '/test' },
            });
            (prettier.resolveConfig as any).mockResolvedValue({ semi: true });
            (prettier.format as any).mockResolvedValue(formattedByPrettier);
            
            const mockLintText = jest.fn<any>().mockResolvedValue([
                { output: formattedByESLint },
            ]);
            (ESLint as any).mockImplementation(() => ({
                lintText: mockLintText,
            }));
            (vscode.workspace.applyEdit as any).mockResolvedValue(true);

            // Act
            await formatDocument(mockDocument);

            // Assert
            expect(vscode.workspace.getWorkspaceFolder).toHaveBeenCalledWith(mockDocument.uri);
            expect(prettier.resolveConfig).toHaveBeenCalledWith('/test/file.js');
            expect(prettier.format).toHaveBeenCalledWith('const x = 1;', {
                semi: true,
                filepath: '/test/file.js',
            });
            expect(ESLint).toHaveBeenCalledWith({
                cwd: '/test',
                fix: true,
            });
            expect(mockLintText).toHaveBeenCalledWith(formattedByPrettier, {
                filePath: '/test/file.js',
            });
            expect(vscode.workspace.applyEdit).toHaveBeenCalled();
        });

        it('should use cached prettier config on second call', async () => {
            // Arrange
            const formattedByPrettier = 'const x = 1;\n';
            const formattedByESLint = 'const x = 1;\n';

            (vscode.workspace.getWorkspaceFolder as any).mockReturnValue({
                uri: { fsPath: '/test' },
            });
            (prettier.resolveConfig as any).mockResolvedValue({ semi: true });
            (prettier.format as any).mockResolvedValue(formattedByPrettier);
            
            const mockLintText = jest.fn<any>().mockResolvedValue([
                { output: formattedByESLint },
            ]);
            (ESLint as any).mockImplementation(() => ({
                lintText: mockLintText,
            }));
            (vscode.workspace.applyEdit as any).mockResolvedValue(true);

            // Act - format twice
            await formatDocument(mockDocument);
            await formatDocument(mockDocument);

            // Assert - prettier.resolveConfig should only be called once due to caching
            expect(prettier.resolveConfig).toHaveBeenCalledTimes(1);
            expect(prettier.format).toHaveBeenCalledTimes(2);
        });

        it('should use cached ESLint instance on second call', async () => {
            // Arrange
            const formattedByPrettier = 'const x = 1;\n';
            const formattedByESLint = 'const x = 1;\n';

            (vscode.workspace.getWorkspaceFolder as any).mockReturnValue({
                uri: { fsPath: '/test' },
            });
            (prettier.resolveConfig as any).mockResolvedValue({ semi: true });
            (prettier.format as any).mockResolvedValue(formattedByPrettier);
            
            const mockLintText = jest.fn<any>().mockResolvedValue([
                { output: formattedByESLint },
            ]);
            (ESLint as any).mockImplementation(() => ({
                lintText: mockLintText,
            }));
            (vscode.workspace.applyEdit as any).mockResolvedValue(true);

            // Act - format twice
            await formatDocument(mockDocument);
            await formatDocument(mockDocument);

            // Assert - ESLint constructor should only be called once due to caching
            expect(ESLint).toHaveBeenCalledTimes(1);
            expect(mockLintText).toHaveBeenCalledTimes(2);
        });

        it('should format document using file directory when no workspace folder', async () => {
            // Arrange
            const formattedByPrettier = 'const y = 2;\n';
            const formattedByESLint = 'const y = 2;\n';

            (vscode.workspace.getWorkspaceFolder as any).mockReturnValue(undefined);
            (prettier.resolveConfig as any).mockResolvedValue(null);
            (prettier.format as any).mockResolvedValue(formattedByPrettier);
            
            const mockLintText = jest.fn<any>().mockResolvedValue([
                { output: formattedByESLint },
            ]);
            (ESLint as any).mockImplementation(() => ({
                lintText: mockLintText,
            }));
            (vscode.workspace.applyEdit as any).mockResolvedValue(true);

            // Act
            await formatDocument(mockDocument);

            // Assert
            expect(vscode.workspace.getWorkspaceFolder).toHaveBeenCalledWith(mockDocument.uri);
            expect(ESLint).toHaveBeenCalledWith({
                cwd: '/test',
                fix: true,
            });
        });

        it('should handle prettier formatting error', async () => {
            // Arrange
            (vscode.workspace.getWorkspaceFolder as any).mockReturnValue({
                uri: { fsPath: '/test' },
            });
            (prettier.resolveConfig as any).mockResolvedValue({});
            (prettier.format as any).mockRejectedValue(new Error('Prettier error'));

            // Act & Assert
            await expect(formatDocument(mockDocument)).rejects.toThrow('Formatting failed: Error: Prettier error');
        });

        it('should return original text when eslint fails', async () => {
            // Arrange
            const formattedByPrettier = 'const z = 3;\n';

            (vscode.workspace.getWorkspaceFolder as any).mockReturnValue({
                uri: { fsPath: '/test' },
            });
            (prettier.resolveConfig as any).mockResolvedValue({});
            (prettier.format as any).mockResolvedValue(formattedByPrettier);
            
            const mockLintText = jest.fn<any>().mockRejectedValue(new Error('ESLint error'));
            (ESLint as any).mockImplementation(() => ({
                lintText: mockLintText,
            }));
            (vscode.workspace.applyEdit as any).mockResolvedValue(true);

            // Act
            await formatDocument(mockDocument);

            // Assert
            expect(mockWorkspaceEdit.replace).toHaveBeenCalledWith(
                mockDocument.uri,
                expect.anything(),
                formattedByPrettier
            );
        });

        it('should return original text when eslint returns no output', async () => {
            // Arrange
            const formattedByPrettier = 'const a = 4;\n';

            (vscode.workspace.getWorkspaceFolder as any).mockReturnValue({
                uri: { fsPath: '/test' },
            });
            (prettier.resolveConfig as any).mockResolvedValue({});
            (prettier.format as any).mockResolvedValue(formattedByPrettier);
            
            const mockLintText = jest.fn<any>().mockResolvedValue([
                { output: undefined },
            ]);
            (ESLint as any).mockImplementation(() => ({
                lintText: mockLintText,
            }));
            (vscode.workspace.applyEdit as any).mockResolvedValue(true);

            // Act
            await formatDocument(mockDocument);

            // Assert
            expect(mockWorkspaceEdit.replace).toHaveBeenCalledWith(
                mockDocument.uri,
                expect.anything(),
                formattedByPrettier
            );
        });

        it('should return original text when eslint returns empty results', async () => {
            // Arrange
            const formattedByPrettier = 'const b = 5;\n';

            (vscode.workspace.getWorkspaceFolder as any).mockReturnValue({
                uri: { fsPath: '/test' },
            });
            (prettier.resolveConfig as any).mockResolvedValue({});
            (prettier.format as any).mockResolvedValue(formattedByPrettier);
            
            const mockLintText = jest.fn<any>().mockResolvedValue([]);
            (ESLint as any).mockImplementation(() => ({
                lintText: mockLintText,
            }));
            (vscode.workspace.applyEdit as any).mockResolvedValue(true);

            // Act
            await formatDocument(mockDocument);

            // Assert
            expect(mockWorkspaceEdit.replace).toHaveBeenCalledWith(
                mockDocument.uri,
                expect.anything(),
                formattedByPrettier
            );
        });
    });

    describe('clearCaches', () => {
        it('should clear caches and force new config resolution', async () => {
            // Arrange
            const formattedByPrettier = 'const x = 1;\n';
            const formattedByESLint = 'const x = 1;\n';

            (vscode.workspace.getWorkspaceFolder as any).mockReturnValue({
                uri: { fsPath: '/test' },
            });
            (prettier.resolveConfig as any).mockResolvedValue({ semi: true });
            (prettier.format as any).mockResolvedValue(formattedByPrettier);
            
            const mockLintText = jest.fn<any>().mockResolvedValue([
                { output: formattedByESLint },
            ]);
            (ESLint as any).mockImplementation(() => ({
                lintText: mockLintText,
            }));
            (vscode.workspace.applyEdit as any).mockResolvedValue(true);

            // Act - format, clear cache, format again
            await formatDocument(mockDocument);
            clearCaches();
            await formatDocument(mockDocument);

            // Assert - prettier.resolveConfig and ESLint should be called twice
            expect(prettier.resolveConfig).toHaveBeenCalledTimes(2);
            expect(ESLint).toHaveBeenCalledTimes(2);
        });
    });
});
