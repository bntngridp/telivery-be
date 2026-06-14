import tsParser from '@typescript-eslint/parser';

export default [
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'documents/**',
            'scripts/**',
            'coverage/**',
            '*.config.ts',
            'tests/**',
            'eslint.config.mjs',
            '.kilo/**',
            '.git/**',
        ],
    },
    {
        files: ['src/**/*.ts', 'tests/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
            },
            globals: {
                process: 'readonly',
                console: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': 'off',
            'no-undef': 'off',
            'no-empty': 'off',
            'no-prototype-builtins': 'off',
            'prefer-const': 'warn',
            'no-console': 'off',
            'no-useless-escape': 'off',
        },
    },
];
