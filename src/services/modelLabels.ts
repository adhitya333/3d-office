export const modelLabel = (model: string | null | undefined): string => {
  const labels: Record<string,string> = {
    'gemini-3.8-flash-low':'Gemini 3.8 Flash · Quick', 'gemini-3.8-flash-medium':'Gemini 3.8 Flash · Balanced', 'gemini-3.8-flash-high':'Gemini 3.8 Flash · Deep',
    'gpt-6.1-sol':'GPT-6.1 Sol', 'gpt-6.1-terra':'GPT-6.1 Terra', 'gpt-6-luna':'GPT-6 Luna',
  };
  return model ? labels[model] || model : 'Not connected';
};
