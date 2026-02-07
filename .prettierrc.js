module.exports = {
  // Line length
  printWidth: 100,

  // Indentation
  tabWidth: 2,
  useTabs: false,

  // Quotes
  singleQuote: true,

  // Semicolons
  semi: true,

  // Trailing commas
  trailingComma: 'all',

  // Spacing
  bracketSpacing: true,

  // Arrow functions
  arrowParens: 'avoid',

  // End of line
  endOfLine: 'lf', // Use LF for cross-platform compatibility

  // File-specific overrides (optional)
  overrides: [
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
      },
    },
  ],
};
