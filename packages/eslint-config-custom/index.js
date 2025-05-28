module.exports = {
  extends: [
    'eslint:recommended',
  ],
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: ['node_modules', 'dist', 'build', '.turbo', '*.js', '!.eslintrc.js'],
  rules: {
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    'prefer-const': 'warn',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      rules: {
        'no-undef': 'off', // TypeScript handles this
      },
    },
  ],
}; 