import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createAntigravityBridge, ANTIGRAVITY_MODEL, ANTIGRAVITY_TASK_MODEL, EMPLOYEE_IDS } from './antigravity.mjs';

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
export function createApiHandler({ env = process.env, bridge = createAntigravityBridge({ env }) } = {}) {
  const model = ANTIGRAVITY_MODEL;
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
        const connection = authenticated ? await bridge.status() : { configured: false };
        json(res, 200, { ...connection, authenticated, requiresLogin, model }); return true;
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
      if (['/api/ai/check', '/api/ai/sign-in'].includes(path) && req.method === 'POST') {
        if (!authenticated) { json(res, 401, { error: { message: 'Sign in to this office first.' } }); return true; }
        if (limited('connection:' + req.socket.remoteAddress, 6)) { json(res, 429, { error: { message: 'Wait a moment before checking again.' } }); return true; }
        if (path.endsWith('sign-in')) {
          if (!localHost || !loopback(req.socket.remoteAddress) || env.APP_ORIGIN) { json(res, 403, { error: { message: 'Open the official Antigravity client on the server to sign in.' } }); return true; }
          json(res, 200, await bridge.signIn());
        } else json(res, 200, await bridge.status(true));
        return true;
      }
      if (path !== '/api/ai/chat' || req.method !== 'POST') { json(res, 404, { error: { message: 'API route not found.' } }); return true; }
      if (!authenticated) { json(res, 401, { error: { message: 'Connect with the office access password in AI settings.' } }); return true; }
      const client = cookie || req.socket.remoteAddress;
      if (limited(`chat:${client}`, 30) || activeTotal >= 16 || (active.get(client) || 0) >= 8) {
        json(res, 429, { error: { message: 'The office is busy. Please try again shortly.' } }); return true;
      }
      const body = await readBody(req);
      if ((body.purpose !== undefined && !['chat', 'task'].includes(body.purpose)) || !EMPLOYEE_IDS.includes(body.employeeId) || !Array.isArray(body.messages) || !body.messages.length || body.messages.length > 64 || body.messages.some(message =>
        !message || !['system', 'user', 'assistant'].includes(message.role) || typeof message.content !== 'string' || message.content.length > 64_000)) {
        json(res, 400, { error: { message: 'Invalid conversation.' } }); return true;
      }
      if (!(await bridge.status()).configured) { json(res, 503, { error: { message: 'Antigravity needs sign-in or access to Gemini 3.8 Flash. Check AI connection settings.' } }); return true; }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120_000);
      const onClose = () => { if (!res.writableEnded) controller.abort(); };
      res.on('close', onClose);
      activeTotal++; active.set(client, (active.get(client) || 0) + 1);
      try {
        const streaming = body.stream === true;
        const replyModel = body.purpose === 'task' ? ANTIGRAVITY_TASK_MODEL : model;
        let streamed = '';
        const send = data => { if (!res.destroyed) res.write('data: ' + JSON.stringify(data) + '\n\n'); };
        if (streaming) {
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
          res.flushHeaders();
        }
        const heartbeat = streaming ? setInterval(() => { if (!res.destroyed) res.write(': waiting\n\n'); }, 10_000) : null;
        try {
          const reply = await bridge.complete({ employeeId: body.employeeId, messages: body.messages, purpose: body.purpose || 'chat', signal: controller.signal,
            onDelta: streaming ? delta => { streamed += delta; send({ choices: [{ delta: { content: delta } }], model: replyModel }); } : undefined });
          if (streaming) {
            if (!streamed) send({ choices: [{ delta: { content: reply.content } }], model: replyModel });
            else if (streamed !== reply.content) send({ final: reply.content, model: replyModel });
            res.end('data: [DONE]\n\n');
          } else json(res, 200, { model: replyModel, choices: [{ message: { content: reply.content } }], usage: reply.usage });
        } catch (error) {
          if (streaming && !res.destroyed) { send({ error: { message: 'Antigravity interrupted the reply. Please retry.' } }); res.end(); }
          else throw error;
        } finally { if (heartbeat) clearInterval(heartbeat); }

      } finally {
        clearTimeout(timeout); res.off('close', onClose);
        activeTotal--; const count = (active.get(client) || 1) - 1;
        if (count) active.set(client, count); else active.delete(client);
      }
    } catch (error) {
      if (!res.headersSent) json(res, error?.name === 'AbortError' ? 504 : 400, { error: { message: error?.name === 'AbortError' ? 'The AI request timed out. Please retry.' : 'Antigravity could not complete the request. Check the connection and try again.' } });
      else if (!res.writableEnded) res.end();
    }
    return true;
  };
}
