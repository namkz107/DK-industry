const crypto = require('crypto');

const args = process.argv.slice(2);
const allowHttp = args.includes('--allow-http');
const expectedRelease = args.find(value => value.startsWith('--expect-release='))?.split('=')[1] || process.env.SMOKE_EXPECTED_RELEASE;
const baseArg = args.find(value => !value.startsWith('--')) || process.env.SMOKE_BASE_URL;
if (!baseArg) {
  console.error('Usage: npm run smoke:production -- https://your-domain.example');
  process.exit(2);
}

const baseUrl = baseArg.replace(/\/$/, '');
if (!allowHttp && !baseUrl.startsWith('https://')) {
  console.error('Production smoke test requires HTTPS. Use --allow-http only for a local staging proxy.');
  process.exit(2);
}

async function check(name, path, verify) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual', headers: { 'X-Request-Id': `smoke-${crypto.randomUUID()}` } });
  const text = await response.text();
  const problem = await verify(response, text);
  if (problem) throw new Error(`${name}: ${problem}`);
  console.log(`PASS ${name} (${response.status})`);
}

async function main() {
  await check('web home', '/', async (response, text) => response.status !== 200 || !text.includes('id="root"') ? 'SPA shell không hợp lệ' : '');
  await check('security headers', '/', async response => {
    const required = ['content-security-policy', 'x-content-type-options', 'x-frame-options', 'strict-transport-security', 'referrer-policy', 'permissions-policy'];
    const missing = required.filter(name => !response.headers.get(name));
    if (missing.length) return `thiếu ${missing.join(', ')}`;
    if (response.headers.get('x-content-type-options')?.toLowerCase() !== 'nosniff') return 'X-Content-Type-Options phải là nosniff';
    if (response.headers.get('x-frame-options')?.toUpperCase() !== 'DENY') return 'X-Frame-Options phải là DENY';
    if (!/^max-age=\d+/i.test(response.headers.get('strict-transport-security') || '')) return 'HSTS không có max-age hợp lệ';
    const csp = response.headers.get('content-security-policy') || '';
    for (const directive of ["default-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'self'", 'upgrade-insecure-requests']) {
      if (!csp.includes(directive)) return `CSP thiếu ${directive}`;
    }
    return '';
  });
  await check('API liveness', '/api/live', async (response, text) => {
    if (response.status !== 200) return `HTTP ${response.status}`;
    try {
      const body = JSON.parse(text);
      if (body.status !== 'alive') return 'status không phải alive';
      const apiContract = Number(body.apiContract);
      if (!Number.isFinite(apiContract) || apiContract < 2) return 'API container quá cũ, thiếu contract project-tracking (cần apiContract >= 2)';
      if (expectedRelease && body.release !== expectedRelease) return `backend release ${body.release || 'không xác định'} không khớp ${expectedRelease}`;
      return '';
    } catch { return 'response không phải JSON'; }
  });
  await check('API readiness', '/api/ready', async (response, text) => {
    if (response.status !== 200) return `HTTP ${response.status}`;
    try { return JSON.parse(text).status === 'ready' ? '' : 'database chưa ready'; } catch { return 'response không phải JSON'; }
  });
  await check('SPA fallback', '/smoke-route-does-not-exist', async (response, text) => response.status !== 200 || !text.includes('id="root"') ? 'reverse proxy chưa fallback về SPA' : '');
  await check('robots', '/robots.txt', async (response, text) => response.status !== 200 || !/Sitemap:\s+https:\/\//i.test(text) ? 'robots chưa có sitemap production' : '');
  await check('sitemap', '/sitemap.xml', async (response, text) => response.status !== 200 || !text.includes('<urlset') ? 'sitemap không hợp lệ' : '');
  console.log(`Smoke test production hoàn tất: ${baseUrl}`);
}

main().catch(error => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
