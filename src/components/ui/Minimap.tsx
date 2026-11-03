import React, { useRef, useEffect } from 'react';
import { EMPLOYEES } from '../../data/employees';
import { ROOMS } from '../../data/rooms';
import { EmployeeDefinition } from '../../types/office';

interface MinimapProps {
  playerPos?: { x: number; z: number; rotation: number };
  onSelectEmployee: (emp: EmployeeDefinition) => void;
  onTeleportToRoom?: (roomId: string) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  playerPos = { x: 0, z: 8.0, rotation: Math.PI },
  onSelectEmployee
}) => {
  const playerDotRef = useRef<HTMLDivElement>(null);
  const playerConeRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLSpanElement>(null);

  // Minimap coordinate mapping:
  // World bounds: X from -15 to 15 (width 30m), Z from -21 to 21 (depth 42m)
  // Map dimensions: 220px wide by 220px tall
  const mapWidth = 220;
  const mapHeight = 220;

  const worldToMap = (wx: number, wz: number) => {
    const mx = ((wx + 15) / 30) * mapWidth;
    const my = ((wz + 21) / 42) * mapHeight;
    return { x: mx, y: my };
  };

  const initialMap = worldToMap(playerPos.x, playerPos.z);

  // High-performance event-driven position update (Zero React Re-renders!)
  React.useEffect(() => {
    const handleMove = (e: CustomEvent<{ x: number; z: number; rotation: number }>) => {
      const { x, z, rotation } = e.detail;
      const pt = worldToMap(x, z);
      if (playerDotRef.current) {
        playerDotRef.current.style.left = `${pt.x}px`;
        playerDotRef.current.style.top = `${pt.y}px`;
      }
      if (playerConeRef.current) {
        playerConeRef.current.style.transform = `rotate(${rotation + Math.PI}rad)`;
      }
      if (coordsRef.current) {
        coordsRef.current.textContent = `X: ${x.toFixed(1)} Z: ${z.toFixed(1)}`;
      }
    };
    window.addEventListener('player-position-update', handleMove as EventListener);
    return () => window.removeEventListener('player-position-update', handleMove as EventListener);
  }, []);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-2xl flex flex-col gap-2 select-none">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-slate-800 pb-1.5">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          VERLYN HQ RADAR
        </span>
        <span ref={coordsRef} className="text-[10px] font-mono text-slate-400">
          X: {playerPos.x.toFixed(1)} Z: {playerPos.z.toFixed(1)}
        </span>
      </div>

      <div className="relative w-[220px] h-[220px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
        {/* Room zones */}
        {ROOMS.map(room => {
          const topLeft = worldToMap(room.bounds.minX, room.bounds.minZ);
          const bottomRight = worldToMap(room.bounds.maxX, room.bounds.maxZ);
          const w = bottomRight.x - topLeft.x;
          const h = bottomRight.y - topLeft.y;

          return (
            <div
              key={room.id}
              className="absolute border border-slate-700/50 flex flex-col items-center justify-center text-center p-1 overflow-hidden transition-colors"
              style={{
                left: `${topLeft.x}px`,
                top: `${topLeft.y}px`,
                width: `${w}px`,
                height: `${h}px`,
                backgroundColor: `${room.accentColor}12`
              }}
              title={room.name}
            >
              <span
                className="text-[9px] font-bold tracking-tight opacity-75 truncate max-w-full px-0.5"
                style={{ color: room.accentColor }}
              >
                {room.shortName}
              </span>
            </div>
          );
        })}

        {/* Central Corridor indicator */}
        <div
          className="absolute bg-slate-800/40 border-l border-r border-slate-700/40 pointer-events-none"
          style={{
            left: `${worldToMap(-2.5, 0).x}px`,
            top: `${worldToMap(0, -10).y}px`,
            width: `${worldToMap(2.5, 0).x - worldToMap(-2.5, 0).x}px`,
            height: `${worldToMap(0, 10).y - worldToMap(0, -10).y}px`
          }}
        />

        {/* Entrance Plaza & Stone Walkway */}
        <div
          className="absolute border border-sky-500/30 bg-sky-950/30 flex items-center justify-center text-[8px] font-bold text-sky-400 pointer-events-none"
          style={{
            left: `${worldToMap(-6.5, 0).x}px`,
            top: `${worldToMap(0, 10.5).y}px`,
            width: `${worldToMap(6.5, 0).x - worldToMap(-6.5, 0).x}px`,
            height: `${worldToMap(0, 20.5).y - worldToMap(0, 10.5).y}px`
          }}
        >
          Entrance Plaza
        </div>

        {/* Employee markers */}
        {EMPLOYEES.map(emp => {
          const pos = worldToMap(emp.deskPosition[0], emp.deskPosition[2]);
          return (
            <button
              key={emp.id}
              onClick={() => onSelectEmployee(emp)}
              title={`${emp.name} (${emp.title}) — Click to inspect`}
              className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
            >
              <div
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-md border border-white/40 transition-transform group-hover:scale-125"
                style={{ backgroundColor: emp.avatarColors.accent }}
              >
                {emp.name[0]}
              </div>
            </button>
          );
        })}

        {/* Player position blip with directional cone */}
        <div
          ref={playerDotRef}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75"
          style={{ left: `${initialMap.x}px`, top: `${initialMap.y}px` }}
        >
          {/* Facing direction triangle */}
          <div
            ref={playerConeRef}
            className="w-4 h-4 flex items-center justify-center"
            style={{
              transform: `rotate(${playerPos.rotation + Math.PI}rad)`
            }}
          >
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
          </div>
          {/* Pulsing center dot */}
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-white shadow-[0_0_8px_#38bdf8]" />
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
        <span>Click employee dot to view</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> You
        </span>
      </div>
    </div>
  );
};
