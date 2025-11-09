export const commands = {
    registerCommand: jest.fn(),
};

export const window = {
    activeTextEditor: undefined,
    showErrorMessage: jest.fn(),
    showInformationMessage: jest.fn(),
    showWarningMessage: jest.fn(),
    withProgress: jest.fn(),
};

export const workspace = {
    getConfiguration: jest.fn(),
    onWillSaveTextDocument: jest.fn(),
    getWorkspaceFolder: jest.fn(),
    applyEdit: jest.fn(),
    workspaceFolders: undefined,
    findFiles: jest.fn(),
    textDocuments: [],
    openTextDocument: jest.fn(),
    createFileSystemWatcher: jest.fn(),
};

export const WorkspaceEdit = jest.fn().mockImplementation(() => ({
    replace: jest.fn(),
}));

export const Range = jest.fn().mockImplementation((start: any, end: any) => ({
    start,
    end,
}));

export const Uri = {
    file: jest.fn((path: string) => ({ fsPath: path })),
};

export const RelativePattern = jest.fn().mockImplementation((folder: any, pattern: string) => ({
    folder,
    pattern,
}));

export const ProgressLocation = {
    Notification: 15,
    Window: 10,
    SourceControl: 1,
};
