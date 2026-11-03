import { EmployeeDefinition } from '../types/office';
import { OFFICE_CONFIG } from '../config/office.config';

/**
 * Employees Registry - Data-Driven from OFFICE_CONFIG
 * 7 Verlyn Tech Team Members:
 * - Adhi (Website & Architecture Developer)
 * - Abbu (Landing Page & CRO Designer)
 * - Prox (Search Intelligence & GEO Lead)
 * - VD / Vaibav (Head of Autonomous AI Agents & Workflows)
 * - Taha (Enterprise Systems & CRM/ERP Integration Architect)
 * - Rewu / Rewaant (Head of Growth & Outbound Pipeline)
 * - Ameen (Chief Executive Officer - CEO Overseeing Everything)
 */
export const EMPLOYEES: EmployeeDefinition[] = OFFICE_CONFIG.employees.map(e => ({
  id: e.id,
  name: e.name,
  title: e.role,
  departmentId: e.departmentId as any,
  departmentName: e.departmentName,
  roomName: e.roomName,
  roleDescription: e.roleDescription,
  responsibilities: e.responsibilities,
  avatarColors: e.avatarColors,
  deskPosition: e.deskPosition,
  deskRotation: e.deskRotation,
  lookDirection: e.lookDirection,
  funFact: e.funFact,
  teamBonds: e.teamBonds,
  permittedFutureTools: [
    'Next.js 15 WebGL Canvas Viewport 60FPS',
    'Figma CRO & A/B Funnel Generator',
    'Perplexity Citation & GEO Authority Engine',
    'Autonomous Multi-Agent Mesh (Gemini 2.0)',
    'HubSpot & PostgreSQL Sync Automator',
    'Outbound Pipeline Dispatcher',
    'CEO Enterprise Capital Allocator'
  ],
  taskFormConfig: {
    formType: `${e.id}_task`,
    formTitle: `${e.name} — Operational Briefing`,
    formDescription: `Submit an actionable assignment directly to ${e.name} (${e.role}).`,
    submitButtonText: `Assign to ${e.name}`,
    fields: [
      {
        id: 'title',
        label: 'Initiative Title',
        type: 'text',
        required: true,
        placeholder: `E.g., ${e.deskStyle.boardTasks[0]}`
      },
      {
        id: 'priority',
        label: 'Priority Level',
        type: 'select',
        required: true,
        options: ['low', 'medium', 'high', 'urgent']
      },
      {
        id: 'scope',
        label: 'Operational Scope & Objectives',
        type: 'textarea',
        required: true,
        placeholder: `Specify key deliverables and technical requirements for ${e.name}...`
      }
    ]
  }
}));
