import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { cliEnvironment, runAntigravity } from './antigravity.mjs';
import { CHATGPT_MODELS, GPT_MODEL } from './modelRouting.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

/** Read the official model catalog; this does not create a conversation or run inference. */
export function listChatGPTModels({ binary, env, cwd }) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, ['app-server'], { cwd, env: cliEnvironment(env), windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'ignore'] });
    let buffer = '', settled = false;
    const finish = (error, models) => {
      if (settled) return; settled = true; clearTimeout(timer); child.stdin.end(); child.kill();
      error ? reject(error) : resolve(models);
    };
    const timer = setTimeout(() => finish(new Error('Could not check the ChatGPT model catalog.')), 15_000);
    const send = value => child.stdin.write(JSON.stringify(value) + '\n');
    child.stdin.on('error', () => {});
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      buffer += chunk;
      if (buffer.length > 1_000_000) return finish(new Error('Unreadable ChatGPT model catalog.'));
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline); buffer = buffer.slice(newline + 1);
        let event; try { event = JSON.parse(line); } catch { continue; }
        if (event.id === 1 && event.result) { send({ method: 'initialized' }); send({ id: 2, method: 'model/list', params: { includeHidden: false } }); }
        if (event.id === 2) {
          if (event.error || !Array.isArray(event.result?.data)) return finish(new Error('Could not check available ChatGPT models.'));
          return finish(null, event.result.data.map(model => model.model || model.id).filter(model => CHATGPT_MODELS.includes(model)));
        }
      }
    });
    child.once('error', () => finish(new Error('Could not start the official Codex client.')));
    child.once('close', () => { if (!settled) finish(new Error('The ChatGPT model check stopped early.')); });
    send({ id: 1, method: 'initialize', params: { clientInfo: { name: 'verlyn-office', version: '1.0.0' } } });
  });
}

/** Uses the official CLI's auth store. Tokens are never read, copied, or sent to the browser. */
export function createChatGPTBridge({ env = process.env, runner = runAntigravity, modelLister = listChatGPTModels, root = projectRoot } = {}) {
  const binary = env.CODEX_BIN || (process.platform === 'win32' ? 'codex.exe' : 'codex');
  const manifest = readFile(path.join(root, 'agents/manifest.json'), 'utf8').then(JSON.parse);
  const prepared = new Map();
  let cached = { provider: 'ChatGPT', configured: false, signedIn: false, availableModels: [], error: 'Check ChatGPT sign-in.' };
  let checkedAt = 0, checking;
  const status = async (force = false) => {
    if (!force && Date.now() - checkedAt < (cached.configured ? 300_000 : 15_000)) return cached;
    if (checking) return checking;
    checking = (async () => {
      try {
        const cwd = path.join(root, '.office-data', 'chatgpt', '_connection'); await mkdir(cwd, { recursive: true });
        const result = await runner(['login', 'status'], { binary, env, cwd, timeoutMs: 15_000 });
        const signedIn = result.code === 0 && /logged in using chatgpt/i.test(result.stdout + result.stderr);
        const availableModels = signedIn ? await modelLister({ binary, env, cwd }) : [];
        cached = { provider: 'ChatGPT', signedIn, configured: signedIn && availableModels.length > 0, availableModels,
          error: !signedIn ? 'Open ChatGPT sign-in on this computer using the official Codex client.' : !availableModels.length ? 'No supported GPT model is listed for this ChatGPT account.' : null };
      } catch { cached = { ...cached, configured: false, signedIn: false, availableModels: [], error: 'Install the official Codex CLI and sign in with ChatGPT on this computer.' }; }
      checkedAt = Date.now(); return cached;
    })().finally(() => { checking = null; });
    return checking;
  };
  return {
    status,
    async complete({ employeeId, messages, purpose = 'chat', signal, onDelta, modelOverride = GPT_MODEL }) {
      if (!CHATGPT_MODELS.includes(modelOverride)) throw new Error('Choose a supported ChatGPT model.');
      const config = await manifest;
      if (!Object.hasOwn(config.employees, employeeId)) throw new Error('Choose a valid employee.');
      const connection = await status();
      if (!connection.configured) throw new Error('Sign in with ChatGPT on this computer first.');
      if (!connection.availableModels.includes(modelOverride)) throw new Error('This GPT model is unavailable to the connected account.');
      if (!prepared.has(employeeId)) prepared.set(employeeId, (async () => {
        const skill = await readFile(path.join(root, config.employees[employeeId].skill), 'utf8');
        const cwd = path.join(root, '.office-data', 'chatgpt', employeeId); await mkdir(cwd, { recursive: true });
        await writeFile(path.join(cwd, 'AGENTS.md'), `${skill}\n\nReturn only the requested answer or text deliverable. Do not call tools, inspect unrelated files, run commands, write files, publish, send messages, or change external systems.\n`);
        return { skill, cwd };
      })().catch(error => { prepared.delete(employeeId); throw error; }));
      const { skill, cwd } = await prepared.get(employeeId);
      const prompt = `${skill}\n\nSUPPLIED CONVERSATION\n${messages.map(message => `${message.role.toUpperCase()}:\n${message.content}`).join('\n\n')}\n\nRespond as ${config.employees[employeeId].name}. ${purpose === 'task' ? 'Produce the complete requested text or code deliverable.' : 'Answer directly, usually in 1–4 sentences; expand when asked for detail.'} Use only the supplied context. Do not call tools or run commands. Never claim proposed checks or external actions have been performed.`;
      const result = await runner(['--no-daemon', '-a', 'never', 'exec', '--ignore-user-config', '--ephemeral', '--skip-git-repo-check', '--sandbox', 'read-only', '--model', modelOverride,
        '-c', `model_reasoning_effort="${purpose === 'task' ? 'medium' : 'low'}"`, '-c', 'forced_login_method="chatgpt"', '--json', '-'], { binary, env, cwd, input: prompt, signal, timeoutMs: 120_000 });
      if (result.code !== 0) { checkedAt = 0; throw new Error('ChatGPT could not finish this request. Check sign-in, model access and plan limits.'); }
      let events;
      try { events = result.stdout.split(/\r?\n/).filter(Boolean).map(JSON.parse); } catch { throw new Error('ChatGPT returned an unreadable reply.'); }
      if (!events.some(event => event.type === 'turn.completed') || events.some(event => event.type === 'turn.failed' || event.type === 'error')) throw new Error('ChatGPT did not complete the response.');
      const content = events.filter(event => event.type === 'item.completed' && event.item?.type === 'agent_message').map(event => event.item.text).join('\n').trim();
      if (!content) throw new Error('ChatGPT returned an empty response.');
      onDelta?.(content, modelOverride);
      return { content, model: modelOverride, provider: 'ChatGPT', usage: events.findLast(event => event.type === 'turn.completed')?.usage };
    },
    async signIn() {
      if ((await status(true)).configured) return { alreadyConnected: true, opened: false };
      if (process.platform !== 'win32') throw new Error('Run codex login on the backend computer to sign in with ChatGPT.');
      await new Promise((resolve, reject) => {
        const child = spawn('powershell.exe', ['-NoProfile', '-File', path.join(root, 'scripts/sign-in-chatgpt.ps1')], { windowsHide: true, shell: false, stdio: 'ignore', env: cliEnvironment(env) });
        child.once('error', () => reject(new Error('Run codex login on this computer.')));
        child.once('exit', code => code === 0 ? resolve() : reject(new Error('Could not open the official ChatGPT sign-in.')));
      });
      checkedAt = 0; return { opened: true };
    },
  };
}
