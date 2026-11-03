import React from 'react';
import { EMPLOYEES } from '../../data/employees';
import { ROOMS } from '../../data/rooms';
import { EmployeeDefinition } from '../../types/office';
import { Monitor, User, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { SoundEffects } from '../../services/audio';

interface FloorplanFallback2DProps {
  onSelectEmployee: (emp: EmployeeDefinition) => void;
}

export const FloorplanFallback2D: React.FC<FloorplanFallback2DProps> = ({
  onSelectEmployee
}) => {
  return (
    <div className="w-full h-full bg-[#080C16] text-slate-100 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <h1 className="text-2xl font-bold tracking-tight text-white">Verlyn HQ — Interactive 2D Floorplan</h1>
            </div>
            <p className="text-sm text-slate-400">
              Complete office architectural view. Click any employee workstation to open their assignment brief panel.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-3 py-1.5 rounded-xl">
            <span>2D Fallback Mode Active</span>
          </div>
        </div>

        {/* 2D Interactive Office Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ROOM 1: WEB AND SEARCH STUDIO */}
          <div className="bg-slate-900/60 border-2 border-cyan-500/40 rounded-2xl p-5 space-y-4 hover:border-cyan-500/70 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  WSS-01
                </span>
                <h2 className="text-lg font-bold text-white">Room 1 — Web & Search Studio</h2>
              </div>
              <span className="text-xs text-cyan-300 font-medium">3 Personnel</span>
            </div>

            <p className="text-xs text-slate-400">
              High-performance web architecture, conversion landing pages, and Generative Engine Optimization (GEO).
            </p>

            <div className="space-y-3">
              {EMPLOYEES.filter(e => e.departmentId === 'web-search').map(emp => (
                <div
                  key={emp.id}
                  onClick={() => {
                    onSelectEmployee(emp);
                    SoundEffects.playOpenModal();
                  }}
                  className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/50 p-3.5 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                      style={{ backgroundColor: emp.avatarColors.accent }}
                    >
                      {emp.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-white group-hover:text-cyan-400 transition-colors">
                        {emp.name}
                      </h3>
                      <p className="text-xs text-slate-400">{emp.title}</p>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600/80 group-hover:bg-cyan-500 text-white flex items-center gap-1 transition-colors">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ROOM 4: CEO OFFICE */}
          <div className="bg-slate-900/60 border-2 border-amber-500/40 rounded-2xl p-5 space-y-4 hover:border-amber-500/70 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  CEO-04
                </span>
                <h2 className="text-lg font-bold text-white">Room 4 — CEO Office & Boardroom</h2>
              </div>
              <span className="text-xs text-amber-300 font-medium">Executive Office</span>
            </div>

            <p className="text-xs text-slate-400">
              Executive strategy, project roadmap planning, cross-functional team coordination, and client advisory.
            </p>

            <div className="space-y-3">
              {EMPLOYEES.filter(e => e.departmentId === 'ceo').map(emp => (
                <div
                  key={emp.id}
                  onClick={() => {
                    onSelectEmployee(emp);
                    SoundEffects.playOpenModal();
                  }}
                  className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/50 p-3.5 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                      style={{ backgroundColor: emp.avatarColors.accent }}
                    >
                      {emp.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-white group-hover:text-amber-400 transition-colors">
                        {emp.name}
                      </h3>
                      <p className="text-xs text-slate-400">{emp.title}</p>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600/80 group-hover:bg-amber-500 text-white flex items-center gap-1 transition-colors">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-900/40 text-xs text-amber-300/80">
              Includes: Executive Meeting Table, Conference Seating, and Verlyn Master Roadmap Display.
            </div>
          </div>

          {/* ROOM 2: AI AND BUSINESS SYSTEMS LAB */}
          <div className="bg-slate-900/60 border-2 border-purple-500/40 rounded-2xl p-5 space-y-4 hover:border-purple-500/70 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  ABL-02
                </span>
                <h2 className="text-lg font-bold text-white">Room 2 — AI & Business Systems Lab</h2>
              </div>
              <span className="text-xs text-purple-300 font-medium">2 Personnel</span>
            </div>

            <p className="text-xs text-slate-400">
              Autonomous multi-agent loops, LLM tool pipelines, custom CRM schemas, and enterprise ERP syncs.
            </p>

            <div className="space-y-3">
              {EMPLOYEES.filter(e => e.departmentId === 'ai-systems').map(emp => (
                <div
                  key={emp.id}
                  onClick={() => {
                    onSelectEmployee(emp);
                    SoundEffects.playOpenModal();
                  }}
                  className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-purple-500/50 p-3.5 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                      style={{ backgroundColor: emp.avatarColors.accent }}
                    >
                      {emp.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-white group-hover:text-purple-400 transition-colors">
                        {emp.name}
                      </h3>
                      <p className="text-xs text-slate-400">{emp.title}</p>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/80 group-hover:bg-purple-500 text-white flex items-center gap-1 transition-colors">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-purple-950/30 rounded-xl border border-purple-900/40 text-xs text-purple-300/80">
              Includes: Neon AI Workflow Display near Vaibav & Enterprise Systems Display near Taha.
            </div>
          </div>

          {/* ROOM 3: GROWTH STUDIO */}
          <div className="bg-slate-900/60 border-2 border-emerald-500/40 rounded-2xl p-5 space-y-4 hover:border-emerald-500/70 transition-all">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  GWS-03
                </span>
                <h2 className="text-lg font-bold text-white">Room 3 — Growth Studio</h2>
              </div>
              <span className="text-xs text-emerald-300 font-medium">1 Personnel</span>
            </div>

            <p className="text-xs text-slate-400">
              Multi-channel outbound campaigns, paid acquisition funnels, and B2B pipeline conversion velocity.
            </p>

            <div className="space-y-3">
              {EMPLOYEES.filter(e => e.departmentId === 'growth').map(emp => (
                <div
                  key={emp.id}
                  onClick={() => {
                    onSelectEmployee(emp);
                    SoundEffects.playOpenModal();
                  }}
                  className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-3.5 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                      style={{ backgroundColor: emp.avatarColors.accent }}
                    >
                      {emp.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-white group-hover:text-emerald-400 transition-colors">
                        {emp.name}
                      </h3>
                      <p className="text-xs text-slate-400">{emp.title}</p>
                    </div>
                  </div>

                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/80 group-hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors">
                    <span>Inspect</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-900/40 text-xs text-emerald-300/80">
              Includes: Marketing Campaign Board & Real-Time Lead Pipeline Display.
            </div>
          </div>
        </div>

        {/* CENTRAL CORRIDOR & ENTRANCE */}
        <div className="bg-slate-900/60 border border-blue-500/40 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white">Central Atrium Corridor & Plaza Entrance</h3>
              <p className="text-xs text-slate-400">
                Grand corridor connecting all 4 department studios directly to the entrance plaza with illuminated directional signage.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Player Plaza Spawn • Direct Corridor Access • Verlyn Tech Illuminated Corporate Wall
          </div>
        </div>
      </div>
    </div>
  );
};
