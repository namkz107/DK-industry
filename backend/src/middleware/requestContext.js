const crypto = require('crypto');

function requestContext(req, res, next) {
  const incoming = String(req.get('x-request-id') || '');
  req.id = /^[A-Za-z0-9._:-]{8,100}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

function productionRequestLog(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();
  const startedAt = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.log(JSON.stringify({
      level: 'info',
      event: 'http_request',
      requestId: req.id,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      status: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
      ip: req.ip
    }));
  });
  next();
}

module.exports = { productionRequestLog, requestContext };
