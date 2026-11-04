import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { ANTIGRAVITY_MODEL, ANTIGRAVITY_TASK_MODEL, EMPLOYEE_IDS } from './antigravity.mjs';
import { createMediaStore } from './media.mjs';
import { createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createEmployeeBridge } from './employeeBridge.mjs';

const json = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
};
const digest = value => createHash('sha256').update(value).digest();
const loopback = value => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(value);
async function readBody(req, maxBytes = 512_000) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new Error('Expected JSON');
  let bytes = 0; const chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > maxBytes) throw new Error('Request too large');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

/** Shared by Vite development and the production Node server. */
export function createApiHandler({ env = process.env, media = createMediaStore(fileURLToPath(new URL('../', import.meta.url))), bridge = createEmployeeBridge({ env, media }) } = {}) {
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
        json(res, 200, { ...connection, authenticated, requiresLogin, model: connection.model || model }); return true;
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
      if (['/api/ai/check', '/api/ai/sign-in', '/api/ai/chatgpt/sign-in', '/api/ai/model'].includes(path) && req.method === 'POST') {
        if (!authenticated) { json(res, 401, { error: { message: 'Sign in to this office first.' } }); return true; }
        if (limited((path.endsWith('/model') ? 'model:' : 'connection:') + req.socket.remoteAddress, path.endsWith('/model') ? 15 : 6)) { json(res, 429, { error: { message: 'Wait a moment before checking again.' } }); return true; }
        if (path.endsWith('/model')) {
          const body = await readBody(req); json(res, 200, await bridge.setModel(body.employeeId, body.model));
        } else if (path.endsWith('sign-in')) {
          if (!localHost || !loopback(req.socket.remoteAddress) || env.APP_ORIGIN) { json(res, 403, { error: { message: 'Open the official provider client on the backend computer to sign in.' } }); return true; }
          json(res, 200, await (path === '/api/ai/chatgpt/sign-in' ? bridge.signInChatGPT() : bridge.signIn()));
        } else json(res, 200, await bridge.status(true));
        return true;
      }
      if (path === '/api/media' || path.startsWith('/api/media/')) {
        if (!authenticated) { json(res, 401, { error: { message: 'Sign in to this office first.' } }); return true; }
        if (path === '/api/media' && req.method === 'POST') {
          if (limited(`media:${cookie || req.socket.remoteAddress}`, 15)) { json(res, 429, { error: { message: 'Please wait before attaching more images.' } }); return true; }
          const body = await readBody(req, 2_800_000);
          if (!EMPLOYEE_IDS.includes(body.employeeId)) { json(res, 400, { error: { message: 'Choose a valid employee.' } }); return true; }
          json(res, 201, await media.upload(body)); return true;
        }
        if (['GET','HEAD'].includes(req.method)) {
          try {
            const image = await media.get(path.slice('/api/media/'.length));
            res.writeHead(200, { 'Content-Type': image.mime, 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox" });
            if (req.method === 'HEAD') res.end(); else createReadStream(image.filename).on('error', () => res.destroy()).pipe(res);
          } catch { json(res, 404, { error: { message: 'Image not found.' } }); }
          return true;
        }
        json(res, 405, { error: { message: 'Method not allowed.' } }); return true;
      }
      if (path !== '/api/ai/chat' || req.method !== 'POST') { json(res, 404, { error: { message: 'API route not found.' } }); return true; }
      if (!authenticated) { json(res, 401, { error: { message: 'Connect with the office access password in AI settings.' } }); return true; }
      const client = cookie || req.socket.remoteAddress;
      if (limited(`chat:${client}`, 30) || activeTotal >= 16 || (active.get(client) || 0) >= 8) {
        json(res, 429, { error: { message: 'The office is busy. Please try again shortly.' } }); return true;
      }
      const body = await readBody(req);
      if ((body.purpose !== undefined && !['chat', 'task', 'image'].includes(body.purpose)) || !EMPLOYEE_IDS.includes(body.employeeId) || !Array.isArray(body.messages) || !body.messages.length || body.messages.length > 64 || body.messages.some(message =>
        !message || !['system', 'user', 'assistant'].includes(message.role) || typeof message.content !== 'string' || message.content.length > 64_000 || (message.imageIds !== undefined && (!Array.isArray(message.imageIds) || message.imageIds.length > 3 || message.imageIds.some(id => typeof id !== 'string' || !/^[a-f0-9]{32}$/.test(id)))))) {
        json(res, 400, { error: { message: 'Invalid conversation.' } }); return true;
      }
      if (!(await bridge.status()).configured) { json(res, 503, { error: { message: 'Check ChatGPT or Antigravity sign-in in Connection settings.' } }); return true; }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), body.purpose === 'image' ? 240_000 : 120_000);
      const onClose = () => { if (!res.writableEnded) controller.abort(); };
      res.on('close', onClose);
      activeTotal++; active.set(client, (active.get(client) || 0) + 1);
      try {
        const streaming = body.stream === true;
        let replyModel = body.purpose === 'task' ? ANTIGRAVITY_TASK_MODEL : model;
        let streamed = '';
        const send = data => { if (!res.destroyed) res.write('data: ' + JSON.stringify(data) + '\n\n'); };
        if (streaming) {
          res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'X-Accel-Buffering': 'no' });
          res.flushHeaders();
        }
        const heartbeat = streaming ? setInterval(() => { if (!res.destroyed) res.write(': waiting\n\n'); }, 10_000) : null;
        try {
          const reply = await bridge.complete({ employeeId: body.employeeId, messages: body.messages, purpose: body.purpose || 'chat', signal: controller.signal,
            onDelta: streaming ? (delta, actualModel) => { if (actualModel) replyModel = actualModel; streamed += delta; send({ choices: [{ delta: { content: delta } }], model: replyModel }); } : undefined });
          replyModel = reply.model || replyModel;
          if (streaming) {
            if (reply.images?.length) send({ images: reply.images });
            if (!streamed) send({ choices: [{ delta: { content: reply.content } }], model: replyModel });
            else if (streamed !== reply.content) send({ final: reply.content, model: replyModel });
            res.end('data: [DONE]\n\n');
          } else json(res, 200, { model: replyModel, images: reply.images, choices: [{ message: { content: reply.content } }], usage: reply.usage });
        } catch (error) {
          if (streaming && !res.destroyed) { send({ error: { message: 'The model interrupted the reply. Check the provider connection and retry.' } }); res.end(); }
          else throw error;
        } finally { if (heartbeat) clearInterval(heartbeat); }

      } finally {
        clearTimeout(timeout); res.off('close', onClose);
        activeTotal--; const count = (active.get(client) || 1) - 1;
        if (count) active.set(client, count); else active.delete(client);
      }
    } catch (error) {
      if (!res.headersSent) json(res, error?.name === 'AbortError' ? 504 : 400, { error: { message: error?.name === 'AbortError' ? 'The AI request timed out. Please retry.' : 'Could not complete the request. Check the connection and try again.' } });
      else if (!res.writableEnded) res.end();
    }
    return true;
  };
}
