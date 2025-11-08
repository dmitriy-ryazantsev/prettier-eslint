# GitHub Copilot Instructions for Prettier ESLint Extension

## Project Overview

This is a Visual Studio Code extension that provides integrated code formatting using Prettier followed by ESLint auto-fixing. The extension formats code on save or via command, applying Prettier's formatting rules first and then ESLint's auto-fixable rules.

## Architecture

### Core Components

1. **Extension Entry Point** (`src/extension.ts`)
   - Activates the extension and registers commands
   - Handles format on save functionality
   - Manages VS Code event subscriptions

2. **Formatter Module** (`src/formatter.ts`)
   - Implements the two-step formatting process:
     1. Format with Prettier using project's `.prettierrc` config
     2. Apply ESLint auto-fixes using project's ESLint config
   - Handles errors gracefully, returning original text if either step fails

3. **Tests** (`tests/`)
   - Unit tests for extension activation and commands
   - Unit tests for formatter functionality
   - Uses Jest with ts-jest and VS Code mocks

## Development Guidelines

### Code Style

- Use TypeScript with strict type checking
- Follow existing naming conventions (camelCase for functions/variables)
- Use async/await for asynchronous operations
- Include comprehensive error handling with user-friendly messages

### Testing

- All new features must include unit tests
- Maintain 100% code coverage
- Tests should be placed in the `tests/` directory
- Use the existing mock patterns for VS Code, Prettier, and ESLint

### Adding New Features

1. **New Commands**
   - Register commands in `src/extension.ts` activate function
   - Add command definitions to `package.json` contributes section
   - Include error handling and user feedback

2. **Configuration Options**
   - Add settings to `package.json` configuration section
   - Document defaults and descriptions clearly
   - Access via `vscode.workspace.getConfiguration('prettier-eslint')`

3. **Language Support**
   - Add language IDs to activationEvents in `package.json`
   - Update supported languages list in `src/extension.ts`

### Workflow

- Run `npm test` to execute tests
- Run `npm run lint` to check code style
- Run `npm run compile` to build for development
- Run `npm run package` to create production build
- Tests run automatically on all PRs via GitHub Actions

### Important Notes

- The extension uses project-local Prettier and ESLint configurations
- Format on save is opt-in (disabled by default)
- Error handling should never interrupt user workflow
- All formatter errors are logged to console for debugging
- Build artifacts (`out/`, `dist/`, `*.vsix`) are gitignored

### Dependencies

- **Runtime**: eslint, prettier
- **Development**: TypeScript, webpack, jest, ts-jest
- Keep dependencies minimal and only add when necessary
- Avoid adding unnecessary transitive dependencies

## Common Tasks

### Debugging
- Use VS Code's Extension Development Host (F5)
- Check Developer Tools Console for error logs
- Review test output for detailed error messages

### Package and Publish
- Build uses webpack to bundle the extension
- Publishing requires Azure DevOps Personal Access Token (VSCE_PAT)
- Version bumping is handled in publish workflow

## Related Documentation

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Prettier Documentation](https://prettier.io/docs/en/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
