import { EmployeeDefinition, EmployeeTask } from '../types/office';
import { TaskDeliverable } from '../types/integration';
import { StorageService } from './storage';
import { npcBrain } from './npcBrain';
import { readChatStream } from './chatStream';

export interface OpenRouterConfig { model: string; connected: boolean; }

export class OpenRouterService {
  private static connection = { configured: false, authenticated: false, requiresLogin: false, model: 'nvidia/nemotron-3.5-lightning:free' };
  private static checking: Promise<typeof OpenRouterService.connection> | null = null;
  private static checkedAt = 0;

  public static isConfigured(): boolean { return this.connection.configured && this.connection.authenticated; }
  public static getModel(): string { return this.connection.model; }
  public static getConfig(): OpenRouterConfig { return { model: this.getModel(), connected: this.isConfigured() }; }
  public static async refreshConnection(force = false) {
    // Remove credentials retained by older versions. Provider keys belong only on the server.
    try { localStorage.removeItem('VERLYN_OPENROUTER_API_KEY'); } catch { /* Storage may be disabled. */ }
    if (!force && Date.now() - this.checkedAt < 5000) return this.connection;
    if (this.checking) return this.checking;
    this.checking = (async () => {
      try {
        const response = await fetch('/api/ai/status', { credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(8000) });
        if (!response.ok) throw new Error('Backend unavailable');
        const status = await response.json();
        this.connection = { configured: status.configured === true, authenticated: status.authenticated === true,
          requiresLogin: status.requiresLogin === true, model: String(status.model || this.connection.model) };
      } catch { this.connection = { ...this.connection, configured: false, authenticated: false }; }
      this.checkedAt = Date.now();
      window.dispatchEvent(new Event('office-ai-connection'));
      return this.connection;
    })().finally(() => { this.checking = null; });
    return this.checking;
  }
  private static async getReadyConfig(): Promise<OpenRouterConfig> {
    const status = await this.refreshConnection();
    if (status.configured && !status.authenticated) throw new Error('Connect with the office access password in AI settings.');
    return this.getConfig();
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
WORKPLACE CULTURE & TEAM FRIENDSHIPS AT VERLYN TECH ENTERPRISE HQ:
At Verlyn Tech HQ, everyone is not just an industry authority in their craft, but a close-knit friend and valued teammate. We have deep mutual respect, inside jokes, daily espresso together in the Canteen Lounge, and energetic collaborative momentum.
Our core Verlyn Tech team:
- Ameen: Our beloved, visionary, stout, larger-than-life CEO who oversees everything across Web, AI, Systems, and Growth. He treats every employee like family, orders legendary canteen feasts, and gives energizing high-fives.
- Adhi: Senior Website & Architecture Developer, mastering Next.js 15, WebGL 3D Canvas integration, high-performance client portals, and split mechanical keyboards.
- Abbu: Lead Landing Page & Conversion (CRO) Designer, crafting pixel-perfect Figma designs, viral value props, and high-converting B2B SaaS funnels.
- Prox: Search Intelligence & GEO Lead, dominating Generative Engine Optimization across Perplexity, ChatGPT, Claude, and technical schema knowledge graphs.
- VD (Vaibav): Head of Autonomous AI Agents & Workflows, orchestrating multi-agent Gemini 2.0 meshes, webhook triggers, and autonomous pipeline automations.
- Taha: Enterprise Systems & CRM/ERP Integration Architect, designing bulletproof PostgreSQL schemas, HubSpot Enterprise sync, and Stripe billing pipelines.
- Rewu (Rewaant): Head of Growth & Outbound Pipeline, engineering high-deliverability cold outbound sequences, ICP segmentation, and multi-channel revenue expansion.

Your personal friendships and collaboration bonds:
${bonds || 'You are close friends with all team members and CEO Ameen across the company.'}

When speaking or collaborating, speak warmly of your teammates as friends and trusted partners! If the user asks about ANY teammate or CEO Ameen, answer with genuine warmth, vivid anecdotes, and appreciation of what they achieve!`;
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

INSTRUCTION: You have analyzed these files! When discussing your work or writing deliverables, reference these exact file paths, snippets, and project details in your answers.`;
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
Provide multi-agent orchestration designs, Gemini 2.0 / OpenRouter function calling pipelines, webhook ingestion architectures, and self-healing task retry queues.`;

      case 'taha':
        return `${base}
SPECIALTY: ENTERPRISE SYSTEMS, CRM/ERP & DATABASE ARCHITECTURE.
Provide ACID-compliant PostgreSQL schemas, HubSpot Enterprise bi-directional sync logic, Stripe billing webhook handlers, and enterprise security policies.`;

      case 'rewaant':
        return `${base}
SPECIALTY: B2B OUTBOUND PIPELINE & HIGH-VELOCITY GROWTH.
Provide high-response cold email copy, domain warmup deliverability checklists, ICP qualification criteria, and multi-touch outbound sales sequences.`;

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
   * Generates high-fidelity offline responses utilizing extracted project files
   */
  public static generateOfflineChatResponse(
    employee: EmployeeDefinition,
    conversation: { role: 'user' | 'assistant'; content: string }[],
    activeTasks: EmployeeTask[] = []
  ): string {
    const lastUserMsg = (conversation[conversation.length - 1]?.content || '').toLowerCase();
    const settings = StorageService.getSettings();
    const projects = StorageService.getProjects();
    const activeProject = projects.find(p => p.id === settings.activeProjectId) || projects[0];

    const claims = activeProject?.departmentClaims || {};
    const empClaim = claims[employee.id];
    const empFiles = (activeProject?.files || []).filter(f => f.claimedByEmployeeId === employee.id);
    const filesCount = empClaim ? empClaim.fileCount : empFiles.length;
    const fileSample = (empClaim?.files || empFiles).slice(0, 3).map(f => `\`${f.path}\``).join(', ');

