const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

if (process.env.CI) process.exit(0);
const root = path.resolve(__dirname, '..');
const hook = path.join(root, '.githooks', 'pre-push');
if (process.platform !== 'win32' && fs.existsSync(hook)) fs.chmodSync(hook, 0o755);
const result = spawnSync('git', ['config', 'core.hooksPath', '.githooks'], { cwd: root, stdio: 'inherit' });
if (result.status !== 0) process.exit(result.status ?? 1);
console.log('Installed repository hooks from .githooks');
