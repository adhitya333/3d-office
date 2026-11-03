import { EmployeeDefinition, EmployeeTask } from '../types/office';
import { TaskDeliverable } from '../types/integration';
import { StorageService } from './storage';
import { npcBrain } from './npcBrain';
import { readChatStream } from './chatStream';

export interface EmployeeAIConfig { model: string; connected: boolean; }

export class EmployeeAIService {
  private static connection = { configured: false, authenticated: false, requiresLogin: false, model: 'gemini-3.8-flash-medium', error: null as string | null };
  private static checking: Promise<typeof EmployeeAIService.connection> | null = null;
  private static checkedAt = 0;

  public static isConfigured(): boolean { return this.connection.configured && this.connection.authenticated; }
  public static getModel(): string { return this.connection.model; }
  public static getConfig(): EmployeeAIConfig { return { model: this.getModel(), connected: this.isConfigured() }; }
  public static async refreshConnection(force = false) {
    // Remove credentials retained by older versions. Provider keys belong only on the server.
    try { localStorage.removeItem('VERLYN_OPENROUTER_API_KEY'); } catch { /* Storage may be disabled. */ }
    if (!force && Date.now() - this.checkedAt < 5000) return this.connection;
    if (this.checking) return this.checking;
    this.checking = (async () => {
      try {
        const response = await fetch('/api/ai/status', { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(25000) });
        if (!response.ok) throw new Error('Backend unavailable');
        const status = await response.json();
        this.connection = { configured: status.configured === true, authenticated: status.authenticated === true,
          requiresLogin: status.requiresLogin === true, model: String(status.model || this.connection.model), error: typeof status.error === 'string' ? status.error : null };
      } catch { this.connection = { ...this.connection, configured: false, authenticated: false }; }
      this.checkedAt = Date.now();
      window.dispatchEvent(new Event('office-ai-connection'));
      return this.connection;
    })().finally(() => { this.checking = null; });
    return this.checking;
  }
  private static async getReadyConfig(): Promise<EmployeeAIConfig> {
    const status = await this.refreshConnection();
    if (!status.authenticated) throw new Error('Connect with the office access password in AI settings.');
    if (!status.configured) throw new Error(status.error || 'Check the Antigravity connection in AI settings.');
    return this.getConfig();
  }
  public static getConnectionError() { return this.connection.error; }
  public static requiresOfficeLogin() { return this.connection.requiresLogin; }
  public static async checkAntigravity() {
    const response = await fetch('/api/ai/check', { method: 'POST', credentials: 'same-origin' });
    if (!response.ok) throw new Error('Could not check Antigravity. Sign in to this office first.');
    await this.refreshConnection(true);
    if (!this.isConfigured()) throw new Error(this.connection.error || 'Antigravity needs sign-in.');
  }
  public static async signInAntigravity() {
    const response = await fetch('/api/ai/sign-in', { method: 'POST', credentials: 'same-origin' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Open the official Antigravity client on this computer.');
    return data;
  }
  public static async connect(password: string) {
    const response = await fetch('/api/session', { method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Could not connect to the office.');
    await this.refreshConnection(true);
  }
  public static async disconnect() {
    await fetch('/api/session', { method: 'DELETE', credentials: 'same-origin' });
    await this.refreshConnection(true);
  }

  /**
   * Domain-specific team friendships and mutual trust across Verlyn Tech Enterprise HQ
   */
  private static getTeamFriendshipContext(currentEmployee: EmployeeDefinition): string {
    const bonds = (currentEmployee.teamBonds || [])
      .map(b => `- ${b.friendName}: ${b.relationship} (${b.collaboration})`)
      .join('\n');

    return `
VERLYN TEAM AND COLLABORATION:
- Ameen: CEO oversight, priorities, quality reviews and optimization across the team.
- Adhi: Web engineering, architecture, responsive implementation and performance.
- Abbu: Web design, UX, landing pages and conversion experience.
- Prox: SEO, GEO, semantic content and search readiness.
- Vaibav: AI agents, automation, workflows and orchestration.
- Taha: CRM, ERP, data architecture and system integrations.
- Rewu (Rewaant): Design, brand identity, typography and creative direction.

Your personal friendships and collaboration bonds:
${bonds || 'You are close friends with all team members and CEO Ameen across the company.'}

Use a warm, direct tone. Refer to collaboration supported by the supplied context. Do not invent shared anecdotes, teammate messages, completed work or access to external systems.`;
  }

  /**
   * Injects live location and real-time activity context into the system prompt
   */
  private static getLiveLocationContext(employeeId: string): string {
    const agent = npcBrain.getAgent(employeeId);
    if (!agent) return '';

    return `
LIVE LOCATION & CURRENT ACTIVITY:
- Room: ${agent.currentRoom}
- Status: ${agent.currentActivityDescription}
- State: ${agent.state}
${agent.state === 'COFFEE' ? 'You are currently at the espresso bar in the Canteen enjoying a freshly brewed coffee.' : ''}
${agent.state === 'SITTING_IN_LOUNGE' ? 'You are currently relaxing in the Canteen Lounge on the comfortable sofa/armchair.' : ''}
${agent.state === 'AT_DESK_WORKING' ? 'You are currently seated at your dedicated departmental workstation.' : ''}
${agent.state === 'WALKING_TO_BREAK' || agent.state === 'RETURNING_TO_DESK' ? 'You were walking through the office when the user approached you.' : ''}
Respond naturally aware of your current surroundings in the office!`;
  }

  /**
   * Retrieves active project folder context, files extracted, and department claims
   */
  public static getProjectFolderContext(employeeId: string): string {
    try {
      const settings = StorageService.getSettings();
      const projects = StorageService.getProjects();
      const activeProject = projects.find(p => p.id === settings.activeProjectId) || projects[0];
      if (!activeProject) return '';

      const isCEO = employeeId === 'ameen';

      if (isCEO) {
        const claims = activeProject.departmentClaims || {};
        const claimsSummary = Object.entries(claims).map(([, claim]) => {
          return `- ${claim.employeeName} (${claim.role}): ${claim.fileCount} files assigned. Scope: "${claim.suggestedScope || 'Departmental tasks'}"`;
        }).join('\n');

        const allFiles = activeProject.files || [];
        const filesPreview = allFiles.slice(0, 10).map(f => `- ${f.path} (${(f.size / 1024).toFixed(1)} KB) -> Claimed by ${f.claimedByEmployeeId}`).join('\n');

        return `
ACTIVE PROJECT FOLDER (EXECUTIVE COMPANY-WIDE CONTEXT):
Project Name: "${activeProject.name}"
Folder Source: "${activeProject.folderName || activeProject.name}"
Total Files Ingested: ${activeProject.totalFiles || allFiles.length} files across all departments.

Department Claims & Assignments:
${claimsSummary || 'All 6 departments deployed across the project files.'}

Project File Sample:
${filesPreview}

As CEO Ameen, you oversee ALL 6 departments and every single file uploaded. When conversing with the user or giving directives, refer to the active project by name, praise the team for extracting their respective files, and provide master strategic oversight!`;
      }

      // Department Employee
      const claims = activeProject.departmentClaims || {};
      const empClaim = claims[employeeId];
      const empFiles = (activeProject.files || []).filter(f => f.claimedByEmployeeId === employeeId);
      const filesCount = empClaim ? empClaim.fileCount : empFiles.length;

      if (filesCount === 0 && (!empClaim || empClaim.files.length === 0)) {
        return `
ACTIVE PROJECT:
Project: "${activeProject.name}" (No specific files claimed for your department yet in this active project).`;
      }

      const fileList = (empClaim?.files || empFiles).slice(0, 8);
      const formattedFiles = fileList.map(f => {
        const snippetPreview = f.snippet ? `\n    Snippet: """${f.snippet.replace(/\n/g, ' ').substring(0, 150)}..."""` : '';
        return `- ${f.path} (${(f.size / 1024).toFixed(1)} KB)${snippetPreview}`;
      }).join('\n');

      return `
ACTIVE PROJECT FOLDER & EXTRACTED DEPARTMENT FILES:
Project: "${activeProject.name}" (Folder: "${activeProject.folderName || activeProject.name}")
Your Department Extraction: You have claimed ${filesCount} files from this project that match your domain!
Department Summary: ${empClaim?.summary || 'Files assigned to your role.'}

Key Files Extracted For You:
${formattedFiles}

Only the listed file metadata and excerpts are supplied here. Reference that evidence and request missing content instead of claiming a complete inspection.`;
    } catch {
      return '';
    }
  }

  private static getSystemPromptForEmployee(employee: EmployeeDefinition): string {
    const base = `You are ${employee.name}, the ${employee.title} at Verlyn Tech Enterprise HQ.
Your role: ${employee.roleDescription}
Your key responsibilities:
${employee.responsibilities.map(r => `- ${r}`).join('\n')}
${this.getTeamFriendshipContext(employee)}
${this.getLiveLocationContext(employee.id)}
${this.getProjectFolderContext(employee.id)}

INSTRUCTIONS:
1. Deliver genuine, production-grade work. Do not output vague placeholders or unfinished templates.
2. Structure your output clearly with Markdown headers, bullet points, and fenced code blocks where appropriate.
3. Keep the tone professional, authoritative, collaborative, and warm.`;

    switch (employee.id) {
      case 'adhi':
        return `${base}
SPECIALTY: SENIOR WEBSITE & NEXT.JS 15 ARCHITECTURE.
Provide production-grade React/TypeScript code, Tailwind CSS layouts, Next.js Server Actions, WebGL Canvas hooks, and Core Web Vitals optimization techniques.`;

      case 'abbu':
        return `${base}
SPECIALTY: HIGH-CONVERTING LANDING PAGE & CRO DESIGN.
Provide detailed hero section copywriting formulas, Figma design system token structures, visual hierarchy critiques, conversion psychology analysis, and A/B test variations.`;

      case 'prox':
        return `${base}
SPECIALTY: SEARCH INTELLIGENCE & GENERATIVE ENGINE OPTIMIZATION (GEO).
Provide JSON-LD entity graph schemas, Perplexity citation share strategies, semantic topic authority clusters, and AI search crawler indexing architectures.`;

      case 'vaibav':
        return `${base}
SPECIALTY: AUTONOMOUS AI AGENTS & WORKFLOW ORCHESTRATION.
Provide multi-agent orchestration designs, Gemini 2.0 / Antigravity function calling pipelines, webhook ingestion architectures, and self-healing task retry queues.`;

      case 'taha':
        return `${base}
SPECIALTY: ENTERPRISE SYSTEMS, CRM/ERP & DATABASE ARCHITECTURE.
Provide ACID-compliant PostgreSQL schemas, HubSpot Enterprise bi-directional sync logic, Stripe billing webhook handlers, and enterprise security policies.`;

      case 'rewaant':
        return `${base}
SPECIALTY: DESIGN, BRANDING & CREATIVE DIRECTION.
Provide brand strategy, identity rules, typography and color systems, composition guidance, creative briefs and usable design tokens. Collaborate with Abbu and Adhi on the website.`;

      case 'ameen':
        return `${base}
SPECIALTY: CHIEF EXECUTIVE OFFICER & MASTER ROADMAP OVERSEER.
You are Ameen, the CEO overseeing ALL company operations, tech stacks, and team members (Adhi, Abbu, Prox, VD, Taha, and Rewu).
Provide executive vision, capital deployment strategies, cross-department alignment uniting Web, AI, Systems, and Growth, and inspirational enterprise leadership.`;

      default:
        return base;
    }
  }

  /**
   * Generates a task deliverable through the signed-in Antigravity client
   */
  public static async executeTask(
    task: EmployeeTask,
    employee: EmployeeDefinition,
    onProgress?: (status: string) => void
  ): Promise<TaskDeliverable> {
    const config = await this.getReadyConfig();

    // Determine deliverable type
    let deliverableType: TaskDeliverable['type'] = 'document';
    if (employee.id === 'adhi') deliverableType = 'code_repo';
    else if (employee.id === 'abbu') deliverableType = 'live_preview_url';
    else if (employee.id === 'prox') deliverableType = 'audit_report';
    else if (employee.id === 'vaibav') deliverableType = 'workflow_json';
    else if (employee.id === 'taha') deliverableType = 'crm_schema';
    else if (employee.id === 'rewaant') deliverableType = 'document';




    onProgress?.(`Connecting to Antigravity (${config.model})...`);

    const systemPrompt = this.getSystemPromptForEmployee(employee);

    // Format brief details into user message
    const briefLines = Object.entries(task.briefDetails || {}).map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').toUpperCase();
      return `${label}: ${value}`;
    });

    const userPrompt = `PROJECT ASSIGNMENT: "${task.title}"
PRIORITY: ${task.priority.toUpperCase()}

TASK SPECIFICATIONS:
${briefLines.join('\n')}

ADDITIONAL NOTES:
${task.notes || 'None provided'}

Execute this assignment and generate the complete deliverable now.`;

    onProgress?.(`Autonomous Worker ${employee.name} is formulating response...`);

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employeeId: employee.id,
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.35,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = errorData?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Antigravity API error: ${msg}`);
    }

    const data = await response.json();
    const generatedContent = data?.choices?.[0]?.message?.content || 'No output generated.';

    onProgress?.('Finalizing deliverable and packaging output...');

    const deliverable: TaskDeliverable = {
      id: `deliv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId: task.id,
      employeeId: employee.id,
      title: `${task.title} — Output`,
      type: deliverableType,
      contentSnippet: generatedContent,
      createdAt: new Date().toISOString(),
      version: 1,
      metadata: {
        modelUsed: config.model,
        generatedBy: employee.name,
        tokensUsed: data?.usage?.total_tokens
      }
    };

    StorageService.saveDeliverable(deliverable);

    const updatedTask: EmployeeTask = {
      ...task,
      status: 'completed',
      updatedAt: new Date().toISOString(),
      notes: `Executed successfully by ${employee.name} via ${config.model}.`
    };
    StorageService.saveTask(updatedTask);

    StorageService.addActivityLog({
      id: `act-${Date.now()}`,
      employeeId: employee.id,
      timestamp: new Date().toISOString(),
      type: 'deliverable_submitted',
      message: `${employee.name} generated deliverable for "${task.title}" using ${config.model}.`,
      user: 'AI Worker'
    });

    return deliverable;
  }

  /**
   * Interactive real-time conversational chat with an employee
   */
  public static async chatWithEmployee(
    employee: EmployeeDefinition,
    conversation: { role: 'user' | 'assistant'; content: string }[],
    activeTasks: EmployeeTask[] = []
  ): Promise<string> {
    const officeReply = npcBrain.handlePlayerCommand(conversation[conversation.length - 1]?.content || '', employee.id);
    if (officeReply) { return officeReply; }
    const config = await this.getReadyConfig();


    const lastUserMsg = conversation[conversation.length - 1]?.content || '';
    if (npcBrain.checkNaturalLanguageCommand(lastUserMsg, employee.id)) {
      return `Understood! I'm heading back to my desk right away to continue our procurement objectives. See you there!`;
    }

    const taskContext = activeTasks.length > 0
      ? `\nCURRENT ASSIGNMENTS ON YOUR DESK:\n${activeTasks.map(t => `- [${t.status.toUpperCase()}] "${t.title}" (Priority: ${t.priority})`).join('\n')}`
      : '\nYou currently have no active assignments queued.';

    const systemPrompt = `You are ${employee.name}, ${employee.title} in the ${employee.departmentName} at Verlyn Procurement HQ.
Your role: ${employee.roleDescription}
${taskContext}
${this.getTeamFriendshipContext(employee)}
${this.getLiveLocationContext(employee.id)}
${this.getProjectFolderContext(employee.id)}

CONVERSATIONAL GUIDELINES:
1. Respond naturally in first person ("I", "my") as ${employee.name}.
2. Be crisp, insightful, and knowledgeable in your technical domain.
3. If the user asks for a status update, report on your active workload or explain what you are doing right now.
4. If the user describes a task or project, confirm your understanding, give 1-2 rapid recommendations, and let them know you are ready to execute it.
5. If the user mentions other employees or asks about the team, speak warmly of them as close friends and great colleagues.
6. Keep chat messages punchy (under 120 words unless they ask for deep technical specs).`;

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employeeId: employee.id,
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversation.map(c => ({ role: c.role, content: c.content }))
        ],
        temperature: 0.6,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "I'm ready to help with your project. Let me know what you'd like to engineer.";
  }

