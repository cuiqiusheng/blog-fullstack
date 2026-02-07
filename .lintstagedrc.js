module.exports = {
  // TypeScript and JavaScript files
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],
  // JSON files (excluding lock files)
  '*.json': [
    filenames => {
      // Exclude lock files to avoid memory issues
      const filtered = filenames.filter(
        f =>
          !f.includes('pnpm-lock.yaml') &&
          !f.includes('package-lock.json') &&
          !f.includes('yarn.lock'),
      );
      return filtered.length > 0 ? `prettier --write ${filtered.join(' ')}` : 'true';
    },
  ],
  // Other files
  '*.{yml,yaml,md,mdx,css,scss,html}': ['prettier --write'],
};
