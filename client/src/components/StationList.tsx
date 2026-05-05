import { useEffect, useRef } from 'react';
import type { Station, FuelType } from '../types';
import StationCard from './StationCard';

interface Props {
  stations: Station[];
  selectedFuel: FuelType;
  hoveredId: string | null;
  selectedId: string | null;
  usingMockData: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

export default function StationList({ stations, selectedFuel, hoveredId, selectedId, usingMockData, onHover, onSelect }: Props) {
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  if (stations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-6 text-center gap-3">
        <svg className="w-14 h-14 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-sm text-white/30">Zoek een stad of postcode<br/>om tankstations te vinden</p>
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
        <div className="mx-3 mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-400 flex items-start gap-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <span>Voorbeelddata — live prijzen tijdelijk niet beschikbaar</span>
        </div>
      )}

      <p className="px-4 pb-2 text-[10px] text-white/25 font-bold uppercase tracking-widest"
        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
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
        <p className="px-4 pt-1 pb-3 text-xs text-white/20">
          + {noPrice.length} stations zonder prijs voor dit brandstoftype
        </p>
      )}
    </div>
  );
}
