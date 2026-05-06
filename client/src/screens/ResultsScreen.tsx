import { useMemo, useState } from 'react';
import { ChevronLeft, Loader2, RotateCw, Map, List } from 'lucide-react';
import type { Station, FuelType, AppStatus } from '../types';
import type { EVStation } from '../types/ev';
import type { DashboardSearchParams } from './DashboardScreen';
import MapView from '../components/MapView';
import StationList from '../components/StationList';
import EVStationList from '../components/EVStationList';
import FuelTypeSelector from '../components/FuelTypeSelector';
import BestPickWidget from '../components/BestPickWidget';
import BottomSheet, { type BottomSheetData } from '../components/BottomSheet';

interface Props {
  searchParams: DashboardSearchParams;
  // Fuel
  stations: Station[];
  selectedFuel: FuelType;
  status: AppStatus;
  usingMockData: boolean;
  onFuelChange: (fuel: FuelType) => void;
  // EV
  evStations: EVStation[];
  evLoading: boolean;
  // Interaction
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  // Navigation
  onBack: () => void;
  onRefresh: () => void;
}

export default function ResultsScreen({
  searchParams,
  stations, selectedFuel, status, usingMockData, onFuelChange,
  evStations, evLoading,
  hoveredId, selectedId, onHover, onSelect,
  onBack, onRefresh,
}: Props) {
  const [view, setView] = useState<'map' | 'list'>('map');
  const mode = searchParams.fuel === 'ev' ? 'ev' : 'fuel';
  const isLoading = status === 'loading' || status === 'geocoding' || evLoading;

  // ── Derived data ──────────────────────────────────────────────
  const sortedStations = useMemo(() =>
    [...stations]
      .filter(s => s.prices[selectedFuel] !== undefined)
      .sort((a, b) => (a.smartScore ?? Infinity) - (b.smartScore ?? Infinity)),
    [stations, selectedFuel]
  );

  const { minPrice, maxPrice, cheapestId } = useMemo(() => {
    const prices = sortedStations.map(s => s.prices[selectedFuel] as number);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    const cheapest = prices.length ? sortedStations.find(s => s.prices[selectedFuel] === min)?.id ?? null : null;
    return { minPrice: min, maxPrice: max, cheapestId: cheapest };
  }, [sortedStations, selectedFuel]);

  const bestStation   = mode === 'fuel' ? sortedStations[0]   : undefined;
  const bestEVStation = useMemo(() => {
    if (mode !== 'ev' || evStations.length === 0) return undefined;
    return [...evStations].sort((a, b) => {
      const aScore = (a.pricePerKwh ?? 0.99) + (a.distanceKm ?? 0) * 0.005;
      const bScore = (b.pricePerKwh ?? 0.99) + (b.distanceKm ?? 0) * 0.005;
      return aScore - bScore;
    })[0];
  }, [evStations, mode]);

  // ── Bottom sheet data ─────────────────────────────────────────
  const bottomSheetData = useMemo((): BottomSheetData | null => {
    if (!selectedId) return null;
    if (mode === 'fuel') {
      const s = stations.find(s => s.id === selectedId);
      if (!s) return null;
      const price = s.prices[selectedFuel];
      return {
        name: s.name,
        subtitle: s.brand,
        address: `${s.address}, ${s.city}`,
        price: price !== undefined ? `€${price.toFixed(3)}` : 'Onbekend',
        priceUnit: '/liter',
        distanceKm: s.distanceKm,
        lat: s.lat,
        lon: s.lon,
        isBestPick: s.id === bestStation?.id,
        mode: 'fuel',
      };
    } else {
      const s = evStations.find(s => s.id === selectedId);
      if (!s) return null;
      return {
        name: s.name,
        subtitle: s.operator,
        address: [s.address, s.city].filter(Boolean).join(', '),
        price: s.pricePerKwh !== null && s.pricePerKwh > 0
          ? `€${s.pricePerKwh.toFixed(2)}`
          : s.pricePerKwh === 0 ? 'GRATIS' : 'Onbekend',
        priceUnit: '/kWh',
        distanceKm: s.distanceKm,
        lat: s.lat,
        lon: s.lon,
        isBestPick: s.id === bestEVStation?.id,
        mode: 'ev',
      };
    }
  }, [selectedId, stations, evStations, selectedFuel, mode, bestStation, bestEVStation]);

  const mapCenter: [number, number] = [searchParams.lat, searchParams.lon];
  const showBestPick = !isLoading && (bestStation || bestEVStation);

  const fuelLabel: Record<string, string> = {
    euro95: 'Euro 95', diesel: 'Diesel', lpg: 'LPG', superplus98: 'Super 98', ev: 'Elektrisch',
  };

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--c-bg)' }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <header
        className="flex-shrink-0"
        style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}
      >
        <div className="px-3 py-2.5 flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-colors active:scale-95"
            style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
            aria-label="Terug"
          >
            <ChevronLeft size={20} style={{ color: 'var(--c-text-2)' }} />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--c-text)' }}>
              {searchParams.displayName}
            </p>
            <p className="text-xs" style={{ color: 'var(--c-text-3)' }}>
              {fuelLabel[searchParams.fuel]} · {searchParams.radius} km
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--c-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--c-text-3)' }}>
                Even kijken…
              </span>
            </div>
          ) : (
            <button
              onClick={onRefresh}
              className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 transition-colors active:scale-95"
              style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
              aria-label="Vernieuwen"
            >
              <RotateCw size={16} style={{ color: 'var(--c-text-3)' }} />
            </button>
          )}
        </div>

        {/* Fuel type switcher (fuel mode only, when stations loaded) */}
        {mode === 'fuel' && sortedStations.length > 0 && (
          <FuelTypeSelector selected={selectedFuel} onChange={onFuelChange} />
        )}
      </header>

      {/* ── Best-pick widget ─────────────────────────────────── */}
      {showBestPick && (
        mode === 'fuel' && bestStation
          ? <BestPickWidget mode="fuel" station={bestStation} selectedFuel={selectedFuel} minPrice={minPrice} radius={searchParams.radius} />
          : mode === 'ev' && bestEVStation
          ? <BestPickWidget mode="ev" station={bestEVStation} radius={searchParams.radius} />
          : null
      )}

      {/* ── Error banner ─────────────────────────────────────── */}
      {status === 'error' && (
        <div
          className="flex-shrink-0 mx-3 mt-1 mb-1 px-3 py-2.5 rounded-xl text-sm flex items-center gap-2"
          style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Kon geen stations ophalen — probeer het opnieuw
        </div>
      )}

      {/* ── Mobile toggle (Kaart / Lijst) ────────────────────── */}
      <div
        className="flex-shrink-0 flex mx-3 my-2 p-1 gap-1 rounded-xl md:hidden"
        style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)' }}
      >
        {([['map', Map, 'Kaart'], ['list', List, 'Lijst']] as const).map(([v, Icon, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.05em',
              background: view === v ? 'var(--c-primary)' : 'transparent',
              color: view === v ? '#fff' : 'var(--c-text-3)',
              boxShadow: view === v ? '0 2px 8px var(--c-primary-glow)' : 'none',
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Map + list area ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Map — hidden on mobile when in list view */}
        <div
          className={`relative flex-1 ${view === 'list' ? 'hidden md:block' : 'block'}`}
          style={{ minHeight: 0 }}
        >
          <MapView
            center={mapCenter}
            stations={mode === 'fuel' ? stations : []}
            evStations={mode === 'ev' ? evStations : []}
            mode={mode}
            selectedFuel={selectedFuel}
            hoveredId={hoveredId}
            selectedId={selectedId}
            cheapestId={mode === 'fuel' ? cheapestId : null}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onMarkerClick={(id) => { onSelect(id); }}
            onDeselect={() => onSelect(null)}
          />
        </div>

        {/* List — hidden on mobile when in map view */}
        <div
          className={`md:w-[380px] md:flex-none flex-col overflow-hidden ${view === 'map' ? 'hidden md:flex' : 'flex flex-1'}`}
          style={{ background: 'var(--c-bg)', borderTop: '1px solid var(--c-border)' }}
        >
          {mode === 'fuel' ? (
            <StationList
              stations={stations}
              selectedFuel={selectedFuel}
              hoveredId={hoveredId}
              selectedId={selectedId}
              usingMockData={usingMockData}
              status={status}
              onHover={onHover}
              onSelect={(id) => onSelect(id)}
            />
          ) : (
            <EVStationList
              stations={evStations}
              hoveredId={hoveredId}
              selectedId={selectedId}
              isLoading={evLoading}
              onHover={onHover}
              onSelect={(id) => onSelect(id)}
            />
          )}
        </div>
      </div>

      {/* ── Bottom sheet ─────────────────────────────────────── */}
      {bottomSheetData && (
        <BottomSheet
          data={bottomSheetData}
          onClose={() => onSelect(null)}
        />
      )}
    </div>
  );
}
