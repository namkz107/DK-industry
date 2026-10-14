const test = require('node:test');
const assert = require('node:assert/strict');
const { placeDetails, reverseLocation, searchLocations } = require('../src/services/googleMapsService');

const originalFetch = global.fetch;
const originalApiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;

test.afterEach(() => {
  global.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.GOOGLE_MAPS_SERVER_API_KEY;
  else process.env.GOOGLE_MAPS_SERVER_API_KEY = originalApiKey;
});

function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}

test('Places Autocomplete returns only Google place predictions with the session token', async () => {
  process.env.GOOGLE_MAPS_SERVER_API_KEY = 'server-key';
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return response({ suggestions: [
      { placePrediction: { placeId: 'google-place-1', text: { text: 'Duyên Trường, Hồng Vân, Hà Nội' }, structuredFormat: { mainText: { text: 'Duyên Trường' }, secondaryText: { text: 'Hồng Vân, Hà Nội' } } } },
      { queryPrediction: { text: { text: 'ignored query' } } }
    ] });
  };

  const items = await searchLocations('Duyên Trường', '123e4567-e89b-12d3-a456-426614174000');

  assert.equal(request.url, 'https://places.googleapis.com/v1/places:autocomplete');
  assert.equal(request.options.headers['X-Goog-Api-Key'], 'server-key');
  assert.deepEqual(JSON.parse(request.options.body), {
    input: 'Duyên Trường', sessionToken: '123e4567-e89b-12d3-a456-426614174000',
    includedRegionCodes: ['vn'], languageCode: 'vi', regionCode: 'vn'
  });
  assert.deepEqual(items, [{ placeId: 'google-place-1', sessionToken: '123e4567-e89b-12d3-a456-426614174000', text: 'Duyên Trường, Hồng Vân, Hà Nội', mainText: 'Duyên Trường', secondaryText: 'Hồng Vân, Hà Nội' }]);
});

test('Place Details maps Google address components to the shipping address model', async () => {
  process.env.GOOGLE_MAPS_SERVER_API_KEY = 'server-key';
  global.fetch = async () => response({
    id: 'google-place-1', formattedAddress: '12 Đường Mẫu, Hồng Vân, Thường Tín, Hà Nội',
    location: { latitude: 20.895803, longitude: 105.862915 },
    addressComponents: [
      { longText: '12', types: ['street_number'] }, { longText: 'Đường Mẫu', types: ['route'] },
      { longText: 'Hồng Vân', types: ['administrative_area_level_3'] },
      { longText: 'Thường Tín', types: ['administrative_area_level_2'] },
      { longText: 'Hà Nội', types: ['administrative_area_level_1'] }
    ]
  });

  const item = await placeDetails('google-place-1', '123e4567-e89b-12d3-a456-426614174000');

  assert.deepEqual(item, {
    placeId: 'google-place-1', formattedAddress: '12 Đường Mẫu, Hồng Vân, Thường Tín, Hà Nội',
    latitude: 20.895803, longitude: 105.862915, addressLine: '12 Đường Mẫu', ward: 'Hồng Vân', district: 'Thường Tín', province: 'Hà Nội'
  });
});

test('Geocoding converts browser coordinates into a Google shipping address', async () => {
  process.env.GOOGLE_MAPS_SERVER_API_KEY = 'server-key';
  global.fetch = async url => {
    assert.match(url, /latlng=20\.895803%2C105\.862915/);
    return response({ status: 'OK', results: [{
      place_id: 'reverse-place', formatted_address: 'Hồng Vân, Thường Tín, Hà Nội',
      geometry: { location: { lat: 20.895803, lng: 105.862915 } },
      address_components: [
        { long_name: 'Hồng Vân', types: ['administrative_area_level_3'] },
        { long_name: 'Thường Tín', types: ['administrative_area_level_2'] },
        { long_name: 'Hà Nội', types: ['administrative_area_level_1'] }
      ]
    }] });
  };

  const item = await reverseLocation(20.895803, 105.862915);

  assert.equal(item.placeId, 'reverse-place');
  assert.equal(item.ward, 'Hồng Vân');
  assert.equal(item.district, 'Thường Tín');
  assert.equal(item.province, 'Hà Nội');
});
