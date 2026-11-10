import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // Code copied from the mobile app was linted with @react-native/eslint-config, which
    // is looser than this setup. Keep the copies byte-identical to mobile instead of
    // editing them to satisfy new rules; fix the warnings below when the owning page is
    // ported (phases W4 - W11).
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: {
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true, // `const { review: _r, ...summary } = result` omits a key
          caughtErrors: 'none', // `catch (e) {}` is the mobile style
        },
      ],
      'react-hooks/purity': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['src/tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.vitest, jest: 'readonly' },
    },
  },
]);
