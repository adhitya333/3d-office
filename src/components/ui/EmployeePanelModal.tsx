import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  User,
  Briefcase,
  AlertCircle,
  Clock,
  Layers,
  Activity,
  PlusCircle,
  FileText,
  Trash2,
  CheckCircle2,
  FolderOpen,
  ArrowRight,
  Zap,
  Copy,
  Check,
  Download,
  Eye,
  Key,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Code,
  MessageSquare,
  Send,
  HelpCircle,
  TrendingUp,
  Database,
  Bot,
  Crown,
  Globe,
  FileCode,
  ImagePlus
} from 'lucide-react';
import { EmployeeDefinition, EmployeeTask, Project } from '../../types/office';
import { TaskDeliverable } from '../../types/integration';
import { StorageService, ChatMessage } from '../../services/storage';
import { EmployeeAIService } from '../../services/employeeAI';
import { SoundEffects } from '../../services/audio';
import { npcBrain } from '../../services/npcBrain';
import { employeeWork } from '../../services/employeeWork';
import { useEmployeeWork } from '../../hooks/useEmployeeWork';
import type { ChatImage } from '../../types/chat';
import { modelLabel } from '../../services/modelLabels';

interface EmployeePanelModalProps {
  employee: EmployeeDefinition;
  projects: Project[];
  activeProjectId: string;
  onClose: () => void;
  onTasksUpdated: () => void;
  onOpenProjectManager?: () => void;
  onOpenProjectUpload?: () => void;
}

type EmployeeTab = 'chat' | 'files' | 'assign' | 'tasks' | 'deliverables' | 'activity';
type SavedPanelState = {
  tab?: EmployeeTab;
  draft?: string;
  chatScrollTop?: number;
  selectedProjectId?: string;
  taskTitle?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  formData?: Record<string, any>;
  images?: ChatImage[];
  generateImage?: boolean;
};

