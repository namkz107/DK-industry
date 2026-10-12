const databaseIntegrationFlags = [
  'RUN_ADMIN_INTEGRATION',
  'RUN_AUTH_INTEGRATION',
  'RUN_CHAT_INTEGRATION',
  'RUN_CUSTOMER_INTEGRATION',
  'RUN_LEAD_INTEGRATION',
  'RUN_STAFF_INTEGRATION',
  'RUN_SUPPORT_INTEGRATION'
];

const integrationEnabled = databaseIntegrationFlags.some(name => process.env[name] === '1');

if (integrationEnabled) {
  const uri = String(process.env.TEST_MONGODB_URI || '').trim();
  if (!uri) {
    throw new Error('Integration tests require TEST_MONGODB_URI pointing to a dedicated test database. Refusing to use MONGODB_URI.');
  }
  let databaseName = '';
  try { databaseName = new URL(uri).pathname.replace(/^\//, '').split('/')[0]; }
  catch { throw new Error('TEST_MONGODB_URI is not a valid MongoDB connection URI.'); }
  if (!/(?:^|[_-])test$/i.test(databaseName)) {
    throw new Error('TEST_MONGODB_URI must use a database name ending in _test or -test.');
  }
  process.env.MONGODB_URI = uri;
}
