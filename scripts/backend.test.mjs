import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { createApiHandler } from '../server/api.mjs';
import { createAntigravityBridge, ANTIGRAVITY_MODEL, EMPLOYEE_IDS, cliEnvironment } from '../server/antigravity.mjs';

const fakeBridge = (overrides = {}) => ({
  status: async () => ({ configured: true, signedIn: true, provider: 'Antigravity', model: ANTIGRAVITY_MODEL }),
  complete: async () => ({ content: 'Hello from Antigravity', model: ANTIGRAVITY_MODEL }),
  signIn: async () => ({ alreadyConnected: true }), ...overrides,
});
async function fixture(t, options = {}) {
  const api = createApiHandler({ bridge: fakeBridge(), ...options });
  const server = http.createServer(async (req, res) => { if (!await api(req, res)) { res.writeHead(404); res.end(); } });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  return 'http://127.0.0.1:' + server.address().port;
}
const request = (data, extra = {}) => ({ method: 'POST', headers: { 'Content-Type': 'application/json', ...extra }, body: JSON.stringify(data) });
const conversation = { employeeId: 'adhi', messages: [{ role: 'user', content: 'Hello' }] };

test('The API uses Antigravity, pins Gemini 3.8 Flash and keeps provider credentials private', async t => {
  let received;
  const base = await fixture(t, { bridge: fakeBridge({ complete: async input => { received = input; return { content: 'Hi', model: ANTIGRAVITY_MODEL }; } }) });
  const status = await (await fetch(base + '/api/ai/status')).json();
  assert.equal(status.configured, true); assert.equal(status.provider, 'Antigravity');
  assert.equal(status.model, 'gemini-3.8-flash-medium'); assert.equal(status.apiKey, undefined);
  const reply = await fetch(base + '/api/ai/chat', request({ ...conversation, model: 'attacker-model' }));
  assert.equal(reply.status, 200); assert.equal((await reply.json()).model, ANTIGRAVITY_MODEL);
  assert.equal(received.employeeId, 'adhi'); assert.equal(received.model, undefined);
  const safe = cliEnvironment({ PATH: '/bin', USERPROFILE: 'profile', OPENROUTER_API_KEY: 'private', APP_ACCESS_TOKEN: 'private', OTHER_SECRET: 'private' });
  assert.deepEqual(Object.keys(safe), ['PATH', 'USERPROFILE']);
});

test('Office login uses HttpOnly cookies, rejects cross-origin calls and supports logout', async t => {
  let calls = 0;
  const base = await fixture(t, { env: { APP_ACCESS_TOKEN: 'test-office-password-that-is-long' }, bridge: fakeBridge({ complete: async () => { calls++; return { content: 'Hello' }; } }) });
  assert.equal((await fetch(base + '/api/ai/status').then(r => r.json())).authenticated, false);
  assert.equal((await fetch(base + '/api/ai/chat', request(conversation))).status, 401);
  assert.equal((await fetch(base + '/api/ai/check', { method: 'POST' })).status, 401);
  assert.equal((await fetch(base + '/api/session', request({ password: 'wrong' }))).status, 401);
  const login = await fetch(base + '/api/session', request({ password: 'test-office-password-that-is-long' }));
  assert.equal(login.status, 200);
  const setCookie = login.headers.get('set-cookie');
  assert(setCookie.includes('HttpOnly')); assert(setCookie.includes('SameSite=Strict'));
  const Cookie = setCookie.split(';')[0];
  assert.equal((await fetch(base + '/api/ai/chat', request(conversation, { Cookie, Origin: 'https://untrusted.example' }))).status, 403);
  assert.equal(calls, 0);
  assert.equal((await fetch(base + '/api/ai/chat', request(conversation, { Cookie, Origin: base }))).status, 200);
  await fetch(base + '/api/session', { method: 'DELETE', headers: { Cookie } });
  assert.equal((await fetch(base + '/api/ai/chat', request(conversation, { Cookie }))).status, 401);
});