const panelStateKey = (id: string) => `verlyn_employee_panel_${id}_v1`;
const readPanelState = (id: string): SavedPanelState => {
  try {
    const saved = JSON.parse(localStorage.getItem(panelStateKey(id)) || '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    if (!['chat', 'files', 'assign', 'tasks', 'deliverables', 'activity'].includes(saved.tab)) delete saved.tab;
    return saved;
  }
  catch { return {}; }
};
const savePanelState = (id: string, update: SavedPanelState) => {
  try { localStorage.setItem(panelStateKey(id), JSON.stringify({ ...readPanelState(id), ...update })); }
  catch { /* Storage is optional in private browsing. */ }
};

export const EmployeePanelModal: React.FC<EmployeePanelModalProps> = ({
  employee,
  projects,
  activeProjectId,
  onClose,
  onTasksUpdated,
  onOpenProjectManager,
  onOpenProjectUpload
}) => {
  const [activeTab, setActiveTab] = useState<EmployeeTab>(() => readPanelState(employee.id).tab || 'chat');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProjectId);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);
  const [expandedSnippetPath, setExpandedSnippetPath] = useState<string | null>(null);

  // Chat State
  const work = useEmployeeWork(employee.id);
  const chatMessages = work.messages;
  const [chatInput, setChatInput] = useState<string>(() => readPanelState(employee.id).draft || '');
  const [chatImages, setChatImages] = useState<ChatImage[]>(() => (readPanelState(employee.id).images || []).slice(0, 3));
  const [generateImage, setGenerateImage] = useState(() => readPanelState(employee.id).generateImage === true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const isSendingChat = work.chatStatus !== 'idle';
  const isRequestingUpdate = work.isRequestingUpdate;
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const restoreChatScrollRef = useRef<number | null>(readPanelState(employee.id).chatScrollTop ?? null);
  const followChatRef = useRef(true);
  const lastChatElementRef = useRef<HTMLDivElement | null>(null);

  // Official local provider connections
  const [isConfigured, setIsConfigured] = useState<boolean>(EmployeeAIService.isConfigured());
  const [showConnectionModal, setShowConnectionModal] = useState<boolean>(false);
  const [officePassword, setOfficePassword] = useState<string>('');
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [, setConnectionVersion] = useState(0);
  const [canteenNotice, setCanteenNotice] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  useEffect(() => {
    const update = () => { setIsConfigured(EmployeeAIService.isConfigured()); setConnectionVersion(version => version + 1); };
    window.addEventListener('office-ai-connection', update);
    void EmployeeAIService.refreshConnection(true);
    return () => window.removeEventListener('office-ai-connection', update);
  }, []);
  const executingTaskId = work.executingTaskId;
  const executionStatus = work.executionStatus;
  const executionError = work.error;

  // Deliverables & Preview State
  const [deliverables, setDeliverables] = useState<TaskDeliverable[]>([]);
  const [previewDeliverable, setPreviewDeliverable] = useState<TaskDeliverable | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tasks and Logs
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  useEffect(() => {
    setTasks(StorageService.getTasksForEmployee(employee.id));
    setDeliverables(StorageService.getDeliverables(employee.id));
    setActivityLogs(StorageService.getActivityLogs(employee.id));
  }, [employee.id, executingTaskId]);

  useEffect(() => {
    const saved = readPanelState(employee.id);
    loadData();
    // Initialize form defaults
    const initial: Record<string, any> = {};
    employee.taskFormConfig.fields.forEach(field => {
      initial[field.id] = field.defaultValue || '';
    });
    setFormData({ ...initial, ...saved.formData });
    setTaskTitle(saved.taskTitle || `${employee.taskFormConfig.formTitle.replace(' Brief', '').replace(' Request', '')} - ${new Date().toLocaleDateString()}`);
    setPriority(saved.priority || 'high');
    setSelectedProjectId(saved.selectedProjectId || activeProjectId);
    setActiveTab(saved.tab || 'chat');
    setChatInput(saved.draft || '');
    restoreChatScrollRef.current = saved.chatScrollTop ?? null;
    lastChatElementRef.current = null;
  }, [employee]);

  useEffect(() => {
    savePanelState(employee.id, { tab: activeTab, draft: chatInput, selectedProjectId, taskTitle, priority, formData });
  }, [employee.id, activeTab, chatInput, selectedProjectId, taskTitle, priority, formData]);

  // Restore the conversation position once; follow new messages only when already near the bottom.
  useEffect(() => {
    const feed = chatScrollRef.current;
    if (activeTab !== 'chat' || !feed || chatMessages.length === 0) return;
    if (feed !== lastChatElementRef.current) {
      lastChatElementRef.current = feed;
      restoreChatScrollRef.current = readPanelState(employee.id).chatScrollTop ?? null;
    }
    if (restoreChatScrollRef.current !== null) {
      feed.scrollTop = restoreChatScrollRef.current;
      followChatRef.current = feed.scrollHeight - feed.clientHeight - feed.scrollTop < 60;
      restoreChatScrollRef.current = null;
    } else if (followChatRef.current) feed.scrollTop = feed.scrollHeight;
  }, [chatMessages, activeTab, isSendingChat]);

  const getDefaultGreeting = (): string => {
    switch (employee.id) {
      case 'adhi':
        return `Hey! I'm Adhi, Senior Website Developer. I engineer Next.js architectures, interactive components, and responsive Web apps. What module or page should we build today?`;
      case 'abbu':
        return `Hello! Abbu here, Landing Page & CRO Specialist. Let's engineer high-converting landing pages. Tell me your product, target audience, and offer hook!`;
      case 'prox':
        return `Greetings! I'm Prox, SEO & Generative Engine Optimization lead. Let me know what website or search visibility footprint you'd like audited.`;
      case 'vaibav':
        return `Hey! Vaibav here, Agentic AI & Automations lead. What multi-agent meshes, background triggers, or Python scripts should we engineer?`;
      case 'taha':
        return `Hello! Taha here, Systems Engineering & CRM/ERP specialist. I handle PostgreSQL schemas, HubSpot/Salesforce sync pipelines, and database migrations.`;
      case 'rewaant':
        return `Hey! Rewu here. I lead design and branding: visual identity, typography, color systems, and creative direction. What are we designing?`;
      case 'ameen':
        return `Welcome. Ameen here, CEO and Master Strategist. What strategic goals, cross-department roadmaps, or resource allocations are we planning?`;
      default:
        return `Hello! I'm ${employee.name}, ${employee.title}. How can I assist you with your project today?`;
    }
  };

  const loadData = () => {
    const loadedTasks = StorageService.getTasksForEmployee(employee.id);
    setTasks(loadedTasks);
    setActivityLogs(StorageService.getActivityLogs(employee.id));
    setDeliverables(StorageService.getDeliverables(employee.id));
    setIsConfigured(EmployeeAIService.isConfigured());

    // Load Chat messages or seed initial greeting
    let messages = StorageService.getChatMessages(employee.id);
    if (messages.length === 0) {
      const initialGreeting: ChatMessage = {
        id: `msg-init-${Date.now()}`,
        employeeId: employee.id,
        sender: 'employee',
        content: getDefaultGreeting(),
        timestamp: new Date().toISOString()
      };
      StorageService.saveChatMessage(initialGreeting);
      messages = [initialGreeting];
    }
    employeeWork.refresh(employee.id);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewDeliverable) {
          setPreviewDeliverable(null);
          return;
        }
        if (showConnectionModal) {
          setShowConnectionModal(false);
          return;
        }
        onClose();
        SoundEffects.playCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, previewDeliverable, showConnectionModal]);

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects.find(p => p.id === activeProjectId) || projects[0];
  const isCEO = employee.id === 'ameen';
  const claimedFiles = isCEO
    ? (currentProject?.files || [])
    : (currentProject?.files || []).filter(f => f.claimedByEmployeeId === employee.id);
  const departmentClaim = currentProject?.departmentClaims?.[employee.id];

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  // EXECUTE AN EXTRACTED FILE TASK DIRECTLY
  const handleExecuteExtractedFileTask = async (filePath: string, snippet?: string) => {
    const fileName = filePath.split('/').pop() || filePath;
    const cleanTitle = `${employee.taskFormConfig.formTitle.replace(' Brief', '').replace(' Request', '')}: ${fileName}`;

    const newTask: EmployeeTask = {
      id: `task-${employee.id}-${Date.now().toString(36)}`,
      employeeId: employee.id,
      projectId: currentProject.id,
      title: cleanTitle,
      taskType: employee.taskFormConfig.formType,
      priority: 'high',
      status: 'awaiting_connection',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      briefDetails: {
        fileName,
        filePath,
        sourceFile: filePath,
        codeContext: snippet ? snippet.slice(0, 500) : 'Full component analysis'
      },
      attachedFiles: [filePath],
      extractedFromFolder: true,
      notes: `Auto-generated from extracted project file: ${filePath}`
    };

    StorageService.saveTask(newTask);
    onTasksUpdated();
    loadData();

    await handleExecuteTask(newTask);
  };

  // EXECUTE DEPARTMENT SUGGESTED TASK
  const handleExecuteDepartmentSuggestedTask = async () => {
    const title = departmentClaim?.suggestedTaskTitle || (isCEO ? `Executive Strategy & Cross-Department Plan for ${currentProject.name}` : `Analyze Extracted Files for ${currentProject.name}`);

    const newTask: EmployeeTask = {
      id: `task-${employee.id}-${Date.now().toString(36)}`,
      employeeId: employee.id,
      projectId: currentProject.id,
      title,
      taskType: employee.taskFormConfig.formType,
      priority: 'urgent',
      status: 'awaiting_connection',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      briefDetails: {
        initiative: title,
        scope: departmentClaim?.suggestedScope || 'Full cross-departmental execution roadmap',
        projectFolder: currentProject.folderName || currentProject.name,
        totalFilesClaimed: claimedFiles.length
      },
      attachedFiles: claimedFiles.map(f => f.path),
      extractedFromFolder: true,
      notes: `Extracted department objective for ${employee.name}`
    };

    StorageService.saveTask(newTask);
    onTasksUpdated();
    loadData();

    await handleExecuteTask(newTask);
  };

  // ASK IN CHAT ABOUT A SPECIFIC FILE
  const handleAskAboutFileInChat = (filePath: string) => {
    setActiveTab('chat');
    handleSendChat(`Can you review and explain your architectural plan for the extracted file "${filePath}"?`);
  };

  // Requests are owned by the app service and survive this panel being closed.
  const handleSendChat = async (customText?: string) => {
    if (uploadingImage) return;
    const job = employeeWork.sendMessage(employee, (customText || chatInput).trim(), { images: chatImages, generateImage });
    if (job) { setChatImages([]); savePanelState(employee.id, { images: [] }); setImageError(null); }
    if (!job) return;
    setChatInput('');
    SoundEffects.playOpenModal();
    await job;
  };
  // CONVERT RECENT CHAT INTO AN ACTIVE TASK AND START EXECUTION
  const handleConvertChatToTaskAndRun = async () => {
    if (!EmployeeAIService.isConfigured()) {
      setShowConnectionModal(true);
      return;
    }

    // Find the latest user message or default
    const lastUserMsg = [...chatMessages].reverse().find(m => m.sender === 'user')?.content ||
      `Project Assignment for ${employee.name}`;

    const cleanTitle = lastUserMsg.length > 50 ? `${lastUserMsg.substring(0, 48)}...` : lastUserMsg;

    const newTask: EmployeeTask = {
      id: `task-${employee.id}-${Date.now().toString(36)}`,
      employeeId: employee.id,
      projectId: selectedProjectId,
      title: cleanTitle,
      taskType: employee.taskFormConfig.formType,
      priority: 'high',
      status: 'awaiting_connection',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      briefDetails: {
        chatBrief: lastUserMsg,
        assignedVia: 'Live Interactive Chat Session',
        projectScope: `Formulated directly from chat discussion with ${employee.name}`
      },
      notes: `Queued and executed via chat with ${EmployeeAIService.getConfig(employee.id).taskModel}`
    };

    StorageService.saveTask(newTask);
    SoundEffects.playSuccess();
    loadData();
    onTasksUpdated();

    // Notify in chat
    const actionMsg: ChatMessage = {
      id: `msg-act-${Date.now()}`,
      employeeId: employee.id,
      sender: 'employee',
      content: `I've registered assignment "${cleanTitle}" onto my desk and started execution now! Check my live progress status below.`,
      timestamp: new Date().toISOString(),
      isTaskAction: true,
      taskId: newTask.id
    };
    employeeWork.addMessage(actionMsg);

    // Execute
    await handleExecuteTask(newTask);
  };

  const handleAskProgressUpdate = async (targetTask?: EmployeeTask) => {
    const task = targetTask || tasks.find(item => item.status !== 'completed') || tasks[0];
    await employeeWork.requestProgress(employee, task);
  };

  const handleExecuteTask = async (task: EmployeeTask) => {
    const job = employeeWork.executeTask(task, employee);
    if (!job) return;
    await job;
    onTasksUpdated();
  };
  // Save Task (from manual form)
  const handleSaveAssignment = async (e?: React.FormEvent, executeImmediately: boolean = false) => {
    if (e) e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: EmployeeTask = {
      id: `task-${employee.id}-${Date.now().toString(36)}`,
      employeeId: employee.id,
      projectId: selectedProjectId,
      title: taskTitle.trim(),
      taskType: employee.taskFormConfig.formType,
      priority,
      status: 'awaiting_connection',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      briefDetails: { ...formData },
      notes: executeImmediately
        ? `Queued for immediate execution via ${EmployeeAIService.getConfig(employee.id).taskModel}`
        : 'Assignment saved and queued in registry.'
    };

    StorageService.saveTask(newTask);
    SoundEffects.playSuccess();
    loadData();
    onTasksUpdated();

    if (executeImmediately) {
      setActiveTab('tasks');
      await handleExecuteTask(newTask);
    } else {
      setSavedSuccessMsg(`Assignment "${newTask.title}" saved successfully!`);
      setTimeout(() => {
        setSavedSuccessMsg(null);
        setActiveTab('tasks');
      }, 1200);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      StorageService.deleteTask(taskId);
      loadData();
      onTasksUpdated();
      SoundEffects.playCloseModal();
    }
  };

  const handleDeleteDeliverable = (delivId: string) => {
    if (confirm('Delete this deliverable?')) {
      StorageService.deleteDeliverable(delivId);
      loadData();
      SoundEffects.playCloseModal();
    }
  };

  const handleCopyContent = (deliv: TaskDeliverable) => {
    if (!deliv.contentSnippet) return;
    navigator.clipboard.writeText(deliv.contentSnippet);
    setCopiedId(deliv.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadDeliverable = (deliv: TaskDeliverable) => {
    if (!deliv.contentSnippet) return;
    const isHtml = deliv.contentSnippet.includes('<!DOCTYPE html>') || deliv.contentSnippet.includes('<html');
    const ext = isHtml ? 'html' : 'md';
    const blob = new Blob([deliv.contentSnippet], { type: isHtml ? 'text/html' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${employee.id}-${deliv.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOfficeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await EmployeeAIService.connect(officePassword);
      setIsConfigured(EmployeeAIService.isConfigured());
      setShowConnectionModal(false);
      setOfficePassword('');
      SoundEffects.playSuccess();
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Could not connect.');
    }
  };

  const configuredModel = EmployeeAIService.getModel(employee.id);
  const employeeModel = EmployeeAIService.getEmployeeModel(employee.id);
  const providers = EmployeeAIService.getProviders();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#080b0d]/85 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
          SoundEffects.playCloseModal();
        }
      }}
    >
      <div role="dialog" aria-modal="true" aria-label={`Conversation with ${employee.name}`} className="employee-panel bg-[#151b1f] border border-[#384249] w-full max-w-5xl h-[min(760px,94dvh)] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#f0eee8]">
        {/* Header */}
        <div className="employee-panel-header shrink-0 p-4 sm:px-6 sm:py-5 border-b border-[#303940] bg-[#192025] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar Pill */}
            <div
              className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center text-lg font-semibold text-[#f0eee8] border border-[#5b686c] bg-[#28343a]"
            >
              {employee.name[0]}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-semibold tracking-tight text-[#f4f1e9]">{employee.name}</h2>
                <span
                  className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide border border-[#46544d] text-[#bed0bf] uppercase"
                >
                  {employee.departmentName}
                </span>

                {/* Connection Status Badge */}
                {isConfigured ? (
                  <button
                    onClick={() => setShowConnectionModal(true)}
                    className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium text-[#a9c6b0] border border-[#42594d] hover:bg-[#273a31]"
                    title={`${employeeModel?.provider || 'AI'} · ${modelLabel(configuredModel)}. Open connection settings`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8fc29c]" />
                    <span>{modelLabel(configuredModel)}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConnectionModal(true)}
                    className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium text-[#d2b984] border border-[#66583d] hover:bg-[#3a3224]"
                    title="Connect AI"
                  >
                    <span>Connect AI</span>
                  </button>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#b9c2c5] mt-0.5 truncate">{employee.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConnectionModal(true)}
              className="p-2 rounded-lg text-[#aeb9bd] hover:text-white hover:bg-[#2c363b] transition-colors"
              title="Connection settings"
            >
              <Key className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                onClose();
                SoundEffects.playCloseModal();
              }}
              className="p-2 rounded-lg text-[#aeb9bd] hover:text-white hover:bg-[#2c363b] transition-colors"
              title="Close (Esc)"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Execution Error Banner */}
        {executionError && (
          <div className="px-6 py-3 bg-rose-950/60 border-b border-rose-800/60 text-xs text-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{executionError}</span>
            </div>
            <button onClick={() => employeeWork.clearError(employee.id)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="employee-panel-tabs flex shrink-0 border-b border-[#303940] bg-[#171e22] px-2 sm:px-5 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'chat'
                ? 'border-cyan-500 text-cyan-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'files'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Files {claimedFiles.length > 0 && <span className="text-[11px] opacity-70">{claimedFiles.length}</span>}
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              ['tasks', 'assign', 'activity'].includes(activeTab)
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Work {tasks.length > 0 && <span className="text-[11px] opacity-70">{tasks.length}</span>}
          </button>

          <button
            onClick={() => setActiveTab('deliverables')}
            className={`px-4 py-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'deliverables'
                ? 'border-blue-500 text-blue-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Results {deliverables.length > 0 && <span className="text-[11px] opacity-70">{deliverables.length}</span>}
          </button>



        </div>

        {/* Tab Content Body */}
        <div className="employee-panel-body flex-1 min-h-0 overflow-y-auto p-2 sm:p-5">
          {/* TAB 0: INTERACTIVE CHAT & PROGRESS UPDATES */}
          {activeTab === 'chat' && (
            <div className="employee-chat-shell flex flex-col h-full min-h-0 bg-[#11171a] border border-[#303940] rounded-xl overflow-hidden">
              <div className="employee-chat-toolbar shrink-0 px-3 sm:px-4 py-2.5 border-b border-[#303940] flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#cbd2d0] truncate">Conversation with {employee.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => {
                    const result = npcBrain.commandToCanteen(employee.id);
                    setCanteenNotice(result === 'queued' ? 'Canteen invitation queued until work and a seat are free.' : result === 'already-there' ? 'Already on a canteen break.' : 'Heading to the canteen to collect food or coffee, sit, and finish.');
                  }} className="px-2.5 py-1.5 rounded-md border border-[#566850] text-[#bfd1b8] hover:bg-[#263237] text-[11px] font-medium" title="Invite this employee to collect food or coffee and take a seat. Chat command: /canteen">Call to canteen</button>
                  <button
                    onClick={() => handleAskProgressUpdate()}
                    disabled={isRequestingUpdate || isSendingChat}
                    className="px-2.5 py-1.5 rounded-md border border-[#39474c] text-[#b9c8ca] hover:bg-[#263237] text-[11px] font-medium disabled:opacity-50"
                  >
                    {isRequestingUpdate ? 'Checking…' : 'Get update'}
                  </button>
                  <button
                    onClick={handleConvertChatToTaskAndRun}
                    disabled={isSendingChat || executingTaskId !== null}
                    className="px-2.5 py-1.5 rounded-md bg-[#baa477] hover:bg-[#d0b98a] text-[#161b1d] text-[11px] font-semibold disabled:opacity-50"
                    title="Create and run a task from the latest message"
                  >
                    Run as task
                  </button>
                </div>
              </div>

              <div
                ref={chatScrollRef}
                onScroll={event => {
                  const feed = event.currentTarget;
                  followChatRef.current = feed.scrollHeight - feed.clientHeight - feed.scrollTop < 60;
                  savePanelState(employee.id, { chatScrollTop: feed.scrollTop });
                }}
                className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-4 space-y-3"
              >
                {canteenNotice && <p role="status" className="text-xs text-[#c8d6bc] bg-[#29372d] rounded-lg p-2">{canteenNotice} Use /canteen in chat to invite again.</p>}
                {chatMessages.map(message => {
                  const fromUser = message.sender === 'user';
                  return (
                    <div key={message.id} className={`flex ${fromUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[92%] sm:max-w-[76%] rounded-xl px-3.5 py-2.5 border text-sm leading-relaxed whitespace-pre-wrap ${fromUser
                        ? 'bg-[#354247] border-[#526166] text-[#f4f1e9]'
                        : 'bg-[#202a2e] border-[#364348] text-[#e4e8e5]'}`}>
                        <div className="mb-1 text-[11px] font-medium text-[#aeb9b8]">
                          {fromUser ? 'You' : employee.name} · {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {message.content}
                        {message.model && !fromUser && <p className="mt-2 text-[10px] text-[#9BACAA]">{modelLabel(message.model)}</p>}
                        {message.images?.length ? <div className="mt-3 grid gap-3">{message.images.filter(image => /^\/api\/media\/[a-f0-9]{32}$/.test(image.url)).map(image => <figure key={image.id} className="overflow-hidden rounded-lg border border-[#465157] bg-[#11171a]">
                          <a href={image.url} target="_blank" rel="noreferrer" aria-label={`Open ${image.name}`}><img src={image.url} alt={image.name} loading="lazy" decoding="async" className="w-full max-h-80 object-contain" /></a>
                          <figcaption className="flex items-center justify-between gap-3 px-3 py-2 text-[11px] text-[#b8c5c0]"><span className="truncate">{image.name}</span><a href={image.url} download={`verlyn-${image.id}.${image.mime === 'image/png' ? 'png' : image.mime === 'image/webp' ? 'webp' : 'jpg'}`} className="shrink-0 text-[#d8c398] hover:underline">Download</a></figcaption>
                        </figure>)}</div> : null}
                        {message.isTaskAction && (
                          <button onClick={() => setActiveTab('deliverables')} className="block mt-2 text-xs text-[#d5be91] hover:underline">View results</button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(isSendingChat || executingTaskId) && (
                  <p className="text-xs text-[#aeb9bd] px-1" role="status">
                    {executingTaskId ? executionStatus || 'Working on task…' : work.messages[work.messages.length - 1]?.kind === 'image' && work.chatStatus === 'thinking' ? `${employee.name} is creating your image…` : `${employee.name} is ${work.chatStatus === 'thinking' ? 'thinking' : 'responding'}…`}
                  </p>
                )}
              </div>
              <div className="employee-chat-composer shrink-0 p-2.5 sm:p-3 bg-[#192126] border-t border-[#303940]">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" aria-label="Attach reference images" onChange={async event => {
                    const files = Array.from(event.currentTarget.files || []).slice(0, 3 - chatImages.length); event.currentTarget.value = '';
                    if (!files.length) return; setUploadingImage(true); setImageError(null);
                    const next = [...chatImages];
                    try { for (const file of files) { next.push(await EmployeeAIService.uploadImage(employee.id, file)); savePanelState(employee.id, { images: next }); } setChatImages(next); }
                    catch (error) { setChatImages(next); setImageError(error instanceof Error ? error.message : 'Could not attach this image.'); }
                    finally { setUploadingImage(false); }
                  }} />
                  <button type="button" disabled={uploadingImage || isSendingChat || chatImages.length >= 3} onClick={() => imageInputRef.current?.click()} className="flex items-center gap-1.5 text-[11px] font-medium text-[#c8d2cb] hover:text-white disabled:opacity-40"><ImagePlus className="w-3.5 h-3.5" />{uploadingImage ? 'Attaching…' : 'Attach image'}</button>
                  <select aria-label="Response type" value={generateImage ? 'image' : 'chat'} onChange={event => { const next = event.target.value === 'image'; setGenerateImage(next); savePanelState(employee.id, { generateImage: next }); }} disabled={isSendingChat} className="max-w-[55%] rounded-md bg-[#263237] border border-[#465157] px-2 py-1 text-[11px] text-[#e0e6df]">
                    <option value="chat">Chat / read image</option><option value="image">Create image</option>
                  </select>
                </div>
                {chatImages.length > 0 && <div className="flex gap-2 mb-2">{chatImages.map(image => <div key={image.id} className="relative w-14 h-12 rounded-md border border-[#576960] overflow-hidden"><img src={image.url} alt={image.name} className="w-full h-full object-cover" /><button type="button" aria-label={`Remove ${image.name}`} onClick={() => { const next = chatImages.filter(item => item.id !== image.id); setChatImages(next); savePanelState(employee.id, { images: next }); }} className="absolute right-0 top-0 bg-[#11171a]/90 text-white p-0.5"><X className="w-3 h-3" /></button></div>)}</div>}
                {imageError && <p role="alert" className="mb-2 text-xs text-rose-300">{imageError}</p>}
                <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={event => setChatInput(event.target.value)}
                  onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); followChatRef.current = true; handleSendChat(); } }}
                  placeholder={generateImage ? 'Describe the image to create…' : chatImages.length ? 'Ask about the image or extract its text…' : `Message ${employee.name}`}
                  aria-label={`Message ${employee.name}`}
                  className="min-w-0 flex-1 bg-[#11171a] border border-[#465157] rounded-lg px-3 py-2.5 text-sm text-[#f3f1eb] placeholder-[#99a5a9] focus:outline-none focus:border-[#bda779]"
                />
                <button
                  onClick={() => { followChatRef.current = true; handleSendChat(); }}
                  disabled={(!chatInput.trim() && !chatImages.length) || isSendingChat || uploadingImage}
                  className="px-3.5 py-2.5 rounded-lg bg-[#baa477] hover:bg-[#d0b98a] disabled:opacity-40 text-[#171c1e] font-semibold text-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-[#f3f1eb]">Project files</h3>
                  <p className="text-xs text-[#aeb9bd] mt-1">Files assigned to {employee.name} in {currentProject?.name || 'this project'}.</p>
                </div>
                {onOpenProjectUpload && <button onClick={onOpenProjectUpload} className="px-3 py-2 rounded-lg border border-[#586367] text-xs text-[#e5e9e5] hover:bg-[#283238]">Upload folder</button>}
              </div>
              {departmentClaim?.summary && <p className="text-sm text-[#c9d2cf] bg-[#202a2e] border border-[#374349] rounded-lg p-3">{departmentClaim.summary}</p>}
              {claimedFiles.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-[#465157] text-center text-sm text-[#aeb9bd]">No files assigned yet. Upload a project folder to start.</div>
              ) : (
                <div className="space-y-2">
                  {claimedFiles.map(file => (
                    <div key={file.path} className="rounded-lg border border-[#364248] bg-[#20292e] p-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#edf0ec] truncate">{file.name}</p>
                        <p className="text-xs text-[#aeb9bd] truncate">{file.path}</p>
                        {expandedSnippetPath === file.path && file.snippet && <pre className="mt-2 p-2 rounded bg-[#101719] text-xs text-[#c9d2d0] overflow-x-auto max-h-52">{file.snippet}</pre>}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {file.snippet && <button onClick={() => setExpandedSnippetPath(expandedSnippetPath === file.path ? null : file.path)} className="text-xs text-[#bfcac8] hover:text-white">{expandedSnippetPath === file.path ? 'Hide' : 'Preview'}</button>}
                        <button onClick={() => handleAskAboutFileInChat(file.path)} className="text-xs text-[#d5be91] hover:underline">Discuss</button>
                        <button onClick={() => handleExecuteExtractedFileTask(file.path, file.snippet)} className="text-xs text-[#d5be91] hover:underline">Run</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {departmentClaim?.suggestedTaskTitle && (
                <button onClick={handleExecuteDepartmentSuggestedTask} className="px-3 py-2 rounded-lg bg-[#baa477] text-[#171c1e] text-xs font-semibold hover:bg-[#d0b98a]">Run suggested task</button>
              )}
            </div>
          )}

          {activeTab === 'assign' && (
            <form onSubmit={event => handleSaveAssignment(event, (event.nativeEvent as SubmitEvent).submitter?.getAttribute('data-run') === 'true')} className="space-y-4 max-w-3xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <button type="button" onClick={() => setActiveTab('tasks')} className="text-xs text-[#b7c3c3] hover:text-white">← Work</button>
                  <h3 className="text-base font-semibold text-[#f3f1eb] mt-1">New task for {employee.name}</h3>
                </div>
                <select value={selectedProjectId} onChange={event => setSelectedProjectId(event.target.value)} aria-label="Project" className="max-w-[45%] bg-[#20292e] border border-[#465157] rounded-lg px-2 py-2 text-xs text-[#edf0ec]">
                  {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </div>
              {savedSuccessMsg && <p role="status" className="text-sm text-[#a9c6b0]">{savedSuccessMsg}</p>}
              <label className="block text-xs font-medium text-[#cbd2d0]">Task title
                <input required value={taskTitle} onChange={event => setTaskTitle(event.target.value)} className="mt-1.5 w-full bg-[#11171a] border border-[#465157] rounded-lg px-3 py-2.5 text-sm text-[#f3f1eb] focus:outline-none focus:border-[#bda779]" />
              </label>
              <label className="block text-xs font-medium text-[#cbd2d0]">Priority
                <select value={priority} onChange={event => setPriority(event.target.value as typeof priority)} className="mt-1.5 w-full bg-[#11171a] border border-[#465157] rounded-lg px-3 py-2.5 text-sm text-[#f3f1eb]">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                </select>
              </label>
              {employee.taskFormConfig.fields.filter(field => field.id !== 'title' && field.id !== 'priority').map(field => (
                <label key={field.id} className="block text-xs font-medium text-[#cbd2d0]">{field.label}
                  {field.type === 'textarea' ? (
                    <textarea required={field.required} value={formData[field.id] || ''} onChange={event => handleFieldChange(field.id, event.target.value)} placeholder={field.placeholder} rows={4} className="mt-1.5 w-full bg-[#11171a] border border-[#465157] rounded-lg px-3 py-2.5 text-sm text-[#f3f1eb] placeholder-[#8f9ca0] focus:outline-none focus:border-[#bda779]" />
                  ) : field.type === 'select' ? (
                    <select required={field.required} value={formData[field.id] || ''} onChange={event => handleFieldChange(field.id, event.target.value)} className="mt-1.5 w-full bg-[#11171a] border border-[#465157] rounded-lg px-3 py-2.5 text-sm text-[#f3f1eb]">
                      <option value="">Select</option>{field.options?.map(option => <option key={option} value={option}>{option}</option>)}
                    </select>
                  ) : (
                    <input type={field.type === 'date' ? 'date' : 'text'} required={field.required} value={formData[field.id] || ''} onChange={event => handleFieldChange(field.id, event.target.value)} placeholder={field.placeholder} className="mt-1.5 w-full bg-[#11171a] border border-[#465157] rounded-lg px-3 py-2.5 text-sm text-[#f3f1eb] placeholder-[#8f9ca0] focus:outline-none focus:border-[#bda779]" />
                  )}
                </label>
              ))}
              <div className="flex flex-wrap gap-2 pt-2">
                <button type="submit" className="px-4 py-2.5 rounded-lg border border-[#66716e] text-sm text-[#edf0ec] hover:bg-[#273237]">Save task</button>
                <button type="submit" data-run="true" className="px-4 py-2.5 rounded-lg bg-[#baa477] text-[#171c1e] text-sm font-semibold hover:bg-[#d0b98a]">Save and run</button>
              </div>
            </form>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[#f3f1eb]">Work for {employee.name}</h3>
                <div className="flex items-center gap-3">
                  <button onClick={() => setActiveTab('activity')} className="text-xs text-[#b7c3c3] hover:text-white">Activity</button>
                  <button onClick={() => setActiveTab('assign')} className="px-3 py-2 rounded-lg bg-[#baa477] text-[#171c1e] text-xs font-semibold hover:bg-[#d0b98a]">New task</button>
                </div>
              </div>
              {tasks.length === 0 && <p className="p-8 text-center text-sm text-[#aeb9bd] border border-dashed border-[#465157] rounded-xl">No tasks yet. Start a conversation or create a task.</p>}
              {tasks.map(task => (
                <div key={task.id} className="rounded-xl border border-[#354147] bg-[#20292e] p-4 flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#edf0ec]">{task.title}</p>
                    <p className="mt-1 text-xs text-[#aeb9bd] capitalize">{task.status.replace('_', ' ')} · {task.priority} priority · {projects.find(project => project.id === task.projectId)?.name || 'Project'}</p>
                    {executingTaskId === task.id && <p className="mt-2 text-xs text-[#d5be91]" role="status">{executionStatus || 'Working…'}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    {task.status !== 'completed' && <button onClick={() => handleExecuteTask(task)} disabled={executingTaskId !== null} className="text-[#d5be91] hover:underline disabled:opacity-40">Run</button>}
                    {task.status === 'completed' && <button onClick={() => setActiveTab('deliverables')} className="text-[#d5be91] hover:underline">Results</button>}
                    <button onClick={() => handleDeleteTask(task.id)} className="text-[#bdc5c6] hover:text-[#efb4ac]">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'deliverables' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-[#f3f1eb]">Results</h3>
              {deliverables.length === 0 && <p className="p-8 text-center text-sm text-[#aeb9bd] border border-dashed border-[#465157] rounded-xl">Completed work will appear here.</p>}
              {deliverables.map(deliverable => (
                <div key={deliverable.id} className="rounded-xl border border-[#354147] bg-[#20292e] p-4 flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#edf0ec]">{deliverable.title}</p>
                    <p className="mt-1 text-xs text-[#aeb9bd]">{deliverable.type.replace(/_/g, ' ')} · {new Date(deliverable.createdAt).toLocaleDateString()}</p>
                    {deliverable.contentSnippet && <p className="mt-2 text-xs text-[#b8c3c1] line-clamp-2 whitespace-pre-wrap">{deliverable.contentSnippet.slice(0, 240)}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    {deliverable.contentSnippet && <button onClick={() => setPreviewDeliverable(deliverable)} className="text-[#d5be91] hover:underline">Preview</button>}
                    {deliverable.contentSnippet && <button onClick={() => handleCopyContent(deliverable)} className="text-[#bfcac8] hover:text-white">{copiedId === deliverable.id ? 'Copied' : 'Copy'}</button>}
                    {deliverable.contentSnippet && <button onClick={() => handleDownloadDeliverable(deliverable)} className="text-[#bfcac8] hover:text-white">Download</button>}
                    {deliverable.url && <a href={deliverable.url} target="_blank" rel="noopener noreferrer" className="text-[#d5be91] hover:underline">Open</a>}
                    <button onClick={() => handleDeleteDeliverable(deliverable.id)} className="text-[#bdc5c6] hover:text-[#efb4ac]">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <button onClick={() => setActiveTab('tasks')} className="text-xs text-[#b7c3c3] hover:text-white">← Work</button>
              <h3 className="text-base font-semibold text-[#f3f1eb]">Recent activity</h3>
              {activityLogs.length === 0 && <p className="text-sm text-[#aeb9bd]">No activity yet.</p>}
              {activityLogs.map(log => <div key={log.id} className="border-b border-[#354147] pb-3 text-sm text-[#d8dfdb]"><p>{log.message}</p><p className="mt-1 text-xs text-[#aeb9bd]">{new Date(log.timestamp).toLocaleString()}</p></div>)}
            </div>
          )}
        </div>
      </div>

      {/* Result preview */}
      {previewDeliverable && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setPreviewDeliverable(null)}
        >
          <div
            className="bg-[#0F172A] border border-slate-700 w-full max-w-5xl h-[88vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-400" />
                <span className="font-bold text-white text-sm">
                  Live Preview: {previewDeliverable.title}
                </span>
              </div>
              <button
                onClick={() => setPreviewDeliverable(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/<!doctype html|<html|<body/i.test(previewDeliverable.contentSnippet || '') ? <iframe
              title="Deliverable Preview"
              srcDoc={previewDeliverable.contentSnippet}
              sandbox="allow-scripts"
              className="w-full flex-1 bg-white"
            /> : <pre className="min-h-0 flex-1 overflow-auto p-5 text-sm whitespace-pre-wrap text-slate-200">{previewDeliverable.contentSnippet}</pre>}
          </div>
        </div>
      )}

      {/* PROVIDER CONNECTION SETTINGS */}
      {showConnectionModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setShowConnectionModal(false)}
        >
          <div
            className="max-h-[92dvh] overflow-y-auto bg-[#0F172A] border border-slate-700 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">AI connection</h3>
                  <p className="text-xs text-slate-400">ChatGPT for GPT · Antigravity for Gemini</p>
                </div>
              </div>
              <button
                onClick={() => setShowConnectionModal(false)}
                aria-label="Close connection settings"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="font-semibold text-slate-200 block">Current Configuration:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Model:</span>
                    <span className="text-emerald-300">{modelLabel(configuredModel)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Connection:</span>
                    <span
                      className={`font-semibold ${
                        isConfigured ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {isConfigured ? '● Backend connected' : '○ Offline / sign in'}
                    </span>
                  </div>
                </div>
                <label className="block pt-2 text-slate-200">Model for {employee.name}
                  <select aria-label={`Model for ${employee.name}`} value={configuredModel} disabled={checkingConnection || isSendingChat || !EmployeeAIService.getAvailableModels().length} onChange={async event => {
                    setCheckingConnection(true); setConnectionError(null);
                    try { await EmployeeAIService.setEmployeeModel(employee.id,event.target.value); }
                    catch(error) { setConnectionError(error instanceof Error ? error.message : 'Could not save model.'); }
                    finally { setCheckingConnection(false); }
                  }} className="mt-1.5 w-full bg-[#202B30] border border-[#50625D] rounded-lg px-3 py-2 text-[#E8EBE3] disabled:opacity-50">
                    {EmployeeAIService.getAvailableModels().map(model=><option key={model} value={model}>{modelLabel(model)}</option>)}
                  </select>
                </label>
                {employeeModel?.fallback && <p className="text-amber-200">{modelLabel(employeeModel.preferredModel)} is unavailable. Currently using {modelLabel(configuredModel)}.</p>}
                <p className="text-[11px] text-slate-400">Images use {modelLabel(employeeModel?.imageModel)}. Model choices stay saved for each employee.</p>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-2">
                <p className="font-semibold text-white">Connected accounts</p>
                <p>Each employee keeps their own role and conversation. GPT uses your ChatGPT sign-in; Gemini and image creation use Antigravity. Account limits apply.</p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <span className={providers.chatgpt?.configured ? 'text-emerald-300' : 'text-amber-300'}>ChatGPT: {providers.chatgpt?.configured ? 'Connected' : 'Sign-in needed'}</span>
                  <span className={providers.antigravity?.configured ? 'text-emerald-300' : 'text-amber-300'}>Antigravity: {providers.antigravity?.configured ? 'Connected' : 'Sign-in needed'}</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button type="button" disabled={checkingConnection} onClick={async()=>{setCheckingConnection(true);setConnectionError(null);try{const result=await EmployeeAIService.signInChatGPT();if(result.alreadyConnected)await EmployeeAIService.refreshConnection(true);else setConnectionError('Complete the official ChatGPT sign-in, then click Check connection.');}catch(error){setConnectionError(error instanceof Error?error.message:'Could not open ChatGPT sign-in.');}finally{setCheckingConnection(false);}}} className="rounded-lg border border-[#566850] px-3 py-2 text-[#cddbc8] disabled:opacity-50">Sign in with ChatGPT</button>
                  <button type="button" disabled={checkingConnection} onClick={async () => { setCheckingConnection(true); setConnectionError(null); try { const result = await EmployeeAIService.signInAntigravity(); if (result.alreadyConnected) { setIsConfigured(true); setConnectionError(null); } else setConnectionError('Complete sign-in in the official Antigravity window, then click Check connection.'); } catch(error) { setConnectionError(error instanceof Error ? error.message : 'Could not open Antigravity.'); } finally { setCheckingConnection(false); } }} className="rounded-lg border border-[#566850] px-3 py-2 text-[#cddbc8] disabled:opacity-50">Open Antigravity sign-in</button>
                  <button type="button" disabled={checkingConnection} onClick={async () => { setCheckingConnection(true); setConnectionError(null); try { await EmployeeAIService.checkAntigravity(); setIsConfigured(true); } catch(error) { setConnectionError(error instanceof Error ? error.message : 'Connection failed.'); } finally { setCheckingConnection(false); } }} className="rounded-lg bg-[#baa477] text-[#171c1e] px-3 py-2 disabled:opacity-50">{checkingConnection ? 'Checking…' : 'Check connection'}</button>
                </div>
                {EmployeeAIService.requiresOfficeLogin() && <p className="pt-2 text-[11px] text-slate-400">Unlock this shared office with its separate access password below.</p>}
              </div>
              <div className="space-y-2 pt-1">
                {connectionError && <p role="alert" className="text-rose-300">{connectionError}</p>}
                <form onSubmit={handleOfficeLogin} className="space-y-3">
                  {EmployeeAIService.requiresOfficeLogin() && <input
                    type="password"
                    value={officePassword}
                    onChange={e => setOfficePassword(e.target.value)}
                    placeholder="Office access password" aria-label="Office access password" autoComplete="current-password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                  />}

                  <div className="flex items-center justify-between pt-1">
                    {isConfigured && EmployeeAIService.requiresOfficeLogin() && (
                      <button
                        type="button"
                        onClick={() => {
                          void EmployeeAIService.disconnect().then(() => setIsConfigured(EmployeeAIService.isConfigured()));
                        }}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Disconnect session
                      </button>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => setShowConnectionModal(false)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-medium"
                      >
                        Cancel
                      </button>
                      {EmployeeAIService.requiresOfficeLogin() && <button
                        type="submit"
                        disabled={!officePassword.trim()}
                        className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-xs text-white font-semibold shadow"
                      >
                        Connect securely
                      </button>}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
