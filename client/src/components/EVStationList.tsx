import { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import type { EVStation } from '../types/ev';
import EVStationCard from './EVStationCard';
import { EVSkeletonCard } from './ui/SkeletonCard';

interface Props {
  stations: EVStation[];
  hoveredId: string | null;
  selectedId: string | null;
  isLoading: boolean;
  radius?: number;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onRetry?: () => void;
}

type Filter = 'all' | 'fast' | 'ac';

const FILTER_LABELS: Record<Filter, string> = { all: 'ALLE', fast: '⚡ SNEL DC', ac: '~ NORMAAL AC' };

export default function EVStationList({ stations, hoveredId, selectedId, isLoading, radius, onHover, onSelect, onRetry }: Props) {
  const selectedRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto py-2">
        {[...Array(5)].map((_, i) => <EVSkeletonCard key={i} />)}
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-4">
        <Zap size={48} style={{ color: 'var(--c-surface-3)' }} strokeWidth={1} />
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--c-text-2)' }}>
            Geen laadpalen gevonden
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--c-text-3)' }}>
            {radius ? `Binnen ${radius} km zijn geen laadpalen gevonden` : 'Probeer een grotere zoekradius'}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{ background: 'var(--c-surface-2)', color: 'var(--c-text-2)', border: '1px solid var(--c-border)' }}
          >
            Opnieuw zoeken
          </button>
        )}
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
            className="flex-1 py-2.5 text-xs font-bold rounded-lg transition-all active:scale-95"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.05em',
              background: filter === f ? 'var(--c-ev)' : 'var(--c-surface-2)',
              color: filter === f ? '#111' : 'var(--c-text-3)',
              border: `1px solid ${filter === f ? 'var(--c-ev)' : 'var(--c-border)'}`,
              boxShadow: filter === f ? '0 2px 8px var(--c-ev-glow)' : 'none',
            }}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--c-text-3)', fontFamily: "'Barlow Condensed', sans-serif" }}>
        {filtered.length} laadpalen · afstand
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
