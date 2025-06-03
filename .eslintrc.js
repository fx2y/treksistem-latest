module.exports = {
  root: true,
  extends: ['@treksistem/eslint-config-custom'],
  env: {
    node: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    '.turbo',
    '!.eslintrc.js',
    '!commitlint.config.js',
    '.wrangler',
    '.github',
  ],
};
