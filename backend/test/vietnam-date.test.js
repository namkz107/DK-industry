const test = require('node:test');
const assert = require('node:assert/strict');
const { deliveryDayReached, vietnamDateKey } = require('../src/lib/vietnamDate');

test('delivery day follows the Vietnam calendar, including midnight', () => {
  assert.equal(vietnamDateKey('2026-12-12'), '2026-12-12');
  assert.equal(vietnamDateKey('2026-12-11T16:59:00.000Z'), '2026-12-11');
  assert.equal(vietnamDateKey('2026-12-11T17:00:00.000Z'), '2026-12-12');
  assert.equal(deliveryDayReached('2026-12-12', new Date('2026-12-11T16:59:00.000Z')), false);
  assert.equal(deliveryDayReached('2026-12-12', new Date('2026-12-11T17:00:00.000Z')), true);
  assert.equal(deliveryDayReached(undefined, new Date('2026-12-12T00:00:00.000Z')), false);
});
