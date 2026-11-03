import React, { useState } from 'react';
import {
  Users,
  FolderKanban,
  HelpCircle,
  Volume2,
  VolumeX,
  Plus,
  Eye,
  LogOut,
  Camera,
  Menu,
  Maximize2,
  Minimize2,
  Gauge,
} from 'lucide-react';
import { EmployeeDefinition, Project, SittableChair } from '../../types/office';
import { Minimap } from './Minimap';
import { SoundEffects } from '../../services/audio';
import { RefreshmentStation } from '../../data/refreshments';

interface HUDProps {
  nearEmployee: EmployeeDefinition | null;
  nearDesk?: { employee: EmployeeDefinition; isReturning: boolean } | null;
  nearChair?: SittableChair | null;
  nearDoor?: { id: string; name: string; isOpen: boolean } | null;
  onToggleDoor?: () => void;
  nearRefreshment?: RefreshmentStation | null;
  onOpenRefreshments?: () => void;
  refreshmentToast?: string | null;
  isSitting?: boolean;
  seatedChair?: SittableChair | null;
  onSit?: () => void;
  onStand?: () => void;
  onInteract: (emp: EmployeeDefinition) => void;
  onCallToDesk?: (emp: EmployeeDefinition) => void;
  onOpenDirectory: () => void;
  onOpenTaskBoard: () => void;
  onOpenControls: () => void;
  isPerformanceOpen: boolean;
  onTogglePerformance: () => void;
  onResetPosition: () => void;
  onOpenProjectUpload: () => void;
  onRecallTeam: () => void;
  isFirstPerson: boolean;
  onToggleFirstPerson: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  is2DMode: boolean;
  onToggle2DMode: () => void;
  projects: Project[];
  activeProjectId: string;
  onSelectProject: (id: string) => void;
  onAddProject: (name: string, client: string) => void;
  playerPos?: { x: number; z: number; rotation: number };
  onSelectEmployeeFromMinimap: (emp: EmployeeDefinition) => void;
}

