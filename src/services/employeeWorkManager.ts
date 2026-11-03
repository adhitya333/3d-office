import type { EmployeeDefinition, EmployeeTask } from '../types/office';
import type { TaskDeliverable } from '../types/integration';
import type { ChatMessage } from './storage';

export type EmployeeWorkPhase = 'idle' | 'thinking' | 'responding' | 'working';
export interface EmployeeWorkSnapshot {
  messages: ChatMessage[];
  chatStatus: 'idle' | 'thinking' | 'responding';
  isRequestingUpdate: boolean;
  executingTaskId: string | null;
  executionStatus: string;
  error: string | null;
}
interface WorkStorage {
  getChatMessages: (id: string) => ChatMessage[];
  saveChatMessage: (message: ChatMessage) => void;
  getTasksForEmployee: (id: string) => EmployeeTask[];
}
interface WorkTransport {
  streamChatWithEmployee: (employee: EmployeeDefinition, history: { role: 'user' | 'assistant'; content: string }[], tasks: EmployeeTask[], onChunk: (text: string, delta: string) => void, signal?: AbortSignal) => Promise<string>;
  askProgressUpdate: (employee: EmployeeDefinition, task?: EmployeeTask) => Promise<string>;
  executeTask: (task: EmployeeTask, employee: EmployeeDefinition, onProgress: (status: string) => void) => Promise<TaskDeliverable>;
}

export const workPhase = (state: EmployeeWorkSnapshot): EmployeeWorkPhase =>
  state.chatStatus !== 'idle' ? state.chatStatus : state.isRequestingUpdate ? 'thinking' : state.executingTaskId ? 'working' : 'idle';

/** Owns requests for the lifetime of the app. UI subscriptions never own or cancel jobs. */
export class EmployeeWorkManager {
  private states = new Map<string, EmployeeWorkSnapshot>();
  private listeners = new Map<string, Set<() => void>>();
  private globalListeners = new Set<() => void>();
  private serial = 0;

  constructor(private storage: WorkStorage, private transport: WorkTransport, private onChange?: (id: string, state: EmployeeWorkSnapshot) => void) {}

  private id(prefix: string) { return `${prefix}-${Date.now()}-${++this.serial}`; }

  public getSnapshot(id: string): EmployeeWorkSnapshot {
    let state = this.states.get(id);
    if (!state) {
      const messages = this.storage.getChatMessages(id).map(message => {
        if (message.delivery !== 'thinking' && message.delivery !== 'responding') return message;
        const recovered: ChatMessage = { ...message, delivery: 'interrupted', content: message.delivery === 'thinking'
          ? 'This reply was interrupted when the app reloaded. Send your message again to retry.'
          : `${message.content}\n\n[Reply interrupted when the app reloaded.]` };
        this.storage.saveChatMessage(recovered);
        return recovered;
      });
      state = { messages, chatStatus: 'idle', isRequestingUpdate: false, executingTaskId: null, executionStatus: '', error: null };
      this.states.set(id, state);
    }
    return state;
  }

  public subscribe(id: string, listener: () => void): () => void {
    const listeners = this.listeners.get(id) || new Set();
    listeners.add(listener);
    this.listeners.set(id, listeners);
    return () => { listeners.delete(listener); if (!listeners.size) this.listeners.delete(id); };
  }
  public subscribeAll(listener: () => void): () => void {
    this.globalListeners.add(listener);
    return () => { this.globalListeners.delete(listener); };
  }
  public getActiveEmployees(): { employeeId: string; phase: EmployeeWorkPhase }[] {
    return [...this.states].filter(([, state]) => workPhase(state) !== 'idle').map(([employeeId, state]) => ({ employeeId, phase: workPhase(state) }));
  }
  private update(id: string, change: Partial<EmployeeWorkSnapshot>) {
    const state = { ...this.getSnapshot(id), ...change };
    this.states.set(id, state);
    this.onChange?.(id, state);
    this.listeners.get(id)?.forEach(listener => listener());
    this.globalListeners.forEach(listener => listener());
  }
  public refresh(id: string) {
    const state = this.getSnapshot(id);
    const live = new Map(state.messages.filter(message => message.delivery === 'thinking' || message.delivery === 'responding').map(message => [message.id, message]));
    this.update(id, { messages: this.storage.getChatMessages(id).map(message => live.get(message.id) || message) });
  }
  public addMessage(message: ChatMessage) {
    this.getSnapshot(message.employeeId);
    this.storage.saveChatMessage(message);
    this.refresh(message.employeeId);
  }
  public clearError(id: string) { this.update(id, { error: null }); }

