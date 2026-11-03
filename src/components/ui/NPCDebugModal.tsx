import React, { useEffect, useState } from 'react';
import { npcBrain, NPCAgent, NPCState } from '../../services/npcBrain';
import { OFFICE_CONFIG } from '../../config/office.config';

interface NPCDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NPCDebugModal: React.FC<NPCDebugModalProps> = ({ isOpen, onClose }) => {
  const [agents, setAgents] = useState<NPCAgent[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setAgents(npcBrain.getAllAgents());
    }, 250);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const getStateBadgeColor = (state: NPCState) => {
    switch (state) {
      case 'AT_DESK_WORKING':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'WALKING_TO_BREAK':
      case 'RETURNING_TO_DESK':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'COFFEE':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'SNACK':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'SITTING_IN_LOUNGE':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'CHATTING_WITH_PLAYER':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'WAITING_FOR_DOOR':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              🤖
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-wide">
                NPC Autonomous Life & Brain Inspector
              </h2>
              <p className="text-xs text-slate-400">
                Press [B] to toggle • Real-time state machine telemetry & manual override
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => npcBrain.commandAllBackToDesks()}
              className="px-3.5 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 rounded-lg hover:bg-amber-500/30 transition-colors shadow-sm"
            >
              🚨 Recall Everyone to Desk
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-xs font-mono text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Employee</th>
                  <th className="pb-3 px-3">State</th>
                  <th className="pb-3 px-3">Location & Activity</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {agents.map(agent => (
                  <tr key={agent.config.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-3">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: agent.config.avatarColors.accent }}
                        />
                        {agent.config.name}
                        {agent.config.id === 'ameen' && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded font-mono">
                            CEO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{agent.config.role}</div>
                    </td>

                    <td className="py-4 px-3">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-mono font-bold rounded-md border ${getStateBadgeColor(
                          agent.state
                        )}`}
                      >
                        {agent.state}
                      </span>
                    </td>

                    <td className="py-4 px-3">
                      <div className="text-xs font-medium text-slate-300">
                        {agent.currentActivityDescription}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        Room: {agent.currentRoom}
                      </div>
                    </td>

                    <td className="py-4 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => {
                            if (agent.state === 'AT_DESK_WORKING') {
                              // Trigger immediate break
                              agent.breakCooldownTimer = 0;
                            }
                          }}
                          disabled={agent.state !== 'AT_DESK_WORKING'}
                          className="px-2 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 rounded text-slate-300 hover:text-white transition-colors"
                          title="Force Break"
                        >
                          ☕ Break
                        </button>

                        <button
                          onClick={() => npcBrain.commandBackToDesk(agent.config.id)}
                          disabled={agent.state === 'AT_DESK_WORKING' || agent.state === 'RETURNING_TO_DESK'}
                          className="px-2 py-1 text-xs font-medium bg-cyan-500/20 hover:bg-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed border border-cyan-500/40 rounded text-cyan-300 transition-colors"
                          title="Call back to desk"
                        >
                          🖥 Desk
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Schedule summary footer */}
          <div className="mt-4 p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl flex items-center justify-between text-xs text-slate-400">
            <div>
              <span className="text-white font-bold">Office Policy:</span> Maximum{' '}
              <span className="text-cyan-400 font-bold">{OFFICE_CONFIG.schedule.maxConcurrentBreaks}</span> concurrent
              employees on break • Interval: 2-6 min jittered • Automatic desk return.
            </div>
            <div className="font-mono text-slate-500">60Hz Kinematic Fixed Timestep</div>
          </div>
        </div>
      </div>
    </div>
  );
};
