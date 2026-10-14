const test = require('node:test');
const assert = require('node:assert/strict');
const { reverseLocation, searchLocations } = require('../src/services/locationService');

const originalFetch = global.fetch;

test.afterEach(() => {
  global.fetch = originalFetch;
});

function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

test('Nominatim search is restricted to Vietnam and maps address details', async () => {
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return response([{ place_id: 123, display_name: '12 Đường Mẫu, Hồng Vân, Thường Tín, Hà Nội, Việt Nam', lat: '20.895803', lon: '105.862915', address: { house_number: '12', road: 'Đường Mẫu', village: 'Hồng Vân', county: 'Thường Tín', state: 'Hà Nội' } }]);
  };

  const items = await searchLocations('Đường Mẫu test unique');

  const url = new URL(request.url);
  assert.equal(url.origin, 'https://nominatim.openstreetmap.org');
  assert.equal(url.pathname, '/search');
  assert.equal(url.searchParams.get('countrycodes'), 'vn');
  assert.equal(url.searchParams.get('addressdetails'), '1');
  assert.match(request.options.headers['User-Agent'], /^DKIndustry\/1\.0/);
  assert.equal(items[0].placeId, '123');
  assert.equal(items[0].addressLine, '12 Đường Mẫu');
  assert.equal(items[0].ward, 'Hồng Vân');
  assert.equal(items[0].district, 'Thường Tín');
  assert.equal(items[0].province, 'Hà Nội');
});

test('Nominatim reverse lookup converts browser coordinates into a shipping address', async () => {
  global.fetch = async url => {
    const parsed = new URL(url);
    assert.equal(parsed.pathname, '/reverse');
    assert.equal(parsed.searchParams.get('lat'), '20.895804');
    assert.equal(parsed.searchParams.get('lon'), '105.862916');
    return response({ place_id: 456, display_name: 'Hồng Vân, Thường Tín, Hà Nội, Việt Nam', lat: '20.895804', lon: '105.862916', address: { village: 'Hồng Vân', county: 'Thường Tín', state: 'Hà Nội' } });
  };

  const item = await reverseLocation(20.895804, 105.862916);

  assert.equal(item.placeId, '456');
  assert.equal(item.ward, 'Hồng Vân');
  assert.equal(item.district, 'Thường Tín');
  assert.equal(item.province, 'Hà Nội');
});
