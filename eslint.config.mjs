import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

/** ESLint for Node/TS packages (api, worker, shared). Web uses `next lint` in its own script. */
export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/node_modules/**',
      'api/prisma/**',
    ],
  },
  {
    files: ['api/src/**/*.ts', 'worker/src/**/*.ts', 'packages/shared/src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  }
);
