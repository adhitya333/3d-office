import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createApiHandler } from '../server/api.mjs';

async function fixture(t, options = {}) {
  const api = createApiHandler(options);
  const server = http.createServer(async (req, res) => { if (!await api(req, res)) { res.writeHead(404); res.end(); } });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  return `http://127.0.0.1:${server.address().port}`;
}
const request = (data, extra = {}) => ({ method: 'POST', headers: { 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(data) });
const conversation = { messages: [{ role: 'user', content: 'Hello' }] };

test('Provider credentials stay server-side, model is pinned and request budget is bounded', async t => {
  let upstream;
  const base = await fixture(t, { env: { OPENROUTER_API_KEY: 'server-only-test-key', OPENROUTER_MODEL: 'configured-model' },
    fetchImpl: async (url, options) => { upstream = { url, ...options }; return Response.json({ choices: [{ message: { content: 'Hello back' } }] }); } });
  const status = await (await fetch(`${base}/api/ai/status`)).json();
  assert.equal(status.configured, true); assert.equal(status.authenticated, true);
  assert(!JSON.stringify(status).includes('server-only-test-key'));
  const response = await fetch(`${base}/api/ai/chat`, request({ ...conversation, model: 'attacker-model', max_tokens: 999999 }));
  assert.equal(response.status, 200);
  assert.equal(upstream.headers.Authorization, 'Bearer server-only-test-key');
  assert.equal(JSON.parse(upstream.body).model, 'configured-model');
  assert.equal(JSON.parse(upstream.body).max_tokens, 3000);
  assert(!JSON.stringify(await response.json()).includes('server-only-test-key'));
});

test('Shared office requires login, uses HttpOnly cookies, rejects cross-origin requests, and supports logout', async t => {
  let calls = 0;
  const base = await fixture(t, { env: { OPENROUTER_API_KEY: 'test-key', APP_ACCESS_TOKEN: 'test-office-password-that-is-long' },
    fetchImpl: async () => { calls++; return Response.json({ choices: [] }); } });
  assert.equal((await fetch(`${base}/api/ai/status`).then(r => r.json())).authenticated, false);
  assert.equal((await fetch(`${base}/api/ai/chat`, request(conversation))).status, 401);
  assert.equal((await fetch(`${base}/api/session`, request({ password: 'wrong' }))).status, 401);
  const login = await fetch(`${base}/api/session`, request({ password: 'test-office-password-that-is-long' }));
  assert.equal(login.status, 200);
  const setCookie = login.headers.get('set-cookie');
  assert(setCookie.includes('HttpOnly')); assert(setCookie.includes('SameSite=Strict'));
  const Cookie = setCookie.split(';')[0];
  assert.equal((await fetch(`${base}/api/ai/chat`, request(conversation, { Cookie, Origin: 'https://untrusted.example' }))).status, 403);
  assert.equal(calls, 0);
  assert.equal((await fetch(`${base}/api/ai/chat`, request(conversation, { Cookie, Origin: base }))).status, 200);
  await fetch(`${base}/api/session`, { method: 'DELETE', headers: { Cookie } });
  assert.equal((await fetch(`${base}/api/ai/chat`, request(conversation, { Cookie }))).status, 401);
});

test('SSE streams are forwarded and invalid input never reaches the provider', async t => {
  let calls = 0;
  const stream = 'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\ndata: [DONE]\n\n';
  const base = await fixture(t, { env: { OPENROUTER_API_KEY: 'test-key' }, fetchImpl: async () => { calls++; return new Response(stream); } });
  const invalid = await fetch(`${base}/api/ai/chat`, request({ messages: [{ role: 'bad', content: 'x' }] }));
  assert.equal(invalid.status, 400); assert.equal(calls, 0);
  const response = await fetch(`${base}/api/ai/chat`, request({ ...conversation, stream: true }));
  assert.equal(response.headers.get('content-type'), 'text/event-stream');
  assert.equal(await response.text(), stream);
});

test('Missing keys and provider errors are explicit and sanitized; requests are rate limited', async t => {
  const offline = await fixture(t, { env: {} });
  assert.equal((await fetch(`${offline}/api/ai/chat`, request(conversation))).status, 503);
  const base = await fixture(t, { env: { OPENROUTER_API_KEY: 'test-secret' },
    fetchImpl: async () => Response.json({ error: { message: 'test-secret private diagnostics' } }, { status: 401 }) });
  const response = await fetch(`${base}/api/ai/chat`, request(conversation));
  assert.equal(response.status, 502); assert(!(await response.text()).includes('test-secret'));
  for (let i = 1; i < 30; i++) await fetch(`${base}/api/ai/chat`, request(conversation));
  assert.equal((await fetch(`${base}/api/ai/chat`, request(conversation))).status, 429);
});
