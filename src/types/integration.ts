/**
 * Verlyn HQ — Integration Boundary Definitions
 *
 * This module defines the clear contract for future backend connections,
 * AI tool agents, background task workers, live streaming events, and approvals.
 */

import { DepartmentId, TaskPriority, TaskStatus } from './office';

export type IntegrationStatus =
  | 'not_connected'
  | 'connecting'
  | 'connected'
  | 'auth_required'
  | 'error';

export type WorkerExecutionState =
  | 'idle'
  | 'awaiting_input'
  | 'executing_step'
  | 'awaiting_approval'
  | 'completed'
  | 'failed';

export interface EmployeeToolDefinition {
  id: string;
  name: string;
  category: 'code' | 'design' | 'analytics' | 'automation' | 'crm' | 'strategy';
  description: string;
  authProvider?: string;
  isConnected: boolean;
  capabilities: string[];
}

export interface WorkerIntegrationConfig {
  employeeId: string;
  endpointUrl?: string;
  modelProvider?: 'gemini-1.5-pro' | 'gemini-2.0-flash' | 'claude-3-5-sonnet' | 'gpt-4o' | 'custom';
  apiKeyPlaceholderName: string;
  permittedTools: EmployeeToolDefinition[];
  maxConcurrency: number;
  autoApprovalThreshold: 'manual_only' | 'low_risk' | 'autonomous';
}

export interface TaskDeliverable {
  id: string;
  taskId: string;
  employeeId: string;
  title: string;
  type: 'code_repo' | 'live_preview_url' | 'audit_report' | 'workflow_json' | 'crm_schema' | 'marketing_plan' | 'document';
  url?: string;
  contentSnippet?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  version: number;
}

export interface ApprovalAction {
  id: string;
  taskId: string;
  employeeId: string;
  requestedAt: string;
  summary: string;
  changesOverview: string[];
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface TaskExecutionEvent {
  id: string;
  taskId: string;
  employeeId: string;
  timestamp: string;
  type:
    | 'task_queued'
    | 'worker_assigned'
    | 'step_started'
    | 'step_progress'
    | 'tool_called'
    | 'approval_requested'
    | 'deliverable_created'
    | 'task_completed'
    | 'task_failed';
  payload: {
    stepName?: string;
    progressPercent?: number;
    logText?: string;
    toolName?: string;
    deliverableId?: string;
    error?: string;
  };
}

/**
 * Interface that backend connectors will implement in Phase 2
 */
export interface EmployeeBackendConnector {
  getIntegrationStatus(employeeId: string): Promise<IntegrationStatus>;
  testConnection(employeeId: string): Promise<{ success: boolean; latencyMs?: number; message?: string }>;
  dispatchTask(taskId: string, payload: any): Promise<{ workerId: string; status: TaskStatus }>;
  subscribeTaskEvents(taskId: string, onEvent: (event: TaskExecutionEvent) => void): () => void;
  submitApproval(approvalId: string, approved: boolean, feedback?: string): Promise<void>;
  fetchDeliverables(employeeId: string, taskId?: string): Promise<TaskDeliverable[]>;
}
