import React, { useEffect } from 'react';
import { REFRESHMENT_ITEMS, RefreshmentItem, RefreshmentStation } from '../../data/refreshments';

interface Props {
  station: RefreshmentStation;
  onChoose: (item: RefreshmentItem) => void;
  onClose: () => void;
}

export const RefreshmentsModal: React.FC<Props> = ({ station, onChoose, onClose }) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const items = REFRESHMENT_ITEMS.filter(item => item.station === station.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[#080b0d]/80 backdrop-blur-sm" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={`${station.name} menu`} className="w-full max-w-md max-h-[88dvh] overflow-y-auto rounded-2xl border border-[#445047] bg-[#171d1d] p-5 shadow-2xl text-[#f1eee7]">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#a3b2a7]">Verlyn canteen</p>
            <h2 className="mt-1 text-xl font-semibold">{station.name}</h2>
          </div>
          <button onClick={onClose} aria-label="Close menu" className="rounded-lg px-2 py-1 text-[#b4beb7] hover:bg-[#293331] hover:text-white">✕</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map(item => (
            <button key={item.id} onClick={() => onChoose(item)} className="min-h-14 text-left rounded-lg border border-[#3b4943] bg-[#202a27] px-3 py-2 hover:bg-[#2a3830] hover:border-[#8da38c] focus:outline-none focus:border-[#d1ba89]">
              <span className="block text-sm font-medium text-[#f1eee7]">{item.name}</span>
              <span className="block text-[11px] text-[#aebdb0]">{item.kind === 'drink' ? 'Drink' : 'Eat'}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
