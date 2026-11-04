import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAntigravityBridge, ANTIGRAVITY_CONCURRENCY, EMPLOYEE_IDS } from './antigravity.mjs';
import { createChatGPTBridge } from './chatgpt.mjs';
import { CHAT_MODEL, GPT_MODEL, SUPPORTED_MODELS, employeeModelRoute } from './modelRouting.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export function createEmployeeBridge({ env = process.env, media, root = projectRoot, antigravity = createAntigravityBridge({ env, media, root }), chatgpt = createChatGPTBridge({ env, root }) } = {}) {
  const manifest = readFile(path.join(root, 'agents/manifest.json'), 'utf8').then(JSON.parse);
  const routingFile = path.join(root, '.office-data', 'model-routing.json');
  let overrides = readFile(routingFile, 'utf8').then(JSON.parse).catch(() => ({})), writes = Promise.resolve();
  let running = 0; const waiting = [];
  const acquire = signal => new Promise((resolve, reject) => {
    const item = { start: () => { signal?.removeEventListener('abort', cancel); running++; resolve(() => { running--; waiting.shift()?.start(); }); } };
    const cancel = () => { const index = waiting.indexOf(item); if (index >= 0) waiting.splice(index, 1); reject(Object.assign(new Error('Request cancelled.'), {name:'AbortError'})); };
    if (signal?.aborted) return cancel();
    if (running < ANTIGRAVITY_CONCURRENCY) item.start(); else { waiting.push(item); signal?.addEventListener('abort',cancel,{once:true}); }
  });
  const status = async (force = false) => {
    const [gemini, gpt, config, choices] = await Promise.all([antigravity.status(force),chatgpt.status(force),manifest,overrides]);
    const availableModels = [...new Set([...(gemini.configured ? gemini.availableModels || [] : []),...(gpt.configured ? gpt.availableModels || [] : [])])];
    return { provider:'ChatGPT + Antigravity', configured:availableModels.length > 0, signedIn:gemini.signedIn || gpt.signedIn,
      model:availableModels.includes(CHAT_MODEL) ? CHAT_MODEL : GPT_MODEL, availableModels, providers:{antigravity:gemini,chatgpt:gpt},
      error:availableModels.length ? null : 'Sign in with ChatGPT or Antigravity on this computer.',
      employeeModels:Object.fromEntries(EMPLOYEE_IDS.map(id=>{
        const route=employeeModelRoute(config,choices,id,availableModels);
        return [id,{...route,provider:route.model?.startsWith('gpt-')?'ChatGPT':'Antigravity',taskModel:employeeModelRoute(config,choices,id,availableModels,'task').model,imageModel:employeeModelRoute(config,choices,id,availableModels,'image').model}];
      })) };
  };
  return {
    status,
    signIn: () => antigravity.signIn(),
    signInChatGPT: () => chatgpt.signIn(),
    async setModel(employeeId, model) {
      if (!EMPLOYEE_IDS.includes(employeeId) || !SUPPORTED_MODELS.includes(model) || !(await status()).availableModels.includes(model)) throw new Error('Choose an available employee model.');
      const write = writes.then(async()=>{
        const next={...await overrides,[employeeId]:model};
        await mkdir(path.dirname(routingFile),{recursive:true}); await writeFile(routingFile+'.tmp',JSON.stringify(next)); await rename(routingFile+'.tmp',routingFile);
        overrides=Promise.resolve(next);
      });
      writes=write.catch(()=>{}); await write; return status();
    },
    async complete(options) {
      const [connection, config, choices] = await Promise.all([status(),manifest,overrides]);
      const hasImages = options.messages.some(message=>message.imageIds?.length);
      const route=employeeModelRoute(config,choices,options.employeeId,connection.availableModels,options.purpose,hasImages);
      if (!route.model) throw new Error('Sign in to the provider for this request first.');
      const release=await acquire(options.signal);
      try { return await (route.model.startsWith('gpt-')?chatgpt:antigravity).complete({...options,modelOverride:route.model}); }
      finally { release(); }
    },
  };
}