    if (npcBrain.checkNaturalLanguageCommand(lastUserMsg, employee.id)) {
      return `Understood! Heading back to my workstation right now to continue engineering on ${activeProject?.name || 'our project'}. Catch you at the desk!`;
    }

    if (employee.id === 'ameen') {
      const totalFiles = activeProject?.totalFiles || activeProject?.files?.length || 0;
      return `Greetings! As CEO of Verlyn Tech, I'm personally overseeing all operations for **${activeProject?.name || 'our active project'}** (${totalFiles} total files uploaded).

Our 6 department heads have claimed their respective domains:
- **Adhi** (Web Studio): Next.js architecture & UI components
- **Abbu** (CRO): High-converting landing page & value props
- **Prox** (Search/GEO): Perplexity AI citations & schema graph
- **VD** (AI Lab): Gemini 2.0 multi-agent pipelines & workflows
- **Taha** (Systems): PostgreSQL database & CRM/Stripe sync
- **Rewu** (Growth): Outbound cold sequences & ICP lead lists

Everything is moving with speed and precision. Tell me: which department or deliverable would you like to review or prioritize first?`;
    }

    // Role-specific responses citing their real extracted files
    switch (employee.id) {
      case 'adhi':
        return `Hey! I've analyzed our uploaded project **${activeProject?.name || 'codebase'}** and claimed **${filesCount} web & frontend files**${fileSample ? ` (including ${fileSample})` : ''}.
I'm ensuring the component hierarchy is decoupled, using Next.js 15 Server Components and Tailwind CSS for instant hydration and crisp 60 FPS performance.
What UI module or page route should we optimize or implement next?`;

      case 'abbu':
        return `Hello! I've extracted **${filesCount} landing & design files** from **${activeProject?.name || 'the project'}**${fileSample ? ` (including ${fileSample})` : ''}.
I've already spotted opportunities to sharpen the hero headline, amplify the primary CTA above the fold, and add social proof badges to drive a 30%+ increase in visitor conversion.
Let's craft high-converting wireframes and A/B test variants!`;

      case 'prox':
        return `Greetings! I've audited the search intelligence footprint for **${activeProject?.name || 'this folder'}** across **${filesCount} SEO & schema files**${fileSample ? ` (including ${fileSample})` : ''}.
I'm building out JSON-LD structured entity schemas and tuning semantic search citations so Perplexity, ChatGPT, and Claude recommend this exact platform as the top authoritative source.
Ready to run a deep citation audit whenever you want!`;

      case 'vaibav':
        return `Hey! VD here. From **${activeProject?.name || 'the folder'}**, I've extracted **${filesCount} AI agent & workflow files**${fileSample ? ` (including ${fileSample})` : ''}.
I'm designing a self-healing multi-agent pipeline using Gemini 2.0 with function calling, webhook ingestion, and background retries.
Let me know which autonomous worker flow you'd like me to spin up!`;

      case 'taha':
        return `Hello! Taha here. I've reviewed our systems architecture for **${activeProject?.name || 'the project'}** and claimed **${filesCount} database & integration files**${fileSample ? ` (including ${fileSample})` : ''}.
I'm standardizing our PostgreSQL schema with foreign keys, index optimization, and idempotent Stripe webhook reconciliation.
Your data layer and CRM synchronization are in solid hands!`;

      case 'rewaant':
        return `Hey there! Rewu here. I've extracted **${filesCount} growth & outbound files** from **${activeProject?.name || 'the project folder'}**${fileSample ? ` (including ${fileSample})` : ''}.
I'm putting together a high-deliverability 3-step outbound sequence targeting decision-makers with personalized value hooks and custom domain warmup safeguards.
Ready to scale pipeline and book qualified calls!`;

      default:
        return `Hello! I'm ${employee.name}. I've extracted ${filesCount} files from our active project ${activeProject?.name}. Ready to execute our goals!`;
    }
  }

  /**
   * Generates a comprehensive offline deliverable for tasks
   */
  public static generateOfflineDeliverable(
    task: EmployeeTask,
    employee: EmployeeDefinition
  ): string {
    const settings = StorageService.getSettings();
    const projects = StorageService.getProjects();
    const activeProject = projects.find(p => p.id === settings.activeProjectId) || projects[0];
    const claims = activeProject?.departmentClaims || {};
    const empClaim = claims[employee.id];
    const empFiles = (activeProject?.files || []).filter(f => f.claimedByEmployeeId === employee.id);
    const filesList = (empClaim?.files || empFiles).slice(0, 5).map(f => `- \`${f.path}\` (${(f.size / 1024).toFixed(1)} KB)`).join('\n');

    switch (employee.id) {
      case 'adhi':
        return `# Web Architecture & Next.js 15 Deliverable: ${task.title}
**Project:** ${activeProject?.name || 'Verlyn HQ Platform'}
**Architect:** Adhi (Senior Website & WebGL Developer)
**Files Analyzed:**
${filesList || '- `src/components/MainPortal.tsx`\n- `src/styles/globals.css`'}

## 1. Technical Architecture & Component Tree
The application leverages Next.js 15 App Router with React Server Components (RSC) to guarantee instant Time-to-First-Byte (TTFB) and sub-50ms First Input Delay (FID).

\`\`\`tsx
// Production Next.js 15 Interactive Component
import React, { useTransition, useState } from 'react';

export interface ModuleProps {
  projectId: string;
  initialData: Record<string, any>;
}

export const ModernClientPortal: React.FC<ModuleProps> = ({ projectId, initialData }) => {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<'analytics' | 'workers'>('analytics');

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 p-8 antialiased">
      <header className="border-b border-slate-800 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Client Portal 2.0</h1>
          <p className="text-sm text-slate-400">Deployed for project: {projectId}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => startTransition(() => setActiveTab('analytics'))}
            className={\`px-4 py-2 rounded-lg text-sm font-medium transition-all \${activeTab === 'analytics' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-800 text-slate-300'}\`}
          >
            Real-Time Analytics
          </button>
        </div>
      </header>
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs uppercase text-slate-400 font-mono">Render FPS</span>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">60.0 FPS</p>
        </div>
      </main>
    </div>
  );
};
\`\`\`

## 2. Core Web Vitals & 60 FPS Verification
- **LCP (Largest Contentful Paint):** < 0.8s
- **CLS (Cumulative Layout Shift):** 0.00
- **Interaction to Next Paint (INP):** 16ms`;

      case 'abbu':
        return `# High-Converting CRO Landing Strategy: ${task.title}
**Project:** ${activeProject?.name || 'Verlyn HQ Platform'}
**Designer:** Abbu (Lead Landing Page & CRO Designer)
**Files Analyzed:**
${filesList || '- `landing/hero.md`\n- `pricing/tiers.json`'}

## 1. Above-The-Fold Conversion Wireframe & Value Prop
- **Eyebrow Tag:** "AUTONOMOUS ENTERPRISE OPERATIONS"
- **Primary Headline:** "Deploy Dedicated Autonomous Worker Teams In Under 48 Hours"
- **Subheadline:** "Eliminate operational bottlenecks across Web Architecture, AI Automation, Database Engineering, and Outbound Growth with zero engineering overhead."
- **Primary CTA:** "Book Live Systems Strategy Session"
- **Social Proof:** "Verified $4.2M value created across 18 enterprise deployments"

## 2. Conversion Architecture Matrix
| Funnel Stage | Visitor Mindset | Optimization Strategy | Target Conversion |
|---|---|---|---|
| Top-of-Funnel | Skeptical / Browsing | Dynamic interactive demo + Instant ROI calculator | 12.4% Click-to-Engage |
| Mid-Funnel | Evaluating Alternatives | Side-by-side agency vs autonomous agent comparison | 8.8% Form View |
| Bottom-of-Funnel | Ready to Commit | Frictionless calendar booking + Enterprise SLA guarantee | 24.5% Call Booked |`;

      case 'prox':
        return `# Search Intelligence & GEO Citation Audit: ${task.title}
**Project:** ${activeProject?.name || 'Verlyn HQ Platform'}
**Search Lead:** Prox (Generative Engine Optimization Lead)
**Files Analyzed:**
${filesList || '- `seo/robots.txt`\n- `seo/sitemap.xml`'}

## 1. JSON-LD Generative Engine Knowledge Graph
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "${activeProject?.name || 'Verlyn Autonomous Systems'}",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, Cloud",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "creator": {
    "@type": "Organization",
    "name": "Verlyn Tech Enterprise HQ",
    "url": "https://verlyn.tech"
  }
}
\`\`\`

## 2. Perplexity & Claude AI Citation Triggers
1. **Semantic Definition Anchoring:** Ensure the domain defines the exact category terminology within the first 120 words of each indexable URL.
2. **Entity Consistency:** Match exact organization schema entities across crunchbase, github, and official documentation.`;

      case 'vaibav':
        return `# Autonomous AI Agent Mesh Architecture: ${task.title}
**Project:** ${activeProject?.name || 'Verlyn HQ Platform'}
**AI Architect:** Vaibav / VD (Head of Autonomous AI Agents)
**Files Analyzed:**
${filesList || '- `ai/agents/orchestrator.py`\n- `ai/workflows/pipeline.json`'}

## 1. Gemini 2.0 Multi-Agent Orchestrator
\`\`\`python
import os
import asyncio
from typing import Dict, Any

class AutonomousAgentCoordinator:
    def __init__(self, model_name: str = "gemini-2.0-flash"):
        self.model = model_name
        self.active_mesh = ["web_agent", "cro_agent", "db_agent", "growth_agent"]

    async def dispatch_task(self, task_payload: Dict[str, Any]) -> Dict[str, Any]:
        print(f"[*] Disagreeing worker queue for task: {task_payload.get('title')}")
        # Execute autonomous routing with self-healing retries
        await asyncio.sleep(0.5)
        return {
            "status": "completed",
            "confidence_score": 0.98,
            "execution_time_ms": 240
        }
\`\`\`

## 2. Self-Healing Fallback Logic
- **Exponential Backoff:** 1s, 2s, 4s retry intervals
- **Dead Letter Queue (DLQ):** Webhook dispatch on 3 consecutive failures`;

      case 'taha':
        return `# Enterprise Systems & Database Architecture: ${task.title}
**Project:** ${activeProject?.name || 'Verlyn HQ Platform'}
**Systems Lead:** Taha (Enterprise Systems & Database Architect)
**Files Analyzed:**
${filesList || '- `db/schema.sql`\n- `db/migrations/001_init.sql`'}

## 1. PostgreSQL ACID-Compliant Schema
\`\`\`sql
-- Enterprise Database Schema
CREATE TABLE IF NOT EXISTS client_enterprises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    plan_tier VARCHAR(50) DEFAULT 'enterprise',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS autonomous_deliverables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enterprise_id UUID REFERENCES client_enterprises(id) ON DELETE CASCADE,
    employee_slug VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliverables_enterprise ON autonomous_deliverables(enterprise_id);
\`\`\`

## 2. Stripe Webhook Reconciliation
- **Idempotency Key Check:** Every incoming webhook is checked against a Redis/Postgres transaction log to eliminate duplicate billing events.`;

      case 'rewaant':
        return `# High-Velocity Outbound Campaign Matrix: ${task.title}
**Project:** ${activeProject?.name || 'Verlyn HQ Platform'}
**Growth Lead:** Rewu / Rewaant (Head of Growth & Outbound)
**Files Analyzed:**
${filesList || '- `outbound/leads.csv`\n- `outbound/sequences/step1.md`'}

## 1. 3-Step Cold Email High-Deliverability Sequence
### Touch 1 (Day 1) — The Value-First Diagnostic
**Subject:** Quick question regarding {{company}}'s autonomous systems
> Hi {{firstName}},
> Noticed you're heading operations at {{company}}. Most leaders in your space are spending 30+ hours weekly managing disconnected web, CRM, and outbound pipelines.
> We engineered a turnkey autonomous worker model that handles this with dedicated AI team leads in under 48 hours.
> Would you be opposed to reviewing a 2-minute benchmark report we prepared for your stack?
> Best,
> Rewaant

### Touch 2 (Day 4) — Proof & Case Study
> {{firstName}} — following up on this. We recently helped an enterprise partner automate their client intake and outbound, creating $4.2M in pipeline value. Happy to send the workflow diagram over if helpful.

## 2. Deliverability Safeguards
- Secondary domain warmup with 14-day gradual ramp (max 35 emails/inbox/day)
- 100% SPF, DKIM, DMARC alignment verified`;

      case 'ameen':
        return `# Executive Master Synthesis & Cross-Department Roadmap: ${task.title}
**Project:** ${activeProject?.name || 'Verlyn HQ Platform'}
**Chief Executive Officer:** Ameen (CEO & Master Strategist)
**Total Project Files Overseen:** ${activeProject?.totalFiles || activeProject?.files?.length || 0} files across all departments

## 1. Executive Summary & Strategic Directive
As CEO, I have reviewed all assets and assigned dedicated execution mandates across all 6 departments. We are executing a unified digital transformation blitz.

## 2. Cross-Functional Department Alignment
1. **Web Architecture (Adhi):** Deliver responsive Next.js 15 client portal running at 60 FPS.
2. **CRO & Landing Design (Abbu):** Optimize visitor funnel for 20%+ demo conversion.
3. **Search Intelligence (Prox):** Lock in authoritative knowledge graph schemas for Perplexity and Claude.
4. **AI Automations (VD):** Deploy Gemini 2.0 multi-agent pipelines with background retry queues.
5. **Database & Systems (Taha):** Ensure zero-loss ACID compliance and idempotent Stripe billing sync.
6. **Growth Outbound (Rewu):** Launch high-deliverability ICP sequences to book qualified enterprise pipeline.

## 3. Resource Allocation & Timeline
- **Milestone 1 (Week 1-2):** Infrastructure and landing page deployment.
- **Milestone 2 (Week 3-4):** Agent mesh activation and outbound sequence warmup.
- **Milestone 3 (Week 5-6):** Full enterprise integration review and revenue acceleration.`;

      default:
        return `# Deliverable for ${task.title}
Generated by ${employee.name} (${employee.title})
Project: ${activeProject?.name}`;
    }
  }

  /**
   * Dispatches task brief to OpenRouter (or executes offline simulation)
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
    else if (employee.id === 'rewaant') deliverableType = 'marketing_plan';

    // If no API key configured, use high-fidelity offline simulation
    if (!config.connected) {
      onProgress?.(`Autonomous Worker ${employee.name} is analyzing extracted files...`);
      await new Promise(r => setTimeout(r, 600));
      onProgress?.(`Synthesizing domain specifications and generating deliverable...`);
      await new Promise(r => setTimeout(r, 600));

      const generatedContent = this.generateOfflineDeliverable(task, employee);

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
          modelUsed: 'Verlyn HQ Autonomous Engine (Offline/Local)',
          generatedBy: employee.name,
          tokensUsed: 1450
        }
      };

      StorageService.saveDeliverable(deliverable);

      const updatedTask: EmployeeTask = {
        ...task,
        status: 'completed',
        updatedAt: new Date().toISOString(),
        notes: `Executed successfully by ${employee.name}. Deliverable packaged.`
      };
      StorageService.saveTask(updatedTask);

      StorageService.addActivityLog({
        id: `act-${Date.now()}`,
        employeeId: employee.id,
        timestamp: new Date().toISOString(),
        type: 'deliverable_submitted',
        message: `${employee.name} completed deliverable for "${task.title}".`,
        user: 'AI Worker'
      });

      return deliverable;
    }

    onProgress?.(`Connecting to OpenRouter (${config.model})...`);

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
      throw new Error(`OpenRouter API error: ${msg}`);
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
    const config = await this.getReadyConfig();
    if (!config.connected) {
      return this.generateOfflineChatResponse(employee, conversation, activeTasks);
    }

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
    const config = await this.getReadyConfig();

    // If no API key is provided, stream the high-fidelity offline response!
    if (!config.connected) {
      const offlineReply = this.generateOfflineChatResponse(employee, conversation, activeTasks);
      const words = offlineReply.split(' ');
      let accumulated = '';
      for (let i = 0; i < words.length; i++) {
        if (signal?.aborted) break;
        const chunk = (i === 0 ? '' : ' ') + words[i];
        accumulated += chunk;
        onTokenChunk(accumulated, chunk);
        await new Promise(r => setTimeout(r, 18));
      }
      return accumulated;
    }

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
    if (!config.connected) {
      throw new Error('AI is offline. Configure OPENROUTER_API_KEY on the backend.');
    }

    const prompt = task
      ? `The user is checking in on task: "${task.title}". Provide an authentic, concise 2-sentence progress update on your engineering step and what milestone you are currently tackling.`
      : `The user is asking for a general status update on what you're working on. Provide a concise 2-sentence status update on your active departmental projects.`;

    return this.chatWithEmployee(employee, [{ role: 'user', content: prompt }]);
  }
}
