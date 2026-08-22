import { defineConfig } from 'eslint/config';
import tseslint from '@electron-toolkit/eslint-config-ts';
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import maxCommentLines from './eslint-rules/max-comment-lines.mjs';
import noPropComments from './eslint-rules/no-prop-comments.mjs';

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out', 'helpers/**'] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh,
      nex: { rules: { 'max-comment-lines': maxCommentLines, 'no-prop-comments': noPropComments } }
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules,
      'react/prop-types': 'off',
      'nex/max-comment-lines': 'error',
      'nex/no-prop-comments': 'error'
    }
  },
  {
    // shadcn/ui primitives export their cva variant maps alongside the component.
    files: ['src/web/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off'
    }
  },
  {
    files: ['eslint-rules/**/*.mjs'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off'
    }
  },
  eslintConfigPrettier
);