test('Responses reach chat through SSE and invalid employee IDs cannot reach the CLI', async t => {
  let calls = 0;
  const base = await fixture(t, { bridge: fakeBridge({ complete: async () => { calls++; return { content: 'Hello ☕' }; } }) });
  assert.equal((await fetch(base + '/api/ai/chat', request({ ...conversation, employeeId: '../../.env' }))).status, 400);
  assert.equal((await fetch(base + '/api/ai/chat', request({ ...conversation, messages: [{ role: 'bad', content: 'x' }] }))).status, 400);
  assert.equal(calls, 0);
  const reply = await fetch(base + '/api/ai/chat', request({ ...conversation, stream: true }));
  assert.equal(reply.headers.get('content-type'), 'text/event-stream');
  const stream = await reply.text(); assert(stream.includes('Hello ☕')); assert(stream.includes('[DONE]'));
});

test('Missing sign-in and model failures are explicit, sanitized and rate limited', async t => {
  const offline = await fixture(t, { bridge: fakeBridge({ status: async () => ({ configured: false }) }) });
  assert.equal((await fetch(offline + '/api/ai/chat', request(conversation))).status, 503);
  const base = await fixture(t, { bridge: fakeBridge({ complete: async () => { throw new Error('private-provider-diagnostics'); } }) });
  const reply = await fetch(base + '/api/ai/chat', request(conversation));
  assert.equal(reply.status, 400); assert(!(await reply.text()).includes('private-provider-diagnostics'));
  for (let i = 1; i < 30; i++) await fetch(base + '/api/ai/chat', request(conversation));
  assert.equal((await fetch(base + '/api/ai/chat', request(conversation))).status, 429);
});

test('Seven employees load their own skills and workspaces, with at most two CLI processes at once', async () => {
  let running = 0, maximum = 0, modelChecks = 0;
  const workers = [];
  const runner = async (args, options) => {
    if (args.at(-1) === 'models') { modelChecks++; return { code: 0, stdout: ANTIGRAVITY_MODEL + '\tGemini 3.8 Flash (Medium)\n' }; }
    running++; maximum = Math.max(maximum, running); workers.push({ args, ...options });
    await new Promise(resolve => setTimeout(resolve, 15)); running--;
    return { code: 0, stdout: JSON.stringify({ event: 'result', result: { status: 'SUCCESS', response: 'Role-aware response' } }) };
  };
  const bridge = createAntigravityBridge({ env: {}, runner });
  await assert.rejects(bridge.complete({ employeeId: '../../.env', messages: [] }), /valid employee/);
  const replies = await Promise.all(EMPLOYEE_IDS.map(employeeId => bridge.complete({ employeeId, messages: [{ role: 'user', content: 'Name your role.' }] })));
  assert.equal(replies.length, 7); assert.equal(maximum, 2); assert.equal(modelChecks, 1);
  assert.equal(new Set(workers.map(worker => worker.cwd)).size, 7);
  for (const worker of workers) {
    assert.equal(worker.args[worker.args.indexOf('--model') + 1], ANTIGRAVITY_MODEL);
    assert.equal(worker.args[worker.args.indexOf('--mode') + 1], 'plan');
    assert(!worker.args.includes('--dangerously-skip-permissions'));
    assert.equal(worker.args[worker.args.indexOf('--input-format') + 1], 'stream-json');
    assert.equal(JSON.parse(worker.input).event, 'user');
    assert(JSON.parse(worker.input).message.content.includes('OFFICE CONVERSATION'));
  }
  const rewu = workers.find(worker => worker.cwd.endsWith('rewaant'));
  assert(rewu.input.includes('Brand identity')); assert(rewu.input.includes('Growth or outbound sales is not the default scope'));
});

test('Unavailable Gemini 3.8 Flash never silently switches to another model', async () => {
  const bridge = createAntigravityBridge({ env: {}, runner: async () => ({ code: 0, stdout: 'other-model\tOther model' }) });
  assert.equal((await bridge.status()).configured, false);
  await assert.rejects(bridge.complete({ employeeId: 'adhi', messages: [] }), /not available/);
});
