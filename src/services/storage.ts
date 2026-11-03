import { EmployeeTask, Project, EmployeeActivityLog } from '../types/office';
import { TaskDeliverable } from '../types/integration';
import { DEFAULT_PROJECTS } from '../data/defaultProjects';

const STORAGE_KEYS = {
  TASKS: 'verlyn_hq_tasks_v1',
  PROJECTS: 'verlyn_hq_projects_v1',
  ACTIVITY: 'verlyn_hq_activity_v1',
  DELIVERABLES: 'verlyn_hq_deliverables_v1',
  SETTINGS: 'verlyn_hq_settings_v1',
  CHAT: 'verlyn_hq_chat_history_v1',
};

export interface ChatMessage {
  id: string;
  employeeId: string;
  sender: 'user' | 'employee';
  content: string;
  timestamp: string;
  isTaskAction?: boolean;
  taskId?: string;
  delivery?: 'thinking' | 'responding' | 'complete' | 'failed' | 'interrupted';
}

export interface AppSettings {
  soundEnabled: boolean;
  reducedMotion: boolean;
  activeProjectId: string;
  mouseSensitivity: number;
  firstPersonMode: boolean;
  graphicsQuality: 'Low' | 'Medium' | 'High';
}

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  reducedMotion: false,
  activeProjectId: DEFAULT_PROJECTS[0].id,
  mouseSensitivity: 1.0,
  firstPersonMode: false,
  graphicsQuality: 'High',
};

