export const CHAT_MODEL = 'gemini-3.8-flash-low';
export const TASK_MODEL = 'gemini-3.8-flash-medium';
export const GPT_MODEL = 'gpt-6.1-sol';
export const CHATGPT_MODELS = [GPT_MODEL, 'gpt-6.1-terra', 'gpt-6-luna'];
export const GEMINI_MODELS = [CHAT_MODEL, TASK_MODEL, 'gemini-3.8-flash-high'];
export const SUPPORTED_MODELS = [...GEMINI_MODELS, ...CHATGPT_MODELS];

export function employeeModelRoute(config, overrides, employeeId, availableModels, purpose = 'chat', hasImages = false) {
  const employee = config.employees[employeeId];
  if (!employee) throw new Error('Choose a valid employee.');
  const preferred = overrides[employeeId] || employee.model || config.model || CHAT_MODEL;
  const taskPreferred = overrides[employeeId] ? (preferred === CHAT_MODEL ? TASK_MODEL : preferred) : employee.taskModel || (preferred.startsWith('gpt-') ? preferred : config.taskModel || TASK_MODEL);
  const requested = hasImages || purpose === 'image' ? config.imageModel || CHAT_MODEL : purpose === 'task' ? taskPreferred : preferred;
  const candidates = hasImages || purpose === 'image' ? [CHAT_MODEL, TASK_MODEL, 'gemini-3.8-flash-high'] : [CHAT_MODEL, TASK_MODEL, GPT_MODEL];
  const model = availableModels.includes(requested) ? requested : candidates.find(candidate => availableModels.includes(candidate));
  return { model: model || null, preferredModel: preferred, requestedModel: requested, fallback: Boolean(model && model !== requested) };
}
