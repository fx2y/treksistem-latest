# Commit Hooks with Husky and lint-staged

This project uses [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/okonet/lint-staged) to ensure code quality and consistency before commits are made.

## Setup

The commit hooks are automatically installed when you run `pnpm install` due to the `prepare` script in `package.json`.

## Pre-commit Hook

The pre-commit hook runs automatically when you attempt to commit changes. It:

1. **Lints TypeScript/TSX files** with ESLint and auto-fixes issues where possible
2. **Formats all staged files** with Prettier
3. **Blocks commits** if there are unfixable ESLint errors or warnings (configured with `--max-warnings 0`)

### Files processed:

- `*.ts, *.tsx`: ESLint + Prettier
- `*.js, *.jsx`: Prettier only
- `*.json, *.md, *.yaml, *.yml`: Prettier only

## Commit Message Hook

The commit-msg hook validates that commit messages follow the [Conventional Commits](https://conventionalcommits.org/) specification.

### Allowed scopes:

- `core` - Core functionality
- `worker` - Cloudflare Worker backend
- `fe-admin` - Mitra admin frontend
- `fe-driver` - Driver view frontend
- `fe-user` - User public frontend
- `db` - Database/schema changes
- `shared` - Shared packages/types
- `dx` - Developer experience
- `ci` - CI/CD changes
- `hooks` - Git hooks
- `docs` - Documentation
- `config` - Configuration changes

### Examples:

✅ `feat(worker): add order creation endpoint`
✅ `fix(fe-admin): resolve form validation issue`
✅ `docs: update API documentation`
✅ `ci: add deployment workflow`

❌ `updated stuff`
❌ `fix bugs`

## Testing the Setup

To test that the hooks are working:

```bash
# Create a file with linting issues
echo "const unused = 'test'; console.log('bad formatting')" > test-file.ts

# Stage and try to commit
git add test-file.ts
git commit -m "test commit"  # Should fail due to conventional commit format
git commit -m "test: verify hooks work"  # Should fail due to linting issues

# Fix the file
echo "console.log('good formatting');" > test-file.ts
git add test-file.ts
git commit -m "test: verify hooks work"  # Should pass

# Clean up
rm test-file.ts
```

## Configuration Files

- `.husky/pre-commit` - Pre-commit hook script
- `.husky/commit-msg` - Commit message validation hook
- `commitlint.config.js` - Commit message rules
- `package.json` - lint-staged configuration
- `.eslintrc.js` - Root ESLint configuration

## Troubleshooting

If hooks aren't running:

1. Ensure you've run `pnpm install` after pulling changes
2. Check that `.husky/` directory exists and hooks are executable
3. Try running `pnpm husky install` manually

If hooks are failing unexpectedly:

1. Run the lint/format commands manually: `pnpm lint` and `pnpm format`
2. Check ESLint and Prettier configurations
3. Ensure all dependencies are installed
