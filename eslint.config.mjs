import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: ['out/', 'dist/', '**/*.d.ts', 'node_modules/', 'coverage/', 'tests/__mocks__/'],
    },
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            
            // Curly braces for all control statements
            'curly': ['error', 'all'],
            
            // No nested ternary operators and no unneeded ternary
            'no-nested-ternary': 'error',
            'no-unneeded-ternary': 'error',
            
            // Destructuring and object formatting rules
            'object-curly-newline': ['error', {
                'ObjectExpression': { 'multiline': true, 'minProperties': 6 },
                'ObjectPattern': { 'multiline': true, 'minProperties': 6 },
                'ImportDeclaration': { 'multiline': true, 'minProperties': 6 },
                'ExportDeclaration': { 'multiline': true, 'minProperties': 6 }
            }],
            
            // Padding lines between statements
            'padding-line-between-statements': [
                'error',
                // Require blank line after imports
                { 'blankLine': 'always', 'prev': 'import', 'next': '*' },
                { 'blankLine': 'any', 'prev': 'import', 'next': 'import' },
                
                // Require blank line before return statements
                { 'blankLine': 'always', 'prev': '*', 'next': 'return' },
                
                // Require blank lines around if/for/while/do/switch statements
                { 'blankLine': 'always', 'prev': '*', 'next': ['if', 'for', 'while', 'do', 'switch'] },
                { 'blankLine': 'always', 'prev': ['if', 'for', 'while', 'do', 'switch'], 'next': '*' },
                
                // Allow consecutive if/for/while/do/switch statements without blank lines between them
                { 'blankLine': 'any', 'prev': ['if', 'for', 'while', 'do', 'switch'], 'next': ['if', 'for', 'while', 'do', 'switch'] }
            ]
        },
    }
);
