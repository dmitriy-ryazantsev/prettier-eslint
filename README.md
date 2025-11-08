# Prettier ESLint

![Code Coverage](https://img.shields.io/badge/coverage-73.45%25-yellow)

A Visual Studio Code extension that formats your code using Prettier and then applies ESLint fixes.

## Features

- **Dual Formatting**: Combines Prettier's opinionated code formatting with ESLint's code quality fixes
- **Format on Save**: Optionally format your files automatically when saving
- **Multi-language Support**: Works with JavaScript, TypeScript, JSX, TSX, JSON, and JSONC files
- **Workspace Configuration**: Respects your project's Prettier and ESLint configurations

## Installation

1. Open Visual Studio Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "Prettier ESLint"
4. Click Install

## Usage

### Format Document

Use the command palette (Ctrl+Shift+P / Cmd+Shift+P) and search for:

```
Format Document with Prettier-ESLint
```

Or use the keyboard shortcut for formatting the current document.

### Format on Save

Enable format on save in your settings:

```json
{
  "prettier-eslint.formatOnSave": true
}
```

## Configuration

This extension contributes the following settings:

- `prettier-eslint.enable`: Enable/disable the Prettier-ESLint formatter (default: `true`)
- `prettier-eslint.formatOnSave`: Format files automatically on save (default: `false`)

## Requirements

- Your project should have `.prettierrc` and `.eslintrc` configuration files
- Prettier and ESLint will use your project's configuration files

## How It Works

1. **Prettier** formats your code according to your `.prettierrc` configuration
2. **ESLint** applies auto-fixable rules according to your `.eslintrc` configuration
3. The result is code that is both well-formatted and follows your linting rules

## Known Issues

- The extension requires both Prettier and ESLint configurations to be present in your project
- Some ESLint rules may conflict with Prettier formatting

## Release Notes

### 1.0.0

Initial release of Prettier ESLint extension

- Format document command
- Format on save support
- Multi-language support

## License

MIT