import { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import type { Station, FuelType, AppStatus } from '../types';
import StationCard from './StationCard';
import { FuelSkeletonCard } from './ui/SkeletonCard';

interface Props {
  stations: Station[];
  selectedFuel: FuelType;
  hoveredId: string | null;
  selectedId: string | null;
  usingMockData: boolean;
  status: AppStatus;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

export default function StationList({ stations, selectedFuel, hoveredId, selectedId, usingMockData, status, onHover, onSelect }: Props) {
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  if (status === 'geocoding' || status === 'loading') {
    return (
      <div className="flex-1 overflow-y-auto py-2">
        {[...Array(5)].map((_, i) => <FuelSkeletonCard key={i} />)}
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-3">
        <MapPin size={56} style={{ color: 'var(--c-surface-3)' }} strokeWidth={1} />
        <p className="text-sm" style={{ color: 'var(--c-text-3)' }}>
          Zoek een stad of postcode<br />om tankstations te vinden
        </p>
      </div>
    );
  }

  const withPrice = [...stations]
    .filter((s) => s.prices[selectedFuel] !== undefined)
    .sort((a, b) => (a.smartScore ?? Infinity) - (b.smartScore ?? Infinity));

  const noPrice = stations.filter((s) => s.prices[selectedFuel] === undefined);
  const prices = withPrice.map((s) => s.prices[selectedFuel] as number);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const bestPickId = withPrice[0]?.id;

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {usingMockData && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-xl text-xs flex items-start gap-2"
          style={{ background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.25)', color: '#FF9500' }}>
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>Voorbeelddata — live prijzen tijdelijk niet beschikbaar</span>
        </div>
      )}

      <p className="px-4 pb-2 text-[10px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--c-text-3)', fontFamily: "'Barlow Condensed', sans-serif" }}>
        {withPrice.length} stations · beste keuze eerst
      </p>

      {withPrice.map((station, i) => (
        <div key={station.id} ref={station.id === selectedId ? selectedRef : null}>
          <StationCard
            station={station}
            rank={i + 1}
            selectedFuel={selectedFuel}
            minPrice={minPrice}
            maxPrice={maxPrice}
            isBestPick={station.id === bestPickId}
            isHovered={hoveredId === station.id}
            isSelected={selectedId === station.id}
            onHover={onHover}
            onSelect={onSelect}
          />
        </div>
      ))}

      {noPrice.length > 0 && (
        <p className="px-4 pt-1 pb-3 text-xs" style={{ color: 'var(--c-text-3)' }}>
          + {noPrice.length} stations zonder prijs voor dit brandstoftype
        </p>
      )}
    </div>
  );
}
