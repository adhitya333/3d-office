import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const json = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
};
const digest = value => createHash('sha256').update(value).digest();
const loopback = value => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(value);
async function readBody(req) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new Error('Expected JSON');
  let bytes = 0; const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 512_000) throw new Error('Request too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

/** Shared by Vite development and the production Node server. */
export function createApiHandler({ env = process.env, fetchImpl = fetch } = {}) {
  const model = env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free';
  const apiKey = env.OPENROUTER_API_KEY?.trim() || '';
  const password = env.APP_ACCESS_TOKEN || '';
  const sessions = new Map(); const rates = new Map(); const active = new Map();
  let activeTotal = 0;
  const limited = (key, limit) => {
    const now = Date.now();
    if (rates.size > 1000) for (const [id, item] of rates) if (item.until < now) rates.delete(id);
    const bucket = rates.get(key);
    if (!bucket || bucket.until < now) { rates.set(key, { count: 1, until: now + 60_000 }); return false; }
    return ++bucket.count > limit;
  };
  return async (req, res) => {
    const path = req.url?.split('?')[0];
    if (!path?.startsWith('/api/')) return false;
    try {
      const host = req.headers.host || '';
      const localHost = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
      const expectedOrigin = env.APP_ORIGIN || `http://${host}`;
      if ((!localHost && !env.APP_ORIGIN) || (req.headers.origin && req.headers.origin !== expectedOrigin) || req.headers['sec-fetch-site'] === 'cross-site') {
        json(res, 403, { error: { message: 'This origin is not allowed.' } }); return true;
      }
      const remote = !loopback(req.socket.remoteAddress) || !localHost;
      const requiresLogin = Boolean(password) || remote;
      const cookie = req.headers.cookie?.match(/(?:^|;\s*)office_session=([a-f0-9]{64})(?:;|$)/)?.[1];
      const session = cookie && sessions.get(cookie);
      if (session && session.expires <= Date.now()) sessions.delete(cookie);
      const authenticated = !requiresLogin || Boolean(session && session.expires > Date.now());
      if (path === '/api/ai/status' && req.method === 'GET') {
        json(res, 200, { configured: Boolean(apiKey), authenticated, requiresLogin, model }); return true;
      }
      if (path === '/api/session' && req.method === 'POST') {
        if (limited(`login:${req.socket.remoteAddress}`, 10)) { json(res, 429, { error: { message: 'Too many attempts. Try again in a minute.' } }); return true; }
        const body = await readBody(req);
        if (!password || typeof body.password !== 'string' || !timingSafeEqual(digest(body.password), digest(password))) {
          json(res, 401, { error: { message: 'Office access password is incorrect or not configured on the server.' } }); return true;
        }
        for (const [id, item] of sessions) if (item.expires < Date.now()) sessions.delete(id);
        const token = randomBytes(32).toString('hex');
        sessions.set(token, { expires: Date.now() + 12 * 60 * 60_000 });
        res.setHeader('Set-Cookie', `office_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${expectedOrigin.startsWith('https:') ? '; Secure' : ''}`);
        json(res, 200, { ok: true }); return true;
      }
      if (path === '/api/session' && req.method === 'DELETE') {
        if (cookie) sessions.delete(cookie);
        res.setHeader('Set-Cookie', 'office_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
        json(res, 200, { ok: true }); return true;
      }
      if (path !== '/api/ai/chat' || req.method !== 'POST') { json(res, 404, { error: { message: 'API route not found.' } }); return true; }
      if (!authenticated) { json(res, 401, { error: { message: 'Connect with the office access password in AI settings.' } }); return true; }
      if (!apiKey) { json(res, 503, { error: { message: 'Set OPENROUTER_API_KEY on the backend to enable AI.' } }); return true; }
      const client = cookie || req.socket.remoteAddress;
      if (limited(`chat:${client}`, 30) || activeTotal >= 16 || (active.get(client) || 0) >= 8) {
        json(res, 429, { error: { message: 'The office is busy. Please try again shortly.' } }); return true;
      }
      const body = await readBody(req);
      if (!Array.isArray(body.messages) || !body.messages.length || body.messages.length > 64 || body.messages.some(message =>
        !message || !['system', 'user', 'assistant'].includes(message.role) || typeof message.content !== 'string' || message.content.length > 64_000)) {
        json(res, 400, { error: { message: 'Invalid conversation.' } }); return true;
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);
      const onClose = () => { if (!res.writableEnded) controller.abort(); };
      res.on('close', onClose);
      activeTotal++; active.set(client, (active.get(client) || 0) + 1);
      try {
        const upstream = await fetchImpl('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST', signal: controller.signal,
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
            'HTTP-Referer': env.OPENROUTER_SITE_URL || expectedOrigin, 'X-Title': env.OPENROUTER_APP_NAME || 'Verlyn HQ' },
          body: JSON.stringify({ model, messages: body.messages, stream: body.stream === true,
            temperature: Math.max(0, Math.min(1, Number(body.temperature) || 0.6)),
            max_tokens: Math.max(1, Math.min(3000, Number(body.max_tokens) || 600)) }),
        });
        if (!upstream.ok) {
          // Provider diagnostics may contain request metadata: return a sanitized error.
          await upstream.body?.cancel();
          json(res, upstream.status === 429 ? 429 : 502, { error: { message: upstream.status === 429
            ? 'The AI provider is rate limited. Try again shortly.' : `The AI provider could not complete the request (${upstream.status}).` } });
        } else if (!upstream.body) json(res, 502, { error: { message: 'The AI provider returned an empty response.' } });
        else {
          res.writeHead(200, { 'Content-Type': body.stream === true ? 'text/event-stream' : 'application/json',
            'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no', 'X-Content-Type-Options': 'nosniff' });
          res.flushHeaders();
          await pipeline(Readable.fromWeb(upstream.body), res);
        }
      } finally {
        clearTimeout(timeout); res.off('close', onClose);
        activeTotal--; const count = (active.get(client) || 1) - 1;
        if (count) active.set(client, count); else active.delete(client);
      }
    } catch (error) {
      if (!res.headersSent) json(res, error?.name === 'AbortError' ? 504 : 400, { error: { message: error?.name === 'AbortError' ? 'The AI request timed out. Please retry.' : 'The request could not be completed.' } });
      else if (!res.writableEnded) res.end();
    }
    return true;
  };
}