export const HUD: React.FC<HUDProps> = React.memo(({
  nearEmployee,
  nearDesk,
  nearChair,
  nearDoor,
  onToggleDoor,
  nearRefreshment,
  onOpenRefreshments,
  refreshmentToast,
  isSitting = false,
  seatedChair,
  onSit,
  onStand,
  onInteract,
  onCallToDesk,
  onOpenDirectory,
  onOpenTaskBoard,
  onOpenControls,
  isPerformanceOpen,
  onTogglePerformance,
  onResetPosition,
  onOpenProjectUpload,
  onRecallTeam,
  isFirstPerson,
  onToggleFirstPerson,
  soundEnabled,
  onToggleSound,
  is2DMode,
  onToggle2DMode,
  projects,
  activeProjectId,
  onSelectProject,
  onAddProject,
  playerPos = { x: 0, z: 8.0, rotation: Math.PI },
  onSelectEmployeeFromMinimap,
}) => {
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayMessage, setDisplayMessage] = useState('');

  React.useEffect(() => {
    const update = () => setIsFullscreen(Boolean(document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement));
    update();
    document.addEventListener('fullscreenchange', update);
    document.addEventListener('webkitfullscreenchange', update);
    return () => {
      document.removeEventListener('fullscreenchange', update);
      document.removeEventListener('webkitfullscreenchange', update);
    };
  }, []);

  const toggleFullscreen = async () => {
    setDisplayMessage('');
    const page = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> | void };
    const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> | void };
    try {
      if (isFullscreen) {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else await doc.webkitExitFullscreen?.();
      } else if (page.requestFullscreen) await page.requestFullscreen();
      else if (page.webkitRequestFullscreen) await page.webkitRequestFullscreen();
      else setDisplayMessage('Fullscreen is unavailable in this browser.');
    } catch {
      setDisplayMessage('The browser could not enter fullscreen. Open the app in a regular browser tab and try again.');
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    onAddProject(newProjName.trim(), newProjClient.trim() || 'Verlyn Client');
    setNewProjName('');
    setNewProjClient('');
    setShowProjectModal(false);
    SoundEffects.playSuccess();
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20 flex flex-col justify-between p-4">
      {/* TOP BAR */}
      <header className="relative flex items-center justify-between gap-3 pointer-events-auto">
        {/* Brand / Logo */}
        <div className="bg-slate-900/95 border border-slate-700/80 px-2 sm:px-3.5 py-2 rounded-2xl shadow-xl flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center justify-center p-1 shadow-lg shadow-cyan-500/20 overflow-hidden">
            <img
              src="/verlyn-logo.jpg"
              alt="Verlyn Tech Logo"
              className="w-full h-full object-contain filter invert brightness-125 contrast-125"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[11px] sm:text-sm tracking-tight text-white">VERLYN TECH</span>
              <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                HQ 3D
              </span>
            </div>
            <p className="hidden sm:block text-[10px] text-slate-400">Enterprise AI Headquarters</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 order-last shrink-0">
        <button onClick={onOpenControls} aria-label="Controls" title="Controls" className="bg-slate-900/95 border border-slate-700 p-2 sm:px-3 sm:py-2.5 rounded-xl text-slate-100 flex items-center gap-1.5 text-xs">
          <HelpCircle className="w-4 h-4" /><span className="hidden sm:inline">Controls</span>
        </button>
        <button onClick={onTogglePerformance} aria-label="Performance" aria-pressed={isPerformanceOpen} title="Performance (P)" className={`bg-slate-900/95 border p-2 sm:px-3 sm:py-2.5 rounded-xl flex items-center gap-1.5 text-xs ${isPerformanceOpen ? 'border-[#bda779] text-[#e4d1a7]' : 'border-slate-700 text-slate-100'}`}>
          <Gauge className="w-4 h-4" /><span className="hidden sm:inline">Performance</span>
        </button>
        <button
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          className="bg-slate-900/95 border border-slate-700 p-2 sm:p-2.5 rounded-xl text-slate-100 shadow-lg"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setShowMobileMenu(open => !open)}
          aria-expanded={showMobileMenu}
          aria-label="Open office menu"
          className="bg-slate-900/95 border border-slate-700 p-2.5 rounded-xl text-slate-100 shadow-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        </div>

        {showMobileMenu && (
          <div className="absolute top-full right-0 mt-2 z-40 w-[min(21rem,calc(100vw-2rem))] max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl space-y-3">
            {!isSitting && (
              <div className="flex items-center gap-2">
                <select
                  aria-label="Project"
                  value={activeProjectId}
                  onChange={e => onSelectProject(e.target.value)}
                  className="min-w-0 flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white"
                >
                  {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
                <button onClick={() => { setShowMobileMenu(false); setShowProjectModal(true); }} title="Create project" className="p-2 rounded-lg bg-slate-800 text-white"><Plus className="w-4 h-4" /></button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button onClick={() => { setShowMobileMenu(false); onOpenDirectory(); }} className="rounded-lg bg-slate-800 p-2 text-left">Directory</button>
              <button onClick={() => { setShowMobileMenu(false); onOpenTaskBoard(); }} className="rounded-lg bg-slate-800 p-2 text-left">Task Board</button>
              <button onClick={() => { setShowMobileMenu(false); onOpenControls(); }} className="rounded-lg bg-slate-800 p-2 text-left">Controls</button>
              <button onClick={() => { setShowMobileMenu(false); onToggle2DMode(); }} className="rounded-lg bg-slate-800 p-2 text-left">{is2DMode ? '3D View' : '2D Map'}</button>
              <button onClick={() => { setShowMobileMenu(false); onOpenProjectUpload(); }} className="rounded-lg bg-slate-800 p-2 text-left">Upload project</button>
              <button onClick={() => { setShowMobileMenu(false); onResetPosition(); }} className="rounded-lg bg-slate-800 p-2 text-left">Reset position</button>
              {!is2DMode && <button onClick={onToggleFirstPerson} className="rounded-lg bg-slate-800 p-2 text-left">{isFirstPerson ? 'Third-person view' : 'First-person view'}</button>}
              {!is2DMode && <button onClick={() => { onRecallTeam(); setShowMobileMenu(false); }} className="rounded-lg bg-slate-800 p-2 text-left">Call team to desks</button>}
            </div>
            <button onClick={onToggleSound} className="text-xs text-slate-300">Sound: {soundEnabled ? 'On' : 'Off'}</button>
            <p className="text-[11px] text-slate-400">Sensitivity and reduced motion are in Controls.</p>
          </div>
        )}
        {displayMessage && <div role="status" className="absolute top-full right-0 mt-2 z-50 max-w-xs rounded-xl border border-slate-600 bg-slate-900 p-3 text-xs text-slate-200" onClick={() => setDisplayMessage('')}>{displayMessage}</div>}

        {/* First Person Active Indicator when sitting */}
        {isSitting && (
          <div className="hidden xl:flex bg-slate-900/95 border border-slate-700 text-white px-4 py-2 rounded-2xl shadow-xl items-center gap-3">
            <Camera className="w-4 h-4 animate-pulse" />
            <div className="text-left">
              <span className="text-xs font-black tracking-wide block uppercase">
                Seated
              </span>
              <span className="text-[11px] text-amber-100 font-medium">
                {seatedChair?.name || 'Seated at Workstation'}
              </span>
            </div>
            <button
              onClick={onStand}
              className="ml-2 px-3 py-1 rounded-xl bg-black/40 hover:bg-black/60 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Stand Up [F]</span>
            </button>
          </div>
        )}

        {refreshmentToast && (
          <div role="status" className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1c2924] border border-[#829a83] text-[#e9efe8] px-4 py-2 rounded-xl shadow-xl text-sm font-medium whitespace-nowrap">
            {refreshmentToast}
          </div>
        )}

        {/* Project Selector */}
        {!isSitting && (
          <div className="hidden xl:flex bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-2xl shadow-xl items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Project:</span>
            <select
              value={activeProjectId}
              onChange={e => onSelectProject(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer max-w-[200px] truncate"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowProjectModal(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Create New Project"
            >
              <Plus className="w-4 h-4" />
            </button>

          </div>
        )}

        {/* Global Controls & Actions */}
        <div className="hidden xl:flex items-center gap-2">
          <button
            onClick={onOpenDirectory}
            className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-2 shadow-lg transition-all"
            title="Employee Directory"
          >
            <Users className="w-4 h-4 text-blue-400" />
            <span>Directory</span>
          </button>

          <button
            onClick={onOpenTaskBoard}
            className="bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-2 shadow-lg transition-all"
            title="Company Task Board"
          >
            <FolderKanban className="w-4 h-4 text-purple-400" />
            <span>Task Board</span>
          </button>

          {/* Sound */}
          <button
            onClick={onToggleSound}
            className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 p-2 rounded-xl text-slate-300 shadow-lg"
            title={soundEnabled ? 'Mute audio' : 'Unmute audio'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Floorplan fallback */}
          <button
            onClick={onToggle2DMode}
            className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 shadow-lg flex items-center gap-1.5"
            title={is2DMode ? 'Switch to 3D office' : 'Switch to 2D floorplan'}
          >
            <Eye className="w-4 h-4" />
            <span>{is2DMode ? '3D View' : '2D Map'}</span>
          </button>
        </div>
      </header>

      {/* BOTTOM AREA */}
      <footer className="flex items-end justify-between gap-4">
        {/* A short reminder; detailed controls live in Help. */}
        <div className="office-key-guide absolute top-[4.75rem] left-4 max-w-[calc(100vw-2rem)] bg-slate-900/95 border border-slate-700 px-3 py-2 rounded-xl text-[10px] text-slate-200 pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-1">
          <span><kbd className="font-mono text-cyan-300">WASD</kbd> move</span>
          <span><kbd className="font-mono text-cyan-300">E</kbd> interact</span>
          <span><kbd className="font-mono text-cyan-300">C</kbd> call to desk</span>
          <span><kbd className="font-mono text-cyan-300">F</kbd> sit</span>
          <span><kbd className="font-mono text-cyan-300">Mouse</kbd> look</span>
          <span><kbd className="font-mono text-cyan-300">Scroll / V</kbd> view</span>
          <span><kbd className="font-mono text-cyan-300">Space</kbd> jump / stand</span>
          <span><kbd className="font-mono text-cyan-300">Q</kbd> door</span>
        </div>
        <div className="office-touch-guide absolute top-[4.75rem] left-4 max-w-[calc(100vw-2rem)] bg-slate-900/95 border border-slate-700 px-3 py-2 rounded-xl text-[10px] text-slate-200">Arrow pad: move · Swipe: look · Tap action: interact</div>

        <div className="office-proximity absolute left-1/2 -translate-x-1/2 bottom-6 pointer-events-auto flex flex-col sm:flex-row items-center gap-2 max-w-[calc(100vw-2rem)]">
          {nearRefreshment && !isSitting ? (
            <button onClick={onOpenRefreshments} className="office-action">
              <kbd>E</kbd><span>{nearRefreshment.name}<small>Choose food or drink</small></span>
            </button>
          ) : nearDesk ? (
            <button onClick={() => onCallToDesk?.(nearDesk.employee)} disabled={nearDesk.isReturning} className="office-action">
              <kbd>{nearDesk.isReturning ? '✓' : 'C'}</kbd>
              <span>{nearDesk.isReturning ? `${nearDesk.employee.name} is on the way` : `Call ${nearDesk.employee.name} to desk`}</span>
            </button>
          ) : nearEmployee ? (
            <button onClick={() => onInteract(nearEmployee)} className="office-action">
              <kbd>E</kbd><span>Talk to {nearEmployee.name}<small>Resume your conversation</small></span>
            </button>
          ) : nearChair && !isSitting ? (
            <button onClick={onSit} className="office-action">
              <kbd>F</kbd><span>Sit down<small>{nearChair.name}</small></span>
            </button>
          ) : null}
          {isSitting && <button onClick={onStand} className="office-action office-action-secondary"><kbd>F</kbd><span>Stand up</span></button>}
          {nearChair && !isSitting && (nearEmployee || nearDesk || nearRefreshment) && <button onClick={onSit} className="office-action office-action-secondary"><kbd>F</kbd><span>Sit down</span></button>}
          {nearDoor && !isSitting && <button onClick={onToggleDoor} className="office-action office-action-secondary"><kbd>Q</kbd><span>{nearDoor.isOpen ? 'Close door' : 'Open door'}</span></button>}
        </div>
        {/* MINIMAP (BOTTOM RIGHT) */}
        {!is2DMode && !isSitting && (
          <div className="office-minimap pointer-events-auto hidden md:block">
            <Minimap
              playerPos={playerPos}
              onSelectEmployee={onSelectEmployeeFromMinimap}
            />
          </div>
        )}
      </footer>

      {/* NEW PROJECT MODAL */}
      {showProjectModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setShowProjectModal(false);
          }}
        >
          <div className="bg-[#0F172A] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white">Create New Client Project</h3>
            <p className="text-xs text-slate-400">
              Assignments will be tagged under this project so team deliverables stay organized.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  placeholder="e.g. Acme Corp — Autonomous Platform"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Client / Company Name</label>
                <input
                  type="text"
                  value={newProjClient}
                  onChange={e => setNewProjClient(e.target.value)}
                  placeholder="e.g. Acme Industries"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white shadow-lg"
                >
                  Create Project
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
});
