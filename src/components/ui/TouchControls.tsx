import React, { useEffect, useRef } from 'react';

export const TouchControls: React.FC<{ disabled: boolean }> = ({ disabled }) => {
  const held = useRef(new Set<string>());
  const send = (code: string, pressed: boolean) => {
    if (pressed) held.current.add(code); else held.current.delete(code);
    window.dispatchEvent(new CustomEvent('office-move-input', { detail: { code, pressed } }));
  };
  useEffect(() => {
    if (disabled) held.current.forEach(code => send(code, false));
    return () => held.current.forEach(code => send(code, false));
  }, [disabled]);
  if (disabled) return null;

  return (
    <div className="touch-controls absolute left-4 bottom-4 z-30 grid-cols-3 gap-1.5 pointer-events-auto" aria-label="Movement controls">
      {[
        { code: 'KeyW', label: '↑', name: 'Walk forward', position: 'col-start-2' },
        { code: 'KeyA', label: '←', name: 'Walk left', position: 'row-start-2 col-start-1' },
        { code: 'KeyS', label: '↓', name: 'Walk backward', position: 'row-start-2 col-start-2' },
        { code: 'KeyD', label: '→', name: 'Walk right', position: 'row-start-2 col-start-3' },
      ].map(button => (
        <button
          key={button.code}
          aria-label={button.name}
          onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); send(button.code, true); }}
          onPointerUp={() => send(button.code, false)}
          onPointerCancel={() => send(button.code, false)}
          onLostPointerCapture={() => send(button.code, false)}
          className={`${button.position} w-11 h-11 rounded-xl border border-[#8e9b94]/60 bg-[#17211f]/85 text-[#eee9dd] text-xl active:bg-[#687b67] touch-none select-none`}
        >{button.label}</button>
      ))}
    </div>
  );
};