// Initial realistic briefs to demonstrate the system immediately on first load
const SEED_TASKS: EmployeeTask[] = [
  {
    id: 'task-adhi-01',
    employeeId: 'adhi',
    projectId: 'proj-verlyn-core',
    title: 'Architect Verlyn Modern Client Portal',
    taskType: 'website_brief',
    priority: 'high',
    status: 'awaiting_connection',
    createdAt: '2026-10-25T11:00:00.000Z',
    updatedAt: '2026-10-25T11:00:00.000Z',
    briefDetails: {
      siteType: 'SaaS Product Platform',
      techStack: 'Next.js 15 + TypeScript + Tailwind CSS',
      targetPages: 'Dashboard, Client Analytics, Interactive 3D Office Viewer, Billing, Settings',
      integrations: 'Supabase Auth, Stripe Billing, Resend Email',
      targetDate: '2026-11-20',
      scopeNotes: 'Must be lightweight, fast, responsive on mobile and desktop, with smooth page transitions.'
    },
    notes: 'Saved project brief. Status: Awaiting worker connection.'
  },
  {
    id: 'task-abbu-01',
    employeeId: 'abbu',
    projectId: 'proj-nexus-saas',
    title: 'High-Converting B2B Hero & Pricing Redesign',
    taskType: 'landing_page_brief',
    priority: 'high',
    status: 'awaiting_connection',
    createdAt: '2026-10-26T14:20:00.000Z',
    updatedAt: '2026-10-26T14:20:00.000Z',
    briefDetails: {
      pageGoal: 'Book a 30-min Strategy Call',
      targetAudience: 'B2B Founders & VP Engineering seeking autonomous operations',
      valueProposition: 'Deploy dedicated AI worker teams in under 48 hours without engineering overhead',
      callToAction: 'Book Systems Strategy Session',
      socialProof: 'Over $4.2M value created across 18 deployments',
      designAesthetic: 'Dark Mode Ultra-Modern Cyberpunk Tech'
    },
    notes: 'Saved project brief. Status: Awaiting worker connection.'
  },
  {
    id: 'task-prox-01',
    employeeId: 'prox',
    projectId: 'proj-nexus-saas',
    title: 'GEO & Perplexity Citation Audit',
    taskType: 'seo_geo_audit',
    priority: 'medium',
    status: 'awaiting_connection',
    createdAt: '2026-10-27T09:15:00.000Z',
    updatedAt: '2026-10-27T09:15:00.000Z',
    briefDetails: {
      targetUrl: 'https://nexus-systems.io',
      auditScope: 'Full Comprehensive: Technical SEO + GEO AI Search Readiness',
      competitorUrls: 'https://competitor-alpha.ai\nhttps://competitor-beta.dev',
      targetKeywords: 'enterprise autonomous agents, B2B AI workflows, agentic automation consulting',
      targetGeos: 'Global English / US Enterprise'
    },
    notes: 'Saved project brief. Status: Awaiting worker connection.'
  },
  {
    id: 'task-vaibav-01',
    employeeId: 'vaibav',
    projectId: 'proj-verlyn-core',
    title: 'Autonomous Inbound Lead Qualification Pipeline',
    taskType: 'agent_automation_request',
    priority: 'urgent',
    status: 'awaiting_connection',
    createdAt: '2026-10-28T16:00:00.000Z',
    updatedAt: '2026-10-28T16:00:00.000Z',
    briefDetails: {
      workflowName: 'Inbound Ingestion & Multi-Source Prospect Enrichment',
      triggerSource: 'Webhook Event (Form, Payment, App Event)',
      aiModelPreference: 'Gemini 2.0 Flash / Pro (High Context & Multimodal)',
      workflowSteps: '1. Ingest submission\n2. Research prospect LinkedIn & company web\n3. Calculate ICP fit score\n4. Dispatch notification to Slack and log to CRM',
      humanInTheLoop: 'Require Manual Approval before external actions'
    },
    notes: 'Saved project brief. Status: Awaiting worker connection.'
  },
  {
    id: 'task-taha-01',
    employeeId: 'taha',
    projectId: 'proj-apex-fintech',
    title: 'HubSpot Deals & Stripe Billing Bi-Directional Sync',
    taskType: 'crm_erp_request',
    priority: 'high',
    status: 'awaiting_connection',
    createdAt: '2026-10-29T13:45:00.000Z',
    updatedAt: '2026-10-29T13:45:00.000Z',
    briefDetails: {
      targetPlatform: 'HubSpot Enterprise (CRM & Marketing Hub)',
      coreObjects: 'Companies, Contacts, Deals, Invoices, Contract Entitlements',
      syncRequirements: 'Sync Stripe invoice payments back into HubSpot Deal stages in real-time with webhook verification.',
      permissionsMatrix: 'Departmental Silos with Executive Visibility',
      deliverableExpectation: 'Schema mapping JSON and automated sync script specification'
    },
    notes: 'Saved project brief. Status: Awaiting worker connection.'
  },
  {
    id: 'task-rewaant-01',
    employeeId: 'rewaant',
    projectId: 'proj-apex-fintech',
    title: 'Q4 Enterprise Outbound Campaign Strategy',
    taskType: 'marketing_growth_brief',
    priority: 'medium',
    status: 'awaiting_connection',
    createdAt: '2026-10-30T10:00:00.000Z',
    updatedAt: '2026-10-30T10:00:00.000Z',
    briefDetails: {
      campaignName: 'Apex FinTech Q4 Institutional Outreach',
      channelStrategy: 'Multi-Touch Outbound (Cold Email + LinkedIn Social Selling)',
      targetIcp: 'Managing Directors & Heads of Operations at mid-tier hedge funds and capital management firms ($100M-$1B AUM)',
      targetKpi: '25 Qualified Demo Calls in 60 Days',
      budgetAllocation: '$3,000 - $7,500 / month',
      offerHook: 'Free Institutional Automation Readiness Benchmark Report'
    },
    notes: 'Saved project brief. Status: Awaiting worker connection.'
  },
  {
    id: 'task-ameen-01',
    employeeId: 'ameen',
    projectId: 'proj-verlyn-core',
    title: 'Verlyn Q4 Autonomous Service Rollout Master Plan',
    taskType: 'strategic_planning_request',
    priority: 'urgent',
    status: 'awaiting_connection',
    createdAt: '2026-10-31T09:00:00.000Z',
    updatedAt: '2026-10-31T09:00:00.000Z',
    briefDetails: {
      initiativeTitle: 'Enterprise Multi-Agent Service Integration Standard',
      strategicGoal: 'Unify our Web Studio, AI Lab, Systems Engineering, and Growth teams into a single turnkey offering for client digital transformations.',
      involvedDepartments: 'All Departments (Full Cross-Functional Blitz)',
      targetTimeline: 'Quarterly Strategic Milestone: 90 Days',
      budgetRiskMitigation: 'Allocate $25,000 compute credit; guard against API rate limits with fallback orchestrators.'
    },
    notes: 'Saved project brief. Status: Awaiting worker connection.'
  }
];

const SEED_ACTIVITY: EmployeeActivityLog[] = [
  {
    id: 'act-01',
    employeeId: 'adhi',
    timestamp: '2026-10-25T11:00:00.000Z',
    type: 'task_created',
    message: 'Task brief "Architect Verlyn Modern Client Portal" created and assigned.',
    user: 'Operations Lead'
  },
  {
    id: 'act-02',
    employeeId: 'vaibav',
    timestamp: '2026-10-28T16:00:00.000Z',
    type: 'task_created',
    message: 'Task brief "Autonomous Inbound Lead Qualification Pipeline" created and assigned.',
    user: 'Tech Director'
  },
  {
    id: 'act-03',
    employeeId: 'ameen',
    timestamp: '2026-10-31T09:00:00.000Z',
    type: 'task_created',
    message: 'Strategic initiative "Verlyn Q4 Autonomous Service Rollout" created and assigned.',
    user: 'Executive Board'
  }
];

