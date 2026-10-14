const placesBaseUrl = 'https://places.googleapis.com/v1';
const geocodingBaseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
const requestTimeoutMs = 10000;

function apiKey() {
  const value = String(process.env.GOOGLE_MAPS_SERVER_API_KEY || '').trim();
  if (!value) throw Object.assign(new Error('Chưa cấu hình Google Maps cho chức năng tìm địa chỉ'), { status: 503 });
  return value;
}

function safeSessionToken(value) {
  const token = String(value || '').trim();
  return /^[A-Za-z0-9_-]{1,36}$/.test(token) ? token : '';
}

async function googleJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const status = response.status === 429 ? 429 : response.status === 400 ? 400 : 502;
      const message = response.status === 429
        ? 'Đã vượt hạn mức tìm địa chỉ Google Maps. Vui lòng thử lại sau.'
        : response.status === 400
          ? 'Yêu cầu tìm địa chỉ Google Maps không hợp lệ'
          : 'Google Maps tạm thời không phản hồi hoặc chưa được cấu hình đúng';
      throw Object.assign(new Error(message), { status, providerCode: payload?.error?.status });
    }
    return payload;
  } catch (error) {
    if (error.name === 'AbortError') throw Object.assign(new Error('Google Maps phản hồi quá chậm'), { status: 504 });
    if (error.status) throw error;
    throw Object.assign(new Error('Không thể kết nối tới Google Maps'), { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}

function componentValue(components, ...types) {
  for (const type of types) {
    const component = (components || []).find(item => Array.isArray(item.types) && item.types.includes(type));
    const value = component?.longText || component?.long_name;
    if (value) return value;
  }
  return '';
}

function structuredAddress(components = [], formattedAddress = '') {
  const streetNumber = componentValue(components, 'street_number');
  const route = componentValue(components, 'route');
  const premise = componentValue(components, 'premise', 'subpremise');
  const firstPart = String(formattedAddress).split(',')[0]?.trim() || '';
  return {
    province: componentValue(components, 'administrative_area_level_1', 'locality'),
    district: componentValue(components, 'administrative_area_level_2', 'locality'),
    ward: componentValue(components, 'administrative_area_level_3', 'sublocality_level_1', 'sublocality'),
    addressLine: [streetNumber, route].filter(Boolean).join(' ') || premise || firstPart
  };
}

function placeLocation(item) {
  const latitude = Number(item?.location?.latitude ?? item?.geometry?.location?.lat);
  const longitude = Number(item?.location?.longitude ?? item?.geometry?.location?.lng);
  const formattedAddress = item?.formattedAddress || item?.formatted_address || '';
  const components = item?.addressComponents || item?.address_components || [];
  return {
    placeId: item?.id || item?.place_id || '',
    formattedAddress,
    latitude,
    longitude,
    ...structuredAddress(components, formattedAddress)
  };
}

async function searchLocations(input, sessionToken) {
  const token = safeSessionToken(sessionToken);
  if (!token) throw Object.assign(new Error('Phiên tìm kiếm địa chỉ không hợp lệ'), { status: 400 });
  const payload = await googleJson(`${placesBaseUrl}/places:autocomplete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text'
    },
    body: JSON.stringify({
      input,
      sessionToken: token,
      includedRegionCodes: ['vn'],
      languageCode: 'vi',
      regionCode: 'vn'
    })
  });
  return (payload.suggestions || []).flatMap(item => {
    const prediction = item.placePrediction;
    if (!prediction?.placeId) return [];
    const text = prediction.text?.text || '';
    return [{
      placeId: prediction.placeId,
      sessionToken: token,
      text,
      mainText: prediction.structuredFormat?.mainText?.text || text,
      secondaryText: prediction.structuredFormat?.secondaryText?.text || ''
    }];
  });
}

async function placeDetails(placeId, sessionToken) {
  const token = safeSessionToken(sessionToken);
  if (!token) throw Object.assign(new Error('Phiên tìm kiếm địa chỉ không hợp lệ'), { status: 400 });
  const query = new URLSearchParams({ languageCode: 'vi', regionCode: 'vn', sessionToken: token });
  const payload = await googleJson(`${placesBaseUrl}/places/${encodeURIComponent(placeId)}?${query}`, {
    headers: {
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': 'id,formattedAddress,location,addressComponents'
    }
  });
  const result = placeLocation(payload);
  if (!Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
    throw Object.assign(new Error('Địa điểm Google Maps này không có tọa độ giao hàng'), { status: 404 });
  }
  return result;
}

async function reverseLocation(latitude, longitude) {
  const query = new URLSearchParams({ latlng: `${latitude},${longitude}`, language: 'vi', region: 'vn', key: apiKey() });
  const payload = await googleJson(`${geocodingBaseUrl}?${query}`);
  if (payload.status === 'OVER_QUERY_LIMIT') throw Object.assign(new Error('Đã vượt hạn mức Geocoding. Vui lòng thử lại sau.'), { status: 429 });
  if (payload.status !== 'OK' || !payload.results?.length) {
    const status = payload.status === 'ZERO_RESULTS' ? 404 : 502;
    throw Object.assign(new Error(status === 404 ? 'Không tìm thấy địa chỉ tại vị trí này' : 'Google Geocoding chưa được cấu hình đúng'), { status });
  }
  const result = placeLocation(payload.results[0]);
  if (!Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
    throw Object.assign(new Error('Không tìm thấy tọa độ hợp lệ cho địa chỉ này'), { status: 404 });
  }
  return result;
}

module.exports = { placeDetails, reverseLocation, searchLocations };
