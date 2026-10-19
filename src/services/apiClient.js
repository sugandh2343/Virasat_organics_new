// Prepared adapter only. Existing mock services never import or invoke this module.
const configuredBase = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_PROXY_ENABLED === 'true' ? '/api' : import.meta.env.VITE_API_BASE_URL || 'https://virasatorganics.com/api';
export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', fields = null, requestId = null } = {}) {
    super(message); this.name = 'ApiError'; Object.assign(this, { status, code, fields, requestId });
  }
}
export function createApiClient({ baseUrl = configuredBase, fetchImpl = (...args) => fetch(...args), credentials = 'omit', timeoutMs = 15000 } = {}) {
  const localProxy = baseUrl === '/api';
  if (!localProxy) {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname.replace(/\/$/, '') !== '/api') throw new Error('Use an HTTPS API base or /api development proxy.');
  }
  if (!['omit', 'same-origin', 'include'].includes(credentials)) throw new Error('Invalid credential mode.');
  const base = baseUrl.replace(/\/$/, '');
  return async function request(path, { method = 'GET', body, signal, csrfToken, idempotencyKey, version, cache, headers = {} } = {}) {
    if (!/^\/[a-zA-Z0-9/_-]*(?:\?[^#]*)?$/.test(path) || path.startsWith('//') || path.includes('..')) throw new Error('Use a relative API path.');
    const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
    const controller = new AbortController();
    const abort = () => controller.abort(signal?.reason);
    if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(base + path, {
        method, credentials, signal: controller.signal, ...(cache?{cache}:{}),
        headers: { Accept: 'application/json', ...(body !== undefined && !multipart ? { 'Content-Type': 'application/json' } : {}),
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}), ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
          ...(version !== undefined ? { 'If-Match': String(version) } : {}), ...headers },
        ...(body !== undefined ? { body: multipart ? body : JSON.stringify(body) } : {}),
      });
      if (response.status === 204) return { data: null };
      let payload;
      try { payload = await response.json(); } catch { throw new ApiError('The API returned an invalid response.', { status: response.status, code: 'INVALID_RESPONSE' }); }
      if (!response.ok) throw new ApiError(payload.error?.message || 'API request failed.', { status: response.status, code: payload.error?.code || 'API_ERROR', fields: payload.error?.fields, requestId: payload.requestId });
      if (!payload || !Object.hasOwn(payload, 'data')) throw new ApiError('The API returned an invalid response.', { status: response.status, code: 'INVALID_RESPONSE' });
      return payload;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(controller.signal.aborted ? 'Request cancelled or timed out.' : 'The API could not be reached.', { code: controller.signal.aborted ? 'ABORTED' : 'NETWORK_ERROR' });
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  };
}
