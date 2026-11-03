import React, { useEffect, useState } from 'react';
import { X, UserCheck, ArrowRight, Briefcase, ShieldCheck } from 'lucide-react';
import { EMPLOYEES } from '../../data/employees';
import { EmployeeDefinition } from '../../types/office';
import { SoundEffects } from '../../services/audio';
import { useEmployeeWork } from '../../hooks/useEmployeeWork';
import { workPhase } from '../../services/employeeWorkManager';
import { EmployeeAIService } from '../../services/employeeAI';

const EmployeeStatus: React.FC<{ id: string }> = ({ id }) => {
  const state = useEmployeeWork(id);
  const [configured, setConfigured] = useState(EmployeeAIService.isConfigured());
  useEffect(() => {
    const update = () => setConfigured(EmployeeAIService.isConfigured());
    window.addEventListener('office-ai-connection', update);
    return () => window.removeEventListener('office-ai-connection', update);
  }, []);
  const phase = workPhase(state);
  const label = phase === 'idle' ? state.error ? 'Needs attention' : configured ? 'Ready' : 'Offline mode' : phase === 'thinking' ? 'Thinking…' : phase === 'responding' ? 'Responding…' : 'Working…';
  return <span className="text-[11px] text-[#b8cebb] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#9aba9d]" />{label}</span>;
};

interface EmployeeDirectoryModalProps {
  onClose: () => void;
  onSelectEmployee: (emp: EmployeeDefinition) => void;
}

export const EmployeeDirectoryModal: React.FC<EmployeeDirectoryModalProps> = ({
  onClose,
  onSelectEmployee
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        SoundEffects.playCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
      <div className="bg-[#0F172A] border border-slate-700/80 w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Verlyn Tech — Employee Directory</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                All 7 specialized personnel across the 4 department rooms. Open any profile to assign tasks or review credentials.
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

        {/* Directory Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {EMPLOYEES.map(emp => (
            <div
              key={emp.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-md border border-white/20"
                      style={{ backgroundColor: emp.avatarColors.accent }}
                    >
                      {emp.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">
                        {emp.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">{emp.title}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide border uppercase"
                      style={{
                        backgroundColor: `${emp.avatarColors.accent}15`,
                        borderColor: `${emp.avatarColors.accent}40`,
                        color: emp.avatarColors.accent
                      }}
                    >
                      {emp.departmentName}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {emp.roleDescription}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <EmployeeStatus id={emp.id} />

                <button
                  onClick={() => {
                    onSelectEmployee(emp);
                    SoundEffects.playOpenModal();
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <span>Open Panel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>7 Active Team Roles Registered • Ready for Phase 2 Tool Integration</span>
          <button
            onClick={() => {
              onClose();
              SoundEffects.playCloseModal();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};