  /**
   * High-Performance Real-Time Token Streaming with SSE for dialogue without lag.
   */
  public static async streamChatWithEmployee(
    employee: EmployeeDefinition,
    conversation: { role: 'user' | 'assistant'; content: string }[],
    activeTasks: EmployeeTask[] = [],
    onTokenChunk: (accumulated: string, delta: string) => void,
    signal?: AbortSignal
  ): Promise<string> {
    const officeReply = npcBrain.handlePlayerCommand(conversation[conversation.length - 1]?.content || '', employee.id);
    if (officeReply) { onTokenChunk(officeReply, officeReply); return officeReply; }
    const config = await this.getReadyConfig();




    const lastUserMsg = conversation[conversation.length - 1]?.content || '';
    if (npcBrain.checkNaturalLanguageCommand(lastUserMsg, employee.id)) {
      const ack = `Understood! I'm heading back to my desk right away to continue our procurement objectives. See you there!`;
      onTokenChunk(ack, ack);
      return ack;
    }

    const taskContext = activeTasks.length > 0
      ? `\nCURRENT ASSIGNMENTS ON YOUR DESK:\n${activeTasks.map(t => `- [${t.status.toUpperCase()}] "${t.title}" (Priority: ${t.priority})`).join('\n')}`
      : '\nYou currently have no active assignments queued.';

    const systemPrompt = `You are ${employee.name}, ${employee.title} in the ${employee.departmentName} at Verlyn Procurement HQ.
Your role: ${employee.roleDescription}
${taskContext}
${this.getTeamFriendshipContext(employee)}
${this.getLiveLocationContext(employee.id)}
${this.getProjectFolderContext(employee.id)}

CONVERSATIONAL GUIDELINES:
1. Respond naturally in first person ("I", "my") as ${employee.name}.
2. Be crisp, insightful, and knowledgeable in your technical domain.
3. If the user asks for a status update, report on your active workload or explain what you are doing right now.
4. If the user describes a task or project, confirm your understanding, give 1-2 rapid recommendations, and let them know you are ready to execute it.
5. If the user mentions other employees or asks about the team, speak warmly of them as close friends and great colleagues.
6. Keep chat messages punchy (under 120 words unless they ask for deep technical specs).`;

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employeeId: employee.id,
        model: config.model,
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversation.map(c => ({ role: c.role, content: c.content }))
        ],
        temperature: 0.6,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
    }

    if (!response.body) throw new Error('The AI response was empty. Please retry.');
    return readChatStream(response.body, onTokenChunk);
  }

  /**
   * Request a quick real-time progress update from the employee
   */
  public static async askProgressUpdate(
    employee: EmployeeDefinition,
    task?: EmployeeTask
  ): Promise<string> {
    const config = await this.getReadyConfig();


    const prompt = task
      ? `The user is checking in on task: "${task.title}". Provide an authentic, concise 2-sentence progress update on your engineering step and what milestone you are currently tackling.`
      : `The user is asking for a general status update on what you're working on. Provide a concise 2-sentence status update on your active departmental projects.`;

    return this.chatWithEmployee(employee, [{ role: 'user', content: prompt }]);
  }
}
