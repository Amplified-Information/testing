// import js from '@eslint/js'
// import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  // {
  //   files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
  //   plugins: { js, '@typescript-eslint': tseslint.plugin },
  //   extends: ['js/recommended'],
  //   languageOptions: { globals: globals.browser }
  // },
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    extends: [tseslint.configs.recommended],
    rules: {
      'semi': ['error', 'never'], 
      'quotes': ['error', 'single'],
      'comma-dangle': ['error', 'never'],
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
])