// Exact development origins only; HTTP/2 uses :authority instead of Host.
const allowedOrigins = new Set(['http://localhost:5190', 'https://localhost:5190']);
function deny(res, code, message) {
  res.statusCode = 403;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({error:{code,message}}));
}
export function localApiOriginGuard(req, res, next) {
  if (!/^\/api(?:\/|\?|$)/.test(req.url || '')) return next();
  const origin = req.headers.origin;
  const host = req.headers.host;
  const authority = req.headers[':authority'];
  if ((host ?? authority) !== 'localhost:5190' ||
      (authority !== undefined && authority !== 'localhost:5190') ||
      (origin && !allowedOrigins.has(origin))) {
    deny(res, 'LOCAL_ORIGIN_DENIED', 'Local origin denied. Use https://localhost:5190.'); return;
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !origin) {
    deny(res, 'LOCAL_ORIGIN_REQUIRED', 'Local origin required.'); return;
  }
  next();
}