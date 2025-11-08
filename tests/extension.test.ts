import { jest } from '@jest/globals';
import * as vscode from 'vscode';
import { activate, deactivate } from '../src/extension';
import * as formatter from '../src/formatter';

jest.mock('../src/formatter');
jest.mock('../src/batchFormatter');

describe('extension', () => {
    let mockContext: any;

    beforeEach(() => {
        jest.clearAllMocks();

        mockContext = {
            subscriptions: [],
        };
    });

    describe('activate', () => {
        it('should register format command', () => {
            // Arrange
            const mockDisposable = { dispose: jest.fn() };
            (vscode.commands.registerCommand as any).mockReturnValue(mockDisposable);
            (vscode.workspace.onWillSaveTextDocument as any).mockReturnValue(mockDisposable);

            // Act
            activate(mockContext);

            // Assert
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'prettier-eslint.format',
                expect.any(Function)
            );
            expect(mockContext.subscriptions).toContain(mockDisposable);
        });

        it('should register format workspace command', () => {
            // Arrange
            const mockDisposable = { dispose: jest.fn() };
            (vscode.commands.registerCommand as any).mockReturnValue(mockDisposable);
            (vscode.workspace.onWillSaveTextDocument as any).mockReturnValue(mockDisposable);

            // Act
            activate(mockContext);

            // Assert
            expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
                'prettier-eslint.formatWorkspace',
                expect.any(Function)
            );
        });

        it('should register format on save handler', () => {
            // Arrange
            const mockDisposable = { dispose: jest.fn() };
            (vscode.commands.registerCommand as any).mockReturnValue(mockDisposable);
            (vscode.workspace.onWillSaveTextDocument as any).mockReturnValue(mockDisposable);

            // Act
            activate(mockContext);

            // Assert
            expect(vscode.workspace.onWillSaveTextDocument).toHaveBeenCalledWith(
                expect.any(Function)
            );
            expect(mockContext.subscriptions).toHaveLength(3);
        });

        describe('format command', () => {
            it('should show error when no active editor', async () => {
                // Arrange
                let formatCommandHandler: (...args: any[]) => any = () => {};
                (vscode.commands.registerCommand as any).mockImplementation(
                    (command: string, handler: (...args: any[]) => any) => {
                        if (command === 'prettier-eslint.format') {
                            formatCommandHandler = handler;
                        }
                        return { dispose: jest.fn() };
                    }
                );
                (vscode.workspace.onWillSaveTextDocument as any).mockReturnValue({ dispose: jest.fn() });
                (vscode.window as any).activeTextEditor = undefined;

                activate(mockContext);

                // Act
                await formatCommandHandler();

                // Assert
                expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No active editor found');
                expect(formatter.formatDocument).not.toHaveBeenCalled();
            });

            it('should format document and show success message', async () => {
                // Arrange
                let formatCommandHandler: (...args: any[]) => any = () => {};
                (vscode.commands.registerCommand as any).mockImplementation(
                    (command: string, handler: (...args: any[]) => any) => {
                        if (command === 'prettier-eslint.format') {
                            formatCommandHandler = handler;
                        }
                        return { dispose: jest.fn() };
                    }
                );
                (vscode.workspace.onWillSaveTextDocument as any).mockReturnValue({ dispose: jest.fn() });

                const mockEditor = {
                    document: { uri: 'file:///test.js' },
                };
                (vscode.window as any).activeTextEditor = mockEditor;
                (formatter.formatDocument as any).mockResolvedValue(undefined);

                activate(mockContext);

                // Act
                await formatCommandHandler();

                // Assert
                expect(formatter.formatDocument).toHaveBeenCalledWith(mockEditor.document);
                expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
                    'Document formatted successfully'
                );
            });

            it('should show error message when formatting fails', async () => {
                // Arrange
                let formatCommandHandler: (...args: any[]) => any = () => {};
                (vscode.commands.registerCommand as any).mockImplementation(
                    (command: string, handler: (...args: any[]) => any) => {
                        if (command === 'prettier-eslint.format') {
                            formatCommandHandler = handler;
                        }
                        return { dispose: jest.fn() };
                    }
                );
                (vscode.workspace.onWillSaveTextDocument as any).mockReturnValue({ dispose: jest.fn() });

                const mockEditor = {
                    document: { uri: 'file:///test.js' },
                };
                (vscode.window as any).activeTextEditor = mockEditor;
                (formatter.formatDocument as any).mockRejectedValue(new Error('Test error'));

                activate(mockContext);

                // Act
                await formatCommandHandler();

                // Assert
                expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
                    'Formatting failed: Error: Test error'
                );
            });
        });

        describe('format on save', () => {
            it('should not format when extension is disabled', async () => {
                // Arrange
                let saveHandler: (...args: any[]) => any = () => {};
                (vscode.commands.registerCommand as any).mockReturnValue({ dispose: jest.fn() });
                (vscode.workspace.onWillSaveTextDocument as any).mockImplementation(
                    (handler: (...args: any[]) => any) => {
                        saveHandler = handler;
                        return { dispose: jest.fn() };
                    }
                );

                const mockConfig = {
                    get: jest.fn((key: string, defaultValue?: any) => {
                        if (key === 'enable') return false;
                        if (key === 'formatOnSave') return true;
                        return defaultValue;
                    }),
                };
                (vscode.workspace.getConfiguration as any).mockReturnValue(mockConfig);

                activate(mockContext);

                const mockEvent = {
                    document: { languageId: 'javascript' },
                    waitUntil: jest.fn(),
                };

                // Act
                await saveHandler(mockEvent);

                // Assert
                expect(mockEvent.waitUntil).not.toHaveBeenCalled();
            });

            it('should not format when formatOnSave is disabled', async () => {
                // Arrange
                let saveHandler: (...args: any[]) => any = () => {};
                (vscode.commands.registerCommand as any).mockReturnValue({ dispose: jest.fn() });
                (vscode.workspace.onWillSaveTextDocument as any).mockImplementation(
                    (handler: (...args: any[]) => any) => {
                        saveHandler = handler;
                        return { dispose: jest.fn() };
                    }
                );

                const mockConfig = {
                    get: jest.fn((key: string, defaultValue?: any) => {
                        if (key === 'enable') return true;
                        if (key === 'formatOnSave') return false;
                        return defaultValue;
                    }),
                };
                (vscode.workspace.getConfiguration as any).mockReturnValue(mockConfig);

                activate(mockContext);

                const mockEvent = {
                    document: { languageId: 'javascript' },
                    waitUntil: jest.fn(),
                };

                // Act
                await saveHandler(mockEvent);

                // Assert
                expect(mockEvent.waitUntil).not.toHaveBeenCalled();
            });

            it('should format supported language when enabled and formatOnSave is true', async () => {
                // Arrange
                let saveHandler: (...args: any[]) => any = () => {};
                (vscode.commands.registerCommand as any).mockReturnValue({ dispose: jest.fn() });
                (vscode.workspace.onWillSaveTextDocument as any).mockImplementation(
                    (handler: (...args: any[]) => any) => {
                        saveHandler = handler;
                        return { dispose: jest.fn() };
                    }
                );

                const mockConfig = {
                    get: jest.fn((key: string, defaultValue?: any) => {
                        if (key === 'enable') return true;
                        if (key === 'formatOnSave') return true;
                        return defaultValue;
                    }),
                };
                (vscode.workspace.getConfiguration as any).mockReturnValue(mockConfig);
                (formatter.formatDocument as any).mockResolvedValue(undefined);

                activate(mockContext);

                const mockDocument = { languageId: 'javascript', uri: 'file:///test.js' };
                const mockEvent = {
                    document: mockDocument,
                    waitUntil: jest.fn(),
                };

                // Act
                await saveHandler(mockEvent);

                // Assert
                expect(mockEvent.waitUntil).toHaveBeenCalled();
            });

            it('should format typescript files', async () => {
                // Arrange
                let saveHandler: (...args: any[]) => any = () => {};
                (vscode.commands.registerCommand as any).mockReturnValue({ dispose: jest.fn() });
                (vscode.workspace.onWillSaveTextDocument as any).mockImplementation(
                    (handler: (...args: any[]) => any) => {
                        saveHandler = handler;
                        return { dispose: jest.fn() };
                    }
                );

                const mockConfig = {
                    get: jest.fn((key: string, defaultValue?: any) => {
                        if (key === 'enable') return true;
                        if (key === 'formatOnSave') return true;
                        return defaultValue;
                    }),
                };
                (vscode.workspace.getConfiguration as any).mockReturnValue(mockConfig);
                (formatter.formatDocument as any).mockResolvedValue(undefined);

                activate(mockContext);

                const mockDocument = { languageId: 'typescript', uri: 'file:///test.ts' };
                const mockEvent = {
                    document: mockDocument,
                    waitUntil: jest.fn(),
                };

                // Act
                await saveHandler(mockEvent);

                // Assert
                expect(mockEvent.waitUntil).toHaveBeenCalled();
            });

            it('should format javascriptreact files', async () => {
                // Arrange
                let saveHandler: (...args: any[]) => any = () => {};
                (vscode.commands.registerCommand as any).mockReturnValue({ dispose: jest.fn() });
                (vscode.workspace.onWillSaveTextDocument as any).mockImplementation(
                    (handler: (...args: any[]) => any) => {
                        saveHandler = handler;
                        return { dispose: jest.fn() };
                    }
                );

                const mockConfig = {
                    get: jest.fn((key: string, defaultValue?: any) => {
                        if (key === 'enable') return true;
                        if (key === 'formatOnSave') return true;
                        return defaultValue;
                    }),
                };
                (vscode.workspace.getConfiguration as any).mockReturnValue(mockConfig);
                (formatter.formatDocument as any).mockResolvedValue(undefined);

                activate(mockContext);

                const mockDocument = { languageId: 'javascriptreact', uri: 'file:///test.jsx' };
                const mockEvent = {
                    document: mockDocument,
                    waitUntil: jest.fn(),
                };

                // Act
                await saveHandler(mockEvent);

                // Assert
                expect(mockEvent.waitUntil).toHaveBeenCalled();
            });

            it('should format typescriptreact files', async () => {
                // Arrange
                let saveHandler: (...args: any[]) => any = () => {};
                (vscode.commands.registerCommand as any).mockReturnValue({ dispose: jest.fn() });
                (vscode.workspace.onWillSaveTextDocument as any).mockImplementation(
                    (handler: (...args: any[]) => any) => {
                        saveHandler = handler;
                        return { dispose: jest.fn() };
                    }
                );

                const mockConfig = {
                    get: jest.fn((key: string, defaultValue?: any) => {
                        if (key === 'enable') return true;
                        if (key === 'formatOnSave') return true;
                        return defaultValue;
                    }),
                };
                (vscode.workspace.getConfiguration as any).mockReturnValue(mockConfig);
                (formatter.formatDocument as any).mockResolvedValue(undefined);

                activate(mockContext);

                const mockDocument = { languageId: 'typescriptreact', uri: 'file:///test.tsx' };
                const mockEvent = {
                    document: mockDocument,
                    waitUntil: jest.fn(),
                };

                // Act
                await saveHandler(mockEvent);

                // Assert
                expect(mockEvent.waitUntil).toHaveBeenCalled();
            });

            it('should format json files', async () => {
                // Arrange
                let saveHandler: (...args: any[]) => any = () => {};
                (vscode.commands.registerCommand as any).mockReturnValue({ dispose: jest.fn() });
                (vscode.workspace.onWillSaveTextDocument as any).mockImplementation(
                    (handler: (...args: any[]) => any) => {
                        saveHandler = handler;
                        return { dispose: jest.fn() };
                    }
                );

                const mockConfig = {
                    get: jest.fn((key: string, defaultValue?: any) => {
                        if (key === 'enable') return true;
                        if (key === 'formatOnSave') return true;
                        return defaultValue;
                    }),
                };
                (vscode.workspace.getConfiguration as any).mockReturnValue(mockConfig);
                (formatter.formatDocument as any).mockResolvedValue(undefined);

                activate(mockContext);

                const mockDocument = { languageId: 'json', uri: 'file:///test.json' };
                const mockEvent = {
                    document: mockDocument,
                    waitUntil: jest.fn(),
                };

                // Act
                await saveHandler(mockEvent);

                // Assert
                expect(mockEvent.waitUntil).toHaveBeenCalled();
            });

            it('should format jsonc files', async () => {
                // Arrange
                let saveHandler: (...args: any[]) => any = () => {};
                (vscode.commands.registerCommand as any).mockReturnValue({ dispose: jest.fn() });
                (vscode.workspace.onWillSaveTextDocument as any).mockImplementation(
                    (handler: (...args: any[]) => any) => {
                        saveHandler = handler;
                        return { dispose: jest.fn() };
                    }
                );

                const mockConfig = {
                    get: jest.fn((key: string, defaultValue?: any) => {
                        if (key === 'enable') return true;
                        if (key === 'formatOnSave') return true;
                        return defaultValue;
                    }),
                };
                (vscode.workspace.getConfiguration as any).mockReturnValue(mockConfig);
                (formatter.formatDocument as any).mockResolvedValue(undefined);

                activate(mockContext);

                const mockDocument = { languageId: 'jsonc', uri: 'file:///tsconfig.json' };
                const mockEvent = {
                    document: mockDocument,
                    waitUntil: jest.fn(),
                };

                // Act
                await saveHandler(mockEvent);

                // Assert
                expect(mockEvent.waitUntil).toHaveBeenCalled();
            });

            it('should not format unsupported language', async () => {
                // Arrange
                let saveHandler: (...args: any[]) => any = () => {};
                (vscode.commands.registerCommand as any).mockReturnValue({ dispose: jest.fn() });
                (vscode.workspace.onWillSaveTextDocument as any).mockImplementation(
                    (handler: (...args: any[]) => any) => {
                        saveHandler = handler;
                        return { dispose: jest.fn() };
                    }
                );

                const mockConfig = {
                    get: jest.fn((key: string, defaultValue?: any) => {
                        if (key === 'enable') return true;
                        if (key === 'formatOnSave') return true;
                        return defaultValue;
                    }),
                };
                (vscode.workspace.getConfiguration as any).mockReturnValue(mockConfig);

                activate(mockContext);

                const mockDocument = { languageId: 'python', uri: 'file:///test.py' };
                const mockEvent = {
                    document: mockDocument,
                    waitUntil: jest.fn(),
                };

                // Act
                await saveHandler(mockEvent);

                // Assert
                expect(mockEvent.waitUntil).not.toHaveBeenCalled();
            });

            it('should catch and log formatting errors on save', async () => {
                // Arrange
                const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
                let saveHandler: (...args: any[]) => any = () => {};
                (vscode.commands.registerCommand as any).mockReturnValue({ dispose: jest.fn() });
                (vscode.workspace.onWillSaveTextDocument as any).mockImplementation(
                    (handler: (...args: any[]) => any) => {
                        saveHandler = handler;
                        return { dispose: jest.fn() };
                    }
                );

                const mockConfig = {
                    get: jest.fn((key: string, defaultValue?: any) => {
                        if (key === 'enable') return true;
                        if (key === 'formatOnSave') return true;
                        return defaultValue;
                    }),
                };
                (vscode.workspace.getConfiguration as any).mockReturnValue(mockConfig);
                (formatter.formatDocument as any).mockRejectedValue(new Error('Format error'));

                activate(mockContext);

                const mockDocument = { languageId: 'javascript', uri: 'file:///test.js' };
                let capturedPromise: Promise<any> | null = null;
                const mockEvent = {
                    document: mockDocument,
                    waitUntil: jest.fn((promise: Promise<any>) => {
                        capturedPromise = promise;
                    }),
                };

                // Act
                await saveHandler(mockEvent);
                
                // Wait for the promise to resolve
                if (capturedPromise) {
                    await capturedPromise;
                }

                // Assert
                expect(consoleErrorSpy).toHaveBeenCalledWith('Format on save failed:', expect.any(Error));
                
                consoleErrorSpy.mockRestore();
            });
        });
    });

    describe('deactivate', () => {
        it('should exist and be callable', () => {
            // Act & Assert
            expect(() => deactivate()).not.toThrow();
        });
    });
});
