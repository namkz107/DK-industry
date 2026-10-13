const baseUrl = () => String(process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org').replace(/\/$/, '');
const contactEmail = () => String(process.env.NOMINATIM_EMAIL || process.env.SMTP_USER || '').trim();
const cache = new Map();
const cacheTtlMs = 24 * 60 * 60 * 1000;
let requestQueue = Promise.resolve();
let nextRequestAt = 0;

function cached(key) {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt < Date.now()) { cache.delete(key); return undefined; }
  return entry.value;
}

function schedule(task) {
  const run = requestQueue.then(async () => {
    const delay = Math.max(0, nextRequestAt - Date.now());
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    nextRequestAt = Date.now() + 1100;
    return task();
  });
  requestQueue = run.catch(() => {});
  return run;
}

async function nominatim(pathname, params) {
  const key = `${pathname}?${new URLSearchParams(params)}`;
  const hit = cached(key);
  if (hit !== undefined) return hit;
  const value = await schedule(async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const email = contactEmail();
      const query = new URLSearchParams({ ...params, format: 'jsonv2', addressdetails: '1', 'accept-language': 'vi' });
      if (email) query.set('email', email);
      const response = await fetch(`${baseUrl()}${pathname}?${query}`, {
        headers: { 'User-Agent': email ? `DK-Industry/1.0 (${email})` : 'DK-Industry/1.0', Accept: 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) throw Object.assign(new Error('Dịch vụ OpenStreetMap tạm thời không phản hồi'), { status: response.status === 429 ? 429 : 502 });
      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') throw Object.assign(new Error('Dịch vụ OpenStreetMap phản hồi quá chậm'), { status: 504 });
      throw error;
    } finally { clearTimeout(timer); }
  });
  cache.set(key, { value, expiresAt: Date.now() + cacheTtlMs });
  return value;
}

function structuredAddress(address = {}) {
  return {
    province: address.state || address.city || address.province || '',
    district: address.city_district || address.county || address.town || address.municipality || '',
    ward: address.suburb || address.quarter || address.village || address.hamlet || '',
    addressLine: [address.house_number, address.road || address.pedestrian || address.residential].filter(Boolean).join(' ')
  };
}

function location(item) {
  const displayName = item.display_name || '';
  const [mainText, ...rest] = displayName.split(',').map(value => value.trim()).filter(Boolean);
  return {
    placeId: item.osm_type && item.osm_id ? `osm:${item.osm_type}:${item.osm_id}` : '',
    text: displayName,
    mainText: item.name || mainText || displayName,
    secondaryText: rest.join(', '),
    formattedAddress: displayName,
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    ...structuredAddress(item.address)
  };
}

async function searchLocations(input) {
  const result = await nominatim('/search', { q: input, countrycodes: 'vn', limit: '5' });
  return Array.isArray(result) ? result.map(location).filter(item => Number.isFinite(item.latitude) && Number.isFinite(item.longitude)) : [];
}

async function reverseLocation(latitude, longitude) {
  const result = await nominatim('/reverse', { lat: String(latitude), lon: String(longitude), zoom: '18' });
  if (!result?.lat || !result?.lon) throw Object.assign(new Error('Không tìm thấy địa chỉ tại vị trí này'), { status: 404 });
  return location(result);
}

module.exports = { reverseLocation, searchLocations };