export const StorageService = {
  getTasks(): EmployeeTask[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) {
        this.saveTasks(SEED_TASKS);
        return SEED_TASKS;
      }
      return JSON.parse(data);
    } catch {
      return SEED_TASKS;
    }
  },

  saveTasks(tasks: EmployeeTask[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  },

  getTasksForEmployee(employeeId: string): EmployeeTask[] {
    return this.getTasks().filter(t => t.employeeId === employeeId);
  },

  saveTask(task: EmployeeTask): EmployeeTask {
    const tasks = this.getTasks();
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    if (existingIndex >= 0) {
      tasks[existingIndex] = { ...task, updatedAt: new Date().toISOString() };
    } else {
      tasks.unshift(task);
    }
    this.saveTasks(tasks);

    // Also add to activity
    this.addActivityLog({
      id: `act-${Date.now()}`,
      employeeId: task.employeeId,
      timestamp: new Date().toISOString(),
      type: existingIndex >= 0 ? 'task_updated' : 'task_created',
      message: `Assignment "${task.title}" ${existingIndex >= 0 ? 'updated' : 'created'} for ${task.taskType}. Status: Awaiting connection.`,
      user: 'User'
    });

    return task;
  },

  deleteTask(id: string): void {
    const tasks = this.getTasks();
    const target = tasks.find(t => t.id === id);
    const filtered = tasks.filter(t => t.id !== id);
    this.saveTasks(filtered);

    if (target) {
      this.addActivityLog({
        id: `act-${Date.now()}`,
        employeeId: target.employeeId,
        timestamp: new Date().toISOString(),
        type: 'task_archived',
        message: `Assignment "${target.title}" archived.`,
        user: 'User'
      });
    }
  },

  getProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (!data) {
        this.saveProjects(DEFAULT_PROJECTS);
        return DEFAULT_PROJECTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_PROJECTS;
    }
  },

  saveProjects(projects: Project[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save projects to localStorage', e);
    }
  },

  addProject(project: Project): Project {
    const projects = this.getProjects();
    projects.push(project);
    this.saveProjects(projects);
    return project;
  },

  getActivityLogs(employeeId?: string): EmployeeActivityLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
      const logs: EmployeeActivityLog[] = data ? JSON.parse(data) : SEED_ACTIVITY;
      if (employeeId) {
        return logs.filter(l => l.employeeId === employeeId);
      }
      return logs;
    } catch {
      return employeeId ? SEED_ACTIVITY.filter(l => l.employeeId === employeeId) : SEED_ACTIVITY;
    }
  },

  addActivityLog(log: EmployeeActivityLog): void {
    try {
      const logs = this.getActivityLogs();
      logs.unshift(log);
      // Keep recent 100 logs
      const trimmed = logs.slice(0, 100);
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save activity log', e);
    }
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: Partial<AppSettings>): AppSettings {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  getDeliverables(employeeId?: string): TaskDeliverable[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DELIVERABLES);
      const items: TaskDeliverable[] = data ? JSON.parse(data) : [];
      if (employeeId) {
        return items.filter(d => d.employeeId === employeeId);
      }
      return items;
    } catch {
      return [];
    }
  },

  saveDeliverable(deliverable: TaskDeliverable): TaskDeliverable {
    try {
      const items = this.getDeliverables();
      const idx = items.findIndex(d => d.id === deliverable.id);
      if (idx >= 0) {
        items[idx] = deliverable;
      } else {
        items.unshift(deliverable);
      }
      localStorage.setItem(STORAGE_KEYS.DELIVERABLES, JSON.stringify(items));
      return deliverable;
    } catch (e) {
      console.error('Failed to save deliverable', e);
      return deliverable;
    }
  },

  deleteDeliverable(id: string): void {
    try {
      const items = this.getDeliverables().filter(d => d.id !== id);
      localStorage.setItem(STORAGE_KEYS.DELIVERABLES, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to delete deliverable', e);
    }
  },

  getChatMessages(employeeId: string): ChatMessage[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT);
      const all: Record<string, ChatMessage[]> = data ? JSON.parse(data) : {};
      return all[employeeId] || [];
    } catch {
      return [];
    }
  },

  saveChatMessage(msg: ChatMessage): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT);
      const all: Record<string, ChatMessage[]> = data ? JSON.parse(data) : {};
      if (!all[msg.employeeId]) {
        all[msg.employeeId] = [];
      }
      const existing = all[msg.employeeId].findIndex(item => item.id === msg.id);
      if (existing >= 0) all[msg.employeeId][existing] = msg;
      else all[msg.employeeId].push(msg);
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save chat message', e);
    }
  },

  clearChatMessages(employeeId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHAT);
      const all: Record<string, ChatMessage[]> = data ? JSON.parse(data) : {};
      delete all[employeeId];
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to clear chat messages', e);
    }
  }
};
