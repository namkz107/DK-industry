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

test('frontend container runs Nginx as non-root on an unprivileged port', () => {
  const dockerfile = read('frontend/Dockerfile');
  const compose = read('compose.production.yml');
  const nginx = read('frontend/nginx.conf');
  assert.match(dockerfile, /\nUSER nginx\s*\n/);
  assert.match(dockerfile, /EXPOSE 8080/);
  assert.match(nginx, /listen 8080;/);
  assert.match(compose, /\$\{WEB_PORT:-8080\}:8080/);
  assert.match(compose, /127\.0\.0\.1:8080\/healthz/);
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

test('Nginx does not forward attacker-controlled Host or upgrade headers', () => {
  const nginx = read('frontend/nginx.conf');
  assert.doesNotMatch(nginx, /proxy_set_header Host \$(?:host|http_host);/);
  assert.doesNotMatch(nginx, /proxy_set_header Upgrade \$http_upgrade;/);
  assert.match(nginx, /map \$http_upgrade \$safe_upgrade \{[\s\S]*?\~\*\^websocket\$ websocket;/);
  assert.match(nginx, /proxy_set_header Upgrade \$safe_upgrade;/);
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

test('Vercel serves the Vite application for direct SPA routes', () => {
  const expected = [{ source: '/(.*)', destination: '/index.html' }];
  assert.deepEqual(JSON.parse(read('vercel.json')).rewrites, expected);
  assert.deepEqual(JSON.parse(read('frontend/vercel.json')).rewrites, expected);
});

test('production backend deploy waits for verification and pins the release', () => {
  const workflow = read('.github/workflows/ci.yml');
  const compose = read('compose.production.yml');
  assert.match(workflow, /deploy_backend_production:[\s\S]*needs:\s*\[[^\]]*verify[^\]]*security[^\]]*\]/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/master'/);
  assert.match(workflow, /vars\.PRODUCTION_DEPLOY_ENABLED == 'true'/);
  assert.match(workflow, /git pull --ff-only origin master/);
  assert.match(workflow, /PRODUCTION_KNOWN_HOSTS/);
  assert.match(workflow, /body\.release === expectedRelease/);
  assert.match(compose, /RELEASE_SHA: "\$\{RELEASE_SHA:\?Set RELEASE_SHA to the deployed Git commit\}"/);
});
