const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const workflowDir = path.join(root, '.github', 'workflows');
const files = fs.readdirSync(workflowDir).filter(name => /[.]ya?ml$/i.test(name));
const errors = [];

for (const file of files) {
  const relative = `.github/workflows/${file}`;
  const text = fs.readFileSync(path.join(workflowDir, file), 'utf8');
  if (/runs-on:\s*ubuntu-latest\b/.test(text)) errors.push(`${relative}: pin the runner image instead of ubuntu-latest`);
  for (const match of text.matchAll(/^\s*-?\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gm)) {
    const reference = match[1];
    if (reference.startsWith('./') || reference.startsWith('docker://')) continue;
    const at = reference.lastIndexOf('@');
    const revision = at >= 0 ? reference.slice(at + 1) : '';
    if (!/^[a-f0-9]{40}$/i.test(revision)) errors.push(`${relative}: action must be pinned to a full commit SHA: ${reference}`);
  }
  for (const match of text.matchAll(/^\s*(?:docker\s+run.*\s+)?([A-Za-z0-9._/-]+:[^\s]+)\s*$/gm)) {
    const image = match[1];
    if (/semgrep\/semgrep/.test(image) && !/@sha256:[a-f0-9]{64}$/i.test(image)) errors.push(`${relative}: Semgrep image must be pinned by sha256 digest`);
  }
  if (/deploy_backend_production:/.test(text) && !/vars[.]PRODUCTION_DEPLOY_ENABLED\s*==\s*'true'/.test(text)) {
    errors.push(`${relative}: production deploy must require PRODUCTION_DEPLOY_ENABLED=true`);
  }
}

if (errors.length) {
  console.error(`Workflow validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Workflow validation passed for ${files.length} file(s)`);
