import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Folder,
  FileCode,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Layers,
  Bot,
  Zap,
  Globe,
  Database,
  TrendingUp,
  Crown,
  Eye,
  ChevronRight
} from 'lucide-react';
import { EMPLOYEES } from '../../data/employees';
import { FolderIngestionService, IngestionResult } from '../../services/folderIngestion';
import { StorageService } from '../../services/storage';
import { SoundEffects } from '../../services/audio';

interface ProjectUploadModalProps {
  onClose: () => void;
  onProjectIngested: (projectId: string) => void;
}

export const ProjectUploadModal: React.FC<ProjectUploadModalProps> = ({
  onClose,
  onProjectIngested
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const [projectName, setProjectName] = useState('');
  const [selectedEmpFilter, setSelectedEmpFilter] = useState<string>('all');
  const [expandedFileSnippet, setExpandedFileSnippet] = useState<{ path: string; snippet: string } | null>(null);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = async (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    SoundEffects.playOpenModal();

    try {
      const result = await FolderIngestionService.ingestFiles(fileList, projectName);
      setIngestionResult(result);
      setProjectName(result.project.name);
    } catch (err: any) {
      alert(`Error processing files: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const items = e.dataTransfer.items;
    if (items && items.length > 0) {
      const fileList: File[] = [];

      const readEntry = async (entry: any, path = ''): Promise<void> => {
        if (entry.isFile) {
          const file = await new Promise<File>((resolve) => entry.file(resolve));
          Object.defineProperty(file, 'webkitRelativePath', {
            value: path ? `${path}/${file.name}` : file.name
          });
          fileList.push(file);
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          const entries = await new Promise<any[]>((resolve) => {
            dirReader.readEntries(resolve);
          });
          for (const subEntry of entries) {
            await readEntry(subEntry, path ? `${path}/${entry.name}` : entry.name);
          }
        }
      };

      setIsProcessing(true);
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          if (entry) await readEntry(entry);
        } else {
          const f = item.getAsFile();
          if (f) fileList.push(f);
        }
      }

      if (fileList.length > 0) {
        await handleFilesSelected(fileList);
      } else {
        setIsProcessing(false);
      }
    } else if (e.dataTransfer.files) {
      await handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleLoadSample = (type: 'saas' | 'ecommerce') => {
    setIsProcessing(true);
    SoundEffects.playNearChime();
    setTimeout(() => {
      const sample = FolderIngestionService.generateSampleProject(type);
      setIngestionResult(sample);
      setProjectName(sample.project.name);
      setIsProcessing(false);
    }, 250);
  };

  const handleDeployToOffice = () => {
    if (!ingestionResult) return;

    // Apply custom project name if modified
    const finalProject = {
      ...ingestionResult.project,
      name: projectName.trim() || ingestionResult.project.name
    };

    // Save project to storage
    StorageService.addProject(finalProject);

    // Save all generated employee tasks
    ingestionResult.tasks.forEach(task => {
      StorageService.saveTask({
        ...task,
        projectId: finalProject.id
      });
    });

    // Add activity log
    StorageService.addActivityLog({
      id: `act-${Date.now()}`,
      employeeId: 'ameen',
      timestamp: new Date().toISOString(),
      type: 'task_created',
      message: `Project folder "${finalProject.name}" ingested with ${finalProject.totalFiles} files. All 7 department heads deployed.`,
      user: 'User'
    });

    // Save active project in settings
    StorageService.saveSettings({ activeProjectId: finalProject.id });

    // Notify sound
    SoundEffects.playOpenModal();

    // Trigger parent callback
    onProjectIngested(finalProject.id);
    onClose();
  };

  const getEmpIcon = (empId: string) => {
    switch (empId) {
      case 'adhi': return <Globe className="w-4 h-4 text-cyan-400" />;
      case 'abbu': return <Eye className="w-4 h-4 text-teal-400" />;
      case 'prox': return <Sparkles className="w-4 h-4 text-indigo-400" />;
      case 'vaibav': return <Bot className="w-4 h-4 text-purple-400" />;
      case 'taha': return <Database className="w-4 h-4 text-blue-400" />;
      case 'rewaant': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'ameen': return <Crown className="w-4 h-4 text-amber-400" />;
      default: return <FileCode className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
          SoundEffects.playCloseModal();
        }
      }}
    >
      <div className="bg-[#0F172A] border border-slate-700/80 w-full max-w-4xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Project Folder Ingestion Engine
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AUTO-DEPARTMENT DISPATCH
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload any repository, client folder, or code directory. Each employee extracts what matches their role.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              SoundEffects.playCloseModal();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!ingestionResult ? (
            /* STEP 1: UPLOAD DROP ZONE */
            <div className="space-y-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all flex flex-col items-center justify-center gap-4 ${
                  dragOver
                    ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-900/40'
                }`}
              >
                <div className="p-4 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Upload className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-white">
                    Drag and drop your project folder here
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    Works on any codebase, client assets, design specs, or multi-folder repository. Files will be scanned and claimed by matching specialists.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => folderInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg flex items-center gap-2 transition-all hover:scale-105"
                  >
                    <Folder className="w-4 h-4" />
                    <span>Upload Folder</span>
                  </button>

                  <button
                    onClick={() => filesInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 shadow flex items-center gap-2 transition-all"
                  >
                    <FileCode className="w-4 h-4" />
                    <span>Select Files</span>
                  </button>

                  {/* Hidden browser file inputs */}
                  <input
                    ref={folderInputRef}
                    type="file"
                    /* @ts-ignore */
                    webkitdirectory=""
                    directory=""
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                  <input
                    ref={filesInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                  />
                </div>

                {isProcessing && (
                  <div className="flex items-center gap-2 text-xs text-cyan-400 animate-pulse pt-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    Scanning folder tree & classifying files by department...
                  </div>
                )}
              </div>

              {/* QUICK DEMO SAMPLES */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Or test immediately with a sample project folder:
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleLoadSample('saas')}
                    className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-cyan-500/50 text-left transition-all flex items-start gap-3 group"
                  >
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-cyan-300">
                        SaaS Enterprise Platform (13 files)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Frontend Next.js app, Figma copy, Perplexity keywords, Gemini agent, PostgreSQL schema, cold leads.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleLoadSample('ecommerce')}
                    className="p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-emerald-500/50 text-left transition-all flex items-start gap-3 group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">
                        Autonomous E-Commerce Engine (7 files)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Storefront React UI, CRO offer copy, JSON-LD schemas, inventory AI agent, Stripe SQL, wholesale leads.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: PARSED FOLDER BREAKDOWN & EMPLOYEE CLAIMS */
            <div className="space-y-6">
              {/* Project Meta Bar */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Project Initiative Name
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-cyan-500 w-full md:w-80"
                  />
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
                  <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
                    📂 <span className="text-white font-bold">{ingestionResult.fileCount}</span> files parsed
                  </div>
                  <div className="bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700">
                    👥 <span className="text-cyan-400 font-bold">{ingestionResult.departmentCount}</span> departments claimed
                  </div>
                </div>
              </div>

              {/* Department Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedEmpFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedEmpFilter === 'all'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  All 7 Team Members
                </button>
                {EMPLOYEES.map((emp) => {
                  const claim = ingestionResult.project.departmentClaims?.[emp.id];
                  const count = claim?.fileCount || 0;
                  return (
                    <button
                      key={emp.id}
                      onClick={() => setSelectedEmpFilter(emp.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                        selectedEmpFilter === emp.id
                          ? 'bg-slate-700 text-white border border-cyan-400'
                          : 'bg-slate-800/80 text-slate-400 hover:text-white'
                      }`}
                    >
                      {getEmpIcon(emp.id)}
                      <span>{emp.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 font-mono text-cyan-300">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Employee Extraction Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EMPLOYEES.filter(
                  (emp) => selectedEmpFilter === 'all' || selectedEmpFilter === emp.id
                ).map((emp) => {
                  const claim = ingestionResult.project.departmentClaims?.[emp.id];
                  if (!claim) return null;

                  return (
                    <div
                      key={emp.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-all"
                    >
                      <div className="space-y-2">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                              {getEmpIcon(emp.id)}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                {emp.name}
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                                  {emp.title}
                                </span>
                              </h4>
                              <p className="text-[11px] text-slate-400">{emp.roomName}</p>
                            </div>
                          </div>

                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                            {claim.fileCount} files claimed
                          </span>
                        </div>

                        {/* Summary */}
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                          {claim.summary}
                        </p>

                        {/* Claimed Files List */}
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Extracted Files Preview:
                          </span>
                          <div className="max-h-28 overflow-y-auto space-y-1">
                            {claim.files.slice(0, 5).map((f, idx) => (
                              <div
                                key={idx}
                                onClick={() =>
                                  setExpandedFileSnippet({
                                    path: f.path,
                                    snippet: f.snippet || '[No text snippet available]'
                                  })
                                }
                                className="text-[11px] font-mono text-cyan-400 bg-slate-800/60 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/50 flex items-center justify-between cursor-pointer group"
                              >
                                <span className="truncate max-w-[240px]">{f.path}</span>
                                <span className="text-[10px] text-slate-500 group-hover:text-cyan-300">
                                  {(f.size / 1024).toFixed(1)} KB ↗
                                </span>
                              </div>
                            ))}
                            {claim.files.length > 5 && (
                              <div className="text-[10px] text-slate-500 font-mono pl-1">
                                + {claim.files.length - 5} more files...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Generated Task Brief Preview */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Generated Task:</span>
                          <span className="text-white truncate">{claim.suggestedTaskTitle}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* File Snippet Modal */}
              {expandedFileSnippet && (
                <div
                  className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                  onClick={() => setExpandedFileSnippet(null)}
                >
                  <div
                    className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-xl w-full max-h-[80vh] flex flex-col space-y-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-mono text-xs text-cyan-300 truncate">
                        {expandedFileSnippet.path}
                      </span>
                      <button
                        onClick={() => setExpandedFileSnippet(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-xl overflow-x-auto flex-1 whitespace-pre-wrap max-h-96">
                      {expandedFileSnippet.snippet}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          {ingestionResult ? (
            <button
              onClick={() => {
                setIngestionResult(null);
                setProjectName('');
              }}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              ← Choose another folder
            </button>
          ) : (
            <div className="text-xs text-slate-400">
              Each folder is processed locally in the browser before deploying to employees.
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                SoundEffects.playCloseModal();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>

            {ingestionResult && (
              <button
                onClick={handleDeployToOffice}
                className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-xl flex items-center gap-2 transition-all hover:scale-105"
              >
                <span>Deploy to Office & Assign to Employees</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
