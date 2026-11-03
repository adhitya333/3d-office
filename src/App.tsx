import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OfficeCanvas } from './components/3d/OfficeCanvas';
import { HUD } from './components/ui/HUD';
import { DebugOverlay } from './components/ui/DebugOverlay';
import { EmployeePanelModal } from './components/ui/EmployeePanelModal';
import { EmployeeDirectoryModal } from './components/ui/EmployeeDirectoryModal';
import { TaskBoardModal } from './components/ui/TaskBoardModal';
import { ControlsModal } from './components/ui/ControlsModal';
import { FloorplanFallback2D } from './components/ui/FloorplanFallback2D';
import { NPCDebugModal } from './components/ui/NPCDebugModal';
import { ProjectUploadModal } from './components/ui/ProjectUploadModal';
import { RefreshmentsModal } from './components/ui/RefreshmentsModal';
import { TouchControls } from './components/ui/TouchControls';
import { EmployeeWorkIndicator } from './components/ui/EmployeeWorkIndicator';
import { EMPLOYEES } from './data/employees';
import { EmployeeDefinition, Project, SittableChair } from './types/office';
import { StorageService } from './services/storage';
import { SoundEffects } from './services/audio';
import { npcBrain } from './services/npcBrain';
import { EmployeeAIService } from './services/employeeAI';
import { RefreshmentItem, RefreshmentKind, RefreshmentStation } from './data/refreshments';

