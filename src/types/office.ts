export type DepartmentId = 'web-search' | 'ai-systems' | 'growth' | 'ceo' | 'sourcing' | 'risk' | 'finance' | 'compliance' | 'canteen';

export interface RoomDefinition {
  id: DepartmentId | 'reception' | 'corridor';
  name: string;
  shortName: string;
  departmentCode: string;
  accentColor: string;
  glowColor: string;
  floorColor: string;
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  doorway: {
    x: number;
    z: number;
    width: number;
  };
  description: string;
}

export type TaskStatus = 'awaiting_connection' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface EmployeeTask {
  id: string;
  employeeId: string;
  projectId: string;
  title: string;
  taskType: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  briefDetails: Record<string, any>;
  notes?: string;
  attachedFiles?: string[];
  extractedFromFolder?: boolean;
}

export interface EmployeeActivityLog {
  id: string;
  employeeId: string;
  timestamp: string;
  type: 'task_created' | 'task_updated' | 'task_archived' | 'status_note' | 'deliverable_submitted';
  message: string;
  user: string;
}

export interface EmployeeDefinition {
  id: string;
  name: string;
  title: string;
  departmentId: DepartmentId;
  departmentName: string;
  roomName: string;
  roleDescription: string;
  responsibilities: string[];
  avatarColors: {
    skin: string;
    shirt: string;
    pants: string;
    hair: string;
    accent: string;
  };
  deskPosition: [number, number, number]; // [x, y, z]
  deskRotation: number; // in radians
  lookDirection: number; // in radians
  specialProps?: 'ai_display' | 'business_display' | 'campaign_board' | 'project_board';
  permittedFutureTools: string[];
  teamBonds?: {
    friendId: string;
    friendName: string;
    relationship: string;
    collaboration: string;
  }[];
  funFact?: string;
  taskFormConfig: {
    formType: string;
    formTitle: string;
    formDescription: string;
    fields: {
      id: string;
      label: string;
      type: 'text' | 'textarea' | 'select' | 'multiselect' | 'date';
      placeholder?: string;
      options?: string[];
      required?: boolean;
      defaultValue?: any;
      helperText?: string;
    }[];
  };
}

export interface ProjectFile {
  name: string;
  path: string;
  size: number;
  type: string;
  snippet?: string;
  claimedByEmployeeId: string;
  claimedCategory: string;
}

export interface DepartmentClaim {
  employeeId: string;
  employeeName: string;
  role: string;
  fileCount: number;
  files: ProjectFile[];
  summary: string;
  suggestedTaskTitle: string;
  suggestedScope: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  description: string;
  color: string;
  createdAt: string;
  folderName?: string;
  totalFiles?: number;
  files?: ProjectFile[];
  departmentClaims?: Record<string, DepartmentClaim>;
}

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
  label?: string;
}

export interface SittableChair {
  id: string;
  name: string;
  employeeId?: string;
  position: [number, number, number]; // [x, y, z]
  lookDirection: number; // in radians facing the desk/employee
  targetEmployee?: string;
  kind: 'chair' | 'sofa' | 'bar_stool';
  seatHeight: number;
}
