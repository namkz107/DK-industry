const path = require('path');
const { spawnSync } = require('child_process');

require(path.resolve(__dirname, '../backend/node_modules/dotenv')).config({ path: path.resolve(__dirname, '../backend/.env') });

const testUri = String(process.env.TEST_MONGODB_URI || '').trim();
if (!testUri) {
  console.error('TEST_MONGODB_URI is required for the pre-push integration gate. Use a dedicated database ending in _test or -test.');
  process.exit(1);
}
let databaseName;
try { databaseName = new URL(testUri).pathname.replace(/^\//, '').split('/')[0]; }
catch { console.error('TEST_MONGODB_URI is invalid'); process.exit(1); }
if (!/(?:^|[_-])test$/i.test(databaseName)) {
  console.error('TEST_MONGODB_URI must use a dedicated database name ending in _test or -test.');
  process.exit(1);
}

const env = { ...process.env, NODE_ENV: 'test', MONGODB_URI: testUri, TEST_MONGODB_URI: testUri };
for (const name of ['ADMIN', 'AUTH', 'CHAT', 'CUSTOMER', 'LEAD', 'STAFF', 'SUPPORT']) env[`RUN_${name}_INTEGRATION`] = '1';
const npmCli = process.env.npm_execpath;
const npmCommand = npmCli ? process.execPath : (process.platform === 'win32' ? 'npm.cmd' : 'npm');
const args = npmCli
  ? [npmCli, 'run', 'test:coverage', '--prefix', 'backend']
  : ['run', 'test:coverage', '--prefix', 'backend'];
const result = spawnSync(npmCommand, args, { cwd: path.resolve(__dirname, '..'), env, stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
