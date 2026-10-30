const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = process.env.FRONTEND_DIST_DIR
  ? path.resolve(root, 'frontend', process.env.FRONTEND_DIST_DIR)
  : path.join(root, 'frontend', 'dist');
const patterns = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['MongoDB credential URI', /mongodb(?:\+srv)?:\/\/[^/\s:@]+:[^@\s/]+@/i],
  ['Cloudinary credential URI', /cloudinary:\/\/[^:\s]+:[^@\s]+@/i],
  ['Groq API key', /\bgsk_[A-Za-z0-9_-]{20,}\b/],
  ['OpenAI-style API key', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{20,}\b/],
  ['server secret identifier', /\b(?:JWT_SECRET|MFA_ENCRYPTION_KEY|CLOUDINARY_API_SECRET|SMTP_PASS|MONGODB_URI|ADMIN_SEED_PASSWORD)\b/]
];

if (!fs.existsSync(dist)) {
  console.error('Frontend dist directory is missing. Build the frontend before scanning.');
  process.exit(1);
}

const files = [];
const visit = directory => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(fullPath);
    else files.push(fullPath);
  }
};
visit(dist);

const findings = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  for (const [label, pattern] of patterns) {
    if (pattern.test(content)) findings.push({ file: path.relative(dist, file), label });
  }
}

if (findings.length) {
  for (const finding of findings) console.error(`Potential ${finding.label} in ${finding.file}`);
  process.exit(1);
}

console.log(`Client bundle secret scan passed (${files.length} files).`);
