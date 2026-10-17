const nominatimBaseUrl = 'https://nominatim.openstreetmap.org';
const requestTimeoutMs = 10000;
const cacheTtlMs = 24 * 60 * 60 * 1000;
const maxCacheEntries = 500;
const cache = new Map();
let nextRequestAt = 0;
let requestQueue = Promise.resolve();

function cacheGet(key) {
  const item = cache.get(key);
  if (!item || item.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return item.value;
}

function cacheSet(key, value) {
  if (cache.size >= maxCacheEntries) cache.delete(cache.keys().next().value);
  cache.set(key, { value, expiresAt: Date.now() + cacheTtlMs });
  return value;
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function scheduleRequest(task) {
  const run = requestQueue.then(async () => {
    const delay = Math.max(0, nextRequestAt - Date.now());
    if (delay) await wait(delay);
    nextRequestAt = Date.now() + 1100;
    return task();
  });
  requestQueue = run.catch(() => {});
  return run;
}

function userAgent() {
  const contact = String(process.env.COMPANY_EMAIL || '').trim();
  return contact ? `DKIndustry/1.0 (${contact})` : 'DKIndustry/1.0';
}

async function nominatimJson(path, query) {
  return scheduleRequest(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const response = await fetch(`${nominatimBaseUrl}${path}?${new URLSearchParams(query)}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'Accept-Language': 'vi', 'User-Agent': userAgent() }
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const status = response.status === 429 ? 429 : 502;
        const message = response.status === 429
          ? 'Dịch vụ địa chỉ miễn phí đang giới hạn lượt truy cập. Vui lòng thử lại sau.'
          : 'Dịch vụ địa chỉ miễn phí tạm thời không phản hồi.';
        throw Object.assign(new Error(message), { status });
      }
      return payload;
    } catch (error) {
      if (error.name === 'AbortError') throw Object.assign(new Error('Dịch vụ địa chỉ phản hồi quá chậm'), { status: 504 });
      if (error.status) throw error;
      throw Object.assign(new Error('Không thể kết nối tới dịch vụ địa chỉ miễn phí'), { status: 502 });
    } finally {
      clearTimeout(timer);
    }
  });
}

function firstValue(address, keys) {
  for (const key of keys) if (address?.[key]) return String(address[key]);
  return '';
}

function locationFromNominatim(item) {
  const address = item?.address || {};
  const formattedAddress = String(item?.display_name || '').trim();
  const road = firstValue(address, ['road', 'pedestrian', 'footway', 'residential', 'path']);
  const houseNumber = firstValue(address, ['house_number']);
  const addressLine = [houseNumber, road].filter(Boolean).join(' ') || firstValue(address, ['building', 'amenity', 'shop', 'office']);
  return {
    placeId: item?.place_id === undefined ? '' : String(item.place_id),
    formattedAddress,
    latitude: Number(item?.lat),
    longitude: Number(item?.lon),
    addressLine,
    ward: firstValue(address, ['quarter', 'suburb', 'neighbourhood', 'village', 'hamlet']),
    district: firstValue(address, ['city_district', 'district', 'county', 'town']),
    province: firstValue(address, ['state', 'province', 'city'])
  };
}

function suggestionFromLocation(location) {
  return {
    ...location,
    text: location.formattedAddress,
    mainText: location.addressLine || location.formattedAddress.split(',')[0]?.trim() || location.formattedAddress,
    secondaryText: location.formattedAddress.split(',').slice(1).join(',').trim()
  };
}

async function searchLocations(input) {
  const normalized = String(input || '').trim().replace(/\s+/g, ' ');
  const cacheKey = `search:${normalized.toLocaleLowerCase('vi')}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const payload = await nominatimJson('/search', {
    q: normalized,
    format: 'jsonv2',
    addressdetails: '1',
    countrycodes: 'vn',
    limit: '5',
    dedupe: '1'
  });
  const results = (Array.isArray(payload) ? payload : [])
    .map(locationFromNominatim)
    .filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
    .map(suggestionFromLocation);
  return cacheSet(cacheKey, results);
}

async function reverseLocation(latitude, longitude) {
  const cacheKey = `reverse:${Number(latitude).toFixed(5)},${Number(longitude).toFixed(5)}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;
  const payload = await nominatimJson('/reverse', {
    lat: String(latitude),
    lon: String(longitude),
    format: 'jsonv2',
    addressdetails: '1',
    zoom: '18'
  });
  if (!payload || payload.error) throw Object.assign(new Error('Không tìm thấy địa chỉ tại vị trí này'), { status: 404 });
  const result = locationFromNominatim(payload);
  if (!Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
    throw Object.assign(new Error('Không tìm thấy tọa độ hợp lệ cho địa chỉ này'), { status: 404 });
  }
  return cacheSet(cacheKey, result);
}

module.exports = { reverseLocation, searchLocations };