  public sendMessage(employee: EmployeeDefinition, text: string): Promise<void> | null {
    const state = this.getSnapshot(employee.id);
    if (!text.trim() || state.chatStatus !== 'idle') return null;
    this.refresh(employee.id);
    const history = this.getSnapshot(employee.id).messages
      .filter(message => !message.delivery || message.delivery === 'complete')
      .slice(-24)
      .map(message => ({ role: message.sender === 'user' ? 'user' as const : 'assistant' as const, content: message.content }));
    const user: ChatMessage = { id: this.id('msg-user'), employeeId: employee.id, sender: 'user', content: text.trim(), timestamp: new Date().toISOString(), delivery: 'complete' };
    const reply: ChatMessage = { id: this.id('msg-reply'), employeeId: employee.id, sender: 'employee', content: 'Thinking…', timestamp: new Date().toISOString(), delivery: 'thinking' };
    this.storage.saveChatMessage(user);
    this.storage.saveChatMessage(reply);
    this.update(employee.id, { messages: [...this.getSnapshot(employee.id).messages, user, reply], chatStatus: 'thinking', error: null });
    return this.runChat(employee, [...history, { role: 'user', content: user.content }], reply);
  }

  private async runChat(employee: EmployeeDefinition, history: { role: 'user' | 'assistant'; content: string }[], initialReply: ChatMessage) {
    let reply = initialReply;
    let lastPublish = 0;
    let lastSave = 0;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 125_000);
    const publish = (text: string, force = false) => {
      reply = { ...reply, content: text, delivery: 'responding' };
      const now = Date.now();
      if (force || now - lastSave >= 500) { this.storage.saveChatMessage(reply); lastSave = now; }
      if (force || now - lastPublish >= 80) {
        this.update(employee.id, { messages: this.getSnapshot(employee.id).messages.map(message => message.id === reply.id ? reply : message), chatStatus: 'responding' });
        lastPublish = now;
      }
    };
    try {
      const result = await this.transport.streamChatWithEmployee(employee, history, this.storage.getTasksForEmployee(employee.id), accumulated => publish(accumulated), controller.signal);
      if (!result.trim()) throw new Error('The reply was empty. Please try again.');
      reply = { ...reply, content: result, delivery: 'complete' };
      this.storage.saveChatMessage(reply);
      this.update(employee.id, { messages: this.getSnapshot(employee.id).messages.map(message => message.id === reply.id ? reply : message) });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'The connection failed.';
      reply = { ...reply, content: `I couldn't finish this reply: ${reason}`, delivery: 'failed' };
      this.storage.saveChatMessage(reply);
      this.update(employee.id, { messages: this.getSnapshot(employee.id).messages.map(message => message.id === reply.id ? reply : message), error: reason });
    } finally {
      clearTimeout(timeout);
      this.update(employee.id, { chatStatus: 'idle' });
    }
  }

  public requestProgress(employee: EmployeeDefinition, task?: EmployeeTask): Promise<void> | null {
    if (this.getSnapshot(employee.id).isRequestingUpdate) return null;
    this.update(employee.id, { isRequestingUpdate: true, error: null });
    return (async () => {
      try {
        const text = await this.transport.askProgressUpdate(employee, task);
        this.addMessage({ id: this.id('msg-update'), employeeId: employee.id, sender: 'employee', content: text, timestamp: new Date().toISOString(), delivery: 'complete' });
      } catch (error) {
        this.update(employee.id, { error: error instanceof Error ? error.message : 'Could not get an update.' });
      } finally { this.update(employee.id, { isRequestingUpdate: false }); }
    })();
  }

  public executeTask(task: EmployeeTask, employee: EmployeeDefinition): Promise<void> | null {
    if (this.getSnapshot(employee.id).executingTaskId) return null;
    this.update(employee.id, { executingTaskId: task.id, executionStatus: 'Starting task…', error: null });
    return (async () => {
      try {
        await this.transport.executeTask(task, employee, status => this.update(employee.id, { executionStatus: status }));
        this.addMessage({ id: this.id('msg-done'), employeeId: employee.id, sender: 'employee', content: `Finished “${task.title}”. You can find the deliverable in Results.`, timestamp: new Date().toISOString(), isTaskAction: true, taskId: task.id, delivery: 'complete' });
      } catch (error) {
        this.update(employee.id, { error: error instanceof Error ? error.message : 'The task failed.' });
      } finally { this.update(employee.id, { executingTaskId: null, executionStatus: '' }); }
    })();
  }
}
