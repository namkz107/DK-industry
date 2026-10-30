const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 22) {
  console.error(`Node.js 22 or newer is required; current runtime is ${process.version}`);
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const npmCli = process.env.npm_execpath;
const npmCommand = npmCli ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
const npmPrefix = npmCli ? [npmCli] : [];
const npmNeedsShell = !npmCli && process.platform === 'win32';
const temporaryRoot = path.join(os.tmpdir(), `dk-industry-prepush-${process.pid}`);
const gateEnv = {
  ...process.env,
  CI: '1',
  FRONTEND_DIST_DIR: path.join(temporaryRoot, 'dist'),
  FRONTEND_COVERAGE_DIR: path.join(temporaryRoot, 'coverage'),
  PLAYWRIGHT_OUTPUT_DIR: path.join(temporaryRoot, 'test-results'),
  PLAYWRIGHT_HTML_REPORT: path.join(temporaryRoot, 'playwright-report'),
};
const steps = [
  ['Validate workflow/action pins', ['run', 'validate:workflows']],
  ['Backend coverage and database integrations', ['run', 'test:backend:ci']],
  ['Frontend lint', ['run', 'lint', '--prefix', 'frontend']],
  ['Frontend coverage', ['run', 'test:coverage', '--prefix', 'frontend']],
  ['Architecture rules', ['run', 'check:architecture']],
  ['Production/preflight tests', ['run', 'test:preflight']],
  ['Backup security tests', ['run', 'test:backup-security']],
  ['Deployment security tests', ['run', 'test:deployment-security']],
  ['Frontend production build', ['run', 'build', '--prefix', 'frontend']],
  ['Client bundle secret scan', ['run', 'scan:client-bundle']],
  ['Browser smoke tests', ['run', 'test:e2e', '--prefix', 'frontend']],
  ['Production dependency audit', ['run', 'audit:prod']],
];

for (const [label, args] of steps) {
  console.log(`\n=== ${label} ===`);
  const result = spawnSync(npmCommand, [...npmPrefix, ...args], {
    cwd: root,
    stdio: 'inherit',
    env: gateEnv,
    shell: npmNeedsShell,
  });
  if (result.status !== 0) {
    if (result.error) console.error(result.error.message);
    console.error(`\nPre-push gate stopped at: ${label}`);
    process.exit(result.status ?? 1);
  }
}
console.log('\nPre-push gate passed. Push is allowed.');
