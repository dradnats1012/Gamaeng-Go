import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginNext from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '.next/**',
      'out/**',
      '**/*.min.js',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname ?? process.cwd(),
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-floating-promises': 'off',

      // 안 쓰는 변수 완전 무시 (나중에 설정 풀 것)
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    name: 'next/core-web-vitals',
    plugins: {
      '@next/next': pluginNext,
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      // 필요 시 커스터마이징:
      // 'react/react-in-jsx-scope': 'off',
    },
  },
]
