import React, { useState, useEffect } from 'react';
import { X, Layers, Filter, CheckCircle2, Clock, Trash2, ArrowUpRight, FolderKanban } from 'lucide-react';
import { EmployeeTask, Project, EmployeeDefinition } from '../../types/office';
import { EMPLOYEES } from '../../data/employees';
import { StorageService } from '../../services/storage';
import { SoundEffects } from '../../services/audio';

interface TaskBoardModalProps {
  projects: Project[];
  onClose: () => void;
  onOpenEmployee: (emp: EmployeeDefinition) => void;
}

export const TaskBoardModal: React.FC<TaskBoardModalProps> = ({
  projects,
  onClose,
  onOpenEmployee
}) => {
  const [tasks, setTasks] = useState<EmployeeTask[]>([]);
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<EmployeeTask | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = () => {
    setTasks(StorageService.getTasks());
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedTask) {
          setSelectedTask(null);
        } else {
          onClose();
          SoundEffects.playCloseModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedTask]);

  const filteredTasks = tasks.filter(t => {
    if (filterProject !== 'all' && t.projectId !== filterProject) return false;
    if (filterEmployee !== 'all' && t.employeeId !== filterEmployee) return false;
    return true;
  });

  const handleDelete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this task brief?')) {
      StorageService.deleteTask(taskId);
      loadTasks();
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
      }
      SoundEffects.playCloseModal();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
          SoundEffects.playCloseModal();
        }
      }}
    >
      <div className="bg-[#0F172A] border border-slate-700/80 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Verlyn Tech — Company Task Board</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized registry of all client assignments across Web, AI, Systems, and Growth teams.
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

        {/* Filters Bar */}
        <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            {/* Project Filter */}
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Employee Filter */}
            <select
              value={filterEmployee}
              onChange={e => setFilterEmployee(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Employees</option>
              {EMPLOYEES.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.departmentName})
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400">
            Showing <strong className="text-white">{filteredTasks.length}</strong> assignments
          </span>
        </div>

        {/* Task List Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-slate-800 rounded-xl">
              <p className="text-sm text-slate-400">No tasks found matching filter criteria.</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const emp = EMPLOYEES.find(e => e.id === task.employeeId);
              const proj = projects.find(p => p.id === task.projectId);

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-white group-hover:text-blue-400 transition-colors">
                        {task.title}
                      </span>
                      {task.extractedFromFolder && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-950/80 text-indigo-300 border border-indigo-600/50 flex items-center gap-1">
                          📁 {task.attachedFiles?.length || 1} Extracted Files
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-950/80 text-amber-300 border border-amber-600/50">
                        {task.status.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          task.priority === 'urgent'
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-600/50'
                            : task.priority === 'high'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-600/50'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: emp?.avatarColors.accent || '#38bdf8' }}
                        />
                        <strong className="text-slate-200">{emp?.name || task.employeeId}</strong>
                        <span className="text-slate-500">({emp?.departmentName})</span>
                      </span>
                      <span>•</span>
                      <span>Project: <strong className="text-slate-300">{proj?.name || 'Verlyn'}</strong></span>
                      <span>•</span>
                      <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {emp && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onOpenEmployee(emp);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 transition-colors"
                      >
                        <span>Open {emp.name}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={e => handleDelete(task.id, e)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Delete assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Task Details Drawer Modal if selected */}
        {selectedTask && (
          <div className="p-6 bg-slate-900 border-t border-slate-700 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400">ASSIGNMENT DETAILS: {selectedTask.id}</span>
                <h3 className="text-base font-bold text-white">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300"
              >
                Close Details
              </button>
            </div>

            {selectedTask.attachedFiles && selectedTask.attachedFiles.length > 0 && (
              <div className="p-3 bg-slate-950 rounded-xl border border-indigo-500/30 space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-indigo-400 block">
                  📁 Attached Files Extracted From Project Folder ({selectedTask.attachedFiles.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTask.attachedFiles.map((file, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-slate-300">
                      {file}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {selectedTask.briefDetails &&
                Object.entries(selectedTask.briefDetails).map(([k, v]) => (
                  <div key={k} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      {k.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-slate-200 whitespace-pre-wrap">{String(v)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>All assignments persist locally in browser storage</span>
          <button
            onClick={() => {
              onClose();
              SoundEffects.playCloseModal();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Close Board
          </button>
        </div>
      </div>
    </div>
  );
};
