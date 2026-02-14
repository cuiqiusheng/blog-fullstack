const fs = require('fs');
const path = require('path');

const srcDir = path.resolve('src/graphql/schema');
const destDir = path.resolve('dist/graphql/schema');

fs.mkdirSync(destDir, { recursive: true });
fs.readdirSync(srcDir)
  .filter((f) => f.endsWith('.graphql'))
  .forEach((f) => fs.copyFileSync(path.join(srcDir, f), path.join(destDir, f)));
