import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PerformanceMetrics } from '../../types/performance';

interface DebugOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onQualityChange?: (tier: 'High' | 'Medium' | 'Low') => void;
  currentQuality?: 'High' | 'Medium' | 'Low';
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ isOpen, onClose, onQualityChange, currentQuality = 'Medium' }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    const update = () => setMetrics(window.__DEBUG_METRICS__ || null);
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [isOpen]);
  if (!isOpen) return null;

  return (
    <aside aria-label="Performance monitor" className="fixed top-20 right-4 z-40 w-64 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-xl border border-[#5c6b63] bg-[#151e1b] p-3.5 shadow-xl text-[#e6ebe4] text-xs">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-sm">Performance</h2>
        <button onClick={onClose} aria-label="Close performance" title="Close (P)" className="p-1 rounded hover:bg-[#334139]"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex justify-between items-end pb-3 border-b border-[#35463c]">
        <div><strong className={`font-mono text-3xl ${metrics && metrics.fps < 55 ? 'text-[#e2bd7d]' : 'text-[#b9d3b4]'}`}>{metrics ? Math.round(metrics.fps) : '—'}</strong><span className="ml-1 text-[#aebdaf]">FPS</span></div>
        <div className="text-right text-[#b8c4bb]"><p>{metrics ? `${metrics.frameTimeMs.toFixed(1)} ms` : 'Measuring…'}</p><p className="text-[10px] mt-1">Target: 60 FPS / 16.7 ms</p></div>
      </div>
      <dl className="grid grid-cols-2 gap-y-2 py-3 text-[#afbeb3]">
        <dt>Draw calls</dt><dd className="text-right font-mono text-[#e0e8dd]">{metrics?.drawCalls ?? '—'}</dd>
        <dt>Triangles</dt><dd className="text-right font-mono text-[#e0e8dd]">{metrics ? `${(metrics.triangles / 1000).toFixed(1)}k` : '—'}</dd>
        <dt>Render scale</dt><dd className="text-right font-mono text-[#e0e8dd]">{metrics ? `${metrics.qualityDpr.toFixed(2)}×` : '—'}</dd>
      </dl>
      <div className="grid grid-cols-3 gap-1">
        {(['Low', 'Medium', 'High'] as const).map(tier => <button key={tier} aria-pressed={currentQuality === tier} onClick={() => onQualityChange?.(tier)} className={`rounded-md py-2 text-[11px] font-medium ${currentQuality === tier ? 'bg-[#bba77d] text-[#18211c]' : 'bg-[#2c3931] text-[#ced9cc] hover:bg-[#3a4c40]'}`}>{tier}</button>)}
      </div>
      <p className="mt-2.5 text-[10px] leading-relaxed text-[#aebcaf]">Your quality choice stays selected and is saved. All modes keep full materials and geometry. High adds soft shadows and sharper rendering.</p>
    </aside>
  );
};
