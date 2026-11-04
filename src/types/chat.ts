export interface ChatImage { id: string; url: string; name: string; mime: string; }
export interface ChatTurn { role: 'user' | 'assistant'; content: string; images?: ChatImage[]; }
export interface ChatOptions { purpose?: 'chat' | 'image'; onImages?: (images: ChatImage[]) => void; onModel?: (model: string) => void; }
