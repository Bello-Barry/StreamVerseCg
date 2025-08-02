// approve-builds.js
const fs = require('fs');
const path = require('path');

const buildFile = path.join(process.cwd(), 'package.json');
const pkg = require(buildFile);

pkg.scripts = pkg.scripts || {};
pkg.scripts['approve-builds'] = 'echo "Skipping build script approval"';

fs.writeFileSync(buildFile, JSON.stringify(pkg, null, 2));