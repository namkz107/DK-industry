const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('production Compose requires an explicit origin bind address', () => {
  const compose = read('compose.production.yml');
  assert.match(compose, /WEB_BIND_ADDRESS:\?Set WEB_BIND_ADDRESS explicitly/);
  assert.doesNotMatch(compose, /-\s*["']?8080:80/);
});

test('Nginx sends HSTS only for client-facing HTTPS requests', () => {
  const nginx = read('frontend/nginx.conf');
  assert.match(nginx, /map \$http_x_forwarded_proto \$hsts_header/);
  assert.match(nginx, /add_header Strict-Transport-Security \$hsts_header always/);
  assert.match(nginx, /add_header Referrer-Policy "no-referrer" always/);
  assert.match(nginx, /log_format dk_sanitized/);
  assert.doesNotMatch(nginx, /log_format dk_sanitized[^;]*\$(?:args|request_uri|http_referer)/s);
});

test('Nginx preserves client-facing HTTPS when proxying to the API', () => {
  const nginx = read('frontend/nginx.conf');
  assert.match(nginx, /map \$http_x_forwarded_proto \$forwarded_proto/);
  assert.match(nginx, /proxy_set_header X-Forwarded-Proto \$forwarded_proto;/);
  assert.doesNotMatch(nginx, /proxy_set_header X-Forwarded-Proto \$scheme;/);
});

test('Nginx proxies same-origin public content uploads to the API', () => {
  const nginx = read('frontend/nginx.conf');
  assert.match(nginx, /location \/uploads\/content\/\s*\{[\s\S]*?proxy_pass http:\/\/api:5000;/);
});

test('ClamAV is private and the API waits for scanner health', () => {
  const compose = read('compose.production.yml');
  assert.match(compose, /clamav:[\s\S]*image:\s*clamav\/clamav:/);
  assert.match(compose, /CLAMAV_HOST:\s*clamav/);
  const clamav = compose.split(/\n  clamav:\s*\n/)[1].split(/\n  web:\s*\n/)[0];
  assert.doesNotMatch(clamav, /\n\s+ports:/);
  assert.match(clamav, /\n\s+expose:\s*\n\s+- "3310"/);
});

test('local deployment and age identity files are ignored', () => {
  const gitignore = read('.gitignore');
  assert.match(gitignore, /\*\.agekey/);
  assert.match(gitignore, /compose\.production\.env/);
});