export const App: React.FC = () => {
  // Modal states
  const [activeEmployee, setActiveEmployee] = useState<EmployeeDefinition | null>(null);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isTaskBoardOpen, setIsTaskBoardOpen] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [isProjectUploadOpen, setIsProjectUploadOpen] = useState(false);

  // Office & HUD states
  const [nearEmployee, setNearEmployee] = useState<EmployeeDefinition | null>(null);
  const [nearDesk, setNearDesk] = useState<{ employee: EmployeeDefinition; isReturning: boolean } | null>(null);
  const [nearChair, setNearChair] = useState<SittableChair | null>(null);
  const [nearDoor, setNearDoor] = useState<{ id: string; name: string; isOpen: boolean } | null>(null);
  const [nearRefreshment, setNearRefreshment] = useState<RefreshmentStation | null>(null);
  const [refreshmentMenuStation, setRefreshmentMenuStation] = useState<RefreshmentStation | null>(null);
  const [refreshmentToast, setRefreshmentToast] = useState<string | null>(null);
  const [consumeRequest, setConsumeRequest] = useState<{ kind: RefreshmentKind; dish?: RefreshmentItem['dish']; nonce: number } | null>(null);
  const refreshmentToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isSitting, setIsSitting] = useState<boolean>(false);
  const [seatedChair, setSeatedChair] = useState<SittableChair | null>(null);
  const [sitTrigger, setSitTrigger] = useState<number>(0);
  const [standTrigger, setStandTrigger] = useState<number>(0);
  const [doorTrigger, setDoorTrigger] = useState<number>(0);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Settings & Projects
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mouseSensitivity, setMouseSensitivity] = useState(1.0);
  const [isFirstPerson, setIsFirstPerson] = useState(false);
  const [is2DMode, setIs2DMode] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [isNPCDebugOpen, setIsNPCDebugOpen] = useState(false);
  const [qualityTier, setQualityTier] = useState<'High' | 'Medium' | 'Low'>(() => {
    const saved = StorageService.getSettings().graphicsQuality;
    return ['Low', 'Medium', 'High'].includes(saved) ? saved : 'High';
  });
  const handleQualityChange = useCallback((tier: 'High' | 'Medium' | 'Low') => {
    setQualityTier(tier);
    StorageService.saveSettings({ graphicsQuality: tier });
  }, []);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [tasksVersion, setTasksVersion] = useState(0);

  useEffect(() => {
    if (!activeEmployee) return;
    npcBrain.startChatWithPlayer(activeEmployee.id);
    return () => npcBrain.endChatWithPlayer(activeEmployee.id);
  }, [activeEmployee?.id]);

  // Global Key listeners for Debug Overlays (P = Performance, B = NPC Brain)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'KeyP') {
        e.preventDefault();
        setIsDebugOpen(prev => !prev);
      }
      if (e.code === 'KeyB') {
        e.preventDefault();
        setIsNPCDebugOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize data from local storage
  useEffect(() => {
    const loadedProjects = StorageService.getProjects();
    void EmployeeAIService.refreshConnection(true);
    const loadedSettings = StorageService.getSettings();

    setProjects(loadedProjects);
    setSoundEnabled(loadedSettings.soundEnabled);
    setReducedMotion(loadedSettings.reducedMotion);
    setMouseSensitivity(loadedSettings.mouseSensitivity ?? 1.0);
    setIsFirstPerson(loadedSettings.firstPersonMode ?? false);
    setActiveProjectId(loadedSettings.activeProjectId || loadedProjects[0]?.id || 'proj-verlyn-core');
    SoundEffects.setEnabled(loadedSettings.soundEnabled);
  }, []);

  const handleSensitivityChange = (val: number) => {
    setMouseSensitivity(val);
    StorageService.saveSettings({ mouseSensitivity: val });
  };

  const handleToggleFirstPerson = useCallback(() => {
    setIsFirstPerson(prev => {
      const next = !prev;
      StorageService.saveSettings({ firstPersonMode: next });
      return next;
    });
  }, []);

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    SoundEffects.setEnabled(nextVal);
    StorageService.saveSettings({ soundEnabled: nextVal });
    if (nextVal) {
      SoundEffects.playNearChime();
    }
  };

  const handleToggleReducedMotion = () => {
    const nextVal = !reducedMotion;
    setReducedMotion(nextVal);
    StorageService.saveSettings({ reducedMotion: nextVal });
  };

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    StorageService.saveSettings({ activeProjectId: id });
  };

  const handleAddProject = (name: string, client: string) => {
    const newProj: Project = {
      id: `proj-${Date.now().toString(36)}`,
      name,
      client,
      description: `Client project for ${client}`,
      color: '#3B82F6',
      createdAt: new Date().toISOString()
    };
    StorageService.addProject(newProj);
    setProjects(StorageService.getProjects());
    setActiveProjectId(newProj.id);
  };

  const handleResetPosition = useCallback(() => {
    setResetTrigger(prev => prev + 1);
    setNearEmployee(null);
    setNearDesk(null);
    setNearChair(null);
    setIsSitting(false);
    setSeatedChair(null);
    SoundEffects.playNearChime();
  }, []);

  const handleInteract = (emp: EmployeeDefinition) => {
    setActiveEmployee(emp);
    SoundEffects.playOpenModal();
  };

  const handleCallToDesk = useCallback((emp: EmployeeDefinition) => {
    npcBrain.commandBackToDesk(emp.id);
    SoundEffects.playNearChime();
  }, []);

  const handleChooseRefreshment = (item: RefreshmentItem) => {
    setConsumeRequest(previous => ({ kind: item.kind, dish: item.dish, nonce: (previous?.nonce || 0) + 1 }));
    setRefreshmentMenuStation(null);
    setRefreshmentToast(`${item.name} ${item.kind === 'drink' ? 'served' : 'enjoyed'}`);
    if (item.kind === 'drink') SoundEffects.playDrinkWater();
    else SoundEffects.playNearChime();
    if (refreshmentToastTimer.current) clearTimeout(refreshmentToastTimer.current);
    refreshmentToastTimer.current = setTimeout(() => setRefreshmentToast(null), 2600);
  };

  const handleCloseEmployeeModal = () => {
    setActiveEmployee(null);
  };

  const handleOpenEmployeeFromDirectory = (emp: EmployeeDefinition) => {
    setIsDirectoryOpen(false);
    setActiveEmployee(emp);
  };

  const isAnyModalOpen = Boolean(
    activeEmployee || isDirectoryOpen || isTaskBoardOpen || isControlsOpen || isProjectUploadOpen || refreshmentMenuStation
  );

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-[#080C16] text-slate-100 font-sans select-none">
      {/* 3D Canvas View */}
      {!is2DMode && (
        <OfficeCanvas
          isModalOpen={isAnyModalOpen}
          reducedMotion={reducedMotion}
          sensitivity={mouseSensitivity}
          firstPersonMode={isFirstPerson}
          qualityTier={qualityTier}
          onQualityTierChange={setQualityTier}
          onToggleFirstPersonMode={handleToggleFirstPerson}
          onToggleDebugModal={() => setIsNPCDebugOpen(prev => !prev)}
          onNearEmployeeChange={setNearEmployee}
          onNearDeskChange={setNearDesk}
          onNearChairChange={setNearChair}
          onNearDoorChange={setNearDoor}
          onNearRefreshmentChange={setNearRefreshment}
          onOpenRefreshments={setRefreshmentMenuStation}
          onSittingChange={(sitting, chair) => {
            setIsSitting(sitting);
            setSeatedChair(chair);
          }}
          onInteract={handleInteract}
          onCallToDesk={handleCallToDesk}
          consumeRequest={consumeRequest}
          resetTrigger={resetTrigger}
          sitTrigger={sitTrigger}
          standTrigger={standTrigger}
          doorTrigger={doorTrigger}
          onLoaded={() => setIsSceneReady(true)}
        />
      )}

      {/* 2D Interactive Fallback View */}
      {is2DMode && (
        <FloorplanFallback2D
          onSelectEmployee={emp => {
            setActiveEmployee(emp);
            SoundEffects.playOpenModal();
          }}
        />
      )}

      {/* Heads Up Display (HUD) */}
      <HUD
        nearEmployee={is2DMode ? null : nearEmployee}
        nearDesk={is2DMode ? null : nearDesk}
        nearChair={nearChair}
        nearDoor={nearDoor}
        onToggleDoor={() => setDoorTrigger(t => t + 1)}
        nearRefreshment={is2DMode ? null : nearRefreshment}
        onOpenRefreshments={() => { if (nearRefreshment) setRefreshmentMenuStation(nearRefreshment); }}
        refreshmentToast={refreshmentToast}
        isSitting={isSitting}
        seatedChair={seatedChair}
        onSit={() => setSitTrigger(t => t + 1)}
        onStand={() => setStandTrigger(t => t + 1)}
        onInteract={handleInteract}
        onCallToDesk={handleCallToDesk}
        onOpenDirectory={() => {
          setIsDirectoryOpen(true);
          SoundEffects.playOpenModal();
        }}
        onOpenTaskBoard={() => {
          setIsTaskBoardOpen(true);
          SoundEffects.playOpenModal();
        }}
        onOpenControls={() => {
          setIsControlsOpen(true);
          SoundEffects.playOpenModal();
        }}
        soundEnabled={soundEnabled}
        isPerformanceOpen={isDebugOpen}
        onTogglePerformance={() => setIsDebugOpen(open => !open)}
        onResetPosition={handleResetPosition}
        onOpenProjectUpload={() => setIsProjectUploadOpen(true)}
        isFirstPerson={isFirstPerson}
        onToggleFirstPerson={handleToggleFirstPerson}
        onRecallTeam={() => {
          npcBrain.commandAllBackToDesks();
          SoundEffects.playNearChime();
          setRefreshmentToast('The team is returning to their desks');
          if (refreshmentToastTimer.current) clearTimeout(refreshmentToastTimer.current);
          refreshmentToastTimer.current = setTimeout(() => setRefreshmentToast(null), 3000);
        }}
        onToggleSound={handleToggleSound}
        is2DMode={is2DMode}
        onToggle2DMode={() => setIs2DMode(prev => !prev)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectProject}
        onAddProject={handleAddProject}
        onSelectEmployeeFromMinimap={emp => {
          setActiveEmployee(emp);
          SoundEffects.playOpenModal();
        }}
      />

      {!is2DMode && <TouchControls disabled={isAnyModalOpen} />}
      <EmployeeWorkIndicator onOpenEmployee={handleInteract} />

      {refreshmentMenuStation && (
        <RefreshmentsModal
          station={refreshmentMenuStation}
          onChoose={handleChooseRefreshment}
          onClose={() => setRefreshmentMenuStation(null)}
        />
      )}

      {/* WebGL Performance Debug Overlay (Press P) */}
      <DebugOverlay
        isOpen={isDebugOpen}
        onClose={() => setIsDebugOpen(false)}
        onQualityChange={handleQualityChange}
        currentQuality={qualityTier}
      />

      {/* NPC Autonomous Life & Brain Inspector (Press B) */}
      <NPCDebugModal
        isOpen={isNPCDebugOpen}
        onClose={() => setIsNPCDebugOpen(false)}
      />

      {/* PROJECT FOLDER UPLOAD & DEPARTMENT EXTRACTION MODAL */}
      {isProjectUploadOpen && (
        <ProjectUploadModal
          onClose={() => setIsProjectUploadOpen(false)}
          onProjectIngested={(newProjectId) => {
            const updatedProjects = StorageService.getProjects();
            setProjects(updatedProjects);
            setActiveProjectId(newProjectId);
            setTasksVersion(v => v + 1);
            setIsProjectUploadOpen(false);
          }}
        />
      )}

      {/* EMPLOYEE MODAL (Assign Task, Tasks, Deliverables, Activity) */}
      {activeEmployee && (
        <EmployeePanelModal
          key={activeEmployee.id}
          employee={activeEmployee}
          projects={projects}
          activeProjectId={activeProjectId}
          onClose={handleCloseEmployeeModal}
          onTasksUpdated={() => setTasksVersion(v => v + 1)}
          onOpenProjectUpload={() => setIsProjectUploadOpen(true)}
        />
      )}

      {/* EMPLOYEE DIRECTORY MODAL */}
      {isDirectoryOpen && (
        <EmployeeDirectoryModal
          onClose={() => setIsDirectoryOpen(false)}
          onSelectEmployee={handleOpenEmployeeFromDirectory}
        />
      )}

      {/* COMPANY TASK BOARD MODAL */}
      {isTaskBoardOpen && (
        <TaskBoardModal
          projects={projects}
          onClose={() => setIsTaskBoardOpen(false)}
          onOpenEmployee={emp => {
            setIsTaskBoardOpen(false);
            setActiveEmployee(emp);
          }}
        />
      )}

      {/* CONTROLS & HELP MODAL */}
      {isControlsOpen && (
        <ControlsModal
          onClose={() => setIsControlsOpen(false)}
          onResetPosition={handleResetPosition}
          sensitivity={mouseSensitivity}
          onSensitivityChange={handleSensitivityChange}
          reducedMotion={reducedMotion}
          onToggleReducedMotion={handleToggleReducedMotion}
        />
      )}

      {/* FAST LOADING SPLASH OVERLAY WITH SEAMLESS FADE-OUT */}
      <div
        className={`fixed inset-0 z-50 bg-[#080C16] flex flex-col items-center justify-center gap-6 transition-all duration-500 select-none ${
          isSceneReady ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 pointer-events-auto scale-100'
        }`}
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-cyan-500/50 flex items-center justify-center p-3 shadow-2xl shadow-cyan-500/30">
            <img
              src="/verlyn-logo.jpg"
              alt="Verlyn Tech"
              className="w-full h-full object-contain filter invert brightness-125"
              style={{ mixBlendMode: 'screen' }}
            />
          </div>
          <div className="absolute -inset-2 rounded-3xl border border-cyan-400/20 animate-spin" style={{ animationDuration: '6s' }}></div>
        </div>

        <div className="text-center">
          <h1 className="text-base font-extrabold tracking-widest text-white">VERLYN TECH</h1>
          <p className="text-[11px] font-mono text-cyan-400 tracking-wider mt-1">HEADQUARTERS 3D ENVIRONMENT</p>
        </div>

        <div className="w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-300 rounded-full transition-all duration-300"
            style={{ width: isSceneReady ? '100%' : '80%' }}
          ></div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>Loading 3D workspace & autonomous agents...</span>
        </div>
      </div>
    </div>
  );
};
