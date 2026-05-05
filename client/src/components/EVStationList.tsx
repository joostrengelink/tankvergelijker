import { useEffect, useRef, useState } from 'react';
import type { EVStation } from '../types/ev';
import EVStationCard from './EVStationCard';

interface Props {
  stations: EVStation[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

type Filter = 'all' | 'fast' | 'ac';

export default function EVStationList({ stations, hoveredId, selectedId, onHover, onSelect }: Props) {
  const selectedRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-slate-300 px-6 text-center gap-3">
        <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p className="text-sm text-slate-400">Zoek een stad of postcode<br/>om laadpalen te vinden</p>
      </div>
    );
  }

  const filtered = stations
    .filter((s) => filter === 'fast' ? s.isFastCharger : filter === 'ac' ? !s.isFastCharger : true)
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {/* Filter tabs */}
      <div className="flex gap-1 px-4 pb-3">
        {(['all', 'fast', 'ac'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filter === f ? 'bg-green-500 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-green-300'
            }`}
          >
            {f === 'all' ? 'Alle' : f === 'fast' ? '⚡ Snel (DC)' : '~ Normaal (AC)'}
          </button>
        ))}
      </div>

      <p className="px-4 pb-2 text-[11px] text-slate-400 font-medium uppercase tracking-wider">
        {filtered.length} laadpalen · gesorteerd op afstand
      </p>

      {filtered.map((station, i) => (
        <div key={station.id} ref={station.id === selectedId ? selectedRef : null}>
          <EVStationCard
            station={station}
            rank={i + 1}
            isHovered={hoveredId === station.id}
            isSelected={selectedId === station.id}
            onHover={onHover}
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  );
}
