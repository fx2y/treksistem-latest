module.exports = {
  extends: ['@commitlint/config-conventional'],
  // Add custom rules for Treksistem project scopes
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'core',
        'worker',
        'fe-admin',
        'fe-driver',
        'fe-user',
        'db',
        'shared',
        'dx',
        'ci',
        'hooks',
        'docs',
        'config',
      ],
    ],
  },
};
