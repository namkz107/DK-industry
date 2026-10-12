process.env.NODE_ENV = 'test';
const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');

test('liveness stays available while readiness reports database state', async () => {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
  try {
    const liveResponse = await fetch(`${baseUrl}/live`);
    const live = await liveResponse.json();
    assert.equal(liveResponse.status, 200);
    assert.equal(live.status, 'alive');
    assert.match(live.service, /DK Industry/);

    const readyResponse = await fetch(`${baseUrl}/ready`);
    const ready = await readyResponse.json();
    assert.equal(readyResponse.status, 503);
    assert.equal(ready.database, 'unavailable');
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
