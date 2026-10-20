const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = name => fs.readFileSync(path.join(__dirname, name), 'utf8');

test('backup requires an age public recipient and removes plaintext temporary archives', () => {
  const script = read('backup-mongodb.ps1');
  assert.match(script, /BACKUP_AGE_RECIPIENT/);
  assert.match(script, /--recipient\s+\$AgeRecipient/);
  assert.match(script, /\.archive\.gz\.age/);
  assert.match(script, /finally\s*\{[\s\S]*Remove-Item[\s\S]*\$temporaryArchive/);
  assert.doesNotMatch(script, /BACKUP_AGE_IDENTITY_FILE|BEGIN AGE ENCRYPTED FILE/);
});

test('restore requires an external age identity and keeps the test-database guard', () => {
  const script = read('restore-mongodb.ps1');
  assert.match(script, /BACKUP_AGE_IDENTITY_FILE/);
  assert.match(script, /--decrypt\s+--identity\s+\$resolvedIdentity/);
  assert.match(script, /TargetDatabase.*(?:_test|-test)/s);
  assert.match(script, /finally\s*\{[\s\S]*Remove-Item[\s\S]*\$decryptedArchive/);
  assert.doesNotMatch(script, /AGE-SECRET-KEY-/);
});
