import { spawn } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ANTIGRAVITY_MODEL = 'gemini-3.8-flash-medium';
export const EMPLOYEE_IDS = ['adhi', 'abbu', 'prox', 'rewaant', 'taha', 'vaibav', 'ameen'];
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const cliEnvironment = env => Object.fromEntries(Object.entries(env).filter(([key]) => !/(?:API_KEY|ACCESS_TOKEN|SECRET|PASSWORD)$/i.test(key)));

/** No shell interpolation and no provider credentials in command arguments or prompts. */
export function runAntigravity(args, { cwd, input = '', signal, env = process.env, timeoutMs = 120_000 } = {}) {
  return new Promise((resolve, reject) => {
    const childEnv = cliEnvironment(env);
    const child = spawn(env.ANTIGRAVITY_BIN || 'agy', args, { cwd, env: childEnv, windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'] });
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    let stdout = '', stderr = '', settled = false;
    const stop = () => child.kill();
    const timeout = setTimeout(stop, timeoutMs);
    signal?.addEventListener('abort', stop, { once: true });
    const finish = (error, value) => {
      if (settled) return; settled = true;
      clearTimeout(timeout); signal?.removeEventListener('abort', stop);
      error ? reject(error) : resolve(value);
    };
    child.stdout.on('data', chunk => { stdout += chunk; if (stdout.length > 2_000_000) stop(); });
    child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-32_000); });
    child.stdin.on('error', () => {});
    child.on('error', error => finish(new Error(error.code === 'ENOENT' ? 'Antigravity CLI is not installed on the server.' : 'Could not start Antigravity.')));
    child.on('close', code => {
      if (signal?.aborted) return finish(Object.assign(new Error('Request cancelled.'), { name: 'AbortError' }));
      finish(null, { code, stdout, stderr });
    });
    if (signal?.aborted) stop();
    child.stdin.end(input);
  });
}

export function createAntigravityBridge({ env = process.env, runner = runAntigravity, root = projectRoot } = {}) {
  let lastStatus = { provider: 'Antigravity', model: ANTIGRAVITY_MODEL, configured: false, signedIn: false, error: 'Check the Antigravity connection.' };
  let checkedAt = 0, checking;
  const manifest = readFile(path.join(root, 'agents/manifest.json'), 'utf8').then(JSON.parse);
  const dataRoot = path.join(root, '.office-data', 'agents');
  let running = 0;
  const waiting = [];
  const acquire = signal => new Promise((resolve, reject) => {
    const item = { start: () => { signal?.removeEventListener('abort', cancel); running++; resolve(() => { running--; waiting.shift()?.start(); }); } };
    const cancel = () => { const index = waiting.indexOf(item); if (index >= 0) waiting.splice(index, 1); reject(Object.assign(new Error('Request cancelled.'), { name: 'AbortError' })); };
    if (signal?.aborted) return cancel();
    if (running < 2) item.start(); else { waiting.push(item); signal?.addEventListener('abort', cancel, { once: true }); }
  });
  const status = async (force = false) => {
    if (!force && Date.now() - checkedAt < 60_000) return lastStatus;
    if (checking) return checking;
    checking = (async () => {
      try {
        const cwd = path.join(dataRoot, '_connection'); await mkdir(cwd, { recursive: true });
        const result = await runner(['--log-file', path.join(cwd, 'cli.log'), 'models'], { cwd, env, timeoutMs: 20_000 });
        const signedIn = result.code === 0;
        const available = result.stdout.split(/\r?\n/).some(line => line.trim().split(/\s+/)[0] === ANTIGRAVITY_MODEL);
        lastStatus = { provider: 'Antigravity', model: ANTIGRAVITY_MODEL, signedIn, configured: signedIn && available,
          error: !signedIn ? 'Sign in in the official Antigravity client on this computer, then check again.' : !available ? 'Gemini 3.8 Flash is not available to this Antigravity account.' : null };
      } catch (error) { lastStatus = { ...lastStatus, configured: false, signedIn: false, error: error.message }; }
      checkedAt = Date.now(); return lastStatus;
    })().finally(() => { checking = null; });
    return checking;
  };
  return {
    status,
    async complete({ employeeId, messages, signal }) {
      const config = await manifest;
      if (!Object.hasOwn(config.employees, employeeId)) throw new Error('Choose a valid employee.');
      const connection = await status();
      if (!connection.configured) throw new Error(connection.error);
      const release = await acquire(signal);
      try {
      const skill = await readFile(path.join(root, config.employees[employeeId].skill), 'utf8');
      const cwd = path.join(dataRoot, employeeId); await mkdir(cwd, { recursive: true });
      // Each employee gets an independent workspace and role. OAuth stays in the CLI keyring.
      await writeFile(path.join(cwd, 'AGENTS.md'), `${skill}\n\nThe office supplies conversation and project excerpts in the request. Return a text deliverable. Do not browse local credentials or unrelated files. Do not send messages, publish, deploy, or modify external systems.\n`);
      const prompt = `${skill}\n\nOFFICE CONVERSATION\n${messages.map(message => `${message.role.toUpperCase()}:\n${message.content}`).join('\n\n')}\n\nRespond as ${config.employees[employeeId].name}. Return the requested answer or deliverable directly. Do not use tools unless essential to the user's explicit task.`;
      const input = JSON.stringify({ event: 'user', message: { content: prompt } }) + '\n';
      const result = await runner(['--log-file', path.join(cwd, 'cli.log'), '--input-format', 'stream-json', '--output-format', 'stream-json', '--mode', 'plan', '--sandbox',
        '--disable-slash-commands', '--model', ANTIGRAVITY_MODEL, '--print-timeout', '110s'], { cwd, env, input, signal });
      if (result.code !== 0) { checkedAt = 0; throw new Error('Antigravity could not finish the request. Check your sign-in, quota and model access.'); }
      let response;
      try {
        const events = result.stdout.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line));
        const event = events.findLast(item => item.event === 'result');
        response = event?.result || event;
        if (!response) throw new Error('Missing result');
      } catch { throw new Error('Antigravity returned an unreadable response.'); }
      const responseStatus = String(response.status || '').toLowerCase();
      if (responseStatus !== 'success' && responseStatus !== 'completed' && responseStatus !== 'ok') {
        // Some CLI versions report status as a nested result; never show their raw diagnostics.
        if (responseStatus && responseStatus !== 'complete') throw new Error('Antigravity did not complete the response.');
      }
      if (typeof response.response !== 'string' || !response.response.trim()) throw new Error('Antigravity returned an empty response.');
      return { content: response.response.trim(), model: ANTIGRAVITY_MODEL, usage: response.usage };
      } finally { release(); }
    },
    async signIn() {
      if ((await status(true)).configured) return { opened: false, alreadyConnected: true };
      if (process.platform !== 'win32') throw new Error('Run agy in a terminal on the server and complete its official sign-in flow.');
      await new Promise((resolve, reject) => {
        const child = spawn('powershell.exe', ['-NoProfile', '-File', path.join(root, 'scripts/sign-in-antigravity.ps1')], { windowsHide: true, shell: false, stdio: 'ignore' });
        child.once('error', () => reject(new Error('Open Antigravity on this computer to sign in.')));
        child.once('exit', code => code === 0 ? resolve() : reject(new Error('Could not open Antigravity. Run agy in a terminal.')));
      });
      checkedAt = 0; return { opened: true };
    },
  };
}
