/** Decode SSE boundaries independently of network chunk boundaries. */
export async function readChatStream(body: ReadableStream<Uint8Array>, onChunk: (text: string, delta: string) => void): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = '', buffer = '', finished = false;
  const line = (value: string) => {
    const trimmed = value.trim();
    if (trimmed === 'data: [DONE]') { finished = true; return; }
    if (!trimmed.startsWith('data:')) return;
    let data;
    try { data = JSON.parse(trimmed.slice(5).trim()); } catch { return; }
    if (data.error) throw new Error('The AI provider interrupted the reply. Please retry.');
    const delta = data.choices?.[0]?.delta?.content;
    if (typeof delta === 'string' && delta) { text += delta; onChunk(text, delta); }
  };
  try {
    while (!finished) {
      const { value, done } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      let newline;
      while (!finished && (newline = buffer.indexOf('\n')) >= 0) {
        line(buffer.slice(0, newline)); buffer = buffer.slice(newline + 1);
      }
      if (done) { if (buffer && !finished) line(buffer); break; }
    }
    if (!text.trim()) throw new Error('The AI returned an empty reply. Please retry.');
    return text;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
