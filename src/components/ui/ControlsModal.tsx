import React, { useEffect } from 'react';
import { X, Compass, Move, MousePointer, Keyboard, ShieldAlert, Sparkles } from 'lucide-react';
import { SoundEffects } from '../../services/audio';

interface ControlsModalProps {
  onClose: () => void;
  onResetPosition: () => void;
  sensitivity?: number;
  onSensitivityChange?: (val: number) => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
}

export const ControlsModal: React.FC<ControlsModalProps> = ({
  onClose,
  onResetPosition,
  sensitivity = 1.0,
  onSensitivityChange,
  reducedMotion,
  onToggleReducedMotion
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
      <div className="bg-[#0F172A] border border-slate-700/80 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Office Controls & Guide</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Verlyn HQ 3D navigation and employee interaction manual
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

        {/* Content */}
        <div className="p-6 space-y-4 text-sm overflow-y-auto">
          {/* Movement */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
              <Move className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white">Walking & Navigation</h3>
              <p className="text-xs text-slate-400">
                Use <strong className="text-slate-200">W, A, S, D</strong> or the <strong className="text-slate-200">Arrow Keys</strong> to walk your avatar. The character slides naturally along walls, through doorways, and around desks.
              </p>
            </div>
          </div>

          {/* First Person Walking View */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
              <Keyboard className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white">First-Person Walking Mode</h3>
              <p className="text-xs text-slate-400">
                Scroll in from third person to reach a natural first-person view. Scroll out to return. Press <strong className="text-emerald-300">V</strong> to switch directly. First person uses a fixed field of view without extra optical zoom.
              </p>
            </div>
          </div>

          {/* Sitting & First Person View */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
              <Keyboard className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white">Chairs & Sofas</h3>
              <p className="text-xs text-slate-400">
                Approach any free chair, sofa seat, or stool. Press <strong className="text-slate-200">F</strong> or tap Sit to sit down. Your view stays in third person unless you zoom in or press V. Press <strong className="text-slate-200">F</strong>, <strong className="text-slate-200">Space</strong>, or a movement key to stand. Occupied seats become available when the employee leaves.
              </p>
            </div>
          </div>

          {/* Doors & Water Dispenser */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
              <Keyboard className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white">Doors & Refreshments</h3>
              <p className="text-xs text-slate-400">
                Press <strong className="text-cyan-300">Q</strong> near a door to open or close it. At the water cooler, coffee bar, or snack shelf, press <strong className="text-cyan-300">E</strong> to choose something to eat or drink.
              </p>
            </div>
          </div>

          {/* Interaction */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
              <Keyboard className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-white">Interacting with Employees</h3>
              <p className="text-xs text-slate-400">
                Approach an employee and press <strong className="text-slate-200">E</strong> to talk. If their desk is empty, approach the desk and press <strong className="text-amber-300">C</strong> or click <strong className="text-amber-300">Call to desk</strong> to ask them to return.
              </p>
            </div>
          </div>

          {/* Camera controls */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 mt-0.5">
              <MousePointer className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Mouse Sensitivity & Look</h3>
                <span className="font-mono text-xs font-bold text-cyan-400">{sensitivity.toFixed(1)}x</span>
              </div>
              <p className="text-xs text-slate-400">
                Click the office to capture the mouse and look around. Press Escape to release it. Hold <strong className="text-slate-200">Shift</strong> to sprint. On a touch screen, use the arrow pad to move and swipe the office to look around. Landscape gives you more room.
              </p>
              {onSensitivityChange && (
                <div className="pt-1 flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 font-mono">0.2x</span>
                  <input
                    type="range"
                    min="0.2"
                    max="2.5"
                    step="0.1"
                    value={sensitivity}
                    onChange={e => onSensitivityChange(parseFloat(e.target.value))}
                    className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 font-mono">2.5x</span>
                </div>
              )}
              <button
                onClick={onToggleReducedMotion}
                aria-pressed={reducedMotion}
                className="mt-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Reduced motion: {reducedMotion ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {/* Unstuck Button */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-amber-950/20 border border-amber-900/40">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="font-semibold text-amber-200 text-xs">Stuck in furniture or wall?</h4>
                <p className="text-[11px] text-amber-300/70">Press 'R' or click to teleport back to Reception</p>
              </div>
            </div>

            <button
              onClick={() => {
                onResetPosition();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600/80 hover:bg-amber-600 text-white transition-colors"
            >
              Reset Position Now
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-end">
          <button
            onClick={() => {
              onClose();
              SoundEffects.playCloseModal();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Got it, Let's Walk
          </button>
        </div>
      </div>
    </div>
  );
};
