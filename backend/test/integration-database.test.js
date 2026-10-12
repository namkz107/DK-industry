const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const helper = path.join(__dirname, '..', 'test-utils', 'integrationDatabase.js');
const run = values => {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^RUN_.*_INTEGRATION$/.test(key)) delete env[key];
  Object.assign(env, values);
  return spawnSync(process.execPath, ['-e', `require(${JSON.stringify(helper)})`], { env, encoding: 'utf8' });
};

test('database integration tests refuse the normal application database', () => {
  const result = run({ RUN_AUTH_INTEGRATION: '1', MONGODB_URI: 'mongodb://127.0.0.1:27017/dk_industry' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /TEST_MONGODB_URI/);
});

test('database integration tests accept only an explicit test database', () => {
  const result = run({
    RUN_AUTH_INTEGRATION: '1',
    MONGODB_URI: 'mongodb://127.0.0.1:27017/dk_industry',
    TEST_MONGODB_URI: 'mongodb://127.0.0.1:27017/dk_industry_test'
  });
  assert.equal(result.status, 0, result.stderr);
});
